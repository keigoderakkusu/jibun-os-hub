import { type PortfolioItem, TYPE_COLORS, TYPE_LABELS, USD_JPY, toJPY, fmt } from "./types";

interface Props {
  portfolio: PortfolioItem[];
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: number) => void;
}

export default function PortfolioTab({ portfolio, onEdit, onDelete }: Props) {
  const stats = portfolio.reduce(
    (acc, item) => {
      const v = toJPY(item);
      acc.cost += v.cost;
      acc.current += v.current;
      acc.pnl += v.pnl;
      return acc;
    },
    { cost: 0, current: 0, pnl: 0 }
  );
  const pct = stats.cost > 0 ? (stats.pnl / stats.cost) * 100 : 0;

  const byType = (Object.keys(TYPE_LABELS) as PortfolioItem["type"][]).map(type => {
    const total = portfolio.filter(i => i.type === type).reduce((s, i) => s + toJPY(i).current, 0);
    return { type, total, label: TYPE_LABELS[type], color: TYPE_COLORS[type] };
  }).filter(t => t.total > 0);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* サマリー */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">評価額合計</p>
          <p className="text-xl font-bold text-gray-900">¥{fmt(stats.current)}</p>
          <p className="text-xs text-gray-400 mt-1">投資元本 ¥{fmt(stats.cost)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">損益</p>
          <p className={`text-xl font-bold ${stats.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {stats.pnl >= 0 ? "+" : ""}¥{fmt(stats.pnl)}
          </p>
          <p className={`text-xs mt-1 ${pct >= 0 ? "text-emerald-500" : "text-red-400"}`}>
            {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">参考レート</p>
          <p className="text-xl font-bold text-gray-900">¥{USD_JPY}</p>
          <p className="text-xs text-gray-400 mt-1">USD/JPY（手動更新）</p>
        </div>
      </div>

      {/* アセット配分 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-600 mb-3">アセット配分</p>
        <div className="flex gap-4 mb-2 flex-wrap">
          {byType.map(t => (
            <div key={t.type} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
              <span className="text-gray-500">{t.label}</span>
              <span className="font-semibold">{(t.total / stats.current * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        <div className="flex h-2 rounded-full overflow-hidden">
          {byType.map(t => (
            <div key={t.type} style={{ flex: t.total, background: t.color }} />
          ))}
        </div>
      </div>

      {/* 銘柄一覧 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["銘柄", "種別", "数量", "取得単価", "現在値", "評価額", "損益", ""].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {portfolio.map(item => {
              const v = toJPY(item);
              const cur = item.currency === "USD" ? `$${fmt(item.currentPrice, 2)}` : `¥${fmt(item.currentPrice)}`;
              const buy = item.currency === "USD" ? `$${fmt(item.buyPrice, 2)}` : `¥${fmt(item.buyPrice)}`;
              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.ticker}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ background: TYPE_COLORS[item.type] + "18", color: TYPE_COLORS[item.type] }}
                    >
                      {TYPE_LABELS[item.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{fmt(item.qty)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{buy}</td>
                  <td className="px-4 py-3 font-medium">{cur}</td>
                  <td className="px-4 py-3 font-semibold">¥{fmt(v.current)}</td>
                  <td className="px-4 py-3">
                    <p className={`font-semibold text-xs ${v.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {v.pnl >= 0 ? "+" : ""}¥{fmt(v.pnl)}
                    </p>
                    <p className={`text-xs ${v.pct >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                      {v.pct >= 0 ? "+" : ""}{v.pct.toFixed(1)}%
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => onEdit(item)} className="px-2 py-1 border border-gray-200 rounded text-xs text-gray-500 hover:bg-gray-100">編集</button>
                      <button onClick={() => onDelete(item.id)} className="px-2 py-1 border border-red-100 rounded text-xs text-red-400 hover:bg-red-50">削除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
