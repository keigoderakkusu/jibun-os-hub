import { useState } from "react";

const PERSONAS = {
  ai: {
    label: "⚡ AI実務・自動化",
    color: "#00D4FF",
    system: `26歳営業DX担当「Keigo」として書く。読者は20代。失敗談・数字を正直に書く等身大スタイル。構成：①導入 ②実践 ③成果 ④失敗 ⑤20代へのメッセージ ⑥ツール紹介。末尾に<!-- meta: 説明 --><!-- tags: タグ1,タグ2,タグ3 --><!-- affiliate: ツール|説明 -->`,
    presets: [
      "AIエージェントを部下として使いこなす方法：26歳の実体験",
      "GASでSlack通知を自動化した話：コードが書けない自分がやってみた",
      "Cursorを使えばコードが書けなくても自動化できる：正直レビュー",
      "ChatGPT APIをExcelに繋いだら会議資料が10分で完成した",
      "AIで日報を自動生成したら残業が週3時間減った話",
    ],
  },
  career: {
    label: "💼 転職・キャリア",
    color: "#FF6B35",
    system: `26歳第二新卒「Keigo」として書く。年収300万→1000万を目指す過程をリアルに公開。読者は20代。数字・失敗を正直に書く。構成：①導入 ②実践 ③成果 ④失敗 ⑤20代へのメッセージ ⑥アクション。末尾に<!-- meta: 説明 --><!-- tags: タグ1,タグ2,タグ3 --><!-- affiliate: ツール|説明 -->`,
    presets: [
      "AIを使った転職活動の全記録：26歳が年収300万から脱出を試みた話",
      "DX推進・AI活用人材の年収相場：転職市場のリアル2026年版",
      "第二新卒でAIスキルを武器に転職した話：面接で何を聞かれたか",
      "ポートフォリオに何を載せるべきか：AI活用実績の見せ方",
      "年収300万から500万へ：26歳が転職で学んだ交渉術",
    ],
  },
  side: {
    label: "💰 副業・収益化",
    color: "#A855F7",
    system: `26歳副業ブロガー「Keigo」として書く。収益も赤字も全部公開するビルドインパブリックスタイル。読者は副業を始めたい20代。構成：①導入 ②実践 ③成果（赤字含む） ④失敗 ⑤20代へのメッセージ ⑥アクション。末尾に<!-- meta: 説明 --><!-- tags: タグ1,タグ2,タグ3 --><!-- affiliate: ツール|説明 -->`,
    presets: [
      "ブログ副業を始めて3ヶ月：26歳の正直な収益報告と失敗まとめ",
      "個人ブログをAIで半自動化して月1万円稼ぐまでの記録",
      "アフィリエイトで稼げるまでにかかった時間と費用：全部公開",
      "自分株式会社の月次レポート：収益・学び・失敗まとめ",
      "AIブログで月10万円を目指す：26歳のリアルなロードマップ",
    ],
  },
  money: {
    label: "📈 お金・投資",
    color: "#10b981",
    system: `26歳新NISA積立中「Keigo」として書く。年収300万でも資産形成できることを証明中。将来の結婚・子供を視野に経済基盤構築中。読者は20代。構成：①導入 ②実践 ③成果 ④失敗 ⑤20代へのメッセージ ⑥アクション。末尾に<!-- meta: 説明 --><!-- tags: タグ1,タグ2,タグ3 --><!-- affiliate: ツール|説明 -->`,
    presets: [
      "新NISAを半年続けた正直な結果と失敗まとめ：26歳の投資記録",
      "年収300万で結婚・子供を考えるための資産形成：リアルな計算",
      "AIで株・投資信託を分析したら投資判断が変わった話",
      "26歳が月3万円を積み立て続けた結果：新NISAのリアル",
      "ヴィンテージ時計の相場をPythonで監視するシステムを作った",
    ],
  },
};

export default function App() {
  const [persona,  setPersona]  = useState("ai");
  const [topic,    setTopic]    = useState("");
  const [keywords, setKeywords] = useState("");
  const [busy,     setBusy]     = useState(false);
  const [status,   setStatus]   = useState("テーマを入力して生成ボタンを押してください");
  const [article,  setArticle]  = useState("");
  const [copied,   setCopied]   = useState(false);
  const [history,  setHistory]  = useState([]);
  const [tab,      setTab]      = useState("generate");

  const p = PERSONAS[persona];

  async function generate() {
    if (!topic.trim() || busy) return;
    setBusy(true);
    setArticle("");
    setStatus("送信中...");
    try {
      setStatus("生成中... 30秒〜1分かかります、このままお待ちください");
      const kw  = keywords.trim() ? "\nSEOキーワード: " + keywords : "";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system:     p.system,
          messages:   [{ role: "user", content: "テーマ：" + topic + kw }],
        }),
      });
      setStatus("受信中... (HTTP " + res.status + ")");
      const raw  = await res.text();
      const json = JSON.parse(raw);
      if (json.error) {
        setStatus("❌ APIエラー：" + json.error.message);
        setBusy(false);
        return;
      }
      const text = (json.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      if (!text) {
        setStatus("❌ 空の返答でした。console.anthropic.com でクレジット残高を確認してください");
        setBusy(false);
        return;
      }
      setArticle(text);
      setHistory(prev => [{ persona, topic, text, ts: Date.now() }, ...prev.slice(0, 19)]);
      setStatus("✅ 生成完了 — " + text.length.toLocaleString() + "文字");
      setTab("preview");
    } catch (e) {
      setStatus("❌ エラー：" + e.message);
    }
    setBusy(false);
  }

  function copy() {
    navigator.clipboard.writeText(article);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function loadHistory(h) {
    setPersona(h.persona);
    setTopic(h.topic);
    setArticle(h.text);
    setStatus("✅ 履歴から読み込み — " + h.text.length.toLocaleString() + "文字");
    setTab("preview");
  }

  const CARD = { background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "16px 18px" };
  const LBL  = { fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: 7 };

  function TabBtn({ id, label }) {
    const active = tab === id;
    return (
      <button onClick={() => setTab(id)} style={{ padding: "8px 18px", background: active ? "rgba(0,212,255,0.1)" : "transparent", border: "1px solid " + (active ? "rgba(0,212,255,0.35)" : "rgba(255,255,255,0.08)"), borderRadius: 6, color: active ? "#00D4FF" : "#666", fontSize: 12, cursor: "pointer" }}>
        {label}
      </button>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "#e0e0f0", fontFamily: "sans-serif", padding: "24px 20px", maxWidth: 900, margin: "0 auto" }}>

      {/* ヘッダー */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00D4FF", boxShadow: "0 0 8px #00D4FF" }} />
          <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase" }}>自分株式会社 — Blog Engine</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
          AIブログ<span style={{ color: "#00D4FF" }}>生成</span>エンジン
        </h1>
        <p style={{ fontSize: 12, color: "#555" }}>26歳ペルソナ × Claude API — テーマを入れてボタンを押すだけ</p>
      </div>

      {/* タブ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        <TabBtn id="generate" label="✍️ 生成" />
        <TabBtn id="preview"  label="📄 プレビュー" />
        <TabBtn id="history"  label={"🕐 履歴（" + history.length + "件）"} />
      </div>

      {/* ════ 生成 ══════════════════════════════════════════════ */}
      {tab === "generate" && (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}>
          <div>
            <div style={{ marginBottom: 18 }}>
              <span style={LBL}>記事の種類</span>
              {Object.entries(PERSONAS).map(([key, val]) => (
                <button key={key}
                  onClick={() => { setPersona(key); setTopic(""); setArticle(""); setStatus("テーマを入力して生成ボタンを押してください"); }}
                  style={{ display: "block", width: "100%", padding: "10px 12px", marginBottom: 6, background: persona === key ? "rgba(255,255,255,0.05)" : "transparent", border: "1px solid " + (persona === key ? val.color : "rgba(255,255,255,0.07)"), borderRadius: 7, color: persona === key ? val.color : "#888", fontSize: 12, cursor: "pointer", textAlign: "left", fontWeight: persona === key ? 700 : 400 }}>
                  {val.label}
                </button>
              ))}
            </div>
            <div>
              <span style={LBL}>プリセット</span>
              {p.presets.map((pr, i) => (
                <button key={i} onClick={() => setTopic(pr)}
                  style={{ display: "block", width: "100%", padding: "7px 10px", marginBottom: 5, background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, color: "#777", fontSize: 11, cursor: "pointer", textAlign: "left", lineHeight: 1.5 }}>
                  → {pr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 12 }}>
              <span style={LBL}>記事テーマ</span>
              <textarea value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="テーマを入力してください..."
                rows={4}
                style={{ width: "100%", padding: "10px 13px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e0f0", fontSize: 14, resize: "vertical", outline: "none", lineHeight: 1.6 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <span style={LBL}>SEOキーワード（任意）</span>
              <input value={keywords} onChange={e => setKeywords(e.target.value)}
                placeholder="例：AI 転職 26歳, 副業 ブログ"
                style={{ width: "100%", padding: "9px 13px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e0f0", fontSize: 13, outline: "none" }} />
            </div>
            <button onClick={generate} disabled={busy || !topic.trim()}
              style={{ width: "100%", padding: "15px", marginBottom: 12, background: busy ? "rgba(255,255,255,0.03)" : "rgba(0,212,255,0.15)", border: "1px solid " + (busy ? "rgba(255,255,255,0.07)" : p.color), borderRadius: 8, color: busy ? "#444" : p.color, fontSize: 15, fontWeight: "bold", cursor: busy ? "not-allowed" : "pointer", letterSpacing: "0.05em" }}>
              {busy ? "⏳ 生成中... そのままお待ちください" : "▶ 記事を生成する"}
            </button>
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, fontSize: 13, color: status.startsWith("✅") ? "#4ade80" : status.startsWith("❌") ? "#ff8080" : "#00D4FF", wordBreak: "break-all", lineHeight: 1.6 }}>
              {status}
            </div>
            {article && !busy && (
              <button onClick={() => setTab("preview")}
                style={{ width: "100%", padding: "11px", marginTop: 12, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, color: "#4ade80", fontSize: 14, fontWeight: "bold", cursor: "pointer" }}>
                📄 記事を確認する →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════ プレビュー ════════════════════════════════════════ */}
      {tab === "preview" && (
        <div>
          {!article ? (
            <div style={{ ...CARD, textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📄</div>
              <p style={{ color: "#555", marginBottom: 16 }}>まだ記事が生成されていません</p>
              <button onClick={() => setTab("generate")}
                style={{ padding: "9px 20px", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6, color: "#00D4FF", fontSize: 13, cursor: "pointer" }}>
                → 生成タブへ
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ ...CARD, padding: "8px 14px" }}>
                    <div style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>文字数</div>
                    <div style={{ fontSize: 15, color: "#00D4FF", fontWeight: 700 }}>{article.replace(/[#*`<!-]/g, "").length.toLocaleString()}字</div>
                  </div>
                  <div style={{ ...CARD, padding: "8px 14px" }}>
                    <div style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>読了時間</div>
                    <div style={{ fontSize: 15, color: "#00D4FF", fontWeight: 700 }}>{Math.ceil(article.length / 600)}分</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={copy}
                    style={{ padding: "9px 18px", background: copied ? "rgba(74,222,128,0.15)" : "transparent", border: "1px solid " + (copied ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.15)"), borderRadius: 6, color: copied ? "#4ade80" : "#aaa", fontSize: 12, cursor: "pointer" }}>
                    {copied ? "✓ コピー済！" : "📋 Markdownをコピー"}
                  </button>
                  <button onClick={() => setTab("generate")}
                    style={{ padding: "9px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#666", fontSize: 12, cursor: "pointer" }}>
                    ← 戻る
                  </button>
                </div>
              </div>
              <div style={{ ...CARD, maxHeight: "60vh", overflowY: "auto", padding: "22px 26px", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.9, color: "#c8c8d8" }}>
                {article}
              </div>
              <div style={{ ...CARD, marginTop: 14, borderColor: "rgba(252,211,77,0.2)", background: "rgba(252,211,77,0.03)" }}>
                <div style={{ fontSize: 10, color: "#fcd34d", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>💰 WordPressへの投稿手順</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {["① 上の「Markdownをコピー」を押す", "② WordPress管理画面を開く", "③ 投稿 → 新規投稿をクリック", "④ 右上「コードエディター」に切替", "⑤ コピーした内容を貼り付ける", "⑥ アイキャッチ画像を設定して公開"].map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#888", padding: "4px 0" }}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ 履歴 ══════════════════════════════════════════════ */}
      {tab === "history" && (
        <div>
          {history.length === 0 ? (
            <div style={{ ...CARD, textAlign: "center", padding: "50px 20px", color: "#444" }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>🕐</div>
              まだ記事が生成されていません
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>{history.length}件 — クリックで記事を表示</div>
              {history.map((h, i) => (
                <div key={i} onClick={() => loadHistory(h)}
                  style={{ ...CARD, marginBottom: 10, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,212,255,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#ddd", fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>{h.topic}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>
                        {PERSONAS[h.persona]?.label} · {h.text.length.toLocaleString()}文字 · {new Date(h.ts).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <span style={{ padding: "5px 12px", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 6, color: "#00D4FF", fontSize: 11, flexShrink: 0 }}>表示 →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 36, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#2a2a3a" }}>
        <span>自分株式会社 Blog Engine — 26歳の年収1000万計画</span>
        <span>powered by Claude API</span>
      </div>

    </div>
  );
}
