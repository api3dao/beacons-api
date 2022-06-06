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
rm -rf .build .serverless; # This removes build artifacts (paranoid)
yarn sls invoke local --function <the name of the function you'd like to test>
```

If you're happy, authenticate with AWS and acquire credentials, as per the
[serverless guide](https://www.serverless.com/framework/docs/providers/aws/guide/credentials).

```shell
yarn sls deploy --region us-east-1
```
