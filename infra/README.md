# Zeedly AWS CDK

This CDK app deploys the Zeedly API to AWS:

- DynamoDB single table with `pk` / `sk` and `gsi1` through `gsi4`
- Lambda function bundled from `apps/api/src/index.ts`
- API Gateway HTTP API with `/health` and `/trpc/*`

## First-Time Setup

```bash
pnpm install
pnpm infra:bootstrap -- aws://ACCOUNT_ID/eu-west-1
```

## Deploy

```bash
STAGE=dev WEB_URL=https://your-web-app.example pnpm infra:deploy
```

Optional production secrets can be provided through AWS Secrets Manager. Create a JSON secret with these keys, then pass its name with `API_SECRET_NAME`:

```json
{
  "OPENFORT_SECRET_KEY": "sk_...",
  "OPENFORT_SHIELD_SECRET": "...",
  "STRIPE_SECRET_KEY": "sk_...",
  "STRIPE_WEBHOOK_SECRET": "whsec_..."
}
```

```bash
STAGE=prod WEB_URL=https://your-web-app.example API_SECRET_NAME=/zeedly/prod/api pnpm infra:deploy
```

The deploy outputs include:

- `ApiUrl`
- `TrpcUrl`
- `HealthUrl`
- `TableName`

Set the web app's `NEXT_PUBLIC_API_URL` to the `TrpcUrl` output.

## Useful Commands

```bash
STAGE=dev WEB_URL=http://localhost:3000 pnpm infra:synth
STAGE=dev WEB_URL=https://your-web-app.example pnpm infra:diff
STAGE=dev pnpm infra:destroy
```

For production, deploy with `STAGE=prod`. Production tables are retained if the stack is destroyed; non-production tables are destroyed with the stack.

You can also pass CDK context directly when needed:

```bash
pnpm --dir infra exec cdk deploy -c stage=prod -c webUrl=https://app.zeedly.example
```
