import { useState, useEffect } from "react";
import type { PortfolioItem, AssetType, Currency } from "./types";
import { TYPE_LABELS, TYPE_COLORS } from "./types";

interface Props {
  editItem: PortfolioItem | null;
  onSave: (item: Omit<PortfolioItem, "id">) => void;
  onClose: () => void;
}

const DEFAULT_FORM = {
  name: "", ticker: "", type: "JP" as AssetType,
  qty: "", buyPrice: "", currentPrice: "", currency: "JPY" as Currency,
};

export default function AddItemModal({ editItem, onSave, onClose }: Props) {
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name,
        ticker: editItem.ticker,
        type: editItem.type,
        qty: String(editItem.qty),
        buyPrice: String(editItem.buyPrice),
        currentPrice: String(editItem.currentPrice),
        currency: editItem.currency,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [editItem]);

  const setType = (type: AssetType) => {
    setForm(f => ({ ...f, type, currency: type === "US" ? "USD" : "JPY" }));
  };

  const valid = form.name && form.qty && form.buyPrice && form.currentPrice;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      name: form.name,
      ticker: form.ticker,
      type: form.type,
      qty: parseFloat(form.qty),
      buyPrice: parseFloat(form.buyPrice),
      currentPrice: parseFloat(form.currentPrice),
      currency: form.currency,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl p-6 w-96 max-w-[95vw] shadow-xl animate-fadeIn">
        <h3 className="text-base font-bold mb-5">{editItem ? "銘柄を編集" : "銘柄を追加"}</h3>

        {/* 種別 */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-2">種別</label>
          <div className="flex gap-1.5">
            {(Object.keys(TYPE_LABELS) as AssetType[]).map(k => (
              <button
                key={k}
                onClick={() => setType(k)}
                className="flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all"
                style={{
                  borderColor: form.type === k ? TYPE_COLORS[k] : "#e5e7eb",
                  background: form.type === k ? TYPE_COLORS[k] + "18" : "transparent",
                  color: form.type === k ? TYPE_COLORS[k] : "#6b7280",
                }}
              >
                {TYPE_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        {/* 銘柄名・ティッカー */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">銘柄名 *</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="例: トヨタ"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">コード/ティッカー</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
              value={form.ticker}
              onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))}
              placeholder="例: 7203"
            />
          </div>
        </div>

        {/* 数量・単価 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "数量 *", key: "qty" as const, placeholder: "100" },
            { label: "取得単価 *", key: "buyPrice" as const, placeholder: "1800" },
            { label: "現在値 *", key: "currentPrice" as const, placeholder: "3200" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-gray-400 block mb-1">{f.label}</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!valid}
            className={`flex-[2] py-2.5 rounded-xl text-sm font-bold transition-colors ${
              valid ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {editItem ? "更新" : "追加"}
          </button>
        </div>
      </div>
    </div>
  );
}
