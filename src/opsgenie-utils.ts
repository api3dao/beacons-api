import axios from 'axios';
import { OpsGenieMessage } from './types';
import { getGlobalConfig } from './utils';

export const sendToOpsGenieLowLevel = async (message: OpsGenieMessage, globalConfig = getGlobalConfig()) =>
  new Promise<void>((resolve) => {
    console.error(message);
    if (!process.env.OPSGENIE_API_KEY) {
      console.error('No OpsGenie key found in ENVs, this is probably a mistake.');
      resolve();
      return;
    }
    const url = 'https://api.opsgenie.com/v2/alerts';
    const apiKey = process.env.OPSGENIE_API_KEY!;

    const payload = JSON.stringify({
      ...message,
      responders: globalConfig.opsGenieConfig.responders,
    });

    axios({
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `GenieKey ${apiKey}`,
      },
      method: 'POST',
      data: payload,
      timeout: 10_000,
    })
      .catch((e) => {
        console.error('Failed to create OpsGenie alert', e);
        resolve();
      })
      .then(() => {
        resolve();
      });
  });
