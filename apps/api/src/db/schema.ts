import { Entity, Service, createSchema, type EntityItem } from "electrodb";
import { dynamo, TABLE } from "./client.js";

// ---------------------------------------------------------------------------
// Timestamp helpers — stored as epoch milliseconds (number)
// ---------------------------------------------------------------------------

const createdAt = {
  type: "number" as const,
  readOnly: true,
  required: true,
  default: () => Date.now(),
  set: () => Date.now(),
};

const updatedAt = {
  type: "number" as const,
  watch: "*" as const,
  required: true,
  default: () => Date.now(),
  set: () => Date.now(),
};

// ---------------------------------------------------------------------------
// GSI layout (single-table design)
//
// Primary  → pk / sk
// GSI1     → gsi1pk / gsi1sk  — unique alt lookups (email, slug, openfortId)
// GSI2     → gsi2pk / gsi2sk  — user-scoped queries
// GSI3     → gsi3pk / gsi3sk  — parent-scoped queries (creator's IPOs, etc.)
// GSI4     → gsi4pk / gsi4sk  — status-based list queries
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// UserEntity
// ---------------------------------------------------------------------------

const userSchema = createSchema({
  model: { entity: "user", version: "1", service: "zeedly" },
  attributes: {
    userId:         { type: "string", required: true },
    email:          { type: "string", required: true },
    role:           { type: "string", enum: ["user", "creator", "admin"] as const, default: "user" },
    openfortUserId: { type: "string" },
    solanaPubkey:   { type: "string" },
    kycStatus:      { type: "string", enum: ["not_started", "pending", "verified", "rejected"] as const, default: "not_started" },
    kycUpdatedAt:   { type: "number" },
    createdAt,
    updatedAt,
  },
  indexes: {
    byUserId: {
      pk: { field: "pk",     composite: ["userId"] },
      sk: { field: "sk",     composite: [] },
    },
    byEmail: {
      index: "gsi1",
      pk: { field: "gsi1pk", composite: ["email"] },
      sk: { field: "gsi1sk", composite: [] },
    },
    byOpenfortId: {
      index: "gsi2",
      pk: { field: "gsi2pk", composite: ["openfortUserId"] },
      sk: { field: "gsi2sk", composite: [] },
    },
  },
});

export const UserEntity = new Entity(userSchema, { client: dynamo, table: TABLE });
export type User = EntityItem<typeof UserEntity>;

// ---------------------------------------------------------------------------
// CreatorEntity
// ---------------------------------------------------------------------------

const creatorSchema = createSchema({
  model: { entity: "creator", version: "1", service: "zeedly" },
  attributes: {
    creatorId:       { type: "string", required: true },
    userId:          { type: "string" },
    slug:            { type: "string", required: true },
    name:            { type: "string", required: true },
    avatarUrl:       { type: "string" },
    artworkUrl:      { type: "string" },
    bio:             { type: "string" },
    background:      { type: "string" },
    category:        { type: "string", required: true },
    tags:            { type: "list", items: { type: "string" }, default: () => [] },
    genre:           { type: "string" },
    youtubeUrl:      { type: "string", required: true },
    subscriberCount: { type: "number", default: 0 },
    avgViews:        { type: "number", default: 0 },
    totalViews:      { type: "number", default: 0 },
    uploadFrequency: { type: "string" },
    monthlyRevenue:  { type: "number", default: 0 },
    estimatedMonthlyDividend: { type: "number", default: 0 },
    valuation:       { type: "number", default: 0 },
    revenueShareBps: { type: "number", default: 0 },
    analytics:       { type: "any" },
    tokenMint:       { type: "string" },
    status:          { type: "string", enum: ["pending", "approved", "live", "rejected"] as const, default: "pending" },
    createdAt,
    updatedAt,
  },
  indexes: {
    byCreatorId: {
      pk: { field: "pk",     composite: ["creatorId"] },
      sk: { field: "sk",     composite: [] },
    },
    bySlug: {
      index: "gsi1",
      pk: { field: "gsi1pk", composite: ["slug"] },
      sk: { field: "gsi1sk", composite: [] },
    },
    byStatus: {
      index: "gsi4",
      pk: { field: "gsi4pk", composite: ["status"] },
      sk: { field: "gsi4sk", composite: ["creatorId"] },
    },
  },
});

export const CreatorEntity = new Entity(creatorSchema, { client: dynamo, table: TABLE });
export type Creator = EntityItem<typeof CreatorEntity>;

// ---------------------------------------------------------------------------
// IPOEntity
// ---------------------------------------------------------------------------

const ipoSchema = createSchema({
  model: { entity: "ipo", version: "1", service: "zeedly" },
  attributes: {
    ipoId:         { type: "string", required: true },
    creatorId:     { type: "string", required: true },
    pricePerToken: { type: "number", required: true },
    totalSupply:   { type: "number", required: true },
    sold:          { type: "number", default: 0 },
    raisedUsd:     { type: "number", default: 0 },
    raiseTargetUsd: { type: "number", default: 0 },
    maxInvestmentPerAccountUsd: { type: "number", default: 0 },
    valuationAtRaise: { type: "number", default: 0 },
    dividendCadence: { type: "string", default: "Quarterly" },
    tokenMintedAt: { type: "number" },
    tokenDispersedAt: { type: "number" },
    completedAt:   { type: "number" },
    status:        { type: "string", enum: ["upcoming", "active", "closed"] as const, default: "upcoming" },
    startsAt:      { type: "number", required: true },
    endsAt:        { type: "number", required: true },
    createdAt,
    updatedAt,
  },
  indexes: {
    byIpoId: {
      pk: { field: "pk",     composite: ["ipoId"] },
      sk: { field: "sk",     composite: [] },
    },
    byCreator: {
      index: "gsi3",
      pk: { field: "gsi3pk", composite: ["creatorId"] },
      sk: { field: "gsi3sk", composite: ["ipoId"] },
    },
    byStatus: {
      index: "gsi4",
      pk: { field: "gsi4pk", composite: ["status"] },
      sk: { field: "gsi4sk", composite: ["ipoId"] },
    },
  },
});

export const IPOEntity = new Entity(ipoSchema, { client: dynamo, table: TABLE });
export type IPO = EntityItem<typeof IPOEntity>;

// ---------------------------------------------------------------------------
// IPOPurchaseEntity
// ---------------------------------------------------------------------------

const ipoPurchaseSchema = createSchema({
  model: { entity: "ipo_purchase", version: "1", service: "zeedly" },
  attributes: {
    purchaseId: { type: "string", required: true },
    ipoId:      { type: "string", required: true },
    userId:     { type: "string", required: true },
    quantity:   { type: "number", required: true },
    usdAmount:  { type: "number", required: true },
    asset:      { type: "string", default: "USDT" },
    transactionId: { type: "string" },
    claimedAt:  { type: "number" },
    txSig:      { type: "string" },
    status:     {
      type: "string",
      enum: ["pending", "locked", "claimable", "claimed", "confirmed", "failed", "refunded"] as const,
      default: "pending",
    },
    createdAt,
    updatedAt,
  },
  indexes: {
    byPurchaseId: {
      pk: { field: "pk",     composite: ["purchaseId"] },
      sk: { field: "sk",     composite: [] },
    },
    byUser: {
      index: "gsi2",
      pk: { field: "gsi2pk", composite: ["userId"] },
      sk: { field: "gsi2sk", composite: ["purchaseId"] },
    },
    byIpo: {
      index: "gsi3",
      pk: { field: "gsi3pk", composite: ["ipoId"] },
      sk: { field: "gsi3sk", composite: ["purchaseId"] },
    },
  },
});

export const IPOPurchaseEntity = new Entity(ipoPurchaseSchema, { client: dynamo, table: TABLE });
export type IPOPurchase = EntityItem<typeof IPOPurchaseEntity>;

// ---------------------------------------------------------------------------
// TradeEntity
// ---------------------------------------------------------------------------

const tradeSchema = createSchema({
  model: { entity: "trade", version: "1", service: "zeedly" },
  attributes: {
    tradeId:   { type: "string", required: true },
    userId:    { type: "string", required: true },
    creatorId: { type: "string", required: true },
    side:      { type: "string", enum: ["buy", "sell"] as const, required: true },
    quantity:  { type: "number", required: true },
    usdAmount: { type: "number", required: true },
    price:     { type: "number", required: true },
    fee:       { type: "number", default: 0 },
    txSig:     { type: "string" },
    status:    { type: "string", enum: ["pending", "confirmed", "failed"] as const, default: "pending" },
    createdAt,
    updatedAt,
  },
  indexes: {
    byTradeId: {
      pk: { field: "pk",     composite: ["tradeId"] },
      sk: { field: "sk",     composite: [] },
    },
    byUser: {
      index: "gsi2",
      pk: { field: "gsi2pk", composite: ["userId"] },
      sk: { field: "gsi2sk", composite: ["createdAt", "tradeId"] },
    },
    byCreator: {
      index: "gsi3",
      pk: { field: "gsi3pk", composite: ["creatorId"] },
      sk: { field: "gsi3sk", composite: ["createdAt", "tradeId"] },
    },
  },
});

export const TradeEntity = new Entity(tradeSchema, { client: dynamo, table: TABLE });
export type Trade = EntityItem<typeof TradeEntity>;

// ---------------------------------------------------------------------------
// DividendRoundEntity
// ---------------------------------------------------------------------------

const dividendRoundSchema = createSchema({
  model: { entity: "dividend_round", version: "1", service: "zeedly" },
  attributes: {
    roundId:       { type: "string", required: true },
    creatorId:     { type: "string", required: true },
    period:        { type: "string", required: true }, // e.g. "2026-03"
    totalUsdc:     { type: "number", required: true },
    snapshotData:  { type: "any" },
    distributedAt: { type: "number" },
    createdAt,
    updatedAt,
  },
  indexes: {
    byRoundId: {
      pk: { field: "pk",     composite: ["roundId"] },
      sk: { field: "sk",     composite: [] },
    },
    byCreator: {
      index: "gsi3",
      pk: { field: "gsi3pk", composite: ["creatorId"] },
      sk: { field: "gsi3sk", composite: ["period"] },
    },
  },
});

export const DividendRoundEntity = new Entity(dividendRoundSchema, { client: dynamo, table: TABLE });
export type DividendRound = EntityItem<typeof DividendRoundEntity>;

// ---------------------------------------------------------------------------
// DividendPaymentEntity
// ---------------------------------------------------------------------------

const dividendPaymentSchema = createSchema({
  model: { entity: "dividend_payment", version: "1", service: "zeedly" },
  attributes: {
    paymentId:              { type: "string", required: true },
    roundId:                { type: "string", required: true },
    userId:                 { type: "string", required: true },
    tokenBalanceAtSnapshot: { type: "number", required: true },
    usdcAmount:             { type: "number", required: true },
    txSig:                  { type: "string" },
    createdAt,
    updatedAt,
  },
  indexes: {
    byPaymentId: {
      pk: { field: "pk",     composite: ["paymentId"] },
      sk: { field: "sk",     composite: [] },
    },
    byUser: {
      index: "gsi2",
      pk: { field: "gsi2pk", composite: ["userId"] },
      sk: { field: "gsi2sk", composite: ["paymentId"] },
    },
    byRound: {
      index: "gsi3",
      pk: { field: "gsi3pk", composite: ["roundId"] },
      sk: { field: "gsi3sk", composite: ["paymentId"] },
    },
  },
});

export const DividendPaymentEntity = new Entity(dividendPaymentSchema, { client: dynamo, table: TABLE });
export type DividendPayment = EntityItem<typeof DividendPaymentEntity>;

// ---------------------------------------------------------------------------
// TransactionEntity  (unified ledger)
// ---------------------------------------------------------------------------

const transactionSchema = createSchema({
  model: { entity: "transaction", version: "1", service: "zeedly" },
  attributes: {
    txId:        { type: "string", required: true },
    userId:      { type: "string", required: true },
    type:        { type: "string", enum: ["deposit", "withdrawal", "trade", "dividend", "ipo_purchase"] as const, required: true },
    amount:      { type: "number", required: true },
    asset:       { type: "string", default: "USDT" },
    fiatAmount:  { type: "number" },
    fiatCurrency:{ type: "string" },
    exchangeRate:{ type: "number" },
    referenceId: { type: "string" },
    txSig:       { type: "string" },
    status:      { type: "string", enum: ["pending", "confirmed", "failed"] as const, default: "pending" },
    createdAt,
    updatedAt,
  },
  indexes: {
    byTxId: {
      pk: { field: "pk",     composite: ["txId"] },
      sk: { field: "sk",     composite: [] },
    },
    byUser: {
      index: "gsi2",
      pk: { field: "gsi2pk", composite: ["userId"] },
      sk: { field: "gsi2sk", composite: ["createdAt", "txId"] },
    },
  },
});

export const TransactionEntity = new Entity(transactionSchema, { client: dynamo, table: TABLE });
export type Transaction = EntityItem<typeof TransactionEntity>;

// ---------------------------------------------------------------------------
// PriceHistoryEntity
// ---------------------------------------------------------------------------

const priceHistorySchema = createSchema({
  model: { entity: "price_history", version: "1", service: "zeedly" },
  attributes: {
    priceId:   { type: "string", required: true },
    creatorId: { type: "string", required: true },
    price:     { type: "number", required: true },
    timestamp: { type: "number", default: () => Date.now() },
  },
  indexes: {
    byPriceId: {
      pk: { field: "pk",     composite: ["priceId"] },
      sk: { field: "sk",     composite: [] },
    },
    byCreator: {
      index: "gsi3",
      pk: { field: "gsi3pk", composite: ["creatorId"] },
      sk: { field: "gsi3sk", composite: ["timestamp"] },
    },
  },
});

export const PriceHistoryEntity = new Entity(priceHistorySchema, { client: dynamo, table: TABLE });
export type PriceHistory = EntityItem<typeof PriceHistoryEntity>;

// ---------------------------------------------------------------------------
// Service  (groups all entities for cross-entity collection queries)
// ---------------------------------------------------------------------------

export const ZeedlyService = new Service(
  {
    user:            UserEntity,
    creator:         CreatorEntity,
    ipo:             IPOEntity,
    ipoPurchase:     IPOPurchaseEntity,
    trade:           TradeEntity,
    dividendRound:   DividendRoundEntity,
    dividendPayment: DividendPaymentEntity,
    transaction:     TransactionEntity,
    priceHistory:    PriceHistoryEntity,
  },
  { client: dynamo, table: TABLE },
);
