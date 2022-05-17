import { Metric } from '../src/types';

export const metricTestCases = [
  [
    {
      metricName: Metric.TELEMETRY_DISK_SPACE_USAGE,
      value: 50,
    },
    { messageResult: false, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.TELEMETRY_DISK_SPACE_USAGE,
      value: 99,
    },
    { messageResult: true, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.BEACON_LIVE,
      value: 1,
    },
    { messageResult: false, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.BEACON_LIVE,
      value: 0,
    },
    { messageResult: true, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.BEACON_OUTSTANDNING_REQUEST_LATENESS,
      value: 5,
    },
    { messageResult: true, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.BEACON_OUTSTANDNING_REQUEST_LATENESS,
      value: 0,
    },
    { messageResult: false, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.API_READ_LATENCY,
      value: 11_000,
    },
    { messageResult: true, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.API_READ_LATENCY,
      value: 0,
    },
    { messageResult: false, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.API_LIVENESS,
      value: 0,
    },
    { messageResult: true, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.API_LIVENESS,
      value: 1,
    },
    { messageResult: false, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.BEACON_READ_LATENCY,
      value: 11_000,
    },
    { messageResult: true, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.BEACON_READ_LATENCY,
      value: 0,
    },
    { messageResult: false, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.FAILED_FULFILMENTS,
      value: 15,
    },
    { messageResult: true, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.FAILED_FULFILMENTS,
      value: 1,
    },
    { messageResult: false, databaseCall: [] },
  ],
  [
    {
      metricName: Metric.API_BEACON_DEVIATION,
      value: 5,
    },
    { messageResult: false, databaseCall: [] },
  ],
] as const;
