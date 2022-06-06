import { ethers } from 'ethers';
import { go } from '@api3/airnode-utilities';
import { DapiServer__factory } from '@api3/airnode-protocol-v1';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { contracts } from '@api3/operations/chain/deployments/references.json';
import { getGlobalConfig, makeError } from './utils';

export const evmBeaconIdSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
export const evmAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const chainIdSchema = z.number();

const config = getGlobalConfig();

type ParsedLog = {
  parsedLog: ethers.utils.LogDescription;
  blockNumber: number;
  topics: Array<string>;
  transactionHash: string;
};
type ParsedLogWithChainId = { events: ParsedLog[]; chainId: string };

const transactions: Record<string, ParsedLog[]> = Object.fromEntries(
  Object.keys(contracts.DapiServer).map((chainId) => [chainId, []])
);
let lastUpdate = 0;

const transactionSortFunction = (a: ParsedLog, b: ParsedLog) => {
  if (a.blockNumber > b.blockNumber) return -1;
  if (a.blockNumber > b.blockNumber) return 1;
  return 0;
};

export const refreshTransactions = async () => {
  const settledLogRetrieval = await Promise.allSettled(
    Object.entries(contracts.DapiServer).map(async ([chainId, dapiServer]) => {
      const providerUrl = config.providers[chainId];
      const provider = new ethers.providers.JsonRpcProvider(providerUrl, { name: chainId, chainId: parseInt(chainId) });

      const txesPerChainId = transactions[chainId];
      const subBlock = txesPerChainId && txesPerChainId.length > 0 ? txesPerChainId[0].blockNumber : undefined;

      const [err, rawLogs] = await go(
        async () =>
          await provider.getLogs({
            fromBlock: (subBlock ?? (await provider.getBlock('latest')).number - 2000) + 1,
            toBlock: 'latest',
            address: dapiServer,
          }),
        // Timeouts can be quite long for the initial query
        { timeoutMs: 15_000, retries: 2, retryDelayMs: 5_000 }
      );

      if (err || !rawLogs) {
        console.error(err);
        return;
      }

      const voidSigner = new ethers.VoidSigner(ethers.constants.AddressZero);

      const dapiServerInstance = DapiServer__factory.connect(dapiServer, voidSigner);

      const filteredParsedLogs = rawLogs
        .map((log) => ({ ...log, parsedLog: dapiServerInstance.interface.parseLog(log) }))
        .filter(
          (log) =>
            log.parsedLog.eventFragment.name === 'UpdatedBeaconWithSignedData' ||
            log.parsedLog.eventFragment.name === 'UpdatedBeaconWithPsp'
        );

      return { events: filteredParsedLogs, chainId: chainId } as ParsedLogWithChainId;
    })
  );

  settledLogRetrieval
    .filter((log) => log.status === 'fulfilled' && log.value)
    .map((log) => (log as PromiseFulfilledResult<any>).value! as ParsedLogWithChainId)
    .forEach((logWithChainId) => {
      const sortedLogWithChainId = logWithChainId.events.sort(transactionSortFunction).map(
        ({ blockNumber, parsedLog, topics, transactionHash }: ParsedLog) =>
          ({
            blockNumber,
            parsedLog,
            topics,
            transactionHash,
          } as ParsedLog)
      );
      transactions[logWithChainId.chainId.toString()].push(...sortedLogWithChainId);

      lastUpdate = Date.now();
    });
};

export const lastTransactions: APIGatewayProxyHandler = async (event): Promise<any> => {
  try {
    if (
      !(
        event.queryStringParameters?.beaconId &&
        evmBeaconIdSchema.safeParse(event.queryStringParameters?.beaconId).success
      )
    ) {
      return {
        statusCode: 400,
        headers: config.headers,
        body: makeError('beaconId required - beaconId is either not present or invalid'),
      };
    }

    if (!(event.queryStringParameters?.chainId && chainIdSchema.safeParse(event.queryStringParameters?.chainId))) {
      return {
        statusCode: 400,
        headers: config.headers,
        body: makeError('chainId required - chainId is either not present or invalid'),
      };
    }
  } catch (e) {
    console.trace(e);
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('An error occurred during parameter validation'),
    };
  }

  const beaconId = event.queryStringParameters?.beaconId;
  const chainId = event.queryStringParameters?.chainId;

  const parsedTransactionCountLimit = parseInt(event.queryStringParameters?.transactionCountLimit ?? '5');
  const transactionCountLimit = !isNaN(parsedTransactionCountLimit) ? parsedTransactionCountLimit : 5;

  if (Date.now() - lastUpdate > 60_000) {
    try {
      await refreshTransactions();
    } catch (e) {
      console.error(e);
      return {
        statusCode: 500,
        headers: config.headers,
        body: makeError('Something went wrong while retrieving transaction logs'),
      };
    }
  }

  const txesPerChainId = transactions[chainId];
  const payload = txesPerChainId
    .filter((logEvent) => logEvent.parsedLog.args[0] === beaconId)
    .slice(0, transactionCountLimit);

  return {
    statusCode: 200,
    headers: config.headers,
    body: JSON.stringify(payload),
  };
};
