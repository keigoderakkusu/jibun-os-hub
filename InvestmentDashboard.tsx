/**
 * 📊 InvestmentDashboard.tsx
 * 自分株式会社OS — 投資管理ダッシュボード
 *
 * 機能:
 *   - 保有資産（日本株・米国株・投資信託・仮想通貨）の管理・損益追跡
 *   - AIテーマ別の有望銘柄分析（フィジカルAI・量子・宇宙など）
 *   - Claude APIを使った自由質問チャット
 */

import { useState, useCallback } from "react";
import PortfolioTab from "./PortfolioTab";
import AiAnalysisTab from "./AiAnalysisTab";
import AiChatTab from "./AiChatTab";
import AddItemModal from "./AddItemModal";
import type { PortfolioItem, Theme } from "./types";

// ── 初期データ ────────────────────────────────────────────────────────────────
export const INITIAL_PORTFOLIO: PortfolioItem[] = [
  { id: 1, name: "キオクシア", ticker: "6600", type: "JP", qty: 100, buyPrice: 1800, currentPrice: 3200, currency: "JPY" },
  { id: 2, name: "NVIDIA", ticker: "NVDA", type: "US", qty: 10, buyPrice: 480, currentPrice: 875, currency: "USD" },
  { id: 3, name: "eMAXIS Slim 全世界株式", ticker: "FUND001", type: "FUND", qty: 50000, buyPrice: 1.0, currentPrice: 1.23, currency: "JPY" },
  { id: 4, name: "ビットコイン", ticker: "BTC", type: "CRYPTO", qty: 0.05, buyPrice: 6000000, currentPrice: 9800000, currency: "JPY" },
];

export const THEMES: Theme[] = [
  { id: "physical_ai", label: "フィジカルAI", icon: "🤖", desc: "ロボティクス・自律機械" },
  { id: "quantum", label: "量子コンピュータ", icon: "⚛️", desc: "次世代演算技術" },
  { id: "space", label: "宇宙・衛星", icon: "🛸", desc: "民間宇宙開発" },
  { id: "biotech", label: "AIバイオ", icon: "🧬", desc: "創薬・ゲノム解析" },
  { id: "energy", label: "次世代エネルギー", icon: "⚡", desc: "核融合・水素" },
  { id: "semiconductor", label: "半導体", icon: "💎", desc: "AIチップ・HBM" },
];

type TabId = "portfolio" | "ai" | "chat";

// ── メインコンポーネント ───────────────────────────────────────────────────────
export default function InvestmentDashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO);
  const [tab, setTab] = useState<TabId>("portfolio");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);

  const saveItem = useCallback((item: Omit<PortfolioItem, "id">) => {
    if (editItem) {
      setPortfolio(prev => prev.map(p => p.id === editItem.id ? { ...item, id: editItem.id } : p));
    } else {
      setPortfolio(prev => [...prev, { ...item, id: Date.now() }]);
    }
    setShowAdd(false);
    setEditItem(null);
  }, [editItem]);

  const deleteItem = useCallback((id: number) => {
    setPortfolio(prev => prev.filter(p => p.id !== id));
  }, []);

  const startEdit = useCallback((item: PortfolioItem) => {
    setEditItem(item);
    setShowAdd(true);
  }, []);

  const openAdd = useCallback(() => {
    setEditItem(null);
    setShowAdd(true);
  }, []);

  const TABS: { id: TabId; label: string }[] = [
    { id: "portfolio", label: "📊 ポートフォリオ" },
    { id: "ai", label: "🔍 AI銘柄分析" },
    { id: "chat", label: "💬 AIに相談" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-5xl mx-auto flex items-center h-14 gap-1">
          <span className="font-bold text-base mr-6 text-gray-800">マイ投資ダッシュボード</span>

          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}

          <button
            onClick={openAdd}
            className="ml-auto px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600 transition-colors"
          >
            + 銘柄追加
          </button>
        </div>
      </header>

      {/* 注意書き */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 text-center">
        ⚠ このダッシュボードは教育・記録目的です。AI分析は投資助言ではありません。投資は自己責任でお願いします。
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        {tab === "portfolio" && (
          <PortfolioTab
            portfolio={portfolio}
            onEdit={startEdit}
            onDelete={deleteItem}
          />
        )}
        {tab === "ai" && (
          <AiAnalysisTab portfolio={portfolio} themes={THEMES} />
        )}
        {tab === "chat" && (
          <AiChatTab portfolio={portfolio} />
        )}
      </main>

      {/* 銘柄追加/編集モーダル */}
      {showAdd && (
        <AddItemModal
          editItem={editItem}
          onSave={saveItem}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}
