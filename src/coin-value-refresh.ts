import { go } from '@api3/promise-utils';
import { ScheduledHandler } from 'aws-lambda';
import axios from 'axios';
import { Client } from 'pg';
import { goQueryConfig } from './constants';
import { initDb } from './database';
import { CoinGeckoApiResult } from './types';

const ensureTablesCreated = async (db: Client) => {
  const operation = async () =>
    db.query(
      `
    CREATE TABLE IF NOT EXISTS coin_value(
      symbol VARCHAR(40) PRIMARY KEY,
      coingecko_api_name VARCHAR(40),
      value DOUBLE PRECISION NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS token_historic_prices (
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      symbol VARCHAR(40),
      value DOUBLE PRECISION NOT NULL,
      PRIMARY KEY(created_at, symbol)
    );
    `
    );

  const goResponse = await go(operation, goQueryConfig);
  if (!goResponse.success) {
    const e = goResponse.error as Error;
    console.error(goResponse.error);
    console.error(e.stack);
  }
};

const queryCoinGeckoIds = async (db: Client): Promise<string[]> => {
  const operation = async () =>
    db.query(
      `
			SELECT coingecko_api_name AS "coinGeckoId"
			FROM coin_value
			`
    );

  const goResponse = await go(operation, goQueryConfig);
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
};

export const coinValueRefresh: ScheduledHandler = async (): Promise<any> => {
  const db = await initDb();
  if (db === undefined) {
    console.error('An error has occurred while trying to initialize the database');
    return;
  }

  await ensureTablesCreated(db);

  const coinGeckoIds = await queryCoinGeckoIds(db);
  if (coinGeckoIds.length === 0) {
    console.error('Could not find any CoinGeckoId in database');
    return;
  }

  const coinValues = await fetchCoinValues(coinGeckoIds);
  if (coinValues === undefined) {
    console.error('Could not get any result from CoinGecko API.');
    return;
  }

  const symbols = coinValues.map((cv) => cv.symbol);
  const prices = coinValues.map((cv) => cv.current_price);

  const updateValueOperation = async () =>
    db.query(
      `
			UPDATE coin_value AS current 
      SET
			  value = updated.value, updated_at = current_timestamp
			FROM 
        (SELECT UNNEST($1::TEXT[]) AS symbol, UNNEST($2::DOUBLE PRECISION[]) AS value)
			AS updated(symbol, value)
			WHERE 
        current.symbol = updated.symbol;
			`,
      [symbols, prices]
    );

  const goUpdateValueResponse = await go(updateValueOperation, goQueryConfig);
  if (!goUpdateValueResponse.success) {
    const e = goUpdateValueResponse.error as Error;
    console.error(goUpdateValueResponse.error);
    console.error(e.stack);
    return;
  }

  const addHistoricDataOperation = async () =>
    db.query(
      `
    INSERT INTO token_historic_prices (symbol, value) 
    SELECT * FROM UNNEST ($1::TEXT[], $2::DOUBLE PRECISION[]);
    `,
      [symbols, prices]
    );

  const goAddHistoricDataResponse = await go(addHistoricDataOperation, goQueryConfig);
  if (!goAddHistoricDataResponse.success) {
    const e = goAddHistoricDataResponse.error as Error;
    console.error(goAddHistoricDataResponse.error);
    console.error(e.stack);
    return;
  }

  console.log('Values updated successfully');
};
