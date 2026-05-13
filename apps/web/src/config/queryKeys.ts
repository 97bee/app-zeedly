/**
 * Central manifest of React Query cache keys for the app.
 *
 * Every TanStack Query/Mutation hook reads its key from here so that
 * invalidations and optimistic updates have a single source of truth.
 *
 * Convention: use `QueryKeyParts` enum values as the *first* element of each
 * key array. Parameterised keys append their inputs in a stable order.
 */
export enum QueryKeyParts {
  WALLET_BALANCE = "wallet_balance",
  WALLET_TRANSACTIONS = "wallet_transactions",
  WALLET_DEPOSIT_QUOTE = "wallet_deposit_quote",
  WALLET_DEPOSIT_INTENT = "wallet_deposit_intent",

  TRADE_PRICE = "trade_price",
  TRADE_CREATOR_TRADES = "trade_creator_trades",
  TRADE_MY_TRADES = "trade_my_trades",
  TRADE_EXECUTE = "trade_execute",

  CREATORS = "creators",
  CREATOR = "creator",
  CREATOR_APPLICATION = "creator_application",

  IPOS = "ipos",
  IPOS_BY_CREATOR = "ipos_by_creator",
  IPO_PURCHASE = "ipo_purchase",
  IPO_CLAIM = "ipo_claim",

  PORTFOLIO_HOLDINGS = "portfolio_holdings",
  PORTFOLIO_DIVIDENDS = "portfolio_dividends",

  ADMIN_CREATORS = "admin_creators",
  ADMIN_APPROVE_CREATOR = "admin_approve_creator",
  ADMIN_REJECT_CREATOR = "admin_reject_creator",
  ADMIN_LAUNCH_IPO = "admin_launch_ipo",

  ME = "me",
  REQUEST_KYC_REVIEW = "request_kyc_review",
}

export const queryKeys = {
  // ── Wallet ────────────────────────────────────────────────────────────
  getWalletBalance: () => [QueryKeyParts.WALLET_BALANCE] as const,
  getWalletTransactions: (limit?: number) =>
    [QueryKeyParts.WALLET_TRANSACTIONS, limit ?? null] as const,
  getDepositQuote: (amount: number, currency: string) =>
    [QueryKeyParts.WALLET_DEPOSIT_QUOTE, amount, currency] as const,
  createDepositIntent: () => [QueryKeyParts.WALLET_DEPOSIT_INTENT] as const,

  // ── Trade ─────────────────────────────────────────────────────────────
  getTradePrice: (creatorId: string) =>
    [QueryKeyParts.TRADE_PRICE, creatorId] as const,
  getCreatorTrades: (creatorId: string, limit?: number) =>
    [QueryKeyParts.TRADE_CREATOR_TRADES, creatorId, limit ?? null] as const,
  getMyTrades: (limit?: number) =>
    [QueryKeyParts.TRADE_MY_TRADES, limit ?? null] as const,
  executeTrade: () => [QueryKeyParts.TRADE_EXECUTE] as const,

  // ── Creator ───────────────────────────────────────────────────────────
  getCreators: () => [QueryKeyParts.CREATORS] as const,
  getCreator: (slug: string) => [QueryKeyParts.CREATOR, slug] as const,
  submitCreatorApplication: () =>
    [QueryKeyParts.CREATOR_APPLICATION] as const,

  // ── IPO ───────────────────────────────────────────────────────────────
  getIpos: () => [QueryKeyParts.IPOS] as const,
  getIposByCreator: (creatorId: string) =>
    [QueryKeyParts.IPOS_BY_CREATOR, creatorId] as const,
  purchaseIpo: () => [QueryKeyParts.IPO_PURCHASE] as const,
  claimIpo: () => [QueryKeyParts.IPO_CLAIM] as const,

  // ── Portfolio ─────────────────────────────────────────────────────────
  getPortfolioHoldings: () => [QueryKeyParts.PORTFOLIO_HOLDINGS] as const,
  getPortfolioDividends: () => [QueryKeyParts.PORTFOLIO_DIVIDENDS] as const,

  // ── Admin ─────────────────────────────────────────────────────────────
  getAdminCreators: () => [QueryKeyParts.ADMIN_CREATORS] as const,
  approveCreator: () => [QueryKeyParts.ADMIN_APPROVE_CREATOR] as const,
  rejectCreator: () => [QueryKeyParts.ADMIN_REJECT_CREATOR] as const,
  launchIpo: () => [QueryKeyParts.ADMIN_LAUNCH_IPO] as const,

  // ── Auth ──────────────────────────────────────────────────────────────
  getMe: () => [QueryKeyParts.ME] as const,
  requestKycReview: () => [QueryKeyParts.REQUEST_KYC_REVIEW] as const,
};
