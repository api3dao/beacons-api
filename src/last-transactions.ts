import { go } from '@api3/airnode-utilities';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { getGlobalConfig, makeError } from './utils';
import { initDb } from './database';

export const evmBeaconIdSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
export const evmAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const chainIdSchema = z.string().regex(/^\d+$/);

export const DEFAULT_TRANSACTION_COUNT = 5;
export const DEFAULT_FROM_BLOCK_SIZE = 2000;
export const MAX_TRANSACTIONS_FRESHNESS = 60_000;

const config = getGlobalConfig();

export const lastTransactions: APIGatewayProxyHandler = async (event): Promise<any> => {
  const parsedBeaconId = evmBeaconIdSchema.safeParse(event.queryStringParameters?.beaconId);
  if (!parsedBeaconId.success) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('beaconId required - beaconId is either not present or invalid'),
    };
  }
  const parsedChainId = chainIdSchema.safeParse(event.queryStringParameters?.chainId);
  if (!parsedChainId.success) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('chainId required - chainId is either not present or invalid'),
    };
  }
  const beaconId = parsedBeaconId.data;
  const chainId = parsedChainId.data;

  const eventTransactionCount = event.queryStringParameters?.transactionCountLimit;
  const parsedTransactionCountLimit = eventTransactionCount ? parseInt(eventTransactionCount) : NaN;
  const transactionCountLimit = !isNaN(parsedTransactionCountLimit)
    ? parsedTransactionCountLimit
    : DEFAULT_TRANSACTION_COUNT;

  const db = await initDb();
  if (db === undefined) {
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('An error has occurred while trying to initialize the database'),
    };
  }

  const operation = async () =>
    db.query(
      `
    SELECT 
    event_data -> 'blockNumber' as "blockNumber", 
    event_data -> 'parsedLog' as "parsedLog",
    event_data -> 'topics' as "topics",
    event_data -> 'transactionHash' as "transactionHash"
    FROM dapi_events 
    WHERE chain = $1 AND 
    event_data->'parsedLog'->'args'->> 0 = $2
    ORDER by block DESC LIMIT $3;
  `,
      [chainId, beaconId, transactionCountLimit]
    );

  const [err, queryResult] = await go(operation, { timeoutMs: 5_000, retries: 2 });
  if (err) {
    const e = err as Error;
    console.error(err);
    console.error(e.stack);
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('An error has occurred while querying last transactions'),
    };
  }

  const payload = queryResult.rows;

  return {
    statusCode: 200,
    headers: config.headers,
    body: JSON.stringify(payload),
  };
};
