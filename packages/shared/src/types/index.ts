export interface User {
  id: string;
  email: string;
  role: "user" | "creator" | "admin";
  openfortUserId: string;
  solanaPubkey: string;
  createdAt: Date;
}

export interface Creator {
  id: string;
  userId: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  category: string;
  tags: string[];
  youtubeUrl: string;
  subscriberCount: number;
  avgViews: number;
  monthlyRevenue: number;
  valuation: number;
  revenueShareBps: number;
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
  usdcBalance: number; // Displayed as USD to user
  holdings: Holding[];
  totalPortfolioValue: number;
}
