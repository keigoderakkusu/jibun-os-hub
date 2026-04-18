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

const PRESETS = [
  { cat: "AI実務",  text: "AIエージェントを部下として使いこなす方法：26歳の実体験" },
  { cat: "AI実務",  text: "GASでSlack通知を自動化した話：コードが書けない自分がやってみた" },
  { cat: "AI実務",  text: "Cursorを使えばコードが書けなくても自動化できる：正直レビュー" },
  { cat: "AI実務",  text: "ChatGPT APIをExcelに繋いだら会議資料が10分で完成した" },
  { cat: "転職",    text: "AIを使った転職活動の全記録：26歳が年収300万から脱出を試みた話" },
  { cat: "転職",    text: "第二新卒でAIスキルを武器に転職した話：面接で何を聞かれたか" },
  { cat: "転職",    text: "ポートフォリオに何を載せるべきか：AI活用実績の見せ方" },
  { cat: "副業",    text: "ブログ副業を始めて3ヶ月：26歳の正直な収益報告と失敗まとめ" },
  { cat: "副業",    text: "個人ブログをAIで半自動化して月1万円稼ぐまでの記録" },
  { cat: "副業",    text: "アフィリエイトで稼げるまでにかかった時間と費用：全部公開" },
  { cat: "投資",    text: "新NISAを半年続けた正直な結果と失敗まとめ：26歳の投資記録" },
  { cat: "投資",    text: "年収300万で結婚・子供を考えるための資産形成：リアルな計算" },
];

const CAT_COLORS = { "AI実務": "#00D4FF", "転職": "#FF6B35", "副業": "#A855F7", "投資": "#10b981" };

export default function App() {
  const [topic,   setTopic]   = useState("");
  const [result,  setResult]  = useState("");
  const [status,  setStatus]  = useState("待機中");
  const [busy,    setBusy]    = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [history, setHistory] = useState([]);
  const [tab,     setTab]     = useState("generate");
  const [filter,  setFilter]  = useState("全て");

  async function generate() {
    if (!topic.trim() || busy) return;
    setBusy(true);
    setResult("");
    setStatus("送信中...");

    let raw = "";

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
        setStatus("❌ 空の返答。残高確認: console.anthropic.com");
        setBusy(false);
        return;
      }

      setResult(text);
      setHistory(prev => [{ topic, text, ts: Date.now() }, ...prev.slice(0, 19)]);
      setStatus("✅ 完了 — " + text.length.toLocaleString() + "文字");
      setTab("preview");

    } catch (e) {
      setStatus("❌ エラー：" + e.message + (raw ? " / " + raw.slice(0, 60) : ""));
    }

    setBusy(false);
  }

  function copy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cats    = ["全て", "AI実務", "転職", "副業", "投資"];
  const shown   = PRESETS.filter(p => filter === "全て" || p.cat === filter);

  const S = {
    card: { background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "16px 18px" },
    tab:  (id) => ({ padding: "8px 18px", background: tab === id ? "rgba(0,212,255,0.1)" : "transparent", border: "1px solid " + (tab === id ? "rgba(0,212,255,0.35)" : "rgba(255,255,255,0.08)"), borderRadius: 6, color: tab === id ? "#00D4FF" : "#666", fontSize: 12, cursor: "pointer" }),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "#e0e0f0", padding: "24px 20px", maxWidth: 860, margin: "0 auto", fontFamily: "sans-serif" }}>

      {/* ヘッダー */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00D4FF", boxShadow: "0 0 8px #00D4FF" }} />
          <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase" }}>自分株式会社 — Blog Engine</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 3 }}>
          AIブログ<span style={{ color: "#00D4FF" }}>生成</span>エンジン
        </h1>
        <p style={{ fontSize: 12, color: "#555" }}>26歳ペルソナ × Claude API — テーマを入れてボタンを押すだけ</p>
      </div>

      {/* タブ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        <button style={S.tab("generate")} onClick={() => setTab("generate")}>✍️ 生成</button>
        <button style={S.tab("preview")}  onClick={() => setTab("preview")}>📄 プレビュー</button>
        <button style={S.tab("history")}  onClick={() => setTab("history")}>🕐 履歴（{history.length}件）</button>
      </div>

      {/* ════ 生成タブ ══════════════════════════════════════════ */}
      {tab === "generate" && (
        <div>
          {/* カテゴリフィルター */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>カテゴリで絞る</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {cats.map(c => (
                <button key={c} onClick={() => setFilter(c)}
                  style={{ padding: "5px 14px", background: filter === c ? "rgba(0,212,255,0.1)" : "transparent", border: "1px solid " + (filter === c ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"), borderRadius: 20, color: filter === c ? "#00D4FF" : "#666", fontSize: 12, cursor: "pointer" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* プリセット */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>プリセット（クリックで入力）</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {shown.map((p, i) => (
                <button key={i} onClick={() => setTopic(p.text)}
                  style={{ padding: "8px 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, color: "#777", fontSize: 11, cursor: "pointer", textAlign: "left", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: CAT_COLORS[p.cat] + "22", color: CAT_COLORS[p.cat], flexShrink: 0, marginTop: 1 }}>{p.cat}</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* テーマ入力 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>記事テーマ</div>
            <textarea value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="テーマを入力、またはプリセットをクリック..."
              rows={3}
              style={{ width: "100%", padding: "10px 13px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e0f0", fontSize: 14, resize: "vertical", outline: "none" }} />
          </div>

          {/* 生成ボタン */}
          <button onClick={generate} disabled={busy || !topic.trim()}
            style={{ width: "100%", padding: "14px", marginBottom: 12, background: busy ? "rgba(255,255,255,0.03)" : "rgba(0,212,255,0.15)", border: "1px solid " + (busy ? "rgba(255,255,255,0.08)" : "rgba(0,212,255,0.5)"), borderRadius: 8, color: busy ? "#444" : "#00D4FF", fontSize: 15, fontWeight: "bold", cursor: busy ? "not-allowed" : "pointer" }}>
            {busy ? "⏳ 生成中... しばらくお待ちください（30秒〜1分）" : "▶ 記事を生成する"}
          </button>

          {/* ステータス */}
          <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, fontSize: 13, color: status.startsWith("✅") ? "#4ade80" : status.startsWith("❌") ? "#ff8080" : "#00D4FF", wordBreak: "break-all" }}>
            {status}
          </div>

          {/* 生成完了ボタン */}
          {result && !busy && (
            <button onClick={() => setTab("preview")}
              style={{ width: "100%", padding: "12px", marginTop: 12, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, color: "#4ade80", fontSize: 14, fontWeight: "bold", cursor: "pointer" }}>
              📄 生成された記事を確認する →
            </button>
          )}
        </div>
      )}

      {/* ════ プレビュータブ ════════════════════════════════════ */}
      {tab === "preview" && (
        <div>
          {!result ? (
            <div style={{ ...S.card, textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📄</div>
              <p style={{ color: "#555", marginBottom: 16 }}>まだ記事が生成されていません</p>
              <button onClick={() => setTab("generate")}
                style={{ padding: "9px 20px", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6, color: "#00D4FF", fontSize: 13, cursor: "pointer" }}>
                → 生成タブへ
              </button>
            </div>
          ) : (
            <div>
              {/* 情報バー */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ ...S.card, padding: "8px 14px" }}>
                    <div style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>文字数</div>
                    <div style={{ fontSize: 15, color: "#00D4FF", fontWeight: 700 }}>{result.replace(/[#*`<!-]/g, "").length.toLocaleString()}字</div>
                  </div>
                  <div style={{ ...S.card, padding: "8px 14px" }}>
                    <div style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>読了時間</div>
                    <div style={{ fontSize: 15, color: "#00D4FF", fontWeight: 700 }}>{Math.ceil(result.length / 600)}分</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={copy}
                    style={{ padding: "9px 18px", background: copied ? "rgba(74,222,128,0.15)" : "transparent", border: "1px solid " + (copied ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.15)"), borderRadius: 6, color: copied ? "#4ade80" : "#aaa", fontSize: 12, cursor: "pointer", fontWeight: copied ? 700 : 400 }}>
                    {copied ? "✓ コピー済！" : "📋 Markdownをコピー"}
                  </button>
                  <button onClick={() => setTab("generate")}
                    style={{ padding: "9px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#666", fontSize: 12, cursor: "pointer" }}>
                    ← 戻る
                  </button>
                </div>
              </div>

              {/* 記事本文 */}
              <div style={{ ...S.card, maxHeight: "58vh", overflowY: "auto", padding: "22px 26px", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.9, color: "#c8c8d8" }}>
                {result}
              </div>

              {/* WP投稿手順 */}
              <div style={{ ...S.card, marginTop: 14, borderColor: "rgba(252,211,77,0.2)", background: "rgba(252,211,77,0.03)" }}>
                <div style={{ fontSize: 10, color: "#fcd34d", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>💰 WordPressへの投稿手順</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    "① 上の「Markdownをコピー」を押す",
                    "② WordPress管理画面を開く",
                    "③ 投稿 → 新規投稿をクリック",
                    "④ 右上「コードエディター」に切替",
                    "⑤ コピーした内容を貼り付ける",
                    "⑥ アイキャッチ画像を設定して公開",
                  ].map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#888", padding: "4px 0" }}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ 履歴タブ ══════════════════════════════════════════ */}
      {tab === "history" && (
        <div>
          {history.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: "50px 20px", color: "#444" }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>🕐</div>
              まだ記事が生成されていません
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>{history.length}件 — クリックで記事を表示</div>
              {history.map((h, i) => (
                <div key={i}
                  onClick={() => { setResult(h.text); setTopic(h.topic); setTab("preview"); }}
                  style={{ ...S.card, marginBottom: 10, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,212,255,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#ddd", fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>{h.topic}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>
                        {h.text.length.toLocaleString()}文字 · {new Date(h.ts).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <span style={{ padding: "5px 12px", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 6, color: "#00D4FF", fontSize: 11, flexShrink: 0 }}>
                      表示 →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* フッター */}
      <div style={{ marginTop: 32, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#2a2a3a" }}>
        <span>自分株式会社 Blog Engine</span>
        <span>powered by Claude API</span>
      </div>

    </div>
  );
}
