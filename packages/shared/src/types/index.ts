export interface User {
  id: string;
  email: string;
  role: "user" | "creator" | "admin";
  openfortUserId: string;
  solanaPubkey: string;
  kycStatus: "not_started" | "pending" | "verified" | "rejected";
  createdAt: Date;
}

export interface Creator {
  id: string;
  userId: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  artworkUrl: string | null;
  bio: string | null;
  background: string | null;
  category: string;
  tags: string[];
  genre: string | null;
  youtubeUrl: string;
  subscriberCount: number;
  avgViews: number;
  totalViews: number;
  uploadFrequency: string | null;
  monthlyRevenue: number;
  estimatedMonthlyDividend: number;
  valuation: number;
  revenueShareBps: number;
  analytics: unknown;
  tokenMint: string | null;
  status: "pending" | "approved" | "live" | "rejected";
  createdAt: Date;
}

export interface IPO {
  id: string;
  creatorId: string;
  pricePerToken: number;
  totalSupply: number;
  sold: number;
  raisedUsd: number;
  raiseTargetUsd: number;
  maxInvestmentPerAccountUsd: number;
  valuationAtRaise: number;
  dividendCadence: string;
  tokenMintedAt: Date | null;
  tokenDispersedAt: Date | null;
  completedAt: Date | null;
  status: "upcoming" | "active" | "closed";
  startsAt: Date;
  endsAt: Date;
}

export interface Trade {
  id: string;
  userId: string;
  creatorId: string;
  side: "buy" | "sell";
  quantity: number;
  usdAmount: number;
  price: number;
  fee: number;
  txSig: string | null;
  status: "pending" | "confirmed" | "failed";
  createdAt: Date;
}

export interface DividendRound {
  id: string;
  creatorId: string;
  period: string;
  totalUsdc: number;
  distributedAt: Date | null;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "deposit" | "withdrawal" | "trade" | "dividend" | "ipo_purchase";
  amount: number;
  asset: "USDT";
  fiatAmount: number | null;
  fiatCurrency: string | null;
  exchangeRate: number | null;
  referenceId: string | null;
  txSig: string | null;
  status: "pending" | "confirmed" | "failed";
  createdAt: Date;
}

export interface PriceHistory {
  creatorId: string;
  price: number;
  timestamp: Date;
}

// Portfolio view types (derived from on-chain data)
export interface Holding {
  creatorId: string;
  creatorName: string;
  creatorSlug: string;
  tokenMint: string;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  avgCostBasis: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface WalletBalance {
  usdtBalance: number;
  usdcBalance: number; // Backward-compatible alias during migration
  holdings: Holding[];
  offerings: Array<{
    purchaseId: string;
    ipoId: string;
    creatorId: string;
    creatorName: string;
    creatorSlug: string;
    state: "coming_soon" | "live" | "completed";
    status: "pending" | "locked" | "claimable" | "claimed" | "confirmed" | "failed" | "refunded";
    quantity: number;
    usdtAmount: number;
    pricePerToken: number;
    startsAt: Date | null;
    endsAt: Date | null;
    lockedUsdt: number;
    kycRequiredBeforeClaim: boolean;
    canClaim: boolean;
    claimStatus: string;
    createdAt: Date;
  }>;
  totalPortfolioValue: number;
}
