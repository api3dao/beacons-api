import { Client } from 'pg';
import { ethers } from 'ethers';
import { go } from '@api3/promise-utils';
import { goQueryConfig } from './constants';

export const getDataFeedIdFromDapiName = async (dapiName: string, chainId: string, db: Client) => {
  const hashedDapiNameId = ethers.utils.formatBytes32String(dapiName);

  const operation = () =>
    db.query(
      `
    SELECT event_data->'parsedLog'->'args'->> 1 as "dataFeedId"
    FROM dapi_events 
    WHERE 
    chain = $1 AND
    event_name = 'SetDapiName' AND 
    event_data->'parsedLog'->'args'->> 0 = $2 
    ORDER BY block DESC
    LIMIT 1;
  `,
      [parseInt(chainId), hashedDapiNameId]
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
