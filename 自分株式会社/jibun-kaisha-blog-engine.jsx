import { useState, useEffect, useRef } from "react";

const PERSONAS = {
  ai_work: {
    id: "ai_work",
    label: "AI実務・自動化",
    icon: "⚡",
    color: "#00D4FF",
    prompt: `あなたは25歳の営業DX担当者です。GAS・Python・AIエージェントを使って業務効率化を実践しています。
読者は「AIに興味はあるが使いこなせていない20代ビジネスパーソン」です。
トーン：丁寧すぎず、実体験ベースの等身大な語り口。専門用語は使うが必ず一言で解説する。
構成：①なぜ必要か（20代の悩み共感）→②実際にやってみた（コード・手順あり）→③メリット（数値化）→④まとめ＋次の一歩`,
    affiliates: ["AIツール（SaaS）", "プログラミングスクール", "Kindle技術書"],
  },
  qol_tech: {
    id: "qol_tech",
    label: "20代QOL×テック",
    icon: "🎯",
    color: "#FF6B35",
    prompt: `あなたは投資・ガジェット・カメラが趣味の25歳です。新NISAやヴィンテージ品、ZV-E10を使ったVlogも発信しています。
読者は「お金と趣味を賢く両立したい20代」です。
トーン：友人に話しかけるような親しみやすさ。失敗談も正直に書く。
構成：①自分がハマった背景（共感）→②実際の成果・数字→③注意点・失敗談→④おすすめリンク`,
    affiliates: ["証券口座開設", "ガジェット（Amazon/楽天）", "中古買取サービス"],
  },
  jibun_kaisha: {
    id: "jibun_kaisha",
    label: "自分株式会社ログ",
    icon: "🏢",
    color: "#A855F7",
    prompt: `あなたは「一人で会社のような仕組みを作る」実験をしている25歳です。AIを使って自動化・収益化の過程をリアルに公開しています。
読者は「副業・独立を考えている20代」です。
トーン：ビルドインパブリック（過程を全部見せる）スタイル。数字と失敗を隠さない。
構成：①今週の進捗（KPI）→②やってみたこと→③詰まったポイントと解決策→④次のアクション＋収益レポート`,
    affiliates: ["サーバー契約", "Notion/ツール系", "有料note/Tips"],
  },
};

const TOPIC_PRESETS = {
  ai_work: [
    "GASでSlack通知を自動化した話",
    "ChatGPTのAPIをExcelに繋いだら会議資料が10分で完成した",
    "Pythonで営業リストを自動整理するスクリプトを作った",
    "AIエージェントで日報生成を完全自動化してみた",
  ],
  qol_tech: [
    "新NISAを半年続けた正直な結果と反省点",
    "ZV-E10でVlogを始めて3ヶ月でわかったこと",
    "ヴィンテージ時計の相場をPythonで監視するシステムを作った",
    "25歳のガジェット環境：本当に使ったものだけ紹介",
  ],
  jibun_kaisha: [
    "個人ブログをAIで半自動化して月1万円稼ぐまでの記録",
    "自分株式会社の月次レポート：収益・学び・失敗まとめ",
    "NotionとClaudeを繋いでコンテンツ管理を自動化した",
    "ブログ記事をClaudeに書かせる仕組みと品質管理の実態",
  ],
};

function TypingText({ text, speed = 8 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const prevText = useRef("");

  useEffect(() => {
    if (text !== prevText.current) {
      setDisplayed("");
      setDone(false);
      indexRef.current = 0;
      prevText.current = text;
    }
  }, [text]);

  useEffect(() => {
    if (done || !text) return;
    if (indexRef.current >= text.length) {
      setDone(true);
      return;
    }
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, indexRef.current + 1));
      indexRef.current += 1;
    }, speed);
    return () => clearTimeout(timer);
  }, [displayed, text, done, speed]);

  return <span>{displayed}{!done && <span className="cursor">▋</span>}</span>;
}

export default function App() {
  const [activePersona, setActivePersona] = useState("ai_work");
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [generatedArticle, setGeneratedArticle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [articleTitle, setArticleTitle] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const persona = PERSONAS[activePersona];

  const handlePreset = (preset) => setTopic(preset);

  const generateArticle = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setError("");
    setGeneratedArticle("");
    setArticleTitle("");

    const kw = keywords.trim() ? `\nキーワード（自然に含める）: ${keywords}` : "";
    const affiliateHint = persona.affiliates.join("、");

    const userPrompt = `以下のテーマでブログ記事（下書き）を書いてください。

テーマ: ${topic}${kw}
アフィリエイト想定: ${affiliateHint}

## 出力形式
必ずMarkdown形式で出力してください。
- H1タイトル（##は使わず#のみ）
- H2見出し（##）で各セクション
- コードブロック（あれば）
- 最後にアフィリエイトCTA（###まとめ＆おすすめリンク）を必ず含める
- 文字数目安：1500〜2500文字
- SEOメタディスクリプション（記事末尾に<!-- meta: ... -->形式で）`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: persona.prompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const text = data.content?.map(b => b.text || "").join("") || "";
      const titleMatch = text.match(/^#\s+(.+)/m);
      setArticleTitle(titleMatch ? titleMatch[1] : topic);
      setGeneratedArticle(text);
    } catch (e) {
      setError("生成に失敗しました: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedArticle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse markdown to sections for display
  const sections = generatedArticle
    ? generatedArticle.split(/\n(?=##\s)/).map((s, i) => ({ id: i, content: s }))
    : [];

  const metaMatch = generatedArticle.match(/<!--\s*meta:\s*(.*?)\s*-->/s);
  const metaDesc = metaMatch ? metaMatch[1] : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      color: "#E8E8F0",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Zen+Kaku+Gothic+New:wght@300;400;700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cursor { 
          display: inline-block; 
          animation: blink 0.8s step-end infinite; 
          color: #00D4FF;
        }
        @keyframes blink { 50% { opacity: 0; } }

        .grid-bg {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-image: 
            linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none; z-index: 0;
        }

        .persona-tab {
          cursor: pointer;
          padding: 10px 18px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          transition: all 0.2s;
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 13px;
          letter-spacing: 0.02em;
        }
        .persona-tab:hover { background: rgba(255,255,255,0.07); }
        .persona-tab.active { border-color: var(--pc); background: rgba(var(--pc-rgb), 0.12); color: var(--pc); }

        .preset-chip {
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #aaa;
          font-size: 12px;
          transition: all 0.2s;
          font-family: 'Zen Kaku Gothic New', sans-serif;
          text-align: left;
          line-height: 1.4;
        }
        .preset-chip:hover { border-color: var(--pc); color: var(--pc); background: rgba(var(--pc-rgb), 0.08); }

        .generate-btn {
          width: 100%;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid var(--pc);
          background: rgba(var(--pc-rgb), 0.15);
          color: var(--pc);
          font-size: 15px;
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .generate-btn:hover:not(:disabled) { background: rgba(var(--pc-rgb), 0.28); transform: translateY(-1px); }
        .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .input-field {
          width: 100%; padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          color: #E8E8F0;
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 14px;
          transition: border-color 0.2s;
          resize: vertical;
        }
        .input-field:focus { outline: none; border-color: var(--pc); }
        .input-field::placeholder { color: rgba(255,255,255,0.25); }

        .article-section {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 12px;
        }
        .article-section h2 {
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 17px; font-weight: 700;
          color: var(--pc); margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(var(--pc-rgb), 0.2);
        }
        .article-section p {
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 14px; line-height: 1.9; color: #C8C8D8;
          margin-bottom: 10px;
        }
        .article-section code {
          background: rgba(0,0,0,0.4); padding: 2px 6px;
          border-radius: 3px; font-size: 13px; color: #7EE787;
        }
        .article-section pre {
          background: rgba(0,0,0,0.5); padding: 16px;
          border-radius: 6px; overflow-x: auto;
          border-left: 3px solid var(--pc);
          margin: 12px 0;
        }
        .article-section pre code { background: none; padding: 0; }
        .article-section h3 {
          font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 15px; font-weight: 700;
          color: #E8E8F0; margin: 14px 0 8px;
        }

        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 14px 16px;
          flex: 1;
        }

        .loading-bar {
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--pc), transparent);
          animation: loadSlide 1.5s ease-in-out infinite;
        }
        @keyframes loadSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .copy-btn {
          padding: 8px 16px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.15);
          background: transparent;
          color: #aaa;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Mono', monospace;
        }
        .copy-btn:hover { border-color: #fff; color: #fff; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .affiliate-tag {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-family: 'DM Mono', monospace;
          border: 1px solid rgba(var(--pc-rgb), 0.3);
          color: var(--pc);
          background: rgba(var(--pc-rgb), 0.08);
          margin: 3px 3px 3px 0;
        }
      `}</style>

      <div className="grid-bg" />

      {/* Dynamic CSS vars based on persona */}
      <style>{`
        :root {
          --pc: ${persona.color};
          --pc-rgb: ${persona.color === "#00D4FF" ? "0,212,255" : persona.color === "#FF6B35" ? "255,107,53" : "168,85,247"};
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: persona.color,
              boxShadow: `0 0 12px ${persona.color}`,
              animation: "blink 1.5s ease-in-out infinite"
            }} />
            <span style={{ fontSize: 11, color: "#666", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              自分株式会社 / Blog Automation Engine
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Zen Kaku Gothic New', sans-serif",
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            color: "#fff",
          }}>
            AIブログ<span style={{ color: persona.color }}>生成</span>エンジン
          </h1>
          <p style={{ color: "#666", fontSize: 13, marginTop: 8, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
            20代の等身大視点 × Claude API で、収益化できるコンテンツを自動生成
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "start" }}>

          {/* Left Panel - Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Persona Selector */}
            <div>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>
                // コンテンツモデル
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.values(PERSONAS).map(p => (
                  <button
                    key={p.id}
                    className={`persona-tab ${activePersona === p.id ? "active" : ""}`}
                    style={{ "--pc": p.color }}
                    onClick={() => { setActivePersona(p.id); setTopic(""); setGeneratedArticle(""); }}
                  >
                    <span style={{ marginRight: 8 }}>{p.icon}</span>{p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Affiliate Tags */}
            <div>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>
                // 想定アフィリエイト
              </div>
              <div>
                {persona.affiliates.map(a => (
                  <span key={a} className="affiliate-tag">{a}</span>
                ))}
              </div>
            </div>

            {/* Topic Input */}
            <div>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>
                // テーマ入力
              </div>
              <textarea
                className="input-field"
                rows={3}
                placeholder="記事のテーマを入力（例：GASでSlack通知を自動化）"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>

            {/* Presets */}
            <div>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>
                // プリセット
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {TOPIC_PRESETS[activePersona].map(p => (
                  <button key={p} className="preset-chip" onClick={() => handlePreset(p)}>
                    → {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>
                // SEOキーワード（任意）
              </div>
              <input
                className="input-field"
                placeholder="例：GAS 自動化 無料, 20代 副業"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <button
              className="generate-btn"
              onClick={generateArticle}
              disabled={isLoading || !topic.trim()}
            >
              {isLoading ? (
                <span>生成中...</span>
              ) : (
                <span>▶ 記事を生成する</span>
              )}
            </button>

            {isLoading && (
              <div style={{ overflow: "hidden", borderRadius: 2 }}>
                <div className="loading-bar" />
              </div>
            )}

            {error && (
              <div style={{
                padding: 12, borderRadius: 6,
                background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)",
                color: "#ff8080", fontSize: 13,
                fontFamily: "'Zen Kaku Gothic New', sans-serif",
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Right Panel - Output */}
          <div style={{ minHeight: 500 }}>
            {!generatedArticle && !isLoading && (
              <div style={{
                height: 500, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12,
                color: "#444",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>{persona.icon}</div>
                <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 14 }}>
                  テーマを選んで記事を生成しましょう
                </div>
              </div>
            )}

            {isLoading && (
              <div style={{
                height: 500, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(var(--pc-rgb), 0.15)", borderRadius: 12,
                background: "rgba(var(--pc-rgb), 0.03)",
              }}>
                <div style={{ fontSize: 13, color: "#666", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
                  <TypingText text="Claude が記事を生成しています..." speed={40} />
                </div>
                <div style={{ marginTop: 16, fontSize: 11, color: "#444", fontFamily: "'DM Mono', monospace" }}>
                  persona: {activePersona} | topic: {topic.slice(0, 30)}...
                </div>
              </div>
            )}

            {generatedArticle && !isLoading && (
              <div>
                {/* Article Header */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  marginBottom: 16, gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 4 }}>
                      // 生成完了
                    </div>
                    <h2 style={{
                      fontFamily: "'Zen Kaku Gothic New', sans-serif",
                      fontSize: 18, fontWeight: 700,
                      color: "#fff", lineHeight: 1.4,
                    }}>
                      {articleTitle}
                    </h2>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="copy-btn" onClick={handleCopy}>
                      {copied ? "✓ コピー完了" : "Markdown コピー"}
                    </button>
                  </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "文字数", value: generatedArticle.replace(/[#*`]/g, "").length.toLocaleString() + " 字" },
                    { label: "モデル", value: activePersona },
                    { label: "SEO", value: metaDesc ? "✓ あり" : "—" },
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div style={{ fontSize: 10, color: "#555", marginBottom: 4, fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>{s.label}</div>
                      <div style={{ fontSize: 14, color: persona.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Rendered Article */}
                <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
                  {generatedArticle.split("\n").reduce((acc, line) => {
                    const last = acc[acc.length - 1];
                    if (line.startsWith("## ")) {
                      acc.push({ type: "h2", content: line.replace("## ", ""), children: [] });
                    } else if (acc.length === 0) {
                      acc.push({ type: "intro", content: "", children: [line] });
                    } else {
                      last.children = last.children || [];
                      last.children.push(line);
                    }
                    return acc;
                  }, []).map((section, i) => (
                    <div key={i} className="article-section">
                      {section.type === "h2" && (
                        <h2>## {section.content}</h2>
                      )}
                      {(section.children || []).join("\n").split("\n").map((line, j) => {
                        if (line.startsWith("### ")) return <h3 key={j}>{line.replace("### ", "")}</h3>;
                        if (line.startsWith("```")) return null;
                        if (line.startsWith("# ")) return null;
                        if (line.startsWith("<!--")) return null;
                        if (line.trim() === "") return <br key={j} />;
                        if (line.startsWith("- ") || line.startsWith("* ")) {
                          return (
                            <p key={j} style={{ paddingLeft: 16, borderLeft: `2px solid rgba(var(--pc-rgb), 0.3)` }}>
                              {line.replace(/^[-*]\s/, "› ")}
                            </p>
                          );
                        }
                        return (
                          <p key={j} dangerouslySetInnerHTML={{
                            __html: line
                              .replace(/\*\*(.*?)\*\*/g, `<strong style="color:#fff">$1</strong>`)
                              .replace(/`(.*?)`/g, `<code>$1</code>`)
                          }} />
                        );
                      })}
                    </div>
                  ))}

                  {metaDesc && (
                    <div style={{
                      padding: 14, borderRadius: 6,
                      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)",
                      marginTop: 8,
                    }}>
                      <div style={{ fontSize: 10, color: "#555", marginBottom: 6, letterSpacing: "0.1em" }}>// SEO META DESCRIPTION</div>
                      <div style={{ fontSize: 12, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.7 }}>
                        {metaDesc}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 48, paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontSize: 11, color: "#333", fontFamily: "'DM Mono', monospace" }}>
            自分株式会社 © 2025 — powered by Claude API
          </div>
          <div style={{ fontSize: 11, color: "#333", fontFamily: "'DM Mono', monospace", display: "flex", gap: 20 }}>
            {["AI実務", "QOL×テック", "構築ログ"].map((m, i) => (
              <span key={i} style={{ opacity: 0.6 }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
