import { useState, useRef } from "react";

const SYSTEM_PROMPT = `あなたは26歳の営業DX担当者「Keigo」です。AIを使って業務効率化・副業・転職を実践中。
読者は同じ悩みを持つ20代。等身大の語り口で、失敗談・数字も正直に書く。
必ず以下の構成で書く：
① 導入（共感）② 実践内容 ③ 成果と数字 ④ 失敗・反省 ⑤ 20代へのメッセージ ⑥ おすすめツール

記事の最後に必ず以下を追加：
<!-- meta: ここにSEO説明文120字 -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`;

export default function App() {
  const [topic, setTopic]     = useState("");
  const [status, setStatus]   = useState("");
  const [article, setArticle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);

  const generate = async () => {
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError("");
    setArticle("");
    setStatus("Claude に接続中...");

    try {
      setStatus("記事を生成中... (30秒〜1分かかります)");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: "以下のテーマでブログ記事を書いてください。\n\nテーマ：" + topic
          }]
        })
      });

      setStatus("レスポンス処理中...");

      if (!res.ok) {
        const t = await res.text();
        throw new Error("HTTP " + res.status + ": " + t.slice(0, 100));
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || "APIエラー");
      }

      const text = (data.content || [])
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("");

      if (!text) {
        throw new Error("生成結果が空でした");
      }

      setArticle(text);
      setStatus("✅ 生成完了！");

    } catch (e) {
      setError(e.message);
      setStatus("❌ エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(article);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = [
    "AIを使った転職活動の全記録：26歳が年収300万から脱出を試みた話",
    "GASでSlack通知を自動化した話：コードが書けない自分がやってみた",
    "新NISAを半年続けた正直な結果と失敗まとめ",
    "ブログ副業を始めて3ヶ月：26歳の正直な収益報告",
    "AIエージェントを部下として使いこなす方法",
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a14",
      color: "#e0e0f0",
      fontFamily: "sans-serif",
      padding: "24px 20px",
      maxWidth: 900,
      margin: "0 auto",
    }}>

      <h1 style={{ color: "#00D4FF", marginBottom: 4, fontSize: 24 }}>
        自分株式会社 ブログ生成エンジン
      </h1>
      <p style={{ color: "#555", fontSize: 13, marginBottom: 28 }}>
        26歳ペルソナ × Claude API で記事を自動生成
      </p>

      {/* テーマ入力 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          記事テーマ
        </div>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="例：AIを使って転職活動をした話"
          rows={3}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            color: "#e0e0f0",
            fontSize: 14,
            resize: "vertical",
            outline: "none",
          }}
        />
      </div>

      {/* プリセット */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          プリセット（クリックで入力）
        </div>
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => setTopic(p)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 12px",
              marginBottom: 6,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              color: "#888",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            → {p}
          </button>
        ))}
      </div>

      {/* 生成ボタン */}
      <button
        onClick={generate}
        disabled={loading || !topic.trim()}
        style={{
          width: "100%",
          padding: "14px",
          background: loading ? "rgba(255,255,255,0.05)" : "rgba(0,212,255,0.15)",
          border: "1px solid " + (loading ? "rgba(255,255,255,0.1)" : "rgba(0,212,255,0.4)"),
          borderRadius: 8,
          color: loading ? "#555" : "#00D4FF",
          fontSize: 15,
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 16,
          letterSpacing: "0.05em",
        }}
      >
        {loading ? "生成中... しばらくお待ちください" : "▶ 記事を生成する"}
      </button>

      {/* ステータス */}
      {status && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          fontSize: 13,
          color: status.startsWith("✅") ? "#4ade80" : status.startsWith("❌") ? "#ff8080" : "#00D4FF",
          marginBottom: 16,
        }}>
          {status}
        </div>
      )}

      {/* エラー */}
      {error && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(255,60,60,0.1)",
          border: "1px solid rgba(255,60,60,0.3)",
          borderRadius: 8,
          fontSize: 13,
          color: "#ff8080",
          marginBottom: 16,
          wordBreak: "break-all",
        }}>
          <strong>エラー内容：</strong><br />{error}
        </div>
      )}

      {/* 記事表示 */}
      {article && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: "#4ade80" }}>
              生成完了 — {article.length.toLocaleString()}文字
            </div>
            <button
              onClick={copy}
              style={{
                padding: "6px 16px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 5,
                color: "#aaa",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {copied ? "✓ コピー済" : "コピー"}
            </button>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "20px 22px",
            maxHeight: "60vh",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            fontSize: 13,
            lineHeight: 1.9,
            color: "#c8c8d8",
          }}>
            {article}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#555" }}>
            ↑ このMarkdownをコピーしてWordPressのコードエディタに貼り付けてください
          </div>
        </div>
      )}

    </div>
  );
}
