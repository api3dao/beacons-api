import { go } from '@api3/promise-utils';
import { ScheduledHandler } from 'aws-lambda';
import axios from 'axios';
import { Client } from 'pg';
import { initDb } from './database';
import { CoinGeckoApiResult } from './types';

const queryCoinGeckoIds = async (db: Client): Promise<string[]> => {
  const operation = async () =>
    db.query(
      `
			SELECT coingecko_api_name as "coinGeckoId"
			FROM coin_value
			`
    );

  const goResponse = await go(operation, { attemptTimeoutMs: 5_000, retries: 2, totalTimeoutMs: 15_000 });
  if (!goResponse.success) {
    const e = goResponse.error as Error;
    console.error(goResponse.error);
    console.error(e.stack);
    return [];
  }

  return goResponse.data.rows.map((row) => row.coinGeckoId);
};

const fetchCoinValues = async (coinGeckoIds: string[]) => {
  const baseUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd';
  const url = `${baseUrl}&ids=${encodeURIComponent(coinGeckoIds.join(','))}`;

  const result = await axios({
    url,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'GET',
    timeout: 10_000,
  });

  if (result.status >= 400) {
    console.error('An error has occured trying to fetch the values from the API');
    return;
  }

  return result.data as CoinGeckoApiResult[];
}

export const coinValueRefresh: ScheduledHandler = async (): Promise<any> => {

  const db = await initDb();
  if (db === undefined) {
    console.error('An error has occurred while trying to initialize the database');
    return;
  }

  const coinGeckoIds = await queryCoinGeckoIds(db);
  if (coinGeckoIds.length === 0) {
    console.error('Could not find any CoinGeckoId in database');
    return;
  }

	const coinValues = await fetchCoinValues(coinGeckoIds);
	if(coinValues === undefined) {
		console.error('Could not get any result from CoinGecko API.');
		return;
	}

  const operation = async () =>
    db.query(
      `
			update coin_value as current set
			value = updated.value, updated_at = current_timestamp
			from (select unnest($1::text[]) as symbol, unnest($2::double precision[]) as value)
			as updated(symbol, value)
			where current.symbol = updated.symbol;
			`,
      [coinValues.map((cv) => (cv.symbol)), 
			coinValues.map((cv) => (cv.current_price))]
    );

  const goResponse = await go(operation, { attemptTimeoutMs: 5_000, retries: 2, totalTimeoutMs: 15_000 });
  if (!goResponse.success) {
    const e = goResponse.error as Error;
    console.error(goResponse.error);
    console.error(e.stack);
    return;
  }

  console.log('Values updated successfully');
};
