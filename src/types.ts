import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';

export interface GlobalConfig {
  readonly providers: Record<string, string>;
  readonly opsGenieConfig: OpsGenieConfig;
  readonly headers: Record<string, string>;
}

// As per https://docs.opsgenie.com/docs/alert-api
export interface OpsGenieResponder {
  readonly type: 'team' | 'user' | 'escalation' | 'schedule';
  readonly name?: string;
  readonly id?: string;
}

export interface OpsGenieMessage {
  readonly message: string;
  readonly alias: string;
  readonly description?: string;
  readonly priority?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  readonly details?: Record<string, string>;
}

export interface OpsGenieConfig {
  readonly apiKey: string;
  readonly responders: OpsGenieResponder[];
}

export interface OverrideDatabaseOptions {
  readonly hostname?: string;
  readonly port?: string;
  readonly username?: string;
  readonly password?: string;
  readonly database?: string;
}

export type APIGatewayProxyHandler = Handler<APIGatewayProxyEvent, APIGatewayProxyResult>;
