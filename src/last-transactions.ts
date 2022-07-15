import { go } from '@api3/promise-utils';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { getGlobalConfig, makeError } from './utils';
import { initDb } from './database';
import { getDataFeedIdFromDapiName } from './on-chain-value';
import { goQueryConfig } from './constants';

export const dapiNameSchema = z.string();
export const evmBeaconIdSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
export const chainIdSchema = z.string().regex(/^\d+$/);

export const DEFAULT_TRANSACTION_COUNT = 5;

const config = getGlobalConfig();

export const lastTransactions: APIGatewayProxyHandler = async (event): Promise<any> => {
  const { chainId, beaconId, dapiName } = event.queryStringParameters ?? {};

  if (!(dapiName || beaconId)) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('Beaconid or dapiName required - at least one of these values must be present'),
    };
  }

  const parsedBeaconId = evmBeaconIdSchema.safeParse(beaconId);
  if (beaconId && !parsedBeaconId.success) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('Invalid beaconId'),
    };
  }
  const parsedChainId = chainIdSchema.safeParse(chainId);
  if (!parsedChainId.success) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('ChainId required - ChainId is either not present or invalid'),
    };
  }
  const parsedDapiName = dapiNameSchema.safeParse(dapiName);
  if (dapiName && !parsedDapiName.success) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('Invalid dapiName'),
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

  const queryChainId = parsedChainId.data;
  const queryBeaconId = parsedDapiName.success
    ? await getDataFeedIdFromDapiName(parsedDapiName.data, db)
    : parsedBeaconId.success && parsedBeaconId.data;

  if (!queryBeaconId) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('Could not find the chainId from the provided dapiName'),
    };
  }

  const queryTransactionCountLimit = DEFAULT_TRANSACTION_COUNT;

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
      [queryChainId, queryBeaconId, queryTransactionCountLimit]
    );

  const goResponse = await go(operation, goQueryConfig);
  if (!goResponse.success) {
    const e = goResponse.error as Error;
    console.error(goResponse.error);
    console.error(e.stack);
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('An error has occurred while querying last transactions'),
    };
  }

  const payload = goResponse.data.rows;

  if (payload.length === 0) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('Empty results returned from data warehouse'),
    };
  }

  return {
    statusCode: 200,
    headers: config.headers,
    body: JSON.stringify(payload),
  };
};
