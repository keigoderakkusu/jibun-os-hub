// 投資ダッシュボード型定義

export type AssetType = "JP" | "US" | "FUND" | "CRYPTO";
export type Currency = "JPY" | "USD";

export interface PortfolioItem {
  id: number;
  name: string;
  ticker: string;
  type: AssetType;
  qty: number;
  buyPrice: number;
  currentPrice: number;
  currency: Currency;
}

export interface Theme {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

export interface PortfolioStats {
  cost: number;
  current: number;
  pnl: number;
  pct: number;
}

export interface ItemValues {
  cost: number;
  current: number;
  pnl: number;
  pct: number;
}

// 定数
export const USD_JPY = 155;

export const TYPE_COLORS: Record<AssetType, string> = {
  JP: "#3b82f6",
  US: "#10b981",
  FUND: "#f59e0b",
  CRYPTO: "#f97316",
};

export const TYPE_LABELS: Record<AssetType, string> = {
  JP: "日本株",
  US: "米国株",
  FUND: "投資信託",
  CRYPTO: "仮想通貨",
};

// ユーティリティ
export function toJPY(item: PortfolioItem): ItemValues {
  const mult = item.currency === "USD" ? USD_JPY : 1;
  return {
    cost: item.buyPrice * item.qty * mult,
    current: item.currentPrice * item.qty * mult,
    pnl: (item.currentPrice - item.buyPrice) * item.qty * mult,
    pct: ((item.currentPrice - item.buyPrice) / item.buyPrice) * 100,
  };
}

export function fmt(n: number, digits = 0): string {
  return n.toLocaleString("ja-JP", { maximumFractionDigits: digits });
}
