import { Client } from 'pg';
import { ethers } from 'ethers';
import { dapiNameQueryTemplate, getDataFeedIdFromDapiName } from './dapi-names';

describe('handles dapi name query', () => {
  it('responds to a valid query', async () => {
    const mockQueryImplementation = jest.fn().mockImplementation((_query: string, _parameters: any[]) => ({
      rows: [{ dataFeedId: '0xddd22962d8a815f315667f4bd8dfceb04a4383cd3a95397806345840d2705197' }],
    }));

    const dapiName = 'QUICK/USD';
    const chainId = '80001';

    const nameResolutionResult = await getDataFeedIdFromDapiName(dapiName, chainId, {
      query: mockQueryImplementation,
    } as unknown as Client);
    expect(mockQueryImplementation).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledWith(dapiNameQueryTemplate, [
      chainId,
      ethers.utils.formatBytes32String(dapiName),
    ]);

    expect(nameResolutionResult).toEqual(`0xddd22962d8a815f315667f4bd8dfceb04a4383cd3a95397806345840d2705197`);
  });

  it('responds to an invalid query', async () => {
    const mockQueryImplementation = jest.fn().mockImplementation((_query: string, _parameters: any[]) => ({
      rows: [],
    }));

    const dapiName = 'AAVE/BTC';
    const chainId = '80001';

    const nameResolutionResult = await getDataFeedIdFromDapiName(dapiName, chainId, {
      query: mockQueryImplementation,
    } as unknown as Client);
    expect(mockQueryImplementation).toHaveBeenCalledTimes(1);
    expect(mockQueryImplementation).toHaveBeenCalledWith(dapiNameQueryTemplate, [
      chainId,
      ethers.utils.formatBytes32String(dapiName),
    ]);

    expect(nameResolutionResult).toBeUndefined();
  });
});
