# Beacons API

> A set of Lambda handlers to serve data required by Beacons-related frontends

## Overview

Beacon data feeds ideally require frontend UIs to visualise them for the purposes of marketing and assessment. These UIs
will often have the need to display the last updates associated with a beacon and the current on-chain price, among
other requirements not yet defined.

This repository contains a set of serverless handler functions that provide backing services to these frontends.

## Installation

```shell
yarn install
```

## Deployment

Start by copying the example files and modifying them with real values:

```shell
cp telemetryConfig.example.json telemetryConfig.json
cp serverless.example.yml serverless.yml
```

Test your potential deployment:

```shell
rm -rf .build .serverless;
yarn sls invoke local --function <function_name> --data <endpoint_data>
```

Examples:

```shell
rm -rf .build .serverless && yarn sls invoke local --function last_transactions --data '{ "queryStringParameters": {"beaconId":"0x5237b1d9dbbb7fcfabf646bcad0054abda328cee9d9d1fe2488cbed3a33cd47e", "chainId":80001}}'
rm -rf .build .serverless && yarn sls invoke local --function chain_value_data_point --data '{ "queryStringParameters": {"dapiName":"AVAX/USD", "chainId":80001}}'
```

If you're happy, authenticate with AWS and acquire credentials, as per the
[serverless guide](https://www.serverless.com/framework/docs/providers/aws/guide/credentials).

```shell
yarn sls deploy --region us-east-1
```
