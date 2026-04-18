import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ── システムプロンプト ──────────────────────────────────────────────
const PERSONAS = {
  ai_work: {
    label: "⚡ AI実務・自動化", color: "#00D4FF",
    prompt: `あなたは26歳の営業DX担当者「Keigo」です。GAS・Python・AIエージェントで業務効率化を実践中。コードは書けないがAIを使いこなしています。読者は「AIに興味はあるが使いこなせていない20代」。等身大の語り口で失敗談・数字も正直に書く。
構成：①導入（共感） ②実践内容（AIエージェント活用） ③成果と数字 ④失敗・反省点 ⑤20代へのメッセージ ⑥おすすめツール
記事末尾に必ず：
<!-- meta: SEO説明文120字 -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: [
      "AIエージェントを部下として使いこなす方法：26歳の実体験",
      "GASでSlack通知を自動化した話：コードが書けない自分がやってみた",
      "Cursorを使えばコードが書けなくても自動化できる：正直レビュー",
      "ChatGPT APIをExcelに繋いだら会議資料が10分で完成した",
    ]
  },
  career: {
    label: "💼 転職・キャリア", color: "#FF6B35",
    prompt: `あなたは26歳・第二新卒・年収300万から年収1000万を本気で目指している「Keigo」です。AIを武器に転職活動中。読者は同じ悩みを持つ20代。失敗談・数字・リアルな体験を正直に書く。
構成：①導入（共感） ②実践内容 ③成果と数字 ④失敗・反省点 ⑤20代へのメッセージ ⑥おすすめアクション
記事末尾に必ず：
<!-- meta: SEO説明文120字 -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: [
      "AIを使った転職活動の全記録：26歳が年収300万から脱出を試みた話",
      "DX推進・AI活用人材の年収相場：転職市場のリアル2026年版",
      "第二新卒でAIスキルを武器に転職した話：面接で何を聞かれたか",
      "ポートフォリオに何を載せるべきか：AI活用実績の見せ方",
    ]
  },
  side_income: {
    label: "💰 副業・収益化", color: "#A855F7",
    prompt: `あなたは26歳・副業でブログ収益化を実験中の「Keigo」です。ビルドインパブリックスタイルで数字を全部公開。読者は「副業を始めたいけど何からすればいいかわからない20代」。
構成：①導入（共感） ②実践内容 ③成果と数字（赤字も含む） ④失敗・反省点 ⑤20代へのメッセージ ⑥おすすめアクション
記事末尾に必ず：
<!-- meta: SEO説明文120字 -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: [
      "ブログ副業を始めて3ヶ月：26歳の正直な収益報告と失敗まとめ",
      "個人ブログをAIで半自動化して月1万円稼ぐまでの記録",
      "アフィリエイトで稼げるまでにかかった時間と費用：正直に全部公開",
      "自分株式会社の月次レポート：収益・学び・失敗まとめ",
    ]
  },
  money: {
    label: "📈 お金・投資", color: "#10b981",
    prompt: `あなたは26歳・新NISA積立中・将来の結婚・子供を視野に経済基盤を構築中の「Keigo」です。年収300万でも資産形成できることを証明しようとしている。読者は同じ悩みを持つ20代。
構成：①導入（共感） ②実践内容 ③成果と数字 ④失敗・反省点 ⑤20代へのメッセージ ⑥おすすめアクション
記事末尾に必ず：
<!-- meta: SEO説明文120字 -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: [
      "新NISAを半年続けた正直な結果と失敗まとめ：26歳の投資記録",
      "年収300万で結婚・子供を考えるための資産形成：リアルな計算",
      "AIで株・投資信託を分析したら判断が変わった話",
      "26歳が月3万円を積み立て続けた結果：新NISAのリアル",
    ]
  },
};

// ── チャートデータ ──────────────────────────────────────────────────
const INCOME_DATA = [
  { name: "今",    本業: 300, 副業: 0   },
  { name: "6ヶ月", 本業: 300, 副業: 8   },
  { name: "1年",   本業: 500, 副業: 15  },
  { name: "2年",   本業: 650, 副業: 40  },
  { name: "3年",   本業: 750, 副業: 80  },
  { name: "4年",   本業: 800, 副業: 200 },
];

const SKILL_DATA = [
  { name: "AI活用",      現在: 85, 目標: 95 },
  { name: "ブログSEO",   現在: 30, 目標: 75 },
  { name: "SNS運用",     現在: 25, 目標: 70 },
  { name: "転職準備",    現在: 50, 目標: 85 },
  { name: "GAS自動化",   現在: 40, 目標: 80 },
  { name: "資産運用",    現在: 45, 目標: 70 },
];

// ── Markdownレンダラー ──────────────────────────────────────────────
function MdView({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith("# "))
          return <h1 key={i} style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "16px 0 8px" }}>{line.replace("# ", "")}</h1>;
        if (line.startsWith("## "))
          return <h2 key={i} style={{ fontSize: 16, fontWeight: 700, color: "#00D4FF", margin: "18px 0 8px", paddingBottom: 5, borderBottom: "1px solid rgba(0,212,255,0.2)" }}>{line.replace("## ", "")}</h2>;
        if (line.startsWith("### "))
          return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: "#e0e0f0", margin: "12px 0 6px" }}>{line.replace("### ", "")}</h3>;
        if (line.startsWith("- ") || line.startsWith("* "))
          return <div key={i} style={{ display: "flex", gap: 8, margin: "4px 0 4px 8px" }}><span style={{ color: "#00D4FF" }}>›</span><span style={{ fontSize: 13, color: "#c0c0d8", lineHeight: 1.8 }}>{line.replace(/^[-*]\s/, "")}</span></div>;
        if (line.startsWith("```") || line.trim() === "")
          return <div key={i} style={{ height: 4 }} />;
        if (line.startsWith("<!--"))
          return null;
        return <p key={i} style={{ fontSize: 13, color: "#c0c0d8", lineHeight: 1.9, margin: "3px 0" }}>{line}</p>;
      })}
    </div>
  );
}

// ── メインアプリ ────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]         = useState("blog");
  const [persona, setPersona]   = useState("ai_work");
  const [topic, setTopic]       = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState("");
  const [error, setError]       = useState("");
  const [article, setArticle]   = useState("");
  const [copied, setCopied]     = useState(false);
  const [history, setHistory]   = useState([]);

  // KPI（編集可能）
  const [kpiSalary,    setKpiSalary]    = useState(300);
  const [kpiSide,      setKpiSide]      = useState(0);
  const [kpiPosts,     setKpiPosts]     = useState(0);
  const [kpiFollowers, setKpiFollowers] = useState(0);

  const p = PERSONAS[persona];

  // ── 記事生成 ────────────────────────────────────────────────────
  const generate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError("");
    setArticle("");
    setStatus("Claude に接続中...");

    try {
      setStatus("記事を生成中... (30秒〜1分かかります)");
      const kw = keywords.trim() ? "\nSEOキーワード: " + keywords : "";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: p.prompt,
          messages: [{
            role: "user",
            content: "以下のテーマでブログ記事を書いてください。\n\nテーマ：" + topic + kw
          }]
        })
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error("HTTP " + res.status + " — " + t.slice(0, 150));
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "APIエラー");

      const text = (data.content || [])
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("");

      if (!text) throw new Error("生成結果が空でした。もう一度お試しください。");

      setArticle(text);
      setStatus("✅ 生成完了！");
      setKpiPosts(n => n + 1);
      setHistory(prev => [{ topic, text, ts: Date.now() }, ...prev.slice(0, 9)]);

    } catch (e) {
      setError(e.message);
      setStatus("❌ エラー");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(article);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── スタイル共通 ─────────────────────────────────────────────────
  const card = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "16px 18px",
  };

  const navBtn = (id) => ({
    display: "flex", alignItems: "center", gap: 8,
    padding: "9px 12px", borderRadius: 7, cursor: "pointer",
    border: "1px solid " + (page === id ? "rgba(0,212,255,0.3)" : "transparent"),
    background: page === id ? "rgba(0,212,255,0.08)" : "transparent",
    color: page === id ? "#00D4FF" : "#555",
    fontSize: 12, fontFamily: "sans-serif",
    width: "100%", textAlign: "left",
    marginBottom: 4,
  });

  const label = {
    fontSize: 10, color: "#555", textTransform: "uppercase",
    letterSpacing: "0.1em", marginBottom: 7, display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07070f", color: "#e0e0f0", display: "flex", fontFamily: "sans-serif" }}>

      {/* ── サイドバー ───────────────────────────────────────────── */}
      <aside style={{ width: 190, background: "rgba(0,0,0,0.4)", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "16px 10px", flexShrink: 0, height: "100vh", position: "sticky", top: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", boxShadow: "0 0 6px #00D4FF" }} />
            <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.15em" }}>JIBUN-OS</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>
            自分<span style={{ color: "#00D4FF" }}>株式</span>会社
          </div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>26歳 → 年収1000万計画</div>
        </div>

        <nav style={{ flex: 1 }}>
          {[
            { id: "blog",     icon: "✍️", label: "ブログ生成" },
            { id: "preview",  icon: "📄", label: "記事プレビュー" },
            { id: "dashboard",icon: "📊", label: "ダッシュボード" },
            { id: "roadmap",  icon: "🗺️", label: "ロードマップ" },
            { id: "history",  icon: "🕐", label: "生成履歴" },
          ].map(n => (
            <button key={n.id} style={navBtn(n.id)} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12, marginTop: 10 }}>
          <div style={{ fontSize: 10, color: "#4ade80", marginBottom: 4 }}>累計記事数</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#4ade80" }}>{kpiPosts}<span style={{ fontSize: 12, color: "#555" }}> 本</span></div>
        </div>
      </aside>

      {/* ── メインコンテンツ ─────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "24px 22px" }}>

        {/* ════ ブログ生成 ════════════════════════════════════════ */}
        {page === "blog" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Blog Generator</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
                AIブログ<span style={{ color: "#00D4FF" }}>生成</span>
              </h2>
              <p style={{ fontSize: 12, color: "#555" }}>26歳ペルソナ × Claude API — テーマを入れてボタンを押すだけ</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>

              {/* 左パネル */}
              <div>
                {/* ペルソナ選択 */}
                <div style={{ marginBottom: 16 }}>
                  <span style={label}>コンテンツ種類</span>
                  {Object.entries(PERSONAS).map(([key, val]) => (
                    <button key={key}
                      onClick={() => { setPersona(key); setTopic(""); setArticle(""); setStatus(""); setError(""); }}
                      style={{
                        display: "block", width: "100%", padding: "9px 12px", marginBottom: 6,
                        background: persona === key ? `rgba(${key === "ai_work" ? "0,212,255" : key === "career" ? "255,107,53" : key === "side_income" ? "168,85,247" : "16,185,129"},0.1)` : "rgba(255,255,255,0.02)",
                        border: "1px solid " + (persona === key ? val.color : "rgba(255,255,255,0.07)"),
                        borderRadius: 7, color: persona === key ? val.color : "#888",
                        fontSize: 12, cursor: "pointer", textAlign: "left",
                      }}>
                      {val.label}
                    </button>
                  ))}
                </div>

                {/* プリセット */}
                <div style={{ marginBottom: 16 }}>
                  <span style={label}>プリセット</span>
                  {p.presets.map((pr, i) => (
                    <button key={i} onClick={() => setTopic(pr)}
                      style={{
                        display: "block", width: "100%", padding: "7px 10px", marginBottom: 5,
                        background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 6, color: "#777", fontSize: 11, cursor: "pointer", textAlign: "left",
                      }}>
                      → {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* 右パネル */}
              <div>
                <div style={{ marginBottom: 12 }}>
                  <span style={label}>記事テーマ</span>
                  <textarea value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="テーマを入力してください..."
                    rows={3}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e0f0", fontSize: 13, resize: "vertical", outline: "none" }} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <span style={label}>SEOキーワード（任意）</span>
                  <input value={keywords} onChange={e => setKeywords(e.target.value)}
                    placeholder="例：AI 転職 26歳"
                    style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e0e0f0", fontSize: 13, outline: "none" }} />
                </div>

                <button onClick={generate} disabled={loading || !topic.trim()}
                  style={{
                    width: "100%", padding: "14px",
                    background: loading ? "rgba(255,255,255,0.04)" : `rgba(${persona === "ai_work" ? "0,212,255" : persona === "career" ? "255,107,53" : persona === "side_income" ? "168,85,247" : "16,185,129"},0.15)`,
                    border: "1px solid " + (loading ? "rgba(255,255,255,0.08)" : p.color),
                    borderRadius: 8, color: loading ? "#555" : p.color,
                    fontSize: 15, fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer",
                    marginBottom: 12, letterSpacing: "0.05em",
                  }}>
                  {loading ? "⏳ 生成中... (30秒〜1分)" : "▶ 記事を生成する"}
                </button>

                {status && (
                  <div style={{ padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, fontSize: 13, color: status.startsWith("✅") ? "#4ade80" : status.startsWith("❌") ? "#ff8080" : "#00D4FF", marginBottom: 10 }}>
                    {status}
                  </div>
                )}

                {error && (
                  <div style={{ padding: "12px 14px", background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.3)", borderRadius: 8, fontSize: 13, color: "#ff8080", marginBottom: 10, wordBreak: "break-all" }}>
                    <strong>エラー：</strong> {error}
                  </div>
                )}

                {article && (
                  <div style={{ padding: "10px 14px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#4ade80" }}>✅ {article.length.toLocaleString()}文字 生成完了</span>
                      <button onClick={() => setPage("preview")}
                        style={{ padding: "6px 14px", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6, color: "#00D4FF", fontSize: 12, cursor: "pointer" }}>
                        プレビューを見る →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ 記事プレビュー ════════════════════════════════════ */}
        {page === "preview" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Article Preview</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>記事プレビュー</h2>
            </div>

            {!article ? (
              <div style={{ ...card, textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📄</div>
                <p style={{ color: "#555", marginBottom: 16 }}>まだ記事が生成されていません</p>
                <button onClick={() => setPage("blog")}
                  style={{ padding: "9px 20px", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6, color: "#00D4FF", fontSize: 13, cursor: "pointer" }}>
                  → ブログ生成へ
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ ...card, padding: "8px 14px" }}>
                      <div style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>文字数</div>
                      <div style={{ fontSize: 14, color: "#00D4FF", fontWeight: 700 }}>{article.replace(/[#*`\[\]\(\)]/g, "").length.toLocaleString()}字</div>
                    </div>
                    <div style={{ ...card, padding: "8px 14px" }}>
                      <div style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>読了時間</div>
                      <div style={{ fontSize: 14, color: "#00D4FF", fontWeight: 700 }}>{Math.ceil(article.length / 600)}分</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={copy}
                      style={{ padding: "8px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, color: "#888", fontSize: 12, cursor: "pointer" }}>
                      {copied ? "✓ コピー済" : "Markdownコピー"}
                    </button>
                    <button onClick={() => setPage("blog")}
                      style={{ padding: "8px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#666", fontSize: 12, cursor: "pointer" }}>
                      ← 戻る
                    </button>
                  </div>
                </div>

                <div style={{ ...card, maxHeight: "70vh", overflowY: "auto", padding: "22px 24px" }}>
                  <MdView text={article} />
                </div>

                <div style={{ ...card, marginTop: 14, borderColor: "rgba(252,211,77,0.2)" }}>
                  <div style={{ fontSize: 10, color: "#fcd34d", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>💰 WordPress投稿手順</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {["① 上の「Markdownコピー」ボタンを押す", "② WordPressの管理画面を開く", "③ 新規投稿 → コードエディタに切替", "④ コピーした内容を貼り付け", "⑤ アイキャッチ画像を設定する", "⑥ 公開 または スケジュール設定"].map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#888", padding: "5px 0" }}>{s}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ ダッシュボード ════════════════════════════════════ */}
        {page === "dashboard" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>CEO Dashboard</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>
                自分<span style={{ color: "#00D4FF" }}>株式会社</span> 司令部
              </h2>
              <p style={{ fontSize: 12, color: "#555" }}>26歳 / 年収300万 → 1000万計画 — 数字を自分で入力して現在地を把握する</p>
            </div>

            {/* KPI入力カード */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "本業年収（万円）", val: kpiSalary,    set: setKpiSalary,    color: "#00D4FF" },
                { label: "副業月収（万円）", val: kpiSide,      set: setKpiSide,      color: "#4ade80" },
                { label: "累計記事数",       val: kpiPosts,     set: setKpiPosts,     color: "#f59e0b" },
                { label: "SNSフォロワー",    val: kpiFollowers, set: setKpiFollowers, color: "#A855F7" },
              ].map((k, i) => (
                <div key={i} style={{ ...card, borderBottom: `2px solid ${k.color}` }}>
                  <div style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>{k.label}</div>
                  <input type="number" value={k.val} onChange={e => k.set(Number(e.target.value))}
                    style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 22, fontWeight: 900, color: k.color }} />
                </div>
              ))}
            </div>

            {/* 合計年収 */}
            <div style={{ ...card, marginBottom: 20, background: "rgba(74,222,128,0.04)", borderColor: "rgba(74,222,128,0.2)" }}>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>合計年収（本業 + 副業×12ヶ月）</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80" }}>
                {(kpiSalary + kpiSide * 12).toLocaleString()}万円
                <span style={{ fontSize: 13, color: "#555", fontWeight: 400, marginLeft: 12 }}>
                  目標まであと {Math.max(0, 1000 - (kpiSalary + kpiSide * 12)).toLocaleString()}万円
                </span>
              </div>
              <div style={{ marginTop: 10, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, ((kpiSalary + kpiSide * 12) / 1000) * 100)}%`, background: "linear-gradient(90deg,#00D4FF,#4ade80)", borderRadius: 4, transition: "width 0.5s" }} />
              </div>
            </div>

            {/* 収入チャート */}
            <div style={{ ...card, marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>年収推移シミュレーション（本業 + 副業）</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={INCOME_DATA}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <AreaChart data={INCOME_DATA} />
                    <Area type="monotone" dataKey="本業" stroke="#00D4FF" fill="url(#g1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="副業" stroke="#4ade80" fill="url(#g2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* スキルバー */}
            <div style={card}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>スキルギャップ（現在値 → 目標値）</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {SKILL_DATA.map((s, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#ccc" }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: "#555" }}>{s.現在} → {s.目標}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", display: "flex" }}>
                        <div style={{ width: `${s.現在}%`, background: "#00D4FF", borderRadius: "4px 0 0 4px" }} />
                        <div style={{ width: `${s.目標 - s.現在}%`, background: "rgba(0,212,255,0.2)" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ ロードマップ ══════════════════════════════════════ */}
        {page === "roadmap" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Roadmap</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>
                年収<span style={{ color: "#00D4FF" }}>1000万</span>ロードマップ
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[
                { phase: "Phase 1", duration: "今〜6ヶ月", color: "#00D4FF", goal: "基盤構築",
                  income: "本業300万 + 副業月3〜8万",
                  actions: ["ブログを週2〜3本書く", "X/Threadsを毎日投稿", "GASで業務を1つ自動化", "転職市場のリサーチ開始"] },
                { phase: "Phase 2", duration: "6ヶ月〜1.5年", color: "#A855F7", goal: "転職＋副業軌道乗せ",
                  income: "本業500〜650万 + 副業月15〜25万",
                  actions: ["DX・AI活用職に転職", "ブログ月収10万超え", "SNS1万フォロワー達成", "有料note販売開始"] },
                { phase: "Phase 3", duration: "1.5年〜4年", color: "#10b981", goal: "複合収入で1000万",
                  income: "本業750〜800万 + 副業月40〜80万",
                  actions: ["再転職で年収アップ", "ブログ月収20〜30万安定", "結婚・子供の資金確保", "FIRE視野に入れる"] },
              ].map((ph, i) => (
                <div key={i} style={{ ...card, borderTop: `3px solid ${ph.color}` }}>
                  <div style={{ fontSize: 10, color: ph.color, marginBottom: 5 }}>{ph.phase} · {ph.duration}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{ph.goal}</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 12, lineHeight: 1.6 }}>{ph.income}</div>
                  {ph.actions.map((a, j) => (
                    <div key={j} style={{ display: "flex", gap: 7, padding: "4px 0", borderTop: j > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ color: ph.color, fontSize: 11 }}>›</span>
                      <span style={{ fontSize: 11, color: "#aaa" }}>{a}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ ...card, background: "rgba(252,211,77,0.03)", borderColor: "rgba(252,211,77,0.15)" }}>
              <div style={{ fontSize: 10, color: "#fcd34d", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>費用対効果サマリー</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {[
                  { l: "月間コスト", v: "約2,000円〜", s: "サーバー+Claude API" },
                  { l: "損益分岐点", v: "月3〜5本", s: "アフィリエイト1件で黒字" },
                  { l: "時間投資", v: "週2〜3時間", s: "AI活用後の目安" },
                  { l: "1年後ROI", v: "500〜2,000%", s: "月10万÷月5,000円" },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#666", marginBottom: 5 }}>{m.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#fcd34d", marginBottom: 3 }}>{m.v}</div>
                    <div style={{ fontSize: 10, color: "#555" }}>{m.s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ 生成履歴 ══════════════════════════════════════════ */}
        {page === "history" && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>History</div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>生成履歴</h2>
            </div>

            {history.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: "40px 20px", color: "#444" }}>
                まだ記事が生成されていません
              </div>
            ) : (
              <div>
                {history.map((h, i) => (
                  <div key={i} style={{ ...card, marginBottom: 10, cursor: "pointer" }}
                    onClick={() => { setArticle(h.text); setPage("preview"); }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, color: "#ddd", fontWeight: 700, marginBottom: 4 }}>{h.topic}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>
                          {new Date(h.ts).toLocaleString("ja-JP")} · {h.text.length.toLocaleString()}文字
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "#00D4FF", padding: "4px 10px", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6 }}>
                        表示 →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
