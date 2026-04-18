import { useState } from "react";

const SYSTEM_PROMPT = `あなたは26歳の営業DX担当者「Keigo」です。AIを使って副業・転職・業務効率化を実践中。
読者は同じ悩みを持つ20代。失敗談・数字も正直に書く等身大スタイル。

以下の構成でブログ記事をMarkdown形式で書いてください：
# タイトル
## はじめに
## やってみたこと
## 結果と数字
## 失敗・反省点
## 20代へのメッセージ
## まとめ・おすすめツール

<!-- meta: SEO説明文 -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名|説明 -->`;

export default function App() {
  const [topic, setTopic]   = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("待機中");
  const [busy, setBusy]     = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!topic.trim() || busy) return;
    setBusy(true);
    setResult("");
    setStatus("送信中...");

    let raw = "";
    let ok  = false;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system:     SYSTEM_PROMPT,
          messages:   [{ role: "user", content: "テーマ：" + topic }],
        }),
      });

      setStatus("受信中... (HTTP " + resp.status + ")");
      raw = await resp.text();
      setStatus("パース中...");

      const json = JSON.parse(raw);

      if (json.error) {
        setStatus("❌ APIエラー：" + json.error.message);
        setBusy(false);
        return;
      }

      const text = (json.content || [])
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("");

      if (!text) {
        setStatus("❌ 空の返答でした。残高確認: console.anthropic.com");
        setBusy(false);
        return;
      }

      setResult(text);
      setStatus("✅ 完了 — " + text.length.toLocaleString() + "文字");
      ok = true;

    } catch (e) {
      setStatus("❌ エラー：" + e.message + (raw ? "  /  RAW: " + raw.slice(0, 80) : ""));
    }

    setBusy(false);
  }

  function copy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const presets = [
    "AIを使った転職活動の全記録：26歳が年収300万から脱出を試みた話",
    "GASでSlack通知を自動化した話",
    "新NISAを半年続けた正直な結果と失敗まとめ",
    "ブログ副業を始めて3ヶ月：正直な収益報告",
    "AIエージェントを部下として使いこなす方法",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "#e0e0f0", padding: "28px 22px", maxWidth: 820, margin: "0 auto", fontFamily: "sans-serif" }}>

      {/* ヘッダー */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
          自分株式会社 <span style={{ color: "#00D4FF" }}>ブログ生成</span>
        </h1>
        <p style={{ fontSize: 12, color: "#555" }}>26歳ペルソナ × Claude API — テーマを入れてボタンを押すだけ</p>
      </div>

      {/* プリセット */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>プリセット（クリックで入力）</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {presets.map((p, i) => (
            <button key={i} onClick={() => setTopic(p)}
              style={{ padding: "5px 11px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, color: "#777", fontSize: 11, cursor: "pointer" }}>
              {p.slice(0, 22)}…
            </button>
          ))}
        </div>
      </div>

      {/* テーマ入力 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>記事テーマ</div>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="例：AIを使って転職活動をした話"
          rows={3}
          style={{ width: "100%", padding: "10px 13px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e0f0", fontSize: 14, resize: "vertical", outline: "none" }}
        />
      </div>

      {/* 生成ボタン */}
      <button onClick={generate} disabled={busy || !topic.trim()}
        style={{ width: "100%", padding: "14px", marginBottom: 14, background: busy ? "rgba(255,255,255,0.03)" : "rgba(0,212,255,0.15)", border: "1px solid " + (busy ? "rgba(255,255,255,0.08)" : "rgba(0,212,255,0.5)"), borderRadius: 8, color: busy ? "#444" : "#00D4FF", fontSize: 15, fontWeight: "bold", cursor: busy ? "not-allowed" : "pointer" }}>
        {busy ? "⏳ 生成中... しばらくお待ちください（30秒〜1分）" : "▶ 記事を生成する"}
      </button>

      {/* ステータス */}
      <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, fontSize: 13, marginBottom: 16, color: status.startsWith("✅") ? "#4ade80" : status.startsWith("❌") ? "#ff8080" : "#00D4FF", wordBreak: "break-all" }}>
        {status}
      </div>

      {/* 結果 */}
      {result && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>✅ 生成完了 — {result.length.toLocaleString()}文字</span>
            <button onClick={copy}
              style={{ padding: "7px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#aaa", fontSize: 12, cursor: "pointer" }}>
              {copied ? "✓ コピー済" : "Markdownをコピー"}
            </button>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px 22px", maxHeight: "55vh", overflowY: "auto", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.9, color: "#c8c8d8" }}>
            {result}
          </div>
          <div style={{ marginTop: 10, padding: "12px 16px", background: "rgba(252,211,77,0.05)", border: "1px solid rgba(252,211,77,0.15)", borderRadius: 8, fontSize: 12, color: "#888" }}>
            💡 <strong style={{ color: "#fcd34d" }}>WordPressへの投稿：</strong>上の「Markdownをコピー」→ WP管理画面 → 新規投稿 → コードエディタに貼り付け → 公開
          </div>
        </div>
      )}

    </div>
  );
}
