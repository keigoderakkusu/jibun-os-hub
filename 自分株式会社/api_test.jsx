import { useState } from "react";

export default function App() {
  const [status, setStatus] = useState("待機中");
  const [result, setResult] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const test = async () => {
    setLoading(true);
    setStatus("APIに接続中...");
    setResult("");
    setError("");

    try {
      setStatus("リクエスト送信中...");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{ role: "user", content: "「テスト成功」と日本語で一言だけ返してください。" }],
        }),
      });

      setStatus(`レスポンス受信: HTTP ${res.status}`);

      const text = await res.text();
      setStatus(`テキスト取得完了: ${text.length}文字`);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        setError("JSONパースエラー: " + text.slice(0, 200));
        setLoading(false);
        return;
      }

      setStatus("JSONパース完了");

      if (data.error) {
        setError("APIエラー: " + JSON.stringify(data.error));
        setLoading(false);
        return;
      }

      const content = (data.content || []).map(b => b.text || "").join("");
      setResult(content || "（空のレスポンス）");
      setStatus("✅ 成功！");

    } catch (e) {
      setError("通信エラー: " + e.message);
      setStatus("❌ 失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: 30,
      background: "#06060f",
      minHeight: "100vh",
      color: "#e8e8f0",
      fontFamily: "monospace",
    }}>
      <h2 style={{ marginBottom: 20, color: "#00D4FF" }}>Claude API 接続テスト</h2>

      <button
        onClick={test}
        disabled={loading}
        style={{
          padding: "12px 28px",
          background: loading ? "#333" : "rgba(0,212,255,0.2)",
          border: "1px solid rgba(0,212,255,0.5)",
          borderRadius: 8,
          color: "#00D4FF",
          fontSize: 14,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 24,
        }}
      >
        {loading ? "テスト中..." : "▶ テスト実行"}
      </button>

      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>STATUS</div>
        <div style={{ fontSize: 14, color: "#4ade80" }}>{status}</div>
      </div>

      {error && (
        <div style={{
          background: "rgba(255,60,60,0.1)",
          border: "1px solid rgba(255,60,60,0.4)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: "#ff8080", marginBottom: 6 }}>❌ エラー内容</div>
          <div style={{ fontSize: 13, color: "#ffaaaa", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{error}</div>
        </div>
      )}

      {result && (
        <div style={{
          background: "rgba(74,222,128,0.08)",
          border: "1px solid rgba(74,222,128,0.3)",
          borderRadius: 8,
          padding: 16,
        }}>
          <div style={{ fontSize: 11, color: "#4ade80", marginBottom: 6 }}>✅ APIの返答</div>
          <div style={{ fontSize: 14, color: "#fff" }}>{result}</div>
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 11, color: "#444" }}>
        このテストで成功すれば、Claude APIとの接続は正常です。
      </div>
    </div>
  );
}
