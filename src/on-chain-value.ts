import { APIGatewayProxyHandler } from 'aws-lambda';
import { go } from '@api3/promise-utils';
import { ethers } from 'ethers';
import { Client } from 'pg';
import { getGlobalConfig, makeError } from './utils';
import { initDb } from './database';
import { goQueryConfig } from './constants';

const config = getGlobalConfig();

export const getDataFeedIdFromDapiName = async (dapiName: string, db: Client) => {
  const hashedDapiNameId = ethers.utils.formatBytes32String(dapiName);

  const operation = () =>
    db.query(
      `
    SELECT event_data->'parsedLog'->'args'->> 1 as "dataFeedId"
    FROM dapi_events 
    WHERE 
    event_name = 'SetDapiName' AND 
    event_data->'parsedLog'->'args'->> 0 = $1 
    ORDER BY block DESC
    LIMIT 1;
  `,
      [hashedDapiNameId]
    );

  const goResponse = await go(operation, goQueryConfig);
  if (!goResponse.success) {
    const e = goResponse.error as Error;
    console.error(goResponse.error);
    console.error(e.stack);
    return;
  }

  const queryResult = goResponse.data;

  if (!queryResult?.rows[0]?.dataFeedId) {
    console.error('Could not find dataFeedId for the given dapiName');
    return;
  }

  return queryResult.rows[0].dataFeedId;
};

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

  const db = await initDb();
  if (db === undefined) {
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('An error has occurred while trying to initialize the database'),
    };
  }

  const currentDataFeedId = dapiName
    ? await getDataFeedIdFromDapiName(dapiName, db)
    : dataFeedId ??
      ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'bytes32'], [airnodeAddress, templateId]));

  if (!currentDataFeedId) {
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('DataFeedId not found'),
    };
  }

  const operation = async () =>
    db.query(
      `
      SELECT jsonb_path_query_array(event_data -> 'parsedLog' -> 'args' , '$[1 to 2]') as "data"
      FROM dapi_events 
      WHERE 
      chain = $1 AND
      event_data->'parsedLog'->'args'->>0 = $2
      ORDER by block DESC 
      LIMIT 1;
    `,
      [chainId, currentDataFeedId]
    );

  const goResponse = await go(operation, goQueryConfig);
  if (!goResponse.success) {
    const e = goResponse.error as Error;
    console.error(goResponse.error);
    console.error(e.stack);
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('An error has occurred while querying the on-chain-value'),
    };
  }

  const queryResult = goResponse.data;

  if (!queryResult) {
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('An error has occurred while querying the on-chain-value'),
    };
  }

  if (queryResult.rows.length === 0) {
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('Value not found'),
    };
  }

  const result = queryResult.rows[0].data;
  const beaconResponse = [result[0], parseInt(result[1].hex)];

  return {
    statusCode: 200,
    headers: config.headers,
    body: JSON.stringify({ beaconResponse }),
  };
};
