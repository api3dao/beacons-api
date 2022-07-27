import * as fs from 'fs';
import path from 'path';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import * as database from './database';
import { chainValueDataPoint, onChainValueQueryTemplate } from './on-chain-value';

describe('handles http queries for on-chain-value for single dataFeedIds', () => {
  it('responds to a valid query', async () => {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'on-chain-value-example.json')).toString()
    );

    const initDb = jest.spyOn(database, 'initDb');
    const mockQueryImplementation = jest.fn().mockImplementation(() => ({
      rows: [{ data }],
    }));
    // @ts-ignore
    initDb.mockReturnValue({ query: mockQueryImplementation });

    const queryStringParameters = {
      chainId: '137',
      dataFeedId: '0xddd22962d8a815f315667f4bd8dfceb04a4383cd3a95397806345840d2705197',
    };

    const result = await chainValueDataPoint(
      {
        queryStringParameters,
      } as unknown as APIGatewayProxyEvent,
      {} as unknown as Context,
      () => {}
    );
    expect(initDb).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledWith(onChainValueQueryTemplate, [
      queryStringParameters.chainId,
      queryStringParameters.dataFeedId,
    ]);

    expect(result?.statusCode).toEqual(200);
    expect(result?.body).toEqual(`{"beaconResponse":[{"hex":"0x0d9a1ece3a7ef800","type":"BigNumber"},926163856]}`);
  });
});
