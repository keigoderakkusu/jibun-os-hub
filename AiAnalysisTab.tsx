import { useState, useCallback } from "react";
import type { PortfolioItem, Theme } from "./types";

interface Props {
  portfolio: PortfolioItem[];
  themes: Theme[];
}

export default function AiAnalysisTab({ portfolio, themes }: Props) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);

  const analyzeTheme = useCallback(async (theme: Theme) => {
    setSelectedTheme(theme.id);
    setLoading(true);
    setAiResult("");

    const portfolioSummary = portfolio.map(p => `${p.name}(${p.ticker})`).join("、");

    const prompt = `あなたは優秀な株式アナリストです。以下の条件で分析してください。

【テーマ】${theme.label}（${theme.desc}）

【ユーザーの現在の保有銘柄】${portfolioSummary}

【依頼】
このテーマで今後3〜5年で「10倍株（テンバガー）」になる可能性がある銘柄を、日本株・米国株それぞれ3銘柄ずつ挙げてください。

各銘柄について以下を教えてください：
1. 銘柄名（ティッカーまたは証券コード）
2. 注目理由（具体的な事業内容とテーマとの関連）
3. 期待できるカタリスト（株価上昇のきっかけとなるイベント）
4. 主なリスク
5. おすすめ度（★1〜5）

最後に、ユーザーの保有銘柄とのシナジーについても一言コメントしてください。

※これは教育目的の分析であり、投資助言ではありません。`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find((b: { type: string; text?: string }) => b.type === "text")?.text;
      setAiResult(text || "分析できませんでした。再試行してください。");
    } catch {
      setAiResult("エラーが発生しました。再試行してください。");
    }
    setLoading(false);
  }, [portfolio]);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-1">🔍 注目テーマから10倍株を探す</h2>
        <p className="text-xs text-gray-400">テーマを選ぶとAIが有望銘柄を分析します（教育目的 / 投資助言ではありません）</p>
      </div>

      {/* テーマグリッド */}
      <div className="grid grid-cols-3 gap-3">
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => analyzeTheme(t)}
            className={`text-left p-4 rounded-xl border transition-all hover:shadow-sm ${
              selectedTheme === t.id
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200 bg-white hover:border-blue-200"
            }`}
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className={`font-bold text-sm ${selectedTheme === t.id ? "text-blue-600" : "text-gray-800"}`}>
              {t.label}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* 結果 */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-gray-400 text-sm animate-pulse">🤖 AIが分析中です...</div>
        </div>
      )}

      {!loading && aiResult && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded">AI分析結果</span>
            <span className="text-xs text-gray-400">⚠ 投資助言ではありません</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{aiResult}</p>
        </div>
      )}

      {!loading && !aiResult && (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-300">
          <div className="text-4xl mb-2">⬆</div>
          <div className="text-sm">テーマを選択してください</div>
        </div>
      )}
    </div>
  );
}
