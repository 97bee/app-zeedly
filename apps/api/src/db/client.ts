import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { env } from "../lib/config.js";

export const dynamo = new DynamoDBClient({
  region: env.AWS_REGION,
  ...(env.DYNAMODB_ENDPOINT ? { endpoint: env.DYNAMODB_ENDPOINT } : {}),
});

export const TABLE = env.DYNAMODB_TABLE;
