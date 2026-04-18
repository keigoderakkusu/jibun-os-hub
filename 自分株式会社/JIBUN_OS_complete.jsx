import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// ── システムプロンプト ───────────────────────────────────────────────
const PERSONAS = {
  ai_work: {
    label: "⚡ AI実務・自動化", color: "#00D4FF",
    prompt: `あなたは26歳の営業DX担当者「Keigo」です。GAS・AIエージェントで業務効率化を実践中。コードは書けないがAIを使いこなしています。読者は「AIに興味はあるが使いこなせていない20代」。等身大の語り口で失敗談・数字も正直に書く。
以下の構成でMarkdown形式で書いてください：
# タイトル（SEO意識・40字以内）
## はじめに（共感の導入）
## AIエージェントでやってみたこと
## 実際の成果と数字
## 失敗・詰まったポイント
## 同じ20代へのメッセージ
## まとめ・おすすめツール
<!-- meta: SEO説明文120字 -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: ["AIエージェントを部下として使いこなす方法：26歳の実体験","GASでSlack通知を自動化した話：コードが書けない自分がやってみた","Cursorを使えばコードが書けなくても自動化できる：正直レビュー","ChatGPT APIをExcelに繋いだら会議資料が10分で完成した"],
  },
  career: {
    label: "💼 転職・キャリア", color: "#FF6B35",
    prompt: `あなたは26歳・第二新卒・年収300万から年収1000万を本気で目指している「Keigo」です。AIを武器に転職活動中。読者は同じ悩みを持つ20代。失敗談・数字・リアルな体験を正直に書く。
以下の構成でMarkdown形式で書いてください：
# タイトル（SEO意識・40字以内）
## はじめに（共感の導入）
## 実際にやってみたこと
## 結果と数字
## 失敗・反省点
## 同じ20代へのメッセージ
## まとめ・おすすめアクション
<!-- meta: SEO説明文120字 -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: ["AIを使った転職活動の全記録：26歳が年収300万から脱出を試みた話","DX推進・AI活用人材の年収相場：転職市場のリアル2026年版","第二新卒でAIスキルを武器に転職した話：面接で何を聞かれたか","ポートフォリオに何を載せるべきか：AI活用実績の見せ方"],
  },
  side_income: {
    label: "💰 副業・収益化", color: "#A855F7",
    prompt: `あなたは26歳・副業でブログ収益化を実験中の「Keigo」です。ビルドインパブリックスタイルで数字を全部公開。読者は「副業を始めたいけど何からすればいいかわからない20代」。
以下の構成でMarkdown形式で書いてください：
# タイトル（SEO意識・40字以内）
## はじめに（共感の導入）
## 実際にやってみたこと
## 収益・数字（赤字も含む正直な報告）
## 失敗・反省点
## 同じ20代へのメッセージ
## まとめ・おすすめアクション
<!-- meta: SEO説明文120字 -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: ["ブログ副業を始めて3ヶ月：26歳の正直な収益報告と失敗まとめ","個人ブログをAIで半自動化して月1万円稼ぐまでの記録","アフィリエイトで稼げるまでにかかった時間と費用：全部公開","自分株式会社の月次レポート：収益・学び・失敗まとめ"],
  },
  money: {
    label: "📈 お金・投資", color: "#10b981",
    prompt: `あなたは26歳・新NISA積立中・将来の結婚・子供を視野に経済基盤を構築中の「Keigo」です。年収300万でも資産形成できることを証明しようとしている。読者は同じ悩みを持つ20代。
以下の構成でMarkdown形式で書いてください：
# タイトル（SEO意識・40字以内）
## はじめに（共感の導入）
## 実際にやってみたこと
## 結果と数字
## 失敗・反省点
## 同じ20代へのメッセージ
## まとめ・おすすめアクション
<!-- meta: SEO説明文120字 -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: ["新NISAを半年続けた正直な結果と失敗まとめ：26歳の投資記録","年収300万で結婚・子供を考えるための資産形成：リアルな計算","AIで株・投資信託を分析したら判断が変わった話","26歳が月3万円を積み立て続けた結果：新NISAのリアル"],
  },
};

const INCOME_DATA = [
  { name: "今",    本業: 300, 副業: 0   },
  { name: "6ヶ月", 本業: 300, 副業: 8   },
  { name: "1年",   本業: 500, 副業: 15  },
  { name: "2年",   本業: 650, 副業: 40  },
  { name: "3年",   本業: 750, 副業: 80  },
  { name: "4年",   本業: 800, 副業: 200 },
];

// ── Markdownレンダラー ───────────────────────────────────────────────
function MdView({ text }) {
  if (!text) return null;
  return (
    <div>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("# "))   return <h1 key={i} style={{ fontSize: 19, fontWeight: 700, color: "#fff", margin: "14px 0 7px" }}>{line.slice(2)}</h1>;
        if (line.startsWith("## "))  return <h2 key={i} style={{ fontSize: 15, fontWeight: 700, color: "#00D4FF", margin: "18px 0 7px", paddingBottom: 5, borderBottom: "1px solid rgba(0,212,255,0.2)" }}>{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize: 13, fontWeight: 700, color: "#e0e0f0", margin: "12px 0 5px" }}>{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} style={{ display: "flex", gap: 8, margin: "3px 0 3px 8px" }}><span style={{ color: "#00D4FF", flexShrink: 0 }}>›</span><span style={{ fontSize: 13, color: "#c0c0d8", lineHeight: 1.8 }}>{line.slice(2)}</span></div>;
        if (line.startsWith("<!--") || line.trim() === "") return <div key={i} style={{ height: 4 }} />;
        return <p key={i} style={{ fontSize: 13, color: "#c0c0d8", lineHeight: 1.9, margin: "2px 0" }}>{line}</p>;
      })}
    </div>
  );
}

// ── メインアプリ ─────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]         = useState("blog");
  const [persona, setPersona]   = useState("ai_work");
  const [topic, setTopic]       = useState("");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy]         = useState(false);
  const [status, setStatus]     = useState("待機中");
  const [article, setArticle]   = useState("");
  const [copied, setCopied]     = useState(false);
  const [history, setHistory]   = useState([]);

  // KPI（編集可能）
  const [salary,    setSalary]    = useState(300);
  const [side,      setSide]      = useState(0);
  const [posts,     setPosts]     = useState(0);
  const [followers, setFollowers] = useState(0);

  const p = PERSONAS[persona];

  // ── 記事生成（blog_final.jsxと同じ確実な実装）─────────────────────
  async function generate() {
    if (!topic.trim() || busy) return;
    setBusy(true);
    setArticle("");
    setStatus("送信中...");

    let raw = "";
    try {
      const kw = keywords.trim() ? "\nSEOキーワード: " + keywords : "";
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: p.prompt,
          messages: [{ role: "user", content: "テーマ：" + topic + kw }],
        }),
      });

      setStatus("受信中... (HTTP " + resp.status + ")");
      raw = await resp.text();
      setStatus("パース中...");

      const json = JSON.parse(raw);
      if (json.error) { setStatus("❌ APIエラー：" + json.error.message); setBusy(false); return; }

      const text = (json.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      if (!text) { setStatus("❌ 空の返答。残高確認: console.anthropic.com"); setBusy(false); return; }

      setArticle(text);
      setStatus("✅ 完了 — " + text.length.toLocaleString() + "文字");
      setPosts(n => n + 1);
      setHistory(prev => [{ persona, topic, text, ts: Date.now() }, ...prev.slice(0, 9)]);
      setPage("preview");

    } catch (e) {
      setStatus("❌ " + e.message + (raw ? " / " + raw.slice(0, 60) : ""));
    }
    setBusy(false);
  }

  function copy() {
    navigator.clipboard.writeText(article);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── 共通スタイル ─────────────────────────────────────────────────
  const C = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "16px 18px" };
  const LB = { fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7, display: "block" };
  const NB = (id) => ({
    display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 7,
    cursor: "pointer", width: "100%", textAlign: "left", marginBottom: 4, fontSize: 12,
    background: page === id ? "rgba(0,212,255,0.08)" : "transparent",
    border: "1px solid " + (page === id ? "rgba(0,212,255,0.3)" : "transparent"),
    color: page === id ? "#00D4FF" : "#555",
  });

  const totalIncome = salary + side * 12;
  const pct = Math.min(100, (totalIncome / 1000) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#07070f", color: "#e0e0f0", display: "flex", fontFamily: "sans-serif" }}>

      {/* ══ サイドバー ════════════════════════════════════════════ */}
      <aside style={{ width: 185, background: "rgba(0,0,0,0.45)", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "16px 9px", flexShrink: 0, height: "100vh", position: "sticky", top: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF" }} />
            <span style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.15em" }}>JIBUN-OS</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>自分<span style={{ color: "#00D4FF" }}>株式</span>会社</div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>26歳 → 年収1000万計画</div>
        </div>

        <nav style={{ flex: 1 }}>
          {[
            { id: "blog",      icon: "✍️", label: "ブログ生成" },
            { id: "preview",   icon: "📄", label: "記事プレビュー" },
            { id: "dashboard", icon: "📊", label: "ダッシュボード" },
            { id: "roadmap",   icon: "🗺️", label: "ロードマップ" },
            { id: "history",   icon: "🕐", label: "生成履歴" },
          ].map(n => (
            <button key={n.id} style={NB(n.id)} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 13 }}>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10, marginTop: 8 }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 3 }}>累計記事数</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80" }}>{posts}<span style={{ fontSize: 11, color: "#555" }}> 本</span></div>
          <div style={{ marginTop: 8, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg,#00D4FF,#4ade80)", transition: "width 0.5s" }} />
          </div>
          <div style={{ fontSize: 9, color: "#444", marginTop: 3 }}>年収目標 {pct.toFixed(0)}%</div>
        </div>
      </aside>

      {/* ══ メイン ════════════════════════════════════════════════ */}
      <main style={{ flex: 1, overflowY: "auto", padding: "24px 22px" }}>

        {/* ─── ブログ生成 ────────────────────────────────────────── */}
        {page === "blog" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Blog Generator</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4 }}>AIブログ<span style={{ color: "#00D4FF" }}>生成</span></h2>
              <p style={{ fontSize: 12, color: "#555" }}>テーマを入力してボタンを押すだけ — 生成まで30秒〜1分</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20 }}>

              {/* 左：ペルソナ＋プリセット */}
              <div>
                <span style={LB}>コンテンツ種類</span>
                {Object.entries(PERSONAS).map(([key, val]) => (
                  <button key={key} onClick={() => { setPersona(key); setTopic(""); setArticle(""); setStatus("待機中"); }}
                    style={{ display: "block", width: "100%", padding: "9px 12px", marginBottom: 6, background: persona === key ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.02)", border: "1px solid " + (persona === key ? val.color : "rgba(255,255,255,0.07)"), borderRadius: 7, color: persona === key ? val.color : "#888", fontSize: 12, cursor: "pointer", textAlign: "left" }}>
                    {val.label}
                  </button>
                ))}

                <span style={{ ...LB, marginTop: 16 }}>プリセット</span>
                {p.presets.map((pr, i) => (
                  <button key={i} onClick={() => setTopic(pr)}
                    style={{ display: "block", width: "100%", padding: "7px 10px", marginBottom: 5, background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, color: "#777", fontSize: 11, cursor: "pointer", textAlign: "left" }}>
                    → {pr.slice(0, 30)}{pr.length > 30 ? "…" : ""}
                  </button>
                ))}
              </div>

              {/* 右：入力＋生成 */}
              <div>
                <span style={LB}>記事テーマ</span>
                <textarea value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="テーマを入力してください..." rows={3}
                  style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e0f0", fontSize: 13, resize: "vertical", outline: "none", marginBottom: 12 }} />

                <span style={LB}>SEOキーワード（任意）</span>
                <input value={keywords} onChange={e => setKeywords(e.target.value)}
                  placeholder="例：AI 転職 26歳"
                  style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e0f0", fontSize: 13, outline: "none", marginBottom: 14 }} />

                <button onClick={generate} disabled={busy || !topic.trim()}
                  style={{ width: "100%", padding: "14px", background: busy ? "rgba(255,255,255,0.03)" : "rgba(0,212,255,0.15)", border: "1px solid " + (busy ? "rgba(255,255,255,0.07)" : p.color), borderRadius: 8, color: busy ? "#444" : p.color, fontSize: 15, fontWeight: "bold", cursor: busy ? "not-allowed" : "pointer", marginBottom: 12, letterSpacing: "0.04em" }}>
                  {busy ? "⏳ 生成中... (30秒〜1分かかります)" : "▶ 記事を生成する"}
                </button>

                {/* ステータス */}
                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, fontSize: 13, color: status.startsWith("✅") ? "#4ade80" : status.startsWith("❌") ? "#ff8080" : "#00D4FF", wordBreak: "break-all", marginBottom: article ? 10 : 0 }}>
                  {status}
                </div>

                {/* 完了通知 */}
                {article && (
                  <div style={{ padding: "11px 14px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <span style={{ fontSize: 13, color: "#4ade80" }}>✅ {article.length.toLocaleString()}文字 生成完了</span>
                    <button onClick={() => setPage("preview")}
                      style={{ padding: "6px 14px", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6, color: "#00D4FF", fontSize: 12, cursor: "pointer" }}>
                      プレビューを見る →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── 記事プレビュー ────────────────────────────────────── */}
        {page === "preview" && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Article Preview</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>記事プレビュー</h2>
            </div>

            {!article ? (
              <div style={{ ...C, textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 30, marginBottom: 10, opacity: 0.3 }}>📄</div>
                <p style={{ color: "#555", marginBottom: 16 }}>まだ記事が生成されていません</p>
                <button onClick={() => setPage("blog")} style={{ padding: "9px 20px", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6, color: "#00D4FF", fontSize: 13, cursor: "pointer" }}>
                  → ブログ生成へ
                </button>
              </div>
            ) : (
              <div>
                {/* 上部コントロール */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { k: "文字数", v: article.replace(/[#*`\[\]\(\)<!-->\n]/g, "").length.toLocaleString() + "字" },
                      { k: "読了",   v: Math.ceil(article.length / 600) + "分" },
                    ].map(s => (
                      <div key={s.k} style={{ ...C, padding: "7px 13px" }}>
                        <div style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>{s.k}</div>
                        <div style={{ fontSize: 14, color: "#00D4FF", fontWeight: 700 }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={copy} style={{ padding: "8px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#aaa", fontSize: 12, cursor: "pointer" }}>
                      {copied ? "✓ コピー済" : "Markdownコピー"}
                    </button>
                    <button onClick={() => setPage("blog")} style={{ padding: "8px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#666", fontSize: 12, cursor: "pointer" }}>
                      ← 戻る
                    </button>
                  </div>
                </div>

                {/* 記事本文 */}
                <div style={{ ...C, maxHeight: "65vh", overflowY: "auto", padding: "22px 24px", marginBottom: 14 }}>
                  <MdView text={article} />
                </div>

                {/* WP投稿手順 */}
                <div style={{ ...C, borderColor: "rgba(252,211,77,0.2)", background: "rgba(252,211,77,0.03)" }}>
                  <div style={{ fontSize: 10, color: "#fcd34d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>💰 WordPress投稿手順</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    {["① 上の「Markdownコピー」ボタンを押す", "② WordPressの管理画面を開く", "③ 新規投稿 → コードエディタに切替", "④ コピーした内容を貼り付け", "⑤ アイキャッチ画像を設定する", "⑥ 公開 または スケジュール設定"].map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#888", padding: "4px 0" }}>{s}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── ダッシュボード ─────────────────────────────────────── */}
        {page === "dashboard" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>CEO Dashboard</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>自分<span style={{ color: "#00D4FF" }}>株式会社</span> 司令部</h2>
              <p style={{ fontSize: 12, color: "#555", marginTop: 3 }}>数字を自分で入力して現在地を把握する</p>
            </div>

            {/* KPI入力 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
              {[
                { label: "本業年収（万円）", val: salary,    set: setSalary,    color: "#00D4FF" },
                { label: "副業月収（万円）", val: side,      set: setSide,      color: "#4ade80" },
                { label: "累計記事数",       val: posts,     set: setPosts,     color: "#f59e0b" },
                { label: "SNSフォロワー",    val: followers, set: setFollowers, color: "#A855F7" },
              ].map((k, i) => (
                <div key={i} style={{ ...C, borderBottom: "2px solid " + k.color }}>
                  <div style={{ fontSize: 10, color: "#666", marginBottom: 7 }}>{k.label}</div>
                  <input type="number" value={k.val} onChange={e => k.set(Number(e.target.value))}
                    style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 22, fontWeight: 900, color: k.color }} />
                </div>
              ))}
            </div>

            {/* 合計年収 */}
            <div style={{ ...C, marginBottom: 18, background: "rgba(74,222,128,0.04)", borderColor: "rgba(74,222,128,0.2)" }}>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 5 }}>合計年収（本業 + 副業×12）</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#4ade80", marginBottom: 8 }}>
                {totalIncome.toLocaleString()}万円
                <span style={{ fontSize: 13, color: "#555", fontWeight: 400, marginLeft: 12 }}>目標まであと {Math.max(0, 1000 - totalIncome).toLocaleString()}万円</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg,#00D4FF,#4ade80)", borderRadius: 4, transition: "width 0.5s" }} />
              </div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>達成率 {pct.toFixed(1)}%</div>
            </div>

            {/* 収入チャート */}
            <div style={{ ...C, marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>年収推移シミュレーション</div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={INCOME_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="本業" stroke="#00D4FF" fill="url(#g1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="副業" stroke="#4ade80" fill="url(#g2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 3, background: "#00D4FF", borderRadius: 2 }} /><span style={{ fontSize: 11, color: "#555" }}>本業</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 3, background: "#4ade80", borderRadius: 2 }} /><span style={{ fontSize: 11, color: "#555" }}>副業</span></div>
              </div>
            </div>

            {/* スキルバー */}
            <div style={C}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>スキルギャップ（現在 → 目標）</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { name: "AI活用",    now: 85, goal: 95, color: "#00D4FF" },
                  { name: "ブログSEO", now: 30, goal: 75, color: "#f59e0b" },
                  { name: "SNS運用",   now: 25, goal: 70, color: "#A855F7" },
                  { name: "転職準備",  now: 50, goal: 85, color: "#FF6B35" },
                  { name: "GAS自動化", now: 40, goal: 80, color: "#10b981" },
                  { name: "資産運用",  now: 45, goal: 70, color: "#4ade80" },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#ccc" }}>{s.name}</span>
                      <span style={{ fontSize: 10, color: "#555" }}>{s.now} → {s.goal}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", display: "flex" }}>
                        <div style={{ width: s.now + "%", background: s.color, opacity: 0.9 }} />
                        <div style={{ width: (s.goal - s.now) + "%", background: s.color, opacity: 0.2 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── ロードマップ ───────────────────────────────────────── */}
        {page === "roadmap" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Roadmap</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>年収<span style={{ color: "#00D4FF" }}>1000万</span>ロードマップ</h2>
              <p style={{ fontSize: 12, color: "#555", marginTop: 3 }}>本業転職 + 副業の2軸で4年以内に達成する計画</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
              {[
                { phase: "Phase 1", dur: "今〜6ヶ月",    color: "#00D4FF", goal: "基盤構築",
                  income: "本業300万 + 副業月3〜8万",
                  acts: ["ブログを週2〜3本書く","X/Threadsを毎日投稿","GASで業務を1つ自動化","転職市場のリサーチ開始"] },
                { phase: "Phase 2", dur: "6ヶ月〜1.5年", color: "#A855F7", goal: "転職＋副業軌道乗せ",
                  income: "本業500〜650万 + 副業月15〜25万",
                  acts: ["DX・AI活用職に転職","ブログ月収10万超え","SNS1万フォロワー達成","有料note販売開始"] },
                { phase: "Phase 3", dur: "1.5年〜4年",   color: "#10b981", goal: "複合収入で1000万",
                  income: "本業750〜800万 + 副業月40〜80万",
                  acts: ["再転職で年収アップ","ブログ月収20〜30万安定","結婚・子供の資金確保","FIRE視野に入れる"] },
              ].map((ph, i) => (
                <div key={i} style={{ ...C, borderTop: "3px solid " + ph.color }}>
                  <div style={{ fontSize: 10, color: ph.color, marginBottom: 4 }}>{ph.phase} · {ph.dur}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{ph.goal}</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 12, lineHeight: 1.6 }}>{ph.income}</div>
                  {ph.acts.map((a, j) => (
                    <div key={j} style={{ display: "flex", gap: 7, padding: "4px 0", borderTop: j > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ color: ph.color, fontSize: 11, flexShrink: 0 }}>›</span>
                      <span style={{ fontSize: 11, color: "#aaa" }}>{a}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 費用対効果 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={C}>
                <div style={{ fontSize: 10, color: "#ff8080", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>月次コスト試算</div>
                {[
                  { name: "レンタルサーバー", cost: "¥1,200〜" },
                  { name: "独自ドメイン（月割）", cost: "¥83〜" },
                  { name: "Claude API", cost: "¥500〜3,000" },
                  { name: "Perplexity Pro（任意）", cost: "¥2,000" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: "#ff8080" }}>{r.cost}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,80,80,0.07)", borderRadius: 7, border: "1px solid rgba(255,80,80,0.2)" }}>
                  <div style={{ fontSize: 10, color: "#888", marginBottom: 3 }}>月間合計</div>
                  <div style={{ fontSize: 18, color: "#ff8080", fontWeight: 900 }}>¥1,783〜7,225</div>
                </div>
              </div>

              <div style={{ ...C, background: "rgba(74,222,128,0.03)", borderColor: "rgba(74,222,128,0.2)" }}>
                <div style={{ fontSize: 10, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>収益ロードマップ</div>
                {[
                  { period: "0〜3ヶ月", income: "0〜3,000円",       color: "#444" },
                  { period: "3〜6ヶ月", income: "3,000〜20,000円",  color: "#00D4FF" },
                  { period: "6〜12ヶ月",income: "20,000〜80,000円", color: "#4ade80" },
                  { period: "1年〜",    income: "80,000〜200,000円+",color: "#fcd34d" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", marginBottom: 6, background: "rgba(255,255,255,0.02)", borderRadius: 6, borderLeft: "3px solid " + r.color }}>
                    <span style={{ fontSize: 11, color: r.color, fontWeight: 700 }}>{r.period}</span>
                    <span style={{ fontSize: 12, color: "#4ade80" }}>{r.income}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── 生成履歴 ───────────────────────────────────────────── */}
        {page === "history" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>History</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>生成履歴<span style={{ fontSize: 14, color: "#555", fontWeight: 400, marginLeft: 10 }}>計{history.length}本</span></h2>
            </div>

            {history.length === 0 ? (
              <div style={{ ...C, textAlign: "center", padding: "50px 20px", color: "#444" }}>
                <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.3 }}>🕐</div>
                まだ記事が生成されていません
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} style={{ ...C, marginBottom: 10, cursor: "pointer" }}
                  onClick={() => { setArticle(h.text); setPage("preview"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#ddd", fontWeight: 700, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.topic}</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ fontSize: 10, color: "#555" }}>{new Date(h.ts).toLocaleString("ja-JP")}</span>
                        <span style={{ fontSize: 10, color: PERSONAS[h.persona]?.color || "#555" }}>
                          {PERSONAS[h.persona]?.label || h.persona}
                        </span>
                        <span style={{ fontSize: 10, color: "#555" }}>{h.text.length.toLocaleString()}文字</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "#00D4FF", padding: "4px 10px", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6, flexShrink: 0, marginLeft: 12 }}>
                      表示 →
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </main>
    </div>
  );
}
