import { go } from '@api3/promise-utils';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { getGlobalConfig, makeError } from './utils';
import { initDb } from './database';

export const symbolSchema = z.string();

const config = getGlobalConfig();

export const coinValue: APIGatewayProxyHandler = async (event): Promise<any> => {

  const parsedSymbol = symbolSchema.safeParse(event.queryStringParameters?.symbol);
  if (!parsedSymbol.success) {
    return {
      statusCode: 400,
      headers: config.headers,
      body: makeError('Symbol required - Symbol is either not present or invalid'),
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

  const symbol = parsedSymbol.data;

  const operation = async () =>
    db.query(
      `
    SELECT symbol, value, coingecko_api_name, updated_at
    FROM coin_value 
    WHERE symbol = $1
    LIMIT 1;
  `,
      [symbol]
    );

  const goResponse = await go(operation, { attemptTimeoutMs: 5_000, retries: 2, totalTimeoutMs: 15_000 });
  if (!goResponse.success) {
    const e = goResponse.error as Error;
    console.error(goResponse.error);
    console.error(e.stack);
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError('An error has occurred while querying the symbol value'),
    };
  }

  const queryResult = goResponse.data;
  
  if(queryResult?.rowCount === 0) {
    return {
        statusCode: 400,
        headers: config.headers,
        body: makeError('Value not found for the given symbol'),
      };
  }

  const payload = queryResult.rows[0];

  return {
    statusCode: 200,
    headers: config.headers,
    body: JSON.stringify(payload),
  };
};
