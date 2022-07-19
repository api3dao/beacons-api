import * as fs from 'fs';
import path from 'path';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Client } from 'pg';
import { DEFAULT_TRANSACTION_COUNT, lastTransactions, lastTransactionsQueryTemplate } from './last-transactions';
import * as database from './database';
import * as dapiNames from './dapi-names';

describe('handles http queries for latest transactions for single dataFeedIds', () => {
  it('responds to a valid query', async () => {
    const validRows = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'last-transactions-example.json')).toString()
    );

    const initDb = jest.spyOn(database, 'initDb');
    const mockQueryImplementation = jest.fn().mockImplementation((_query: string, _parameters: any[]) => ({
      rows: validRows,
    }));
    // @ts-ignore
    initDb.mockReturnValue({ query: mockQueryImplementation });

    const queryStringParameters = {
      chainId: '30',
      beaconId: '0x09a5873667837598bd0990ba2f53d750d545ce435ecdcd44e0b4c64ab7d7d20d',
    };

    const result = await lastTransactions(
      {
        queryStringParameters,
      } as unknown as APIGatewayProxyEvent,
      {} as unknown as Context,
      () => {}
    );
    expect(initDb).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledWith(lastTransactionsQueryTemplate, [
      queryStringParameters.chainId,
      queryStringParameters.beaconId,
      DEFAULT_TRANSACTION_COUNT,
    ]);

    expect(result).toBeDefined();

    if (!result) {
      return;
    }

    expect(result.statusCode).toEqual(200);
    expect(result.body).toEqual(JSON.stringify(validRows));
  });

  it('indicates a 400 status code for an empty response', async () => {
    const initDb = jest.spyOn(database, 'initDb');
    const mockQueryImplementation = jest.fn().mockImplementation((_query: string, _parameters: any[]) => ({
      rows: [],
    }));
    // @ts-ignore
    initDb.mockReturnValue({ query: mockQueryImplementation });

    const queryStringParameters = {
      chainId: '30',
      beaconId: '0x09a5873667837598bd0990ba2f53d750d545ce435ecdcd44e0b4c64ab7d7d20d',
    };

    const result = await lastTransactions(
      {
        queryStringParameters,
      } as unknown as APIGatewayProxyEvent,
      {} as unknown as Context,
      () => {}
    );
    expect(initDb).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledWith(lastTransactionsQueryTemplate, [
      queryStringParameters.chainId,
      queryStringParameters.beaconId,
      DEFAULT_TRANSACTION_COUNT,
    ]);

    expect(result).toBeDefined();

    if (!result) {
      return;
    }

    expect(result.statusCode).toEqual(400);
    expect(result.body).toEqual(`{"error":"Empty results returned from data warehouse"}`);
  });

  it('indicates a 400 status code for an empty response', async () => {
    const initDb = jest.spyOn(database, 'initDb');
    const mockQueryImplementation = jest.fn().mockImplementation((_query: string, _parameters: any[]) => ({
      rows: [],
    }));
    // @ts-ignore
    initDb.mockReturnValue({ query: mockQueryImplementation });

    const queryStringParameters = {
      chainId: '30',
      beaconId: '0x09a5873667837598bd0990ba2f53d750d545ce435ecdcd44e0b4c64ab7d7d20d',
    };

    const result = await lastTransactions(
      {
        queryStringParameters,
      } as unknown as APIGatewayProxyEvent,
      {} as unknown as Context,
      () => {}
    );
    expect(initDb).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledWith(lastTransactionsQueryTemplate, [
      queryStringParameters.chainId,
      queryStringParameters.beaconId,
      DEFAULT_TRANSACTION_COUNT,
    ]);

    expect(result).toBeDefined();

    if (!result) {
      return;
    }

    expect(result.statusCode).toEqual(400);
    expect(result.body).toEqual(`{"error":"Empty results returned from data warehouse"}`);
  });

  it('returns a 400 status code for invalid parameters', async () => {
    const initDb = jest.spyOn(database, 'initDb');
    // @ts-ignore
    initDb.mockReturnValue({});

    const queryStringParameters = {
      chainId: 'hi',
      beaconId: '0x09a5873667837598bd0990ba2f53d750d545ce435ecdcd44e0b4c64ab7d7d2d',
    };

    const result = await lastTransactions(
      {
        queryStringParameters,
      } as unknown as APIGatewayProxyEvent,
      {} as unknown as Context,
      () => {}
    );
    expect(initDb).toHaveBeenCalledTimes(0);
    expect(result).toBeDefined();

    if (!result) {
      return;
    }

    expect(result.statusCode).toEqual(400);
    expect(result.body).toEqual(`{"error":"Invalid beaconId"}`);
  });
});

describe('handles http queries for latest transactions for dAPIs', () => {
  it('responds to a valid query', async () => {
    const validDataFeedIdRows = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'last-transactions-example.json')).toString()
    );

    const initDb = jest.spyOn(database, 'initDb');
    const mockQueryImplementation = jest.fn().mockImplementation((_query: string, _parameters: any[]) => ({
      rows: validDataFeedIdRows,
    }));
    const mockedDatabaseClient = { query: mockQueryImplementation };
    const initDbReturnValue = new Promise((resolve) =>
      resolve(mockedDatabaseClient)
    ) as Promise<unknown> as Promise<Client>;
    initDb.mockReturnValue(initDbReturnValue);

    const beaconId = '0x09a5873667837598bd0990ba2f53d750d545ce435ecdcd44e0b4c64ab7d7d20d';
    const dapiName = 'USD/EUR';
    const chainId = '30';

    const getDataFeedIdFromDapiNameSpy = jest.spyOn(dapiNames, 'getDataFeedIdFromDapiName');
    getDataFeedIdFromDapiNameSpy.mockReturnValueOnce(new Promise((resolve) => resolve(beaconId)));

    const queryStringParameters = {
      chainId,
      dapiName,
    };

    // Neither the context nor callback implement our handlers
    const result = await lastTransactions(
      {
        queryStringParameters,
      } as unknown as APIGatewayProxyEvent,
      {} as unknown as Context,
      () => {}
    );

    expect(initDb).toHaveBeenCalledTimes(1);
    expect(getDataFeedIdFromDapiNameSpy).toHaveBeenCalledTimes(1);
    expect(getDataFeedIdFromDapiNameSpy).toHaveBeenCalledWith(dapiName, chainId, mockedDatabaseClient);
    expect(mockQueryImplementation).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledWith(lastTransactionsQueryTemplate, [
      queryStringParameters.chainId,
      beaconId,
      DEFAULT_TRANSACTION_COUNT,
    ]);

    expect(result).toBeDefined();

    if (!result) {
      return;
    }

    expect(result.statusCode).toEqual(200);
    expect(result.body).toEqual(JSON.stringify(validDataFeedIdRows));
  });

  it('returns a 400 status code in response to a query for a non-existent dAPI name', async () => {
    const validDataFeedIdRows = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'last-transactions-example.json')).toString()
    );

    const initDb = jest.spyOn(database, 'initDb');
    const mockQueryImplementation = jest.fn().mockImplementation((_query: string, _parameters: any[]) => ({
      rows: validDataFeedIdRows,
    }));
    const mockedDatabaseClient = { query: mockQueryImplementation };
    const initDbReturnValue = new Promise((resolve) =>
      resolve(mockedDatabaseClient)
    ) as Promise<unknown> as Promise<Client>;
    initDb.mockReturnValue(initDbReturnValue);

    const dapiName = 'DOES NOT EXIST';
    const chainId = '30';

    const getDataFeedIdFromDapiNameSpy = jest.spyOn(dapiNames, 'getDataFeedIdFromDapiName');
    getDataFeedIdFromDapiNameSpy.mockReturnValueOnce(new Promise((resolve) => resolve(undefined)));

    const queryStringParameters = {
      chainId,
      dapiName,
    };

    // Neither the context nor callback implement our handlers
    const result = await lastTransactions(
      {
        queryStringParameters,
      } as unknown as APIGatewayProxyEvent,
      {} as unknown as Context,
      () => {}
    );

    expect(initDb).toHaveBeenCalledTimes(1);
    expect(getDataFeedIdFromDapiNameSpy).toHaveBeenCalledTimes(1);
    expect(getDataFeedIdFromDapiNameSpy).toHaveBeenCalledWith(dapiName, chainId, mockedDatabaseClient);
    expect(mockQueryImplementation).toHaveBeenCalledTimes(0);

    expect(result).toBeDefined();

    if (!result) {
      return;
    }

    expect(result.statusCode).toEqual(400);
    expect(result.body).toEqual(`{"error":"Could not find the chainId from the provided dapiName"}`);
  });
});
