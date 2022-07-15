import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { GlobalConfig } from './types';

export const doTimeout = (interval: number) => new Promise((resolve) => setTimeout(() => resolve(null), interval));

export const makeError = (error: string) => JSON.stringify({ error });

export const exit = (code = 0) => {
  debugLog(`Exiting, code: ${code}`);
  process.exit(code);
};

export const getGlobalConfig = (): GlobalConfig =>
  JSON.parse(
    readFileSync(process.env.TELEMETRY_CONFIG || join(__dirname, '../telemetryConfig.json')).toString('utf-8')
  );

export const isCloudFunction = () => process.env.LAMBDA_TASK_ROOT || process.env.FUNCTION_TARGET;

export const readJsonFile = (filePath: string) => JSON.parse(readFileSync(filePath).toString('utf8'));

export const readJsonDirectoryAsArray = (directoryPath: string): FilePayload[] =>
  readdirSync(directoryPath).map((filename) => ({
    ...readJsonFile(join(directoryPath, filename)),
    filename,
  }));

interface FilePayload {
  readonly filename: string;
}

export const debugLog = (...args: any[]) => {
  if (process.env.DEBUG) {
    debugLog(args);
  }
};
