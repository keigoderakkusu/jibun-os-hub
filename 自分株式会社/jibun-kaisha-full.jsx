import { useState, useEffect, useRef, useCallback } from "react";

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `あなたは25歳の営業DX担当者「Keigo」です。毎日ルーチンワークに追われる20代と同じ悩みを持ちながら、AIエージェントを「部下・同僚」として使いこなすことで仕事を劇的に効率化してきた実体験を持ちます。

【ペルソナ詳細】
- 都内勤務の25歳、営業×DX推進を兼務
- プログラミングは独学（GAS・Python基礎）
- 投資・ガジェット・カメラ（ZV-E10）が趣味
- 「自分株式会社」として副業・自動化を実験中

【文体ルール】
- 丁寧すぎない。友人に話すような等身大の語り口
- 失敗談・数字・具体例を必ず入れる
- 専門用語は使うが、初出時に一言解説
- 「〜してみた」「正直に言うと」「これは使える」系の表現を自然に使う
- 長すぎない段落（3〜4行まで）

【記事構成（必ず守る）】
1. 導入（共感）：「毎日ルーチンワークで終わる…」という悩みへの共感 → AIを「部下・同僚」にする考え方を提示
2. Agent 1「調査・分析」：Manus AI / OpenClawなど競合調査・市場分析を丸投げする方法。営業DX視点。
3. Agent 2「コード生成」：Claude 3.5 Sonnet / Cursor でGAS・Pythonを書いて業務自動化した実体験。
4. Agent 3「執筆・要約」：Perplexity / NotebookLM で大量資料を5分で自分の知識にするワークフロー。
5. 20代へのメッセージ：スキルがなくても「AIを使いこなす側」に回ればキャリアの希少性が上がると強調。
6. アクション（収益）：おすすめツールの紹介と関連記事への誘導（アフィリエイト導線を自然に含む）

【出力形式】
- 必ずMarkdown形式
- タイトルは # で始める（SEOを意識した40字以内）
- セクション見出しは ## を使う
- コードブロックは \`\`\`言語名 で囲む
- 記事末尾に必ず以下を付ける：
  <!-- meta: SEOメタディスクリプション（120字以内） -->
  <!-- tags: タグ1,タグ2,タグ3,タグ4,タグ5 -->
  <!-- affiliate: ツール名1|URL説明1, ツール名2|URL説明2 -->
- 文字数：2000〜3000字
- 必ず全セクションを含めること。省略禁止。`;

// ─── TOPIC PRESETS ───────────────────────────────────────────────────────────
const PRESETS = [
  { label: "AIエージェント入門", topic: "AIエージェントを「部下」として使いこなす方法：20代営業マンの実体験" },
  { label: "GAS自動化", topic: "プログラミング未経験でもできる！GASで営業ルーティンを全自動化した話" },
  { label: "Perplexity活用", topic: "Perplexityを使えば競合調査が10分で終わる：営業DXの実践ワークフロー" },
  { label: "新NISA×AI", topic: "AIで新NISAの銘柄分析を自動化して、投資判断を爆速にした方法" },
  { label: "副業自動化", topic: "自分株式会社の作り方：AIで月収+5万円を目指す20代の収益化ロードマップ" },
  { label: "Cursor入門", topic: "Cursorを使えばコードが書けなくても自動化できる：25歳の正直レビュー" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function parseArticle(raw) {
  const titleMatch = raw.match(/^#\s+(.+)/m);
  const metaMatch = raw.match(/<!--\s*meta:\s*([\s\S]*?)\s*-->/);
  const tagsMatch = raw.match(/<!--\s*tags:\s*([\s\S]*?)\s*-->/);
  const affiliateMatch = raw.match(/<!--\s*affiliate:\s*([\s\S]*?)\s*-->/);
  const body = raw
    .replace(/^#\s+.+\n?/m, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  const charCount = body.replace(/[#*`\[\]\(\)\n]/g, "").length;
  return {
    title: titleMatch ? titleMatch[1].trim() : "記事",
    meta: metaMatch ? metaMatch[1].trim() : "",
    tags: tagsMatch ? tagsMatch[1].trim().split(",").map(t => t.trim()) : [],
    affiliates: affiliateMatch
      ? affiliateMatch[1].trim().split(",").map(a => {
          const [name, desc] = a.split("|");
          return { name: name?.trim(), desc: desc?.trim() };
        })
      : [],
    body,
    charCount,
    raw,
  };
}

// Minimal markdown → JSX renderer
function renderMd(text, accentColor) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let codeBlock = null;
  let codeLines = [];
  let lang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (codeBlock) {
        elements.push(
          <pre key={i} style={{
            background: "rgba(0,0,0,0.55)", padding: "16px 18px",
            borderRadius: 8, overflowX: "auto", margin: "16px 0",
            borderLeft: `3px solid ${accentColor}`,
            fontSize: 13, lineHeight: 1.7,
          }}>
            {lang && <div style={{ fontSize: 10, color: accentColor, marginBottom: 8, letterSpacing: "0.1em" }}>{lang.toUpperCase()}</div>}
            <code style={{ color: "#a5d6a7", fontFamily: "'DM Mono', monospace" }}>{codeLines.join("\n")}</code>
          </pre>
        );
        codeBlock = false; codeLines = []; lang = "";
      } else {
        codeBlock = true;
        lang = line.replace("```", "").trim();
      }
      continue;
    }
    if (codeBlock) { codeLines.push(line); continue; }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} style={{
          fontFamily: "'Zen Kaku Gothic New', sans-serif",
          fontSize: 20, fontWeight: 900, color: accentColor,
          margin: "32px 0 14px", paddingBottom: 8,
          borderBottom: `1px solid ${accentColor}33`,
        }}>
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} style={{
          fontFamily: "'Zen Kaku Gothic New', sans-serif",
          fontSize: 16, fontWeight: 700, color: "#e8e8f0",
          margin: "22px 0 10px",
        }}>
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.replace(/^[-*]\s/, "");
      elements.push(
        <div key={i} style={{
          display: "flex", gap: 10, margin: "6px 0",
          paddingLeft: 8,
        }}>
          <span style={{ color: accentColor, flexShrink: 0, marginTop: 1 }}>›</span>
          <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 15, lineHeight: 1.9, color: "#c8c8d8", margin: 0 }}
            dangerouslySetInnerHTML={{ __html: inlineFormat(content) }} />
        </div>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const [num, ...rest] = line.split(/\.\s/);
      elements.push(
        <div key={i} style={{ display: "flex", gap: 12, margin: "8px 0", paddingLeft: 8 }}>
          <span style={{
            color: accentColor, fontSize: 13, fontFamily: "'DM Mono', monospace",
            minWidth: 22, fontWeight: 700, marginTop: 2,
          }}>{num}.</span>
          <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 15, lineHeight: 1.9, color: "#c8c8d8", margin: 0 }}
            dangerouslySetInnerHTML={{ __html: inlineFormat(rest.join(". ")) }} />
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 8 }} />);
    } else {
      elements.push(
        <p key={i} style={{
          fontFamily: "'Zen Kaku Gothic New', sans-serif",
          fontSize: 15, lineHeight: 1.95, color: "#c8c8d8", margin: "6px 0",
        }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
    }
  }
  return elements;
}

function inlineFormat(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff;font-weight:700">$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.4);padding:2px 6px;border-radius:3px;font-size:13px;color:#7ee787;font-family:\'DM Mono\',monospace">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#60a5fa;text-decoration:underline" target="_blank">$1</a>');
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("generator"); // generator | preview | info
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [article, setArticle] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const progressRef = useRef(null);

  const accentColor = "#00D4FF";

  // Fake progress animation
  const startProgress = useCallback(() => {
    const steps = [
      [15, "ペルソナを設定中..."],
      [30, "Agent 1: 調査・分析セクション生成中..."],
      [50, "Agent 2: コード生成セクション生成中..."],
      [68, "Agent 3: 執筆・要約セクション生成中..."],
      [82, "20代へのメッセージを生成中..."],
      [92, "アフィリエイト導線を最適化中..."],
      [97, "SEOメタデータを生成中..."],
    ];
    let idx = 0;
    progressRef.current = setInterval(() => {
      if (idx < steps.length) {
        setProgress(steps[idx][0]);
        setProgressLabel(steps[idx][1]);
        idx++;
      }
    }, 900);
  }, []);

  const stopProgress = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    setProgressLabel("生成完了！");
  }, []);

  const generate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setError("");
    setArticle(null);
    setProgress(0);
    setProgressLabel("Claude に接続中...");
    startProgress();

    const kw = keywords.trim() ? `\nSEOキーワード（自然に含める）: ${keywords}` : "";

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `以下のテーマでブログ記事を生成してください。\n\nテーマ: ${topic}${kw}\n\n必ず全セクション（導入・Agent1・Agent2・Agent3・20代へのメッセージ・アクション）を含め、指定のMarkdown形式で出力してください。`,
          }],
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const parsed = parseArticle(raw);
      stopProgress();
      setArticle(parsed);
      setHistory(prev => [{ topic, parsed, ts: Date.now() }, ...prev.slice(0, 4)]);
      setTab("preview");
    } catch (e) {
      stopProgress();
      setError("生成に失敗しました: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080810",
      color: "#e8e8f0",
      fontFamily: "'DM Mono', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Zen+Kaku+Gothic+New:wght@300;400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .scanline {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.012) 2px, rgba(0,212,255,0.012) 4px);
          pointer-events: none; z-index: 0;
        }
        .noise {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0; opacity: 0.4;
        }

        .tab-btn {
          padding: 9px 20px; cursor: pointer;
          border: 1px solid transparent; border-radius: 4px;
          font-family: 'DM Mono', monospace; font-size: 12px;
          letter-spacing: 0.08em; transition: all 0.2s;
          background: transparent; color: #555;
        }
        .tab-btn:hover { color: #aaa; border-color: rgba(255,255,255,0.1); }
        .tab-btn.active {
          background: rgba(0,212,255,0.1); color: #00D4FF;
          border-color: rgba(0,212,255,0.3);
        }

        .preset-pill {
          cursor: pointer; padding: 7px 14px;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
          font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 12px;
          background: transparent; color: #888; transition: all 0.2s;
          white-space: nowrap;
        }
        .preset-pill:hover { border-color: #00D4FF; color: #00D4FF; background: rgba(0,212,255,0.06); }

        .gen-btn {
          width: 100%; padding: 18px; cursor: pointer;
          background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,150,200,0.1));
          border: 1px solid rgba(0,212,255,0.4); border-radius: 8px;
          color: #00D4FF; font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 16px; font-weight: 900; letter-spacing: 0.1em;
          transition: all 0.25s; position: relative; overflow: hidden;
        }
        .gen-btn:not(:disabled):hover {
          background: linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,150,200,0.18));
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,212,255,0.2);
        }
        .gen-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .gen-btn::before {
          content: ''; position: absolute; top: -50%; left: -60%;
          width: 40%; height: 200%; background: rgba(255,255,255,0.06);
          transform: skewX(-20deg); transition: left 0.5s;
        }
        .gen-btn:not(:disabled):hover::before { left: 120%; }

        .input-box {
          width: 100%; padding: 13px 15px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09);
          border-radius: 7px; color: #e8e8f0;
          font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 14px;
          transition: border-color 0.2s; resize: vertical;
        }
        .input-box:focus { outline: none; border-color: rgba(0,212,255,0.5); }
        .input-box::placeholder { color: rgba(255,255,255,0.2); }

        .progress-bar-inner {
          height: 100%; background: linear-gradient(90deg, #00D4FF, #0099cc);
          border-radius: 4px; transition: width 0.8s ease;
          box-shadow: 0 0 12px rgba(0,212,255,0.5);
        }

        .section-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 12px;
          background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.2);
          font-size: 11px; color: #00D4FF; font-family: 'DM Mono', monospace;
          margin-bottom: 16px;
        }

        .history-item {
          padding: 10px 14px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.07); border-radius: 6px;
          background: rgba(255,255,255,0.02); transition: all 0.2s;
          font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 13px; color: #888;
        }
        .history-item:hover { border-color: rgba(0,212,255,0.3); color: #ccc; background: rgba(0,212,255,0.04); }

        .copy-btn {
          padding: 8px 16px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.12); border-radius: 5px;
          background: transparent; color: #888;
          font-family: 'DM Mono', monospace; font-size: 12px;
          transition: all 0.2s;
        }
        .copy-btn:hover { border-color: #fff; color: #fff; }

        .affiliate-card {
          background: rgba(255,200,50,0.05); border: 1px solid rgba(255,200,50,0.15);
          border-radius: 8px; padding: 14px 16px;
          font-family: 'Zen Kaku Gothic New', sans-serif;
        }

        .info-card {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 22px 24px;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>

      <div className="scanline" />
      <div className="noise" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1140, margin: "0 auto", padding: "28px 20px" }}>

        {/* ── HEADER ── */}
        <header style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00D4FF", boxShadow: "0 0 10px #00D4FF", animation: "pulse 2s ease-in-out infinite" }} />
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
              <span style={{ fontSize: 10, color: "#444", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                自分株式会社 — Blog Automation Engine v2.0
              </span>
            </div>
            <h1 style={{
              fontFamily: "'Zen Kaku Gothic New', sans-serif",
              fontSize: "clamp(26px, 4.5vw, 42px)", fontWeight: 900,
              letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff",
            }}>
              AI<span style={{ color: "#00D4FF" }}>エージェント</span>ブログ<br />
              <span style={{ fontSize: "0.6em", color: "#555", fontWeight: 300, letterSpacing: "0.05em" }}>
                完全自動生成システム
              </span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { id: "generator", label: "⚡ 生成" },
              { id: "preview", label: "📄 プレビュー" },
              { id: "info", label: "💰 費用対効果" },
            ].map(t => (
              <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* ══ TAB: GENERATOR ══════════════════════════════════════════════════ */}
        {tab === "generator" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

            {/* Left: main input */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Section overview */}
              <div style={{
                background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)",
                borderRadius: 10, padding: "16px 20px",
              }}>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>
                  // 自動生成セクション構成
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    "① 導入（共感）",
                    "② Agent 1: 調査・分析",
                    "③ Agent 2: コード生成",
                    "④ Agent 3: 執筆・要約",
                    "⑤ 20代へのメッセージ",
                    "⑥ アクション（収益）",
                  ].map((s, i) => (
                    <span key={i} style={{
                      padding: "5px 12px", borderRadius: 20,
                      background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
                      fontSize: 12, color: "#00D4FF", fontFamily: "'Zen Kaku Gothic New', sans-serif",
                    }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Topic input */}
              <div>
                <label style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                  // 記事テーマ
                </label>
                <textarea
                  className="input-box" rows={3}
                  placeholder="例：AIエージェントを部下として使いこなす方法"
                  value={topic} onChange={e => setTopic(e.target.value)}
                />
              </div>

              {/* Presets */}
              <div>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>
                  // プリセットテーマ（クリックで選択）
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {PRESETS.map((p, i) => (
                    <button key={i} className="preset-pill"
                      onClick={() => setTopic(p.topic)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", display: "block", marginBottom: 8, textTransform: "uppercase" }}>
                  // SEOキーワード（任意・カンマ区切り）
                </label>
                <input className="input-box"
                  placeholder="例：AIエージェント, 20代 副業, 業務効率化"
                  value={keywords} onChange={e => setKeywords(e.target.value)} />
              </div>

              {/* Generate button */}
              <button className="gen-btn" onClick={generate}
                disabled={isLoading || !topic.trim()}>
                {isLoading ? "生成中..." : "▶ 記事を完全自動生成する"}
              </button>

              {/* Progress */}
              {isLoading && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#00D4FF", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
                      {progressLabel}
                    </span>
                    <span style={{ fontSize: 12, color: "#555" }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                    <div className="progress-bar-inner" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  padding: 14, borderRadius: 8,
                  background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.25)",
                  color: "#ff8080", fontSize: 13,
                  fontFamily: "'Zen Kaku Gothic New', sans-serif",
                }}>
                  ⚠ {error}
                </div>
              )}
            </div>

            {/* Right: history & tips */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Persona card */}
              <div className="info-card">
                <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>
                  // AIペルソナ設定
                </div>
                <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, lineHeight: 1.8, color: "#888" }}>
                  <div style={{ color: "#00D4FF", fontWeight: 700, marginBottom: 6 }}>Keigo / 25歳 営業DX担当</div>
                  <div>・都内勤務、副業で自動化を実験中</div>
                  <div>・GAS・Python独学</div>
                  <div>・新NISA・カメラ・ヴィンテージ品が趣味</div>
                  <div>・等身大の失敗談＋実数値で語る文体</div>
                </div>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>
                    // 生成履歴
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {history.map((h, i) => (
                      <div key={i} className="history-item"
                        onClick={() => { setArticle(h.parsed); setTab("preview"); }}>
                        <div style={{ fontSize: 12, color: "#00D4FF", marginBottom: 2 }}>
                          {h.parsed.title.slice(0, 36)}...
                        </div>
                        <div style={{ fontSize: 11, color: "#444" }}>
                          {new Date(h.ts).toLocaleTimeString("ja-JP")} · {h.parsed.charCount.toLocaleString()}字
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB: PREVIEW ════════════════════════════════════════════════════ */}
        {tab === "preview" && (
          <div>
            {!article ? (
              <div style={{
                height: 400, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 12, color: "#444",
              }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📄</div>
                <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 14 }}>
                  まだ記事が生成されていません
                </div>
                <button style={{
                  marginTop: 16, padding: "8px 20px", cursor: "pointer",
                  background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)",
                  borderRadius: 6, color: "#00D4FF", fontFamily: "'Zen Kaku Gothic New', sans-serif",
                  fontSize: 13,
                }} onClick={() => setTab("generator")}>
                  → 生成タブへ
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>

                {/* Article body */}
                <div>
                  {/* Title + actions */}
                  <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 8 }}>
                        // 生成記事プレビュー
                      </div>
                      <h1 style={{
                        fontFamily: "'Zen Kaku Gothic New', sans-serif",
                        fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 900,
                        color: "#fff", lineHeight: 1.4,
                      }}>
                        {article.title}
                      </h1>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                      <button className="copy-btn" onClick={() => handleCopy(article.raw)}>
                        {copied ? "✓ コピー済" : "Markdownコピー"}
                      </button>
                      <button className="copy-btn" onClick={() => setTab("generator")}>
                        ← 戻る
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{
                    background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12, padding: "28px 32px",
                    maxHeight: "72vh", overflowY: "auto",
                  }}>
                    {renderMd(article.body, accentColor)}
                  </div>
                </div>

                {/* Right meta panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Stats */}
                  <div className="info-card">
                    <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>// 記事データ</div>
                    {[
                      { k: "文字数", v: article.charCount.toLocaleString() + " 字" },
                      { k: "推定読了", v: Math.ceil(article.charCount / 500) + " 分" },
                      { k: "セクション", v: "6 / 6" },
                    ].map(s => (
                      <div key={s.k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize: 12, color: "#666", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{s.k}</span>
                        <span style={{ fontSize: 12, color: "#00D4FF", fontFamily: "'DM Mono', monospace" }}>{s.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* SEO meta */}
                  {article.meta && (
                    <div className="info-card">
                      <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>// SEOメタ</div>
                      <p style={{ fontSize: 12, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.7 }}>
                        {article.meta}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="info-card">
                      <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>// タグ</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {article.tags.map((t, i) => (
                          <span key={i} style={{
                            padding: "3px 10px", borderRadius: 12,
                            background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
                            fontSize: 11, color: "#00D4FF", fontFamily: "'DM Mono', monospace",
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Affiliates */}
                  {article.affiliates.length > 0 && (
                    <div className="affiliate-card">
                      <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>
                        💰 アフィリエイト導線
                      </div>
                      {article.affiliates.map((a, i) => (
                        <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < article.affiliates.length - 1 ? "1px solid rgba(255,200,50,0.1)" : "none" }}>
                          <div style={{ fontSize: 13, color: "#fcd34d", fontWeight: 700, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{a.name}</div>
                          {a.desc && <div style={{ fontSize: 11, color: "#888", marginTop: 2, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{a.desc}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* WordPress guide */}
                  <div className="info-card">
                    <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>// WordPress投稿手順</div>
                    {[
                      "Markdownコピー",
                      "WP管理画面→新規投稿",
                      "「コードエディタ」に貼り付け",
                      "アイキャッチ画像を設定",
                      "アフィリエイトリンクを挿入",
                      "公開 or スケジュール設定",
                    ].map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ color: "#00D4FF", fontSize: 11, fontFamily: "'DM Mono', monospace", minWidth: 20 }}>{i + 1}.</span>
                        <span style={{ fontSize: 12, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: INFO ═══════════════════════════════════════════════════════ */}
        {tab === "info" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* 必要サービス */}
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="info-card" style={{ border: "1px solid rgba(0,212,255,0.2)" }}>
                <div style={{ fontSize: 11, color: "#00D4FF", letterSpacing: "0.15em", marginBottom: 16, textTransform: "uppercase" }}>
                  // 必要なサービス一覧（準備するもの）
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  {[
                    { cat: "ブログ基盤", color: "#00D4FF", items: [
                      { name: "レンタルサーバー", desc: "ConoHa WING / エックスサーバー", cost: "月1,200〜1,500円", req: "必須" },
                      { name: "独自ドメイン", desc: "お名前.com / Cloudflare", cost: "年1,000〜1,500円", req: "必須" },
                      { name: "WordPress", desc: "無料CMS（サーバーにインストール）", cost: "無料", req: "必須" },
                      { name: "WordPressテーマ", desc: "SWELL / THE THOR（SEO最適化）", cost: "買切17,600円〜", req: "推奨" },
                    ]},
                    { cat: "AIツール", color: "#a855f7", items: [
                      { name: "Claude API", desc: "本システムで使用（Anthropic）", cost: "月500〜3,000円", req: "必須" },
                      { name: "Perplexity Pro", desc: "Agent 3: リサーチ用", cost: "月2,000円 / 無料枠あり", req: "推奨" },
                      { name: "Cursor Pro", desc: "Agent 2: コード生成補助", cost: "月2,000円 / 無料枠あり", req: "任意" },
                      { name: "NotebookLM", desc: "Agent 3: 資料要約（Google）", cost: "無料", req: "推奨" },
                    ]},
                    { cat: "収益化", color: "#fcd34d", items: [
                      { name: "Googleアドセンス", desc: "表示型広告（審査あり）", cost: "無料", req: "推奨" },
                      { name: "Amazon アソシエイト", desc: "ガジェット・書籍アフィリエイト", cost: "無料", req: "推奨" },
                      { name: "A8.net / もしもアフィリエイト", desc: "SaaS・金融系アフィリエイト", cost: "無料", req: "推奨" },
                      { name: "note / Tipsアカウント", desc: "有料記事・サブスク販売", cost: "無料（手数料10〜20%）", req: "任意" },
                    ]},
                  ].map(group => (
                    <div key={group.cat} style={{
                      background: "rgba(255,255,255,0.02)", borderRadius: 8,
                      border: `1px solid ${group.color}22`, padding: "14px 16px",
                    }}>
                      <div style={{ fontSize: 12, color: group.color, fontWeight: 700, marginBottom: 12, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
                        {group.cat}
                      </div>
                      {group.items.map((item, i) => (
                        <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "#ddd", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700 }}>{item.name}</span>
                            <span style={{
                              fontSize: 10, padding: "2px 7px", borderRadius: 10,
                              background: item.req === "必須" ? "rgba(255,80,80,0.15)" : item.req === "推奨" ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.06)",
                              color: item.req === "必須" ? "#ff8080" : item.req === "推奨" ? "#00D4FF" : "#888",
                              border: `1px solid ${item.req === "必須" ? "rgba(255,80,80,0.3)" : item.req === "推奨" ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.1)"}`,
                              fontFamily: "'DM Mono', monospace",
                            }}>{item.req}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#666", margin: "2px 0", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{item.desc}</div>
                          <div style={{ fontSize: 11, color: group.color, fontFamily: "'DM Mono', monospace" }}>{item.cost}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 費用 */}
            <div className="info-card">
              <div style={{ fontSize: 11, color: "#ff8080", letterSpacing: "0.15em", marginBottom: 16, textTransform: "uppercase" }}>
                // 月次コスト試算
              </div>
              {[
                { item: "レンタルサーバー", min: 1200, max: 1500 },
                { item: "ドメイン（月割）", min: 83, max: 125 },
                { item: "Claude API", min: 500, max: 3000 },
                { item: "Perplexity（任意）", min: 0, max: 2000 },
                { item: "WordPressテーマ（月割）", min: 0, max: 600 },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 13, color: "#aaa", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{c.item}</span>
                  <span style={{ fontSize: 13, color: "#ff8080", fontFamily: "'DM Mono', monospace" }}>
                    ¥{c.min.toLocaleString()} 〜 ¥{c.max.toLocaleString()}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(255,80,80,0.08)", borderRadius: 6, border: "1px solid rgba(255,80,80,0.2)" }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>月間合計（目安）</div>
                <div style={{ fontSize: 22, color: "#ff8080", fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                  ¥1,783 〜 ¥7,225 / 月
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 4, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
                  ※最小構成（Claude API + サーバー）なら月2,000円以下で運用可能
                </div>
              </div>
            </div>

            {/* 収益試算 */}
            <div className="info-card">
              <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: "0.15em", marginBottom: 16, textTransform: "uppercase" }}>
                // 収益ロードマップ（現実的試算）
              </div>
              {[
                { phase: "0〜3ヶ月", pv: "〜1,000PV/月", income: "0〜3,000円", action: "記事30本、SEO基盤構築", color: "#666" },
                { phase: "3〜6ヶ月", pv: "1,000〜5,000PV/月", income: "3,000〜20,000円", action: "アドセンス審査＋アフィリエイト開始", color: "#00D4FF" },
                { phase: "6〜12ヶ月", pv: "5,000〜20,000PV/月", income: "20,000〜80,000円", action: "検索上位記事を軸に収益記事強化", color: "#4ade80" },
                { phase: "1年〜", pv: "20,000PV+/月", income: "80,000〜200,000円+", action: "有料note・サブスク・スポンサー追加", color: "#fcd34d" },
              ].map((p, i) => (
                <div key={i} style={{
                  padding: "12px 14px", marginBottom: 8,
                  background: "rgba(255,255,255,0.02)", borderRadius: 6,
                  borderLeft: `3px solid ${p.color}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: p.color, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>{p.phase}</span>
                    <span style={{ fontSize: 14, color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>{p.income}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{p.pv} · {p.action}</div>
                </div>
              ))}
            </div>

            {/* ROI */}
            <div style={{ gridColumn: "1 / -1" }}>
              <div className="info-card" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.2)" }}>
                <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: "0.15em", marginBottom: 16, textTransform: "uppercase" }}>
                  // 費用対効果サマリー
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                  {[
                    { label: "損益分岐点", value: "月3〜5本の記事", sub: "アフィリエイト1件で黒字化" },
                    { label: "初期費用（最小）", value: "約20,000円", sub: "サーバー1年+ドメイン+テーマ" },
                    { label: "時間投資（AI活用後）", value: "週2〜3時間", sub: "テーマ選定+生成+投稿のみ" },
                    { label: "1年後期待ROI", value: "500〜2,000%", sub: "月10万円 ÷ 月5,000円コスト" },
                  ].map((m, i) => (
                    <div key={i} style={{ textAlign: "center", padding: 16 }}>
                      <div style={{ fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace", marginBottom: 6, letterSpacing: "0.1em" }}>{m.label}</div>
                      <div style={{ fontSize: 22, color: "#4ade80", fontFamily: "'DM Mono', monospace", fontWeight: 700, marginBottom: 4 }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: "#666", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                  <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, color: "#aaa", lineHeight: 1.8 }}>
                    <strong style={{ color: "#4ade80" }}>結論：</strong>
                    月2,000円以下の投資で始められ、6ヶ月継続すれば投資回収が現実的。
                    このシステムを使えば記事量産にかかる時間を<strong style={{ color: "#fff" }}>週10時間→2時間</strong>に圧縮できるため、
                    「時間コスト」を含めた実質ROIはさらに高くなります。
                    20代のうちにSEO資産（記事）を積み上げることで、<strong style={{ color: "#fcd34d" }}>複利的に収益が伸びる</strong>仕組みが作れます。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#333", fontFamily: "'DM Mono', monospace" }}>
            自分株式会社 © 2025 — Blog Automation Engine v2.0
          </span>
          <span style={{ fontSize: 10, color: "#333", fontFamily: "'DM Mono', monospace" }}>
            powered by Claude API (claude-sonnet-4)
          </span>
        </footer>
      </div>
    </div>
  );
}
