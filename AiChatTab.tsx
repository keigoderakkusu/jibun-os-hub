import { useState, useCallback } from "react";
import type { PortfolioItem } from "./types";
import { fmt } from "./types";

interface Props {
  portfolio: PortfolioItem[];
}

const QUICK_QUESTIONS = [
  "今の保有銘柄のリスク分散はどうですか？",
  "フィジカルAI関連でSBI証券で買える銘柄は？",
  "BTCの比率は高すぎますか？",
  "今後1年で注目すべき分野は？",
  "キオクシアのような10倍株候補は今どこにある？",
];

export default function AiChatTab({ portfolio }: Props) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = useCallback(async (question?: string) => {
    const q = question || input;
    if (!q.trim()) return;
    if (question) setInput(question);

    setLoading(true);
    setResult("");

    const portfolioSummary = portfolio
      .map(p => `${p.name}(${p.ticker}) ${fmt(p.qty)}${p.type === "FUND" ? "口" : "株/枚"} 取得単価${p.buyPrice} 現在値${p.currentPrice}`)
      .join("\n");

    const prompt = `あなたは日本人投資家向けのAIアドバイザーです。

【ユーザーの保有資産】
${portfolioSummary}

【質問】${q}

日本語で具体的かつ丁寧に回答してください。投資助言ではなく教育目的の情報提供として回答してください。`;

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
      setResult(text || "回答できませんでした。");
    } catch {
      setResult("エラーが発生しました。再試行してください。");
    }
    setLoading(false);
  }, [input, portfolio]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-1">💬 AIアドバイザーに相談</h2>
        <p className="text-xs text-gray-400">保有資産の情報を踏まえてAIが回答します（投資助言ではありません）</p>
      </div>

      {/* クイック質問 */}
      <div className="flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => ask(q)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 入力 */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(); }}
          placeholder="例：今の保有銘柄のリスク分散はどうですか？（Cmd+Enterで送信）"
          className="flex-1 p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-blue-300 h-20"
        />
        <button
          onClick={() => ask()}
          disabled={loading || !input.trim()}
          className={`px-5 rounded-xl font-semibold text-sm transition-colors self-stretch ${
            loading || !input.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {loading ? "..." : "送信"}
        </button>
      </div>

      {/* 結果 */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-gray-400 text-sm animate-pulse">🤖 考え中...</div>
        </div>
      )}

      {!loading && result && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-2 py-0.5 rounded">AI回答</span>
            <span className="text-xs text-gray-400">⚠ 投資助言ではありません</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}
