#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ZeedlyApiStack } from "../lib/zeedly-api-stack.js";

const app = new cdk.App();

const stage = app.node.tryGetContext("stage") ?? process.env.STAGE ?? "dev";
const webUrl = app.node.tryGetContext("webUrl") ?? process.env.WEB_URL ?? "http://localhost:3000";
const solanaRpcUrl =
  app.node.tryGetContext("solanaRpcUrl") ??
  process.env.SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";
const apiSecretName = app.node.tryGetContext("apiSecretName") ?? process.env.API_SECRET_NAME;
const openfortPublishableKey =
  app.node.tryGetContext("openfortPublishableKey") ?? process.env.OPENFORT_PUBLISHABLE_KEY;

new ZeedlyApiStack(app, `ZeedlyApi-${stage}`, {
  stage,
  webUrl,
  solanaRpcUrl,
  apiSecretName,
  openfortPublishableKey,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? "eu-west-1",
  },
});

cdk.Tags.of(app).add("App", "Zeedly");
cdk.Tags.of(app).add("Stage", stage);
