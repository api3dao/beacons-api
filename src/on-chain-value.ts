import { APIGatewayProxyHandler } from 'aws-lambda';
import { DapiServer__factory } from '@api3/airnode-protocol-v1';
import { ethers } from 'ethers';
import { go } from '@api3/airnode-utilities';
import { getGlobalConfig, makeError } from './utils';

const config = getGlobalConfig();

export const chainValueDataPoint: APIGatewayProxyHandler = async (event): Promise<any> => {
  const { chainId, dataFeedId, templateId, airnodeAddress, dapiName } = event.queryStringParameters!;
  if (event.httpMethod !== 'GET' || !event.queryStringParameters || !chainId) {
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('Invalid query parameters'),
    };
  }

  if (!(dataFeedId || (templateId && airnodeAddress) || dapiName)) {
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError(
        'Missing query parameters - we need either a datafeedId or both an airnodeAddress and templateId or a dapiName'
      ),
    };
  }

  const provider = config.providers[chainId];
  if (!provider) {
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError("We don't have a provider for that chainId"),
    };
  }

  const dapiServerAddress = config.deployments[chainId];
  if (!dapiServerAddress) {
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError("We don't have a dapiServer for that chainId"),
    };
  }

  const voidSigner = new ethers.VoidSigner(
    ethers.constants.AddressZero,
    new ethers.providers.JsonRpcProvider(provider)
  );

  const dapiServer = DapiServer__factory.connect(dapiServerAddress, voidSigner);

  const readDataFeedId =
    dataFeedId ??
    ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'bytes32'], [airnodeAddress, templateId]));

  const operation = async () =>
    await (dapiName ? dapiServer.readDataFeedWithDapiName(dapiName!) : dapiServer.readDataFeedWithId(readDataFeedId));
  const [err, beaconResponse] = await go(operation, { timeoutMs: 5_000, retries: 2 });

  const e = err as Error;
  if (err) {
    console.error(err);
    console.error(e.stack);
  }

  return {
    statusCode: err ? 500 : 200,
    headers: config.headers,
    body: JSON.stringify({ error: !!err, beaconResponse }),
  };
};
