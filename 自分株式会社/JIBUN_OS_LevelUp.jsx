import { useState, useEffect, useRef, useCallback } from "react";
import { Send, RefreshCw, ChevronRight, ExternalLink, Terminal, FileText, Map, Wrench, DollarSign, BookOpen, LayoutDashboard, Target, TrendingUp, Briefcase, Star, CheckCircle, Circle, Plus, Trash2, Edit3 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

// ═══════════════════════════════════════════════════════════
// SYSTEM PROMPT - 26歳・年収300万→1000万を目指す人向け
// ═══════════════════════════════════════════════════════════
const BLOG_SYSTEM_PROMPT = `あなたは26歳の第二新卒・DX担当「Keigo」です。年収300万から本気でAIを使って年収1000万を目指しています。転職活動にもAIを活用し、副業ブログでも収益化中。同じ悩みを持つ20代に向けて書いています。

【ペルソナ詳細】
・26歳、2社目に転職、年収300万、都内勤務
・AIが得意で好き、コードは書けないがClaude/GASで自動化
・新NISA積立中、将来の結婚・子供も視野に入れ経済基盤を構築中
・ブログ・SNS・副業で収益化を目指しビルドインパブリックで公開中

【絶対守るルール】
・「失敗した」「損した」「稼げなかった」も正直に書く
・年収・資産・副業収入の数字を具体的に（推定でも）書く
・「26歳の自分が読みたかった記事」を書く意識
・専門用語は使うが必ず一言で解説
・最後に必ずアクション（読者が今日できること）を書く

【構成】
①共感の導入（26歳の等身大の悩み）
②AIエージェントを使った実践（Agent1: 調査、Agent2: コード、Agent3: 執筆）
③実際の成果と数字
④失敗・反省点（これが読者の信頼を生む）
⑤26歳へのメッセージ
⑥今日からできるアクション＋アフィリエイト

記事末尾に必ず:
<!-- meta: SEOメタ120字 -->
<!-- tags: タグ1,タグ2,タグ3,タグ4 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`;

const CAREER_ADVISOR_PROMPT = `あなたは26歳のAI活用人材の転職・副業戦略アドバイザーです。
相手は年収300万の第二新卒で、AIを武器に年収1000万を目指しています。
以下の観点で具体的かつ現実的なアドバイスをしてください：
・転職市場でのAI活用人材の実態と年収相場
・ポートフォリオの作り方・見せ方
・DX推進/AI活用ポジションへの転職戦略
・副業での収益化の現実的なロードマップ
・20代でやっておくべき具体的なアクション
回答は必ず箇条書きより具体的な数字・固有名詞・実践ステップで。`;

const SNS_POST_PROMPT = `あなたは26歳のAI活用系インフルエンサー「Keigo」です。
年収300万から本気でAIを使って年収1000万を目指す過程をSNSで公開しています。

【投稿スタイル】
・X(Twitter): 140字以内、最後に改行して関連ハッシュタグ2〜3個
・Threads: 200〜300字、ストーリー仕立て、読者の「わかる！」を引き出す
・LinkedIn: プロフェッショナルトーン、実績・数値・学び

【バズる投稿の型】
・「26歳、年収300万が〇〇してみた」系（等身大ビフォーアフター）
・「AIで〇〇分→〇〇分になった」系（時間削減の数字）
・「失敗した話：〇〇で〇万円損した」系（正直な失敗談）
・「転職活動にAIを使ったら〇〇だった」系（リアルな体験）

必ず読者が「保存したい」「シェアしたい」と思う価値を含めること。`;

// ── CONSTANTS ────────────────────────────────────────────
const SPREADSHEET_ID = "1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M";

const INCOME_PROJECTION = [
  { month: "今",    salary: 300, side: 0,  total: 300  },
  { month: "3ヶ月", salary: 300, side: 3,  total: 303  },
  { month: "6ヶ月", salary: 300, side: 8,  total: 308  },
  { month: "1年",   salary: 500, side: 15, total: 515  },
  { month: "1.5年", salary: 550, side: 25, total: 575  },
  { month: "2年",   salary: 650, side: 40, total: 690  },
  { month: "3年",   salary: 750, side: 80, total: 830  },
  { month: "4年",   salary: 800, side: 200,total: 1000 },
];

const SKILL_MAP = [
  { skill: "Claude/ChatGPT活用",     current: 85, target: 95, category: "AI", color: "#00D4FF" },
  { skill: "GAS/Python自動化",        current: 40, target: 80, category: "技術", color: "#10b981" },
  { skill: "ブログSEO",               current: 30, target: 75, category: "副業", color: "#f59e0b" },
  { skill: "SNS運用",                 current: 25, target: 70, category: "副業", color: "#f59e0b" },
  { skill: "転職活動/面接",           current: 50, target: 85, category: "転職", color: "#A855F7" },
  { skill: "ポートフォリオ作成",      current: 60, target: 90, category: "転職", color: "#A855F7" },
  { skill: "DXプロジェクト推進",      current: 35, target: 75, category: "技術", color: "#10b981" },
  { skill: "資産運用/NISA",          current: 45, target: 70, category: "財務", color: "#FF6B35" },
];

const WEEKLY_TASKS = [
  { id: "blog1",    cat: "ブログ",   text: "AI記事を2本生成してWordPressに下書き保存", priority: "high",   done: false },
  { id: "sns1",     cat: "SNS",    text: "X/Threadsに5投稿（AI自動生成→手直し）",     priority: "high",   done: false },
  { id: "skill1",   cat: "スキル",  text: "GASでなにか1つ業務を自動化して記録",        priority: "medium", done: false },
  { id: "career1",  cat: "転職",    text: "Wantedly/Greenで求人を5件チェック",         priority: "medium", done: false },
  { id: "invest1",  cat: "資産",    text: "新NISAの積立状況を確認・記録",               priority: "low",    done: false },
  { id: "portf1",   cat: "ポートフォリオ", text: "今週作ったものをREADME/ブログに記録", priority: "medium", done: false },
];

const AFFILIATE_LINKS = [
  { name: "Claude Pro",      url: "#", desc: "AI記事生成の中核ツール（月$20）",    category: "AI",   earning: "高" },
  { name: "Perplexity Pro",  url: "#", desc: "リサーチ自動化（月$20）",           category: "AI",   earning: "中" },
  { name: "ConoHa WING",     url: "#", desc: "ブログサーバー（月1,200円〜）",     category: "ブログ", earning: "中" },
  { name: "SBI証券",         url: "#", desc: "新NISA（口座開設で報酬発生）",      category: "投資",  earning: "高" },
  { name: "Cursor",          url: "#", desc: "AIコーディング（月$20）",           category: "AI",   earning: "中" },
  { name: "A8.net",          url: "#", desc: "高単価アフィリ（登録無料）",        category: "副業",  earning: "高" },
];

const SNS_PLATFORMS = [
  { id: "x",        label: "X (Twitter)", icon: "𝕏", color: "#1DA1F2", rgb: "29,161,242",  limit: "140字以内" },
  { id: "threads",  label: "Threads",     icon: "T", color: "#000000", rgb: "0,0,0",        limit: "500字以内" },
  { id: "linkedin", label: "LinkedIn",    icon: "in",color: "#0A66C2", rgb: "10,102,194",  limit: "プロ向け" },
  { id: "note",     label: "note",        icon: "n", color: "#41C9B4", rgb: "65,201,180",  limit: "記事形式" },
];

const BLOG_PRESETS = [
  { label: "転職×AI", topic: "AIを使った転職活動の全記録：26歳が年収300万から脱出を試みた話" },
  { label: "副業記録", topic: "ブログ副業を始めて3ヶ月：26歳の正直な収益報告と失敗まとめ" },
  { label: "NISA×AI", topic: "新NISAをAIで分析したら投資判断が変わった：26歳の実践記録" },
  { label: "自動化",   topic: "コードが書けない26歳がAIで業務を全自動化した方法" },
  { label: "スキル",   topic: "AIスキルが転職で武器になった実体験：DX人材の需要と年収相場" },
  { label: "生活設計", topic: "年収300万で結婚・子供を考えるための資産形成：26歳のリアルな計算" },
];

const PROG_STEPS = [
  [10,"Keigo ペルソナで生成中..."],
  [25,"Agent 1: 調査・分析..."],
  [40,"Agent 2: コード生成..."],
  [58,"Agent 3: 執筆・要約..."],
  [72,"失敗談・本音パートを追加中..."],
  [85,"SEO・アフィリエイト最適化..."],
  [94,"26歳へのメッセージを執筆中..."],
];

// ── HELPERS ─────────────────────────────────────────────
function parseArticle(raw) {
  const tM = raw.match(/^#\s+(.+)/m);
  const mM = raw.match(/<!--\s*meta:\s*([\s\S]*?)\s*-->/);
  const tgM = raw.match(/<!--\s*tags:\s*([\s\S]*?)\s*-->/);
  const aM = raw.match(/<!--\s*affiliate:\s*([\s\S]*?)\s*-->/);
  const body = raw.replace(/^#\s+.+\n?/m, "").replace(/<!--[\s\S]*?-->/g, "").trim();
  return {
    title: tM ? tM[1].trim() : "記事",
    meta: mM ? mM[1].trim() : "",
    tags: tgM ? tgM[1].trim().split(",").map(t => t.trim()) : [],
    affs: aM ? aM[1].trim().split(",").map(a => { const [n, d] = a.split("|"); return { name: n?.trim(), desc: d?.trim() }; }) : [],
    body, chars: body.replace(/[#*`\[\]\(\)\n]/g, "").length, raw,
  };
}

function inlineFmt(t) {
  return t
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff;font-weight:700">$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.5);padding:2px 5px;border-radius:3px;font-size:11px;color:#7ee787;font-family:monospace">$1</code>');
}

function MdView({ text, color = "#00D4FF" }) {
  if (!text) return null;
  const lines = text.split("\n");
  const els = []; let code = false, cl = [];
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (L.startsWith("```")) {
      if (code) {
        els.push(<pre key={i} style={{ background: "rgba(0,0,0,0.6)", padding: "12px 14px", borderRadius: 8, overflowX: "auto", margin: "10px 0", borderLeft: `3px solid ${color}`, fontSize: 11, lineHeight: 1.7 }}><code style={{ color: "#a5d6a7", fontFamily: "monospace" }}>{cl.join("\n")}</code></pre>);
        code = false; cl = [];
      } else code = true;
      continue;
    }
    if (code) { cl.push(L); continue; }
    if (L.startsWith("## ")) els.push(<h2 key={i} style={{ fontFamily: "sans-serif", fontSize: 17, fontWeight: 700, color, margin: "22px 0 10px", paddingBottom: 6, borderBottom: `1px solid ${color}33` }}>{L.replace("## ", "")}</h2>);
    else if (L.startsWith("### ")) els.push(<h3 key={i} style={{ fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, color: "#e8e8f0", margin: "14px 0 7px" }}>{L.replace("### ", "")}</h3>);
    else if (L.startsWith("- ") || L.startsWith("* ")) els.push(<div key={i} style={{ display: "flex", gap: 8, margin: "4px 0 4px 8px" }}><span style={{ color, flexShrink: 0 }}>›</span><p style={{ fontFamily: "sans-serif", fontSize: 13, lineHeight: 1.85, color: "#c8c8d8", margin: 0 }} dangerouslySetInnerHTML={{ __html: inlineFmt(L.replace(/^[-*]\s/, "")) }} /></div>);
    else if (L.trim() === "") els.push(<div key={i} style={{ height: 5 }} />);
    else els.push(<p key={i} style={{ fontFamily: "sans-serif", fontSize: 13, lineHeight: 1.85, color: "#c8c8d8", margin: "4px 0" }} dangerouslySetInnerHTML={{ __html: inlineFmt(L) }} />);
  }
  return <>{els}</>;
}

// ── CSS ──────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Zen+Kaku+Gothic+New:wght@300;400;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .fade-up { animation: fadeUp 0.22s ease; }
  .nav-btn { display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:7px;cursor:pointer;border:1px solid transparent;font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;color:#555;width:100%;background:transparent;transition:all 0.18s;text-align:left; }
  .nav-btn:hover { color:#aaa;background:rgba(255,255,255,0.03); }
  .nav-btn.active { color:#00D4FF;background:rgba(0,212,255,0.08);border-color:rgba(0,212,255,0.2); }
  .card { background:rgba(255,255,255,0.028);border:1px solid rgba(255,255,255,0.07);border-radius:11px;padding:16px 18px; }
  .ibox { width:100%;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);border-radius:7px;color:#e8e8f0;font-family:'Zen Kaku Gothic New',sans-serif;font-size:13px;resize:vertical; }
  .ibox:focus { outline:none;border-color:rgba(0,212,255,0.5); }
  .ibox::placeholder { color:rgba(255,255,255,0.2); }
  .gen-btn { width:100%;padding:14px;cursor:pointer;background:linear-gradient(135deg,rgba(0,212,255,0.14),rgba(0,212,255,0.07));border:1px solid rgba(0,212,255,0.4);border-radius:8px;color:#00D4FF;font-family:'Zen Kaku Gothic New',sans-serif;font-size:14px;font-weight:900;letter-spacing:0.07em;transition:all 0.2s; }
  .gen-btn:not(:disabled):hover { background:linear-gradient(135deg,rgba(0,212,255,0.22),rgba(0,212,255,0.14));transform:translateY(-1px); }
  .gen-btn:disabled { opacity:0.4;cursor:not-allowed; }
  .gen-btn.purple { background:linear-gradient(135deg,rgba(168,85,247,0.14),rgba(168,85,247,0.07));border-color:rgba(168,85,247,0.4);color:#A855F7; }
  .gen-btn.orange { background:linear-gradient(135deg,rgba(255,107,53,0.14),rgba(255,107,53,0.07));border-color:rgba(255,107,53,0.4);color:#FF6B35; }
  .pbar-inner { height:100%;background:linear-gradient(90deg,#00D4FF,rgba(0,212,255,0.5));border-radius:4px;transition:width 0.8s ease; }
  .cpbtn { padding:6px 12px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);border-radius:5px;background:transparent;color:#888;font-family:monospace;font-size:11px;transition:all 0.18s; }
  .cpbtn:hover { border-color:#fff;color:#fff; }
  .task-item { display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);margin-bottom:7px;cursor:pointer;transition:all 0.18s; }
  .task-item:hover { background:rgba(255,255,255,0.04); }
  .task-item.done { opacity:0.5; }
  .skill-row { margin-bottom:12px; }
  .skill-bar { height:5px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;margin-top:5px; }
  .pill { padding:2px 8px;border-radius:10px;font-size:10px;font-family:monospace; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07);border-radius:2px; }
`;

const NAV_ITEMS = [
  { id: "dashboard",  label: "司令部",          Icon: LayoutDashboard },
  { id: "roadmap",    label: "年収ロードマップ",  Icon: TrendingUp },
  { id: "blog",       label: "ブログ生成",        Icon: FileText },
  { id: "sns",        label: "SNS投稿生成",       Icon: Send },
  { id: "career",     label: "転職AIアドバイス",  Icon: Briefcase },
  { id: "portfolio",  label: "ポートフォリオ",    Icon: Star },
  { id: "preview",    label: "記事プレビュー",    Icon: BookOpen },
  { id: "tasks",      label: "今週のタスク",      Icon: Target },
  { id: "affiliate",  label: "アフィリエイト",    Icon: DollarSign },
];

// ── MAIN ─────────────────────────────────────────────────
export default function App() {
  const [page, setPage]         = useState("dashboard");
  // blog
  const [topic, setTopic]       = useState("");
  const [kw, setKw]             = useState("");
  const [loading, setLoading]   = useState(false);
  const [article, setArticle]   = useState(null);
  const [genErr, setGenErr]     = useState("");
  const [prog, setProg]         = useState(0);
  const [progLbl, setProgLbl]   = useState("");
  const [history, setHistory]   = useState([]);
  const [copied, setCopied]     = useState(false);
  // sns
  const [snsPlatform, setSnsPlatform] = useState("x");
  const [snsTheme, setSnsTheme]       = useState("");
  const [snsPost, setSnsPost]         = useState("");
  const [snsLoading, setSnsLoading]   = useState(false);
  // career
  const [careerQ, setCareerQ]   = useState("");
  const [careerA, setCareerA]   = useState("");
  const [careerLoading, setCareerLoading] = useState(false);
  const [careerHistory, setCareerHistory] = useState([]);
  // tasks
  const [tasks, setTasks]       = useState(WEEKLY_TASKS.map(t => ({ ...t })));
  const [newTask, setNewTask]   = useState("");
  const [newTaskCat, setNewTaskCat] = useState("ブログ");
  // kpi
  const [kpiIncome, setKpiIncome]   = useState(300);
  const [kpiSideIncome, setKpiSideIncome] = useState(0);
  const [kpiBlogPosts, setKpiBlogPosts] = useState(0);
  const [kpiFollowers, setKpiFollowers] = useState(0);

  const progRef = useRef(null);

  const startProg = useCallback((steps) => {
    let idx = 0;
    progRef.current = setInterval(() => {
      if (idx < steps.length) { setProg(steps[idx][0]); setProgLbl(steps[idx][1]); idx++; }
    }, 900);
  }, []);
  const stopProg = useCallback(() => {
    if (progRef.current) clearInterval(progRef.current);
    setProg(100); setProgLbl("完了！");
  }, []);

  // Generate blog
  const generateBlog = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true); setGenErr(""); setArticle(null); setProg(0); setProgLbl("Claude に接続中...");
    startProg(PROG_STEPS);
    const kwStr = kw.trim() ? `\nSEOキーワード: ${kw}` : "";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: BLOG_SYSTEM_PROMPT,
          messages: [{ role: "user", content: `テーマ: ${topic}${kwStr}\n全セクション（共感導入・AI実践・成果数字・失敗談・26歳へのメッセージ・アクション）を含め、Markdown形式で2000〜2800字で出力してください。` }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const parsed = parseArticle(raw);
      stopProg(); setArticle(parsed);
      setHistory(prev => [{ topic, parsed, ts: Date.now() }, ...prev.slice(0, 9)]);
      setKpiBlogPosts(p => p + 1);
      setPage("preview");
    } catch (e) { stopProg(); setGenErr("生成失敗: " + e.message); }
    finally { setLoading(false); }
  }, [topic, kw, startProg, stopProg]);

  // Generate SNS post
  const generateSNS = useCallback(async () => {
    if (!snsTheme.trim()) return;
    setSnsLoading(true); setSnsPost("");
    const platform = SNS_PLATFORMS.find(p => p.id === snsPlatform);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: SNS_POST_PROMPT,
          messages: [{ role: "user", content: `プラットフォーム: ${platform.label}（${platform.limit}）\nテーマ: ${snsTheme}\n\n投稿を3パターン生成してください。各パターンは「---」で区切ってください。` }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setSnsPost(data.content?.map(b => b.text || "").join("") || "");
    } catch (e) { setSnsPost("生成失敗: " + e.message); }
    finally { setSnsLoading(false); }
  }, [snsTheme, snsPlatform]);

  // Career advice
  const askCareer = useCallback(async () => {
    if (!careerQ.trim()) return;
    setCareerLoading(true);
    const q = careerQ; setCareerQ("");
    setCareerHistory(prev => [...prev, { role: "user", text: q }]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: CAREER_ADVISOR_PROMPT,
          messages: [...careerHistory.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: q }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const ans = data.content?.map(b => b.text || "").join("") || "";
      setCareerHistory(prev => [...prev, { role: "assistant", text: ans }]);
    } catch (e) { setCareerHistory(prev => [...prev, { role: "assistant", text: "エラー: " + e.message }]); }
    finally { setCareerLoading(false); }
  }, [careerQ, careerHistory]);

  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), cat: newTaskCat, text: newTask, priority: "medium", done: false }]);
    setNewTask("");
  };
  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const doneCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length;
  const weekPct = Math.round((doneCount / totalCount) * 100) || 0;

  const catColors = { "ブログ": "#00D4FF", "SNS": "#A855F7", "スキル": "#10b981", "転職": "#FF6B35", "資産": "#f59e0b", "ポートフォリオ": "#e879f9" };
  const priorityColors = { high: "#ff8080", medium: "#f59e0b", low: "#888" };

  return (
    <div style={{ minHeight: "100vh", background: "#06060f", color: "#e8e8f0", display: "flex", fontFamily: "'DM Mono', monospace" }}>
      <style>{CSS}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 200, background: "rgba(0,0,0,0.5)", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", padding: "16px 10px", flexShrink: 0, height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
        <div style={{ padding: "10px 6px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.18em", textTransform: "uppercase" }}>JIBUN-OS 年収1000万計画</span>
          </div>
          <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 16, fontWeight: 900, color: "#fff" }}>
            自分<span style={{ color: "#00D4FF" }}>株式</span>会社
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>26歳 / ¥300万 → ¥1000万</div>
        </div>
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button key={id} className={`nav-btn ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
              <Icon size={13} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span style={{ fontSize: 11 }}>{label}</span>
              {page === id && <ChevronRight size={10} style={{ marginLeft: "auto", opacity: 0.4 }} />}
            </button>
          ))}
        </nav>
        {/* Week progress */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12, marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: "#4ade80" }}>今週の達成率</span>
            <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>{weekPct}%</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${weekPct}%`, background: "linear-gradient(90deg,#00D4FF,#4ade80)", borderRadius: 4, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontSize: 9, color: "#555", marginTop: 4 }}>{doneCount}/{totalCount} タスク完了</div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflowY: "auto", padding: "24px 22px" }}>

        {/* ═══ DASHBOARD ═══════════════════════════════════════════════════════ */}
        {page === "dashboard" && (
          <div className="fade-up">
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// CEO Dashboard</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
                26歳の<span style={{ color: "#00D4FF" }}>本気の</span>司令部
              </h2>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>年収300万 → 1000万｜今日も1mm前進する</p>
            </div>

            {/* KPI input area */}
            <div className="card" style={{ marginBottom: 16, border: "1px solid rgba(0,212,255,0.2)" }}>
              <div style={{ fontSize: 9, color: "#00D4FF", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>// 今月のKPI（自分で入力・更新）</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "本業年収（万円）", val: kpiIncome, set: setKpiIncome, color: "#00D4FF" },
                  { label: "副業月収（万円）", val: kpiSideIncome, set: setKpiSideIncome, color: "#10b981" },
                  { label: "累計記事数", val: kpiBlogPosts, set: setKpiBlogPosts, color: "#f59e0b" },
                  { label: "SNSフォロワー", val: kpiFollowers, set: setKpiFollowers, color: "#A855F7" },
                ].map((k, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 14px", borderBottom: `2px solid ${k.color}` }}>
                    <div style={{ fontSize: 9, color: "#666", marginBottom: 6 }}>{k.label}</div>
                    <input type="number" value={k.val}
                      onChange={e => k.set(Number(e.target.value))}
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 22, fontWeight: 900, color: k.color, fontFamily: "'DM Mono', monospace" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Today's priority */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div className="card">
                <div style={{ fontSize: 9, color: "#ff8080", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>// 今日絶対やること TOP3</div>
                {tasks.filter(t => t.priority === "high").slice(0, 3).map((t, i) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }} onClick={() => toggleTask(t.id)}>
                    {t.done ? <CheckCircle size={16} style={{ color: "#4ade80", flexShrink: 0 }} /> : <Circle size={16} style={{ color: "#555", flexShrink: 0 }} />}
                    <span style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12, color: t.done ? "#555" : "#ddd", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                    <span style={{ marginLeft: "auto", fontSize: 9, padding: "1px 6px", borderRadius: 8, background: `${catColors[t.cat] || "#555"}22`, color: catColors[t.cat] || "#555", flexShrink: 0 }}>{t.cat}</span>
                  </div>
                ))}
                <button className="gen-btn" style={{ marginTop: 12, fontSize: 12 }} onClick={() => setPage("tasks")}>全タスクを見る →</button>
              </div>

              <div className="card">
                <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>// 26歳の現在地チェック</div>
                {[
                  { label: "年収目標達成率", current: kpiIncome, target: 1000, unit: "万円" },
                  { label: "副業月収目標", current: kpiSideIncome, target: 30, unit: "万円" },
                  { label: "ブログ記事目標", current: kpiBlogPosts, target: 100, unit: "本" },
                ].map((m, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{m.label}</span>
                      <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace" }}>{m.current}/{m.target}{m.unit}</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, (m.current / m.target) * 100)}%`, background: "#4ade80", borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(74,222,128,0.06)", borderRadius: 7, border: "1px solid rgba(74,222,128,0.2)" }}>
                  <div style={{ fontSize: 12, color: "#4ade80", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700 }}>
                    合計年収（推定）: {(kpiIncome + kpiSideIncome * 12).toLocaleString()}万円
                  </div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>本業{kpiIncome}万 + 副業{kpiSideIncome * 12}万（月{kpiSideIncome}万×12）</div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="card">
              <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>// ワンクリックで始める</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {[
                  { icon: "✍️", label: "ブログを書く", sub: "AI記事を今すぐ生成", action: () => setPage("blog"), color: "#00D4FF" },
                  { icon: "📱", label: "SNS投稿を作る", sub: "3パターン自動生成", action: () => setPage("sns"), color: "#A855F7" },
                  { icon: "💼", label: "転職相談", sub: "AIアドバイザーに聞く", action: () => setPage("career"), color: "#FF6B35" },
                  { icon: "🗺️", label: "ロードマップ確認", sub: "今どこにいるか確認", action: () => setPage("roadmap"), color: "#10b981" },
                ].map((a, i) => (
                  <div key={i} onClick={a.action} style={{ padding: "14px", background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 10, cursor: "pointer", transition: "all 0.18s", borderBottom: `2px solid ${a.color}` }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
                    <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, color: "#fff", fontWeight: 700, marginBottom: 3 }}>{a.label}</div>
                    <div style={{ fontSize: 10, color: "#666", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{a.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ROADMAP ════════════════════════════════════════════════════════ */}
        {page === "roadmap" && (
          <div className="fade-up">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// Income Roadmap</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                年収<span style={{ color: "#00D4FF" }}>1000万</span>へのロードマップ
              </h2>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>本業転職 + 副業の2軸で4年以内に達成する計画</p>
            </div>

            {/* Income chart */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>// 年収推移シミュレーション（本業+副業）</div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={INCOME_PROJECTION} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gSalary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSide" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: "#666", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#666", fontSize: 10 }} tickFormatter={v => `${v}万`} />
                    <Tooltip formatter={(v, n) => [`${v}万円`, n === "salary" ? "本業" : n === "side" ? "副業×12" : "合計"]} contentStyle={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="total" stroke="#4ade80" fill="url(#gSide)" strokeWidth={2} name="合計" />
                    <Area type="monotone" dataKey="salary" stroke="#00D4FF" fill="url(#gSalary)" strokeWidth={2} name="本業" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Phases */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              {[
                {
                  phase: "Phase 1", duration: "今〜6ヶ月", color: "#00D4FF", rgb: "0,212,255",
                  goal: "基盤構築", income: "本業300万 + 副業月3〜8万",
                  actions: ["ブログを週2〜3本書く", "X/Threadsを毎日投稿", "GASで1つ業務自動化", "転職市場のリサーチ開始", "スキルをJIBUN-OSで公開"]
                },
                {
                  phase: "Phase 2", duration: "6ヶ月〜1.5年", color: "#A855F7", rgb: "168,85,247",
                  goal: "転職＋副業軌道乗せ", income: "本業500〜650万 + 副業月15〜25万",
                  actions: ["DX推進/AI活用で転職", "ブログ収益月10万超え", "SNS1万フォロワー達成", "有料note/コンテンツ販売", "副業で受託案件を取る"]
                },
                {
                  phase: "Phase 3", duration: "1.5年〜4年", color: "#10b981", rgb: "16,185,129",
                  goal: "複合収入で1000万", income: "本業750〜800万 + 副業月40〜80万",
                  actions: ["再度転職で年収アップ", "ブログ月20〜30万安定", "SNS影響力で案件獲得", "結婚・子供資金の確保", "FIRE/経済的独立を視野"]
                },
              ].map((ph, i) => (
                <div key={i} className="card" style={{ borderTop: `3px solid ${ph.color}` }}>
                  <div style={{ fontSize: 10, color: ph.color, fontFamily: "monospace", marginBottom: 6 }}>{ph.phase} · {ph.duration}</div>
                  <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{ph.goal}</div>
                  <div style={{ fontSize: 11, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif", marginBottom: 10, lineHeight: 1.6 }}>{ph.income}</div>
                  {ph.actions.map((a, j) => (
                    <div key={j} style={{ display: "flex", gap: 7, padding: "4px 0", borderBottom: j < ph.actions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ color: ph.color, fontSize: 10, flexShrink: 0 }}>›</span>
                      <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{a}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Skills to develop */}
            <div className="card">
              <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 14, textTransform: "uppercase" }}>// スキルギャップ分析（現在値 → 目標値）</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {SKILL_MAP.map((s, i) => (
                  <div key={i} className="skill-row">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: `${s.color}22`, color: s.color, fontFamily: "monospace" }}>{s.category}</span>
                        <span style={{ fontSize: 12, color: "#ddd", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{s.skill}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "#666", fontFamily: "monospace" }}>{s.current}→{s.target}</span>
                    </div>
                    <div className="skill-bar">
                      <div style={{ height: "100%", display: "flex" }}>
                        <div style={{ width: `${s.current}%`, background: s.color, borderRadius: "4px 0 0 4px", opacity: 0.9 }} />
                        <div style={{ width: `${s.target - s.current}%`, background: `${s.color}44`, borderRadius: "0 4px 4px 0" }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>ギャップ: {s.target - s.current}ポイント</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ BLOG ════════════════════════════════════════════════════════════ */}
        {page === "blog" && (
          <div className="fade-up">
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// Blog Engine (26歳ペルソナ)</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                AIブログ生成
              </h2>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>26歳・年収300万のリアルな等身大視点で書く</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>// プリセットテーマ</div>
                  {BLOG_PRESETS.map((pr, i) => (
                    <button key={i} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, cursor: "pointer", marginBottom: 6, transition: "all 0.18s", color: "#aaa", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 11, textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#00D4FF"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                      onClick={() => setTopic(pr.topic)}>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 6, background: "rgba(0,212,255,0.1)", color: "#00D4FF", flexShrink: 0 }}>{pr.label}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.topic}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 7, textTransform: "uppercase" }}>// 記事テーマ</div>
                  <textarea className="ibox" rows={4} placeholder="テーマを自由入力..." value={topic} onChange={e => setTopic(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 6, textTransform: "uppercase" }}>// SEOキーワード（任意）</div>
                  <input className="ibox" placeholder="例：AI 転職 26歳, 年収アップ 方法" value={kw} onChange={e => setKw(e.target.value)} />
                </div>
                <button className="gen-btn" onClick={generateBlog} disabled={loading || !topic.trim()}>
                  {loading ? "生成中..." : "▶ 26歳ペルソナで記事生成"}
                </button>
                {loading && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: "#00D4FF", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{progLbl}</span>
                      <span style={{ fontSize: 11, color: "#555" }}>{prog}%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                      <div className="pbar-inner" style={{ width: `${prog}%` }} />
                    </div>
                  </div>
                )}
                {genErr && <div style={{ padding: 10, borderRadius: 7, background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.25)", color: "#ff8080", fontSize: 12 }}>⚠ {genErr}</div>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <div className="card" style={{ border: "1px solid rgba(0,212,255,0.15)" }}>
                  <div style={{ fontSize: 9, color: "#00D4FF", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>// このペルソナで書く</div>
                  <div style={{ color: "#00D4FF", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Keigo / 26歳 / 第二新卒 / 年収300万</div>
                  {["今の年収に危機感あり、でも行動してる", "AIが得意・好き、コードは書けないが自動化得意", "新NISA積立中、将来の結婚を視野に経済基盤構築中", "失敗・損失も全部正直に公開するスタイル", "同じ悩みを持つ20代に「自分もできる」と伝えたい"].map((t, i) => (
                    <div key={i} style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 11, color: "#888", padding: "4px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>· {t}</div>
                  ))}
                </div>

                {history.length > 0 && (
                  <div className="card">
                    <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>// 生成履歴（{history.length}本）</div>
                    {history.slice(0, 5).map((h, i) => (
                      <div key={i} style={{ padding: "7px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}
                        onClick={() => { setArticle(h.parsed); setPage("preview"); }}>
                        <div style={{ fontSize: 11, color: "#00D4FF", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.parsed.title}</div>
                        <div style={{ fontSize: 9, color: "#444", fontFamily: "monospace" }}>{new Date(h.ts).toLocaleString("ja-JP")} · {h.parsed.chars.toLocaleString()}字</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SNS ═════════════════════════════════════════════════════════════ */}
        {page === "sns" && (
          <div className="fade-up">
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// SNS Post Generator</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                SNS投稿<span style={{ color: "#A855F7" }}>自動生成</span>
              </h2>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>3パターン生成 → 選んで投稿するだけ</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Platform selector */}
                <div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>// プラットフォーム</div>
                  {SNS_PLATFORMS.map(pl => (
                    <button key={pl.id}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", background: snsPlatform === pl.id ? `rgba(${pl.rgb},0.1)` : "rgba(255,255,255,0.02)", border: `1px solid ${snsPlatform === pl.id ? pl.color : "rgba(255,255,255,0.07)"}`, borderRadius: 7, cursor: "pointer", marginBottom: 6, transition: "all 0.18s", color: snsPlatform === pl.id ? pl.color : "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12 }}
                      onClick={() => setSnsPlatform(pl.id)}>
                      <span style={{ width: 24, height: 24, borderRadius: 5, background: `rgba(${pl.rgb},0.15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{pl.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>{pl.label}</div>
                        <div style={{ fontSize: 9 }}>{pl.limit}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 7, textTransform: "uppercase" }}>// 投稿テーマ</div>
                  <textarea className="ibox" rows={3} placeholder="例：AIで業務効率化した話、新NISAの近況、転職活動のリアル..." value={snsTheme} onChange={e => setSnsTheme(e.target.value)} />
                </div>

                {/* Quick theme presets */}
                <div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 7, textTransform: "uppercase" }}>// テーマプリセット</div>
                  {["今週AIで時短できたこと", "転職活動の最新状況報告", "副業ブログの収益報告（正直に）", "26歳が新NISAを続けた結果", "失敗した話：〇〇でつまずいた"].map((pr, i) => (
                    <button key={i} style={{ display: "block", width: "100%", padding: "6px 10px", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, cursor: "pointer", marginBottom: 5, color: "#777", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 11, textAlign: "left", transition: "all 0.18s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#A855F7"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                      onClick={() => setSnsTheme(pr)}>→ {pr}</button>
                  ))}
                </div>

                <button className="gen-btn purple" onClick={generateSNS} disabled={snsLoading || !snsTheme.trim()}>
                  {snsLoading ? "生成中..." : "▶ 投稿を3パターン生成"}
                </button>
              </div>

              {/* Output */}
              <div>
                {!snsPost && !snsLoading && (
                  <div style={{ height: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 10, color: "#444" }}>
                    <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>📱</div>
                    <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13 }}>テーマを入力して生成してください</div>
                  </div>
                )}
                {snsLoading && (
                  <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 10 }}>
                    <div style={{ fontSize: 13, color: "#A855F7", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>3パターンを生成中...</div>
                  </div>
                )}
                {snsPost && !snsLoading && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#555" }}>3パターン生成完了 — 選んで使ってください</div>
                      <button className="cpbtn" onClick={() => { navigator.clipboard.writeText(snsPost); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                        {copied ? "✓ コピー済" : "全コピー"}
                      </button>
                    </div>
                    {snsPost.split("---").map((variant, i) => (
                      variant.trim() && (
                        <div key={i} style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 10, color: "#A855F7", fontFamily: "monospace" }}>パターン {i + 1}</span>
                            <button className="cpbtn" onClick={() => navigator.clipboard.writeText(variant.trim())}>コピー</button>
                          </div>
                          <pre style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, color: "#ddd", lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>{variant.trim()}</pre>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ CAREER ADVISOR ═══════════════════════════════════════════════════ */}
        {page === "career" && (
          <div className="fade-up">
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// AI Career Advisor</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                転職<span style={{ color: "#FF6B35" }}>AIアドバイス</span>
              </h2>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>年収1000万への転職戦略をAIが具体的に回答</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0,1fr)", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <div className="card" style={{ border: "1px solid rgba(255,107,53,0.2)" }}>
                  <div style={{ fontSize: 9, color: "#FF6B35", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>// あなたのプロフィール</div>
                  {[{ k: "年齢", v: "26歳" }, { k: "転職回数", v: "1回（2社目）" }, { k: "現在年収", v: "300万円" }, { k: "強み", v: "AI活用・業務自動化" }, { k: "目標年収", v: "500〜1000万円" }].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{r.k}</span>
                      <span style={{ fontSize: 11, color: "#FF6B35", fontFamily: "monospace" }}>{r.v}</span>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>// よく聞く質問</div>
                  {["AI活用人材の年収相場を教えて", "DX推進職への転職に必要なスキルは", "26歳・第二新卒で転職するベストタイミングは", "ポートフォリオに何を入れるべきか", "面接でAI活用実績をどう伝えるか", "副業と本業を両立する戦略は"].map((q, i) => (
                    <button key={i} style={{ display: "block", width: "100%", padding: "6px 10px", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, cursor: "pointer", marginBottom: 5, color: "#777", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 11, textAlign: "left", transition: "all 0.18s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#FF6B35"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                      onClick={() => setCareerQ(q)}>→ {q}</button>
                  ))}
                </div>
              </div>

              {/* Chat area */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden", flex: 1 }}>
                  <div style={{ background: "rgba(255,107,53,0.08)", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#FF6B35", fontFamily: "monospace" }}>転職 AI アドバイザー（年収1000万特化）</span>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 1.5s ease-in-out infinite" }} />
                  </div>
                  <div style={{ height: 380, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {careerHistory.length === 0 && (
                      <div style={{ color: "#444", fontSize: 12, textAlign: "center", marginTop: 60, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>
                        転職・副業・年収アップについて何でも聞いてください<br />
                        <span style={{ fontSize: 10, color: "#333" }}>← 左のよく聞く質問から選ぶとすぐ使えます</span>
                      </div>
                    )}
                    {careerHistory.map((m, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "88%", borderRadius: 8, padding: "8px 12px", fontSize: 12, lineHeight: 1.7, fontFamily: "'Zen Kaku Gothic New', sans-serif", background: m.role === "user" ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.05)", color: m.role === "user" ? "#FF6B35" : "#ddd", border: `1px solid ${m.role === "user" ? "rgba(255,107,53,0.3)" : "rgba(255,255,255,0.07)"}` }}>
                          <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}>{m.text}</pre>
                        </div>
                      </div>
                    ))}
                    {careerLoading && (
                      <div style={{ display: "flex", justifyContent: "flex-start" }}>
                        <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 12, color: "#FF6B35" }}>考え中...</div>
                      </div>
                    )}
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "9px 11px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
                    <input value={careerQ} onChange={e => setCareerQ(e.target.value)} onKeyDown={e => e.key === "Enter" && askCareer()}
                      placeholder="転職・副業・年収についてなんでも..."
                      style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, padding: "8px 12px", color: "#e8e8f0", fontSize: 12, fontFamily: "'Zen Kaku Gothic New', sans-serif", outline: "none" }} />
                    <button onClick={askCareer} disabled={!careerQ.trim() || careerLoading}
                      style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(255,107,53,0.4)", background: "rgba(255,107,53,0.1)", color: "#FF6B35", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, opacity: (!careerQ.trim() || careerLoading) ? 0.4 : 1 }}>
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PORTFOLIO ════════════════════════════════════════════════════════ */}
        {page === "portfolio" && (
          <div className="fade-up">
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// Portfolio Builder</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                あなたの<span style={{ color: "#f59e0b" }}>ポートフォリオ</span>
              </h2>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>転職で差をつける「AI活用実績」の可視化</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {[
                {
                  title: "JIBUN-OS", tag: "Webアプリ", tech: "React + Claude API", desc: "26歳が年収1000万を目指して構築した経営OS。ブログ自動生成・SNS投稿・転職相談・KPI管理を統合。", impact: "記事生成時間 90%削減", color: "#00D4FF"
                },
                {
                  title: "AIブログ自動化システム", tag: "自動化", tech: "Claude API + WordPress REST API + GAS", desc: "SEO記事を週3本自動生成してWordPressに自動投稿。アフィリエイト導線も自動挿入。", impact: "月30本→維持しながら時間ゼロ化", color: "#A855F7"
                },
                {
                  title: "SNS投稿自動化ワークフロー", tag: "自動化", tech: "Claude API + Threads/X API", desc: "ブログ記事からSNS投稿を3パターン自動生成。週5投稿を自動化し影響力を構築中。", impact: "SNS運用時間 80%削減", color: "#10b981"
                },
                {
                  title: "業務効率化GASスクリプト集", tag: "業務改善", tech: "Google Apps Script + Claude API", desc: "営業日報自動生成・会議資料作成・Slack通知など社内業務を多数自動化した実績。", impact: "チームの残業 週5時間削減", color: "#FF6B35"
                },
              ].map((pf, i) => (
                <div key={i} className="card" style={{ borderTop: `2px solid ${pf.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 15, fontWeight: 900, color: "#fff" }}>{pf.title}</div>
                    <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 8, background: `${pf.color}22`, color: pf.color, fontFamily: "monospace", flexShrink: 0, marginLeft: 8 }}>{pf.tag}</span>
                  </div>
                  <div style={{ fontSize: 10, color: pf.color, fontFamily: "monospace", marginBottom: 8 }}>{pf.tech}</div>
                  <div style={{ fontSize: 12, color: "#aaa", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.7, marginBottom: 10 }}>{pf.desc}</div>
                  <div style={{ padding: "7px 10px", background: `${pf.color}11`, border: `1px solid ${pf.color}33`, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>インパクト</div>
                    <div style={{ fontSize: 12, color: pf.color, fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700 }}>✓ {pf.impact}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
              <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>// 転職・副業での使い方（面接・クライアント向け）</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {[
                  { icon: "💼", title: "転職面接", points: ["「AIで業務を何%効率化した」と数値で答える", "JIBUN-OSをデモしながら説明する", "「個人でこれを作れる=社内でも再現できる」"] },
                  { icon: "💰", title: "副業受託", points: ["企業のAI活用コンサルとして売れる", "GAS自動化ツール作成の受注", "AI活用研修・セミナー講師として登壇"] },
                  { icon: "📱", title: "SNS集客", points: ["「このシステム作りました」で話題になる", "ビルドインパブリックで過程を公開", "同世代の共感を集めてフォロワー増加"] },
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "14px" }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{item.title}</div>
                    {item.points.map((pt, j) => (
                      <div key={j} style={{ display: "flex", gap: 7, marginBottom: 5 }}>
                        <span style={{ color: "#f59e0b", flexShrink: 0, fontSize: 11 }}>›</span>
                        <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.6 }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ PREVIEW ═════════════════════════════════════════════════════════ */}
        {page === "preview" && (
          <div className="fade-up">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// Article Preview</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>記事プレビュー</h2>
            </div>
            {!article ? (
              <div style={{ height: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 11, color: "#444" }}>
                <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>📄</div>
                <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, marginBottom: 12 }}>まだ記事が生成されていません</div>
                <button style={{ padding: "8px 18px", cursor: "pointer", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6, color: "#00D4FF", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12 }} onClick={() => setPage("blog")}>→ ブログ生成へ</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 240px", gap: 18, alignItems: "start" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                    <h1 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.4 }}>{article.title}</h1>
                    <button className="cpbtn" style={{ flexShrink: 0 }} onClick={() => { navigator.clipboard.writeText(article.raw); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                      {copied ? "✓ コピー済" : "MDコピー"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {[{ k: "文字数", v: article.chars.toLocaleString() + "字" }, { k: "読了時間", v: Math.ceil(article.chars / 500) + "分" }, { k: "SEO", v: article.meta ? "✓" : "—" }].map(s => (
                      <div key={s.k} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "8px 10px" }}>
                        <div style={{ fontSize: 9, color: "#555", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 3 }}>{s.k}</div>
                        <div style={{ fontSize: 13, color: "#00D4FF", fontFamily: "monospace" }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px 22px", maxHeight: "68vh", overflowY: "auto" }}>
                    <MdView text={article.body} color="#00D4FF" />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {article.meta && (<div className="card"><div style={{ fontSize: 9, color: "#555", marginBottom: 6, textTransform: "uppercase" }}>// SEOメタ</div><p style={{ fontSize: 11, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.7 }}>{article.meta}</p></div>)}
                  {article.tags.length > 0 && (<div className="card"><div style={{ fontSize: 9, color: "#555", marginBottom: 8, textTransform: "uppercase" }}>// タグ</div><div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{article.tags.map((t, i) => (<span key={i} style={{ padding: "2px 8px", borderRadius: 11, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", fontSize: 10, color: "#00D4FF", fontFamily: "monospace" }}>{t}</span>))}</div></div>)}
                  {article.affs.length > 0 && (<div style={{ background: "rgba(255,200,50,0.05)", border: "1px solid rgba(255,200,50,0.15)", borderRadius: 10, padding: "12px 14px" }}><div style={{ fontSize: 9, color: "#888", marginBottom: 8, textTransform: "uppercase" }}>💰 アフィリエイト</div>{article.affs.map((a, i) => (<div key={i} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: i < article.affs.length - 1 ? "1px solid rgba(255,200,50,0.1)" : "none" }}><div style={{ fontSize: 12, color: "#fcd34d", fontWeight: 700, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{a.name}</div>{a.desc && <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>{a.desc}</div>}</div>))}</div>)}
                  <div className="card"><div style={{ fontSize: 9, color: "#555", marginBottom: 8, textTransform: "uppercase" }}>// WP投稿</div>{["MDコピー", "新規投稿→コードエディタに貼付け", "アイキャッチ画像を設定", "アフィリエイトリンク挿入", "公開orスケジュール"].map((s, i) => (<div key={i} style={{ display: "flex", gap: 7, padding: "4px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}><span style={{ color: "#00D4FF", fontSize: 10, fontFamily: "monospace" }}>{i + 1}.</span><span style={{ fontSize: 11, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{s}</span></div>))}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TASKS ════════════════════════════════════════════════════════════ */}
        {page === "tasks" && (
          <div className="fade-up">
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// Weekly Task Manager</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                今週の<span style={{ color: "#4ade80" }}>タスク管理</span>
              </h2>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>達成率: {weekPct}%（{doneCount}/{totalCount}完了）</p>
            </div>

            {/* Add task */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <select value={newTaskCat} onChange={e => setNewTaskCat(e.target.value)}
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "9px 12px", color: "#00D4FF", fontSize: 12, fontFamily: "monospace", outline: "none", flexShrink: 0 }}>
                {["ブログ", "SNS", "スキル", "転職", "資産", "ポートフォリオ", "その他"].map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()}
                placeholder="新しいタスクを追加..."
                style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, padding: "9px 12px", color: "#e8e8f0", fontSize: 12, fontFamily: "'Zen Kaku Gothic New', sans-serif", outline: "none" }} />
              <button onClick={addTask} style={{ padding: "9px 16px", borderRadius: 6, border: "1px solid rgba(74,222,128,0.4)", background: "rgba(74,222,128,0.1)", color: "#4ade80", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                <Plus size={14} /> 追加
              </button>
            </div>

            {/* Tasks by category */}
            {["ブログ", "SNS", "スキル", "転職", "資産", "ポートフォリオ", "その他"].map(cat => {
              const catTasks = tasks.filter(t => t.cat === cat);
              if (catTasks.length === 0) return null;
              return (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: catColors[cat] || "#555" }} />
                    <span style={{ fontSize: 11, color: catColors[cat] || "#555", fontFamily: "monospace", letterSpacing: "0.1em" }}>{cat.toUpperCase()}</span>
                    <span style={{ fontSize: 9, color: "#444" }}>{catTasks.filter(t => t.done).length}/{catTasks.length}</span>
                  </div>
                  {catTasks.map(t => (
                    <div key={t.id} className={`task-item ${t.done ? "done" : ""}`} style={{ borderLeft: `3px solid ${catColors[t.cat] || "#555"}` }}>
                      <div onClick={() => toggleTask(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                        {t.done ? <CheckCircle size={16} style={{ color: "#4ade80", flexShrink: 0 }} /> : <Circle size={16} style={{ color: "#555", flexShrink: 0 }} />}
                        <span style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12, color: t.done ? "#555" : "#ddd", textDecoration: t.done ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.text}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: `${priorityColors[t.priority]}22`, color: priorityColors[t.priority] }}>{t.priority}</span>
                        <button onClick={() => deleteTask(t.id)} style={{ background: "transparent", border: "none", color: "#444", cursor: "pointer", padding: 2 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ AFFILIATE ════════════════════════════════════════════════════════ */}
        {page === "affiliate" && (
          <div className="fade-up">
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// Affiliate Dashboard</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                アフィリエイト<span style={{ color: "#fcd34d" }}>管理</span>
              </h2>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>月10万円を目指すアフィリエイト戦略</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
              {AFFILIATE_LINKS.map((af, i) => (
                <div key={i} className="card" style={{ borderBottom: `2px solid ${af.earning === "高" ? "#fcd34d" : af.earning === "中" ? "#00D4FF" : "#555"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>{af.name}</div>
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: af.earning === "高" ? "rgba(252,211,77,0.15)" : "rgba(0,212,255,0.1)", color: af.earning === "高" ? "#fcd34d" : "#00D4FF", fontFamily: "monospace", flexShrink: 0, marginLeft: 6 }}>単価{af.earning}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace", marginBottom: 6 }}>{af.category}</div>
                  <div style={{ fontSize: 12, color: "#aaa", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.6, marginBottom: 10 }}>{af.desc}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" }}>登録サイトへ →</button>
                    <button style={{ flex: 1, padding: "6px", borderRadius: 6, border: "1px solid rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.07)", color: "#00D4FF", fontSize: 11, cursor: "pointer" }}
                      onClick={() => setTopic(`${af.name}を使って業務を効率化した実体験レビュー`); setPage("blog")}>
                      記事を書く
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ background: "rgba(252,211,77,0.04)", border: "1px solid rgba(252,211,77,0.2)" }}>
              <div style={{ fontSize: 9, color: "#fcd34d", letterSpacing: "0.12em", marginBottom: 14, textTransform: "uppercase" }}>// 月10万円達成のロードマップ</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                {[
                  { period: "0〜3ヶ月", target: "月1〜3万", action: "記事30本書いてアドセンス審査通過", color: "#555" },
                  { period: "3〜6ヶ月", target: "月3〜5万", action: "証券口座・AIツールのアフィリ開始", color: "#00D4FF" },
                  { period: "6〜12ヶ月", target: "月5〜10万", action: "高単価アフィリ（SaaS・金融）を強化", color: "#4ade80" },
                  { period: "1年〜",    target: "月10〜30万", action: "有料note・受託・情報商材を追加", color: "#fcd34d" },
                ].map((r, i) => (
                  <div key={i} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: `3px solid ${r.color}` }}>
                    <div style={{ fontSize: 10, color: r.color, fontFamily: "monospace", marginBottom: 4 }}>{r.period}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "'Zen Kaku Gothic New', sans-serif", marginBottom: 6 }}>{r.target}</div>
                    <div style={{ fontSize: 11, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.6 }}>{r.action}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12, color: "#aaa", lineHeight: 1.85 }}>
                  <strong style={{ color: "#fcd34d" }}>キーインサイト：</strong>アフィリエイトの核は「信頼」。26歳の等身大の失敗談・数字の正直な公開が、同世代の読者の「買いたい」を生む。このJIBUN-OSを「自分が使って成果が出たツール」として紹介することが最も高い転換率につながる。
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
