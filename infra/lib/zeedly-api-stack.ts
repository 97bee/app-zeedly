import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

export interface ZeedlyApiStackProps extends cdk.StackProps {
  stage: string;
  webUrl: string;
  solanaRpcUrl: string;
  apiSecretName?: string;
}

export class ZeedlyApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ZeedlyApiStackProps) {
    super(scope, id, props);

    const stage = normalizeNamePart(props.stage);
    const removalPolicy = stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    const table = new dynamodb.Table(this, "ZeedlyTable", {
      tableName: `zeedly-${stage}`,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy,
    });

    for (const indexName of ["gsi1", "gsi2", "gsi3", "gsi4"]) {
      table.addGlobalSecondaryIndex({
        indexName,
        partitionKey: { name: `${indexName}pk`, type: dynamodb.AttributeType.STRING },
        sortKey: { name: `${indexName}sk`, type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });
    }

    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
    const functionName = `zeedly-api-${stage}`;
    const apiLogGroup = new logs.LogGroup(this, "ZeedlyApiLogGroup", {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy,
    });

    const environment: Record<string, string> = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_ENV: "production",
      DYNAMODB_TABLE: table.tableName,
      SOLANA_RPC_URL: props.solanaRpcUrl,
      WEB_URL: props.webUrl,
      POWERTOOLS_SERVICE_NAME: `zeedly-api-${stage}`,
      LOG_LEVEL: "INFO",
    };

    const apiSecret = props.apiSecretName
      ? secretsmanager.Secret.fromSecretNameV2(this, "ZeedlyApiSecret", props.apiSecretName)
      : undefined;

    if (apiSecret) {
      for (const key of [
        "OPENFORT_SECRET_KEY",
        "OPENFORT_SHIELD_SECRET",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
      ]) {
        environment[key] = apiSecret.secretValueFromJson(key).unsafeUnwrap();
      }
    }

    const apiFunction = new nodejs.NodejsFunction(this, "ZeedlyApiFunction", {
      functionName,
      entry: path.join(repoRoot, "apps/api/src/index.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      logGroup: apiLogGroup,
      environment,
      bundling: {
        target: "node20",
        format: nodejs.OutputFormat.CJS,
        minify: true,
        sourceMap: true,
        sourcesContent: false,
        externalModules: [],
      },
    });

    table.grantReadWriteData(apiFunction);
    apiSecret?.grantRead(apiFunction);

    const httpApi = new apigatewayv2.HttpApi(this, "ZeedlyHttpApi", {
      apiName: `zeedly-api-${stage}`,
      defaultIntegration: new integrations.HttpLambdaIntegration("ZeedlyApiIntegration", apiFunction),
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: httpApi.apiEndpoint,
      description: "Base URL for the deployed Zeedly API",
    });

    new cdk.CfnOutput(this, "TrpcUrl", {
      value: `${httpApi.apiEndpoint}/trpc`,
      description: "Set NEXT_PUBLIC_API_URL to this value in the web app",
    });

    new cdk.CfnOutput(this, "HealthUrl", {
      value: `${httpApi.apiEndpoint}/health`,
      description: "Health check endpoint",
    });

    new cdk.CfnOutput(this, "TableName", {
      value: table.tableName,
      description: "DynamoDB table used by the API",
    });
  }
}

function normalizeNamePart(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "dev";
}
