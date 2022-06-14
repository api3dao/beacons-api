import { APIGatewayProxyHandler } from 'aws-lambda';
import { DapiServer__factory } from '@api3/airnode-protocol-v1';
import { ethers } from 'ethers';
import { go } from '@api3/promise-utils';
import { contracts } from '@api3/operations/chain/deployments/references.json';
import { getGlobalConfig, makeError } from './utils';

const config = getGlobalConfig();

export const chainValueDataPoint: APIGatewayProxyHandler = async (event): Promise<any> => {
  const { chainId, dataFeedId, templateId, airnodeAddress, dapiName } = event.queryStringParameters ?? {};
  if (!chainId) {
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

  const dapiServerAddress = contracts.DapiServer[chainId];
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

  const operation = async () => {
    if (dapiName) {
      const encodedDapiName = ethers.utils.formatBytes32String(dapiName);
      return dapiServer.readDataFeedWithDapiName(encodedDapiName);
    }

    const readDataFeedId =
      dataFeedId ??
      ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'bytes32'], [airnodeAddress, templateId]));
    return dapiServer.readDataFeedWithId(readDataFeedId);
  };
  const goBeaconResponse = await go(operation, {
    attemptTimeoutMs: 5_000,
    retries: 2,
    delay: { type: 'static', delayMs: 1_000 },
  });

  if (!goBeaconResponse.success) {
    console.error(goBeaconResponse.error);
    return {
      statusCode: 500,
      headers: config.headers,
      body: JSON.stringify({ error: goBeaconResponse.error }),
    };
  }

  const humanReadableResponse = {
    value: goBeaconResponse.data.value.toString(),
    timestamp: goBeaconResponse.data.timestamp.toString(),
  };

  return {
    statusCode: 200,
    headers: config.headers,
    body: JSON.stringify({ beaconResponse: humanReadableResponse }),
  };
};
