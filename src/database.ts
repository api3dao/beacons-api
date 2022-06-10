import tls from 'tls';
import { go } from '@api3/airnode-utilities';
import { OverrideDatabaseOptions } from './types';
import { Client } from 'pg';
import { sendToOpsGenieLowLevel } from './opsgenie-utils';

export const initDb = async (optionalOverrides?: OverrideDatabaseOptions) => {
  if (process.env.POSTGRES_HOST === undefined) {
    return;
  }

  const host = optionalOverrides?.hostname ?? process.env.POSTGRES_HOST ?? '';
  const port = parseInt(optionalOverrides?.port ?? process.env.POSTGRES_PORT ?? '65432');

  const socketPromise = await new Promise((resolve, reject) => {
    const socket = tls.connect(
      port,
      host,
      {
        servername: host,
        host,
      },
      () => {
        if (socket.authorized) {
          resolve(socket);
        } else {
          reject('TLS Authorisation failure');
        }
      }
    );
  });

  const db = new Client({
    stream: socketPromise as tls.TLSSocket,
    port,
    user: optionalOverrides?.username ?? process.env.POSTGRES_USER,
    password: optionalOverrides?.password ?? process.env.POSTGRES_PASSWORD,
    host,
    database: optionalOverrides?.database ?? process.env.POSTGRES_DATABASE,
  });

  const operation = async () => {
    await db.connect();
    await db.query('select 1;');
  };

  const [err] = await go(operation, { timeoutMs: 5_000, retries: 0 });
  if (err) {
    const typedError = err as Error;

    await sendToOpsGenieLowLevel({
      message: 'Database connection failed',
      alias: 'database-connection-failed',
      description: `Message: ${typedError.message}
      Stack: 
      ${JSON.stringify(typedError.stack, null, 2)}`,
      priority: 'P2',
    });
    return undefined;
  }

  return db;
};