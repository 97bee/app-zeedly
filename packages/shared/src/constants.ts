// Fee structure (in basis points, 1 bps = 0.01%)
export const FEES = {
  IPO_PLATFORM_FEE_BPS: 700, // 7% to Zeedly on IPO raise
  IPO_CREATOR_FEE_BPS: 9300, // 93% to Creator on IPO raise
  PLATFORM_TOKEN_HOLD_BPS: 1000, // 10% of tokens held by Zeedly
  INVESTOR_TOKEN_BPS: 9000, // 90% of tokens sold to investors
  TRADING_FEE_BPS: 100, // 1% total trading fee
  TRADING_FEE_CREATOR_BPS: 50, // 0.5% to creator
  TRADING_FEE_PLATFORM_BPS: 50, // 0.5% to platform
} as const;

export const CREATOR_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  LIVE: "live",
  REJECTED: "rejected",
} as const;

export const IPO_STATUS = {
  UPCOMING: "upcoming",
  ACTIVE: "active",
  CLOSED: "closed",
} as const;

export const TRADE_SIDE = {
  BUY: "buy",
  SELL: "sell",
} as const;

export const TRANSACTION_TYPE = {
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
  TRADE: "trade",
  DIVIDEND: "dividend",
  IPO_PURCHASE: "ipo_purchase",
} as const;
