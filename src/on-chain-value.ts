import { APIGatewayProxyHandler } from 'aws-lambda';
import { go } from '@api3/airnode-utilities';
import { getGlobalConfig, makeError } from './utils';
import { initDb } from './database';

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

  const db = await initDb();
  if(db === undefined) {
    return {
      statusCode: 500,
      headers: config.headers,
      body: makeError("An error occurred while trying to initialize the database"),
    };
  }

  const operation = async () => db.query(`
    SELECT event_data -> 'parsedLog' -> 'args' ->> 1 as data
    FROM dapi_events 
    WHERE 
    chain = ${chainId} AND
    event_data->'parsedLog'->'args'->>0 = '${dataFeedId}' 
    ORDER by block DESC 
    LIMIT 1;`
  );

  const [err, queryResult] = await go(operation, { timeoutMs: 5_000, retries: 2 });
  const e = err as Error;
  if (err) {
    console.error(err);
    console.error(e.stack);
  }

  const beaconResponse = JSON.parse(queryResult?.rows[0]?.data);

  return {
    statusCode: err ? 500 : 200,
    headers: config.headers,
    body: JSON.stringify({ error: !!err, beaconResponse }),
  };
};