import { go } from '@api3/promise-utils';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { goQueryConfig } from './constants';
import { initDb } from './database';
import { BeaconDeviation } from './types';
import { getGlobalConfig, makeError } from './utils';

export const evmBeaconIdSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
export const chainIdSchema = z.string().regex(/^\d+$/);

const config = getGlobalConfig();

export const getVolatility: APIGatewayProxyHandler = async (event): Promise<any> => {
  const { beaconId, chainId } = event.queryStringParameters ?? {};

  if (!beaconId || !chainId) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('Beaconid and chainId required - both values must be present'),
    };
  }

  const parsedBeaconId = evmBeaconIdSchema.safeParse(beaconId);
  if (!parsedBeaconId.success) {
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
      body: makeError('Invalid ChainId'),
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
  const queryBeaconId = parsedBeaconId.data;

  const operation = async () =>
    db.query(
      `
      SELECT
        time AS "time",
        metric/10^16 as "deviation"
      FROM api_beacon_deviation
      WHERE 
        "time" > NOW() - interval '12' HOUR AND 
        metadata->>'beaconId' like $1 AND 
        metadata->>'chainId' = $2
      ORDER BY 1,2
      `,
      [queryBeaconId, queryChainId]
    );

  const goResponse = await go(operation, goQueryConfig);
  if (!goResponse.success) {
    const e = goResponse.error as Error;
    console.error(goResponse.error);
    console.error(e.stack);
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('An error has occurred while querying volatility'),
    };
  }

  const queryResult: BeaconDeviation[] = goResponse.data.rows;

  if (queryResult.length === 0) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('The query did not return any value'),
    };
  }

  const payload = queryResult.map((vol) => [new Date(vol.time).getTime(), vol.deviation]);

  return {
    statusCode: 200,
    headers: config.headers,
    body: JSON.stringify(payload),
  };
};
