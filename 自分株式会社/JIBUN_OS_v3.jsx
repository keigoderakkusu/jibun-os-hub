import { useState, useEffect, useRef, useCallback } from "react";
import { Send, RefreshCw, ChevronRight, CircleDashed, CheckCircle2, ExternalLink, Terminal, FileText, Map, Wrench, DollarSign, BookOpen, LayoutDashboard } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ── CONSTANTS (NO JSX HERE) ──────────────────────────────────────────────────
const SPREADSHEET_ID = "1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M";

const PERSONAS = {
  ai_work: {
    id: "ai_work", label: "AI実務・自動化", icon: "⚡", color: "#00D4FF", rgb: "0,212,255",
    prompt: `あなたは25歳の営業DX担当者「Keigo」です。GAS・Python・AIエージェントを使って業務効率化を実践しています。読者は「AIに興味はあるが使いこなせていない20代ビジネスパーソン」です。トーン：丁寧すぎず、実体験ベースの等身大な語り口。構成：①なぜ必要か→②Agent1調査→③Agent2コード→④Agent3執筆→⑤20代へのメッセージ→⑥アクション。記事末尾に必ず: <!-- meta: SEOメタ120字 --> <!-- tags: タグ1,タグ2,タグ3 --> <!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: ["GASでSlack通知を自動化した話", "AIエージェントを部下として使いこなす方法", "Cursorを使えばコードが書けなくても自動化できる", "ChatGPT APIをExcelに繋いだら会議資料が10分で完成"],
  },
  qol_tech: {
    id: "qol_tech", label: "20代QOL×テック", icon: "🎯", color: "#FF6B35", rgb: "255,107,53",
    prompt: `あなたは投資・ガジェット・カメラが趣味の25歳「Keigo」です。新NISA・ヴィンテージ品・ZV-E10を使ったVlogも発信しています。読者は「お金と趣味を賢く両立したい20代」です。トーン：友人に話しかけるような親しみやすさ。失敗談も正直に書く。構成：①なぜ必要か→②Agent1調査→③Agent2コード→④Agent3執筆→⑤20代へのメッセージ→⑥アクション。記事末尾に必ず: <!-- meta: SEOメタ120字 --> <!-- tags: タグ1,タグ2,タグ3 --> <!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: ["新NISAを半年続けた正直な結果と反省点", "ZV-E10でVlogを始めて3ヶ月でわかったこと", "ヴィンテージ時計の相場をPythonで監視するシステム", "25歳のガジェット環境：本当に使ったものだけ紹介"],
  },
  jibun_kaisha: {
    id: "jibun_kaisha", label: "自分株式会社ログ", icon: "🏢", color: "#A855F7", rgb: "168,85,247",
    prompt: `あなたは「一人で会社のような仕組みを作る」実験をしている25歳「Keigo」です。AIで自動化・収益化の過程をリアルに公開しています。読者は「副業・独立を考えている20代」です。トーン：ビルドインパブリックスタイル。数字と失敗を隠さない。構成：①なぜ必要か→②Agent1調査→③Agent2コード→④Agent3執筆→⑤20代へのメッセージ→⑥アクション。記事末尾に必ず: <!-- meta: SEOメタ120字 --> <!-- tags: タグ1,タグ2,タグ3 --> <!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets: ["個人ブログをAIで半自動化して月1万円稼ぐまでの記録", "自分株式会社の月次レポート：収益・学び・失敗まとめ", "NotionとClaudeを繋いでコンテンツ管理を自動化した", "ブログ記事をClaudeに書かせる仕組みと品質管理の実態"],
  },
};

const DEPT_DATA = [
  { id: "sales",      label: "営業部",          en: "Sales",      color: "#00D4FF", rgb: "0,212,255",   icon: "🏪", status: "待機中", metric: "リード数",      val: "19",    chart: "bar"  },
  { id: "pr",         label: "広報部",          en: "PR",         color: "#10b981", rgb: "16,185,129",  icon: "📣", status: "稼働中", metric: "メディアリーチ", val: "182万", chart: "area" },
  { id: "marketing",  label: "マーケティング部", en: "Marketing",  color: "#3b82f6", rgb: "59,130,246",  icon: "📊", status: "待機中", metric: "キャンペーン",   val: "5",     chart: "pie"  },
  { id: "accounting", label: "経理部",          en: "Accounting", color: "#A855F7", rgb: "168,85,247",  icon: "💴", status: "待機中", metric: "バーンレート",   val: "¥4.2M", chart: "bar"  },
];

const KPI_DATA = [
  { label: "総資産 (推定)", value: "$203,686,000", sub: "+12.4% 年初来",   color: "#00D4FF", icon: "📈" },
  { label: "月間利益率",    value: "65.38%",        sub: "目標 60.0% 達成", color: "#10b981", icon: "⚡" },
  { label: "ライフスコア",  value: "クラスA",        sub: "進捗 82% / 100",  color: "#f59e0b", icon: "❤️" },
  { label: "システム負荷",  value: "92.4%",          sub: "安定稼働中",       color: "#A855F7", icon: "🖥️" },
];

const AGENT_LIST = [
  { label: "トレンド収集エージェント",      sub: "Google NewsからAI/DXトレンドを自動抽出",   status: "稼働中", time: "最終実行: 本日 23:30",           color: "#10b981" },
  { label: "人生戦略ロードマップ・ワーカー", sub: "音声メモをGeminiで解析・自動記帳",          status: "監視中", time: "監視フォルダ: VRS_Audio_Input",   color: "#3b82f6" },
];

const SETUP_PHASES = [
  {
    phase: "Phase 1", title: "WordPress基盤構築",  duration: "1〜2時間", color: "#00D4FF", rgb: "0,212,255",
    steps: [
      { title: "レンタルサーバー契約",   time: "15分", url: "conoha.jp/wing",         code: null,  detail: "ConoHa WINGの「WINGパック」12ヶ月プランを契約（月1,200円〜）。契約時に独自ドメインが1つ無料でもらえる。" },
      { title: "WordPressインストール", time: "10分", url: null,                      code: null,  detail: "ConoHa管理画面から「かんたんWordPressインストール」を実行。ユーザー名・パスワードをメモしておく。" },
      { title: "テーマ・プラグイン設定", time: "30分", url: "swell-theme.com",         code: null,  detail: "SWELLをインストール後、SEO SIMPLE PACK・XML Sitemaps・Akismetの3プラグインを導入。" },
    ],
  },
  {
    phase: "Phase 2", title: "Claude APIキー取得",  duration: "30分",     color: "#A855F7", rgb: "168,85,247",
    steps: [
      { title: "Anthropicアカウント作成", time: "5分", url: "console.anthropic.com", code: null, detail: "console.anthropic.comにアクセスし、Googleアカウントでサインアップ。" },
      { title: "APIキーを発行",          time: "5分", url: null, code: "# .envファイルに保存\nANTHROPIC_API_KEY=sk-ant-xxxxxxxx", detail: "ダッシュボード→「API Keys」→「Create Key」。キーは再表示不可なので必ずメモ。" },
      { title: "クレジットチャージ",      time: "5分", url: null, code: null, detail: "「Billing」→「Add credit」で$5〜10チャージ。月500〜3,000円が目安（記事50〜150本分）。" },
    ],
  },
  {
    phase: "Phase 3", title: "Google Sheets連携",  duration: "1時間",    color: "#FF6B35", rgb: "255,107,53",
    steps: [
      { title: "スプレッドシート準備",          time: "10分", url: null, code: null, detail: "Google Sheetsに「指示書」「記事ログ」「KPI」の3シートを作成。既存IDを流用可。" },
      { title: "GAS自動投稿スクリプト設置",      time: "20分", url: "script.google.com", code: "function postToWordPress(title, content) {\n  const WP_URL = 'https://your-blog.com/wp-json/wp/v2/posts';\n  const options = {\n    method: 'POST',\n    headers: { 'Authorization': 'Basic ' + Utilities.base64Encode('user:pass') },\n    payload: JSON.stringify({title, content, status: 'draft'})\n  };\n  return UrlFetchApp.fetch(WP_URL, options);\n}", detail: "script.google.comで新しいプロジェクトを作成。上記コードを貼り付けてWordPress自動投稿の準備をする。" },
      { title: "トリガー設定",                  time: "10分", url: null, code: null, detail: "GASエディタ→時計アイコン→新しいトリガー追加。週タイマーで月・水・金の朝9時に自動実行。" },
    ],
  },
  {
    phase: "Phase 4", title: "アフィリエイト設定",  duration: "2時間",    color: "#10b981", rgb: "16,185,129",
    steps: [
      { title: "Googleアドセンス申請",     time: "30分", url: "adsense.google.com",    code: null, detail: "記事10本以上になったら申請。審査通過後にサイトにコードを貼る。審査は通常1〜2週間。" },
      { title: "Amazonアソシエイト登録",   time: "30分", url: "affiliate.amazon.co.jp",code: null, detail: "ガジェット・書籍・カメラ機材の紹介に使う。承認後、各商品のアフィリエイトリンクをシステムに追記。" },
      { title: "A8.net登録",              time: "30分", url: "a8.net",                code: null, detail: "AIツール・金融系（証券口座・NISA）のアフィリエイト広告を取得。単価が高く（1件1,000〜10,000円）AI系記事と相性が良い。" },
    ],
  },
];

const CHART_SALES = [{ n: "M", v: 40 }, { n: "T", v: 30 }, { n: "W", v: 60 }, { n: "T", v: 45 }, { n: "F", v: 70 }];
const CHART_PR    = [{ n: "W1", v: 100 }, { n: "W2", v: 150 }, { n: "W3", v: 200 }, { n: "W4", v: 350 }];
const CHART_MKT   = [{ name: "戦略", value: 53 }, { name: "トレンド", value: 23 }, { name: "広告", value: 24 }];
const PIE_COLORS  = ["#00D4FF", "#3b82f6", "#334155"];


// ── HELPERS ──────────────────────────────────────────────────────────────────
function parseArticle(raw) {
  const tM  = raw.match(/^#\s+(.+)/m);
  const mM  = raw.match(/<!--\s*meta:\s*([\s\S]*?)\s*-->/);
  const tgM = raw.match(/<!--\s*tags:\s*([\s\S]*?)\s*-->/);
  const aM  = raw.match(/<!--\s*affiliate:\s*([\s\S]*?)\s*-->/);
  const body = raw.replace(/^#\s+.+\n?/m, "").replace(/<!--[\s\S]*?-->/g, "").trim();
  return {
    title: tM  ? tM[1].trim()  : "記事",
    meta:  mM  ? mM[1].trim()  : "",
    tags:  tgM ? tgM[1].trim().split(",").map(t => t.trim()) : [],
    affs:  aM  ? aM[1].trim().split(",").map(a => { const [n, d] = a.split("|"); return { name: n?.trim(), desc: d?.trim() }; }) : [],
    body,
    chars: body.replace(/[#*`\[\]\(\)\n]/g, "").length,
    raw,
  };
}

function inlineFmt(t) {
  return t
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff;font-weight:700">$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(0,0,0,0.5);padding:2px 5px;border-radius:3px;font-size:11px;color:#7ee787;font-family:monospace">$1</code>');
}

function MdView({ text, color }) {
  if (!text) return null;
  const lines = text.split("\n");
  const els = [];
  let code = false, cl = [], lang = "";
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (L.startsWith("```")) {
      if (code) {
        els.push(
          <pre key={i} style={{ background: "rgba(0,0,0,0.6)", padding: "12px 14px", borderRadius: 8, overflowX: "auto", margin: "10px 0", borderLeft: `3px solid ${color}`, fontSize: 11, lineHeight: 1.7 }}>
            <code style={{ color: "#a5d6a7", fontFamily: "monospace" }}>{cl.join("\n")}</code>
          </pre>
        );
        code = false; cl = []; lang = "";
      } else { code = true; lang = L.replace("```", "").trim(); }
      continue;
    }
    if (code) { cl.push(L); continue; }
    if (L.startsWith("## "))
      els.push(<h2 key={i} style={{ fontFamily: "sans-serif", fontSize: 17, fontWeight: 900, color, margin: "24px 0 10px", paddingBottom: 6, borderBottom: `1px solid ${color}33` }}>{L.replace("## ", "")}</h2>);
    else if (L.startsWith("### "))
      els.push(<h3 key={i} style={{ fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, color: "#e8e8f0", margin: "14px 0 7px" }}>{L.replace("### ", "")}</h3>);
    else if (L.startsWith("- ") || L.startsWith("* "))
      els.push(
        <div key={i} style={{ display: "flex", gap: 8, margin: "4px 0 4px 8px" }}>
          <span style={{ color, flexShrink: 0 }}>›</span>
          <p style={{ fontFamily: "sans-serif", fontSize: 13, lineHeight: 1.85, color: "#c8c8d8", margin: 0 }} dangerouslySetInnerHTML={{ __html: inlineFmt(L.replace(/^[-*]\s/, "")) }} />
        </div>
      );
    else if (L.trim() === "")
      els.push(<div key={i} style={{ height: 5 }} />);
    else
      els.push(<p key={i} style={{ fontFamily: "sans-serif", fontSize: 13, lineHeight: 1.85, color: "#c8c8d8", margin: "4px 0" }} dangerouslySetInnerHTML={{ __html: inlineFmt(L) }} />);
  }
  return <>{els}</>;
}

// ── GLOBAL CSS ────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Zen+Kaku+Gothic+New:wght@300;400;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .fade-up { animation: fadeUp 0.25s ease; }
  .nav-btn  { display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:7px;cursor:pointer;border:1px solid transparent;font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;color:#555;width:100%;background:transparent;transition:all 0.18s;text-align:left; }
  .nav-btn:hover  { color:#aaa;background:rgba(255,255,255,0.03); }
  .nav-btn.active { color:#00D4FF;background:rgba(0,212,255,0.08);border-color:rgba(0,212,255,0.2); }
  .card { background:rgba(255,255,255,0.028);border:1px solid rgba(255,255,255,0.07);border-radius:11px;padding:18px 20px; }
  .ibox { width:100%;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);border-radius:7px;color:#e8e8f0;font-family:'Zen Kaku Gothic New',sans-serif;font-size:13px;resize:vertical; }
  .ibox:focus { outline:none;border-color:rgba(0,212,255,0.5); }
  .ibox::placeholder { color:rgba(255,255,255,0.2); }
  .gen-btn { width:100%;padding:14px;cursor:pointer;background:linear-gradient(135deg,rgba(0,212,255,0.14),rgba(0,212,255,0.07));border:1px solid rgba(0,212,255,0.4);border-radius:8px;color:#00D4FF;font-family:'Zen Kaku Gothic New',sans-serif;font-size:14px;font-weight:900;letter-spacing:0.07em;transition:all 0.2s; }
  .gen-btn:not(:disabled):hover { background:linear-gradient(135deg,rgba(0,212,255,0.24),rgba(0,212,255,0.15));transform:translateY(-1px); }
  .gen-btn:disabled { opacity:0.4;cursor:not-allowed; }
  .pers-btn { cursor:pointer;padding:9px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;text-align:left;transition:all 0.18s;width:100%;color:#aaa; }
  .pers-btn.active { border-color:var(--pc);background:rgba(var(--pcr),0.1);color:var(--pc); }
  .preset-pill { cursor:pointer;padding:5px 11px;border-radius:20px;border:1px solid rgba(255,255,255,0.07);font-family:'Zen Kaku Gothic New',sans-serif;font-size:11px;background:transparent;color:#777;transition:all 0.18s;text-align:left;display:block;width:100%;margin-bottom:5px; }
  .preset-pill:hover { border-color:var(--pc,#00D4FF);color:var(--pc,#00D4FF);background:rgba(var(--pcr,0\\,212\\,255),0.07); }
  .pbar-inner { height:100%;background:linear-gradient(90deg,#00D4FF,rgba(0,212,255,0.5));border-radius:4px;transition:width 0.8s ease;box-shadow:0 0 8px rgba(0,212,255,0.3); }
  .phase-tab { padding:9px 12px;cursor:pointer;text-align:left;border:1px solid rgba(255,255,255,0.06);border-radius:6px;font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;background:rgba(255,255,255,0.02);color:#666;transition:all 0.18s;width:100%;margin-bottom:6px; }
  .phase-tab.active { color:#fff;background:rgba(var(--pcr),0.1);border-color:var(--pc); }
  .step-card { border:1px solid rgba(255,255,255,0.07);border-radius:7px;padding:10px 12px;cursor:pointer;transition:all 0.18s;background:rgba(255,255,255,0.02);margin-bottom:6px; }
  .step-card.sact { border-color:var(--pc);background:rgba(var(--pcr),0.06); }
  .step-card.sdone { border-color:rgba(74,222,128,0.3);background:rgba(74,222,128,0.04); }
  .code-blk { background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.07);border-radius:7px;padding:12px 14px;overflow-x:auto;border-left:3px solid var(--pc,#00D4FF);font-family:monospace;font-size:11px;color:#a5d6a7;line-height:1.75;white-space:pre; }
  .done-btn { padding:8px 15px;cursor:pointer;border-radius:6px;font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;font-weight:700;transition:all 0.18s;border:1px solid rgba(74,222,128,0.4);background:rgba(74,222,128,0.1);color:#4ade80; }
  .done-btn.isdone { background:rgba(74,222,128,0.22);color:#fff; }
  .snav-btn { padding:7px 14px;cursor:pointer;border:1px solid rgba(255,255,255,0.09);border-radius:6px;background:rgba(255,255,255,0.03);color:#aaa;font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;transition:all 0.18s; }
  .snav-btn:hover:not(:disabled) { border-color:rgba(255,255,255,0.28);color:#fff; }
  .snav-btn:disabled { opacity:0.3;cursor:not-allowed; }
  .cpbtn { padding:6px 12px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);border-radius:5px;background:transparent;color:#888;font-family:monospace;font-size:11px;transition:all 0.18s; }
  .cpbtn:hover { border-color:#fff;color:#fff; }
  ::-webkit-scrollbar { width:4px;height:4px; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07);border-radius:2px; }
`;

// ── SIDEBAR NAV ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "ダッシュボード",  Icon: LayoutDashboard },
  { id: "terminal",  label: "AIターミナル",    Icon: Terminal },
  { id: "blog",      label: "ブログ生成",      Icon: FileText },
  { id: "preview",   label: "記事プレビュー",  Icon: BookOpen },
  { id: "arch",      label: "構成図",          Icon: Map },
  { id: "setup",     label: "構築手順",        Icon: Wrench },
  { id: "roi",       label: "費用対効果",      Icon: DollarSign },
];

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]         = useState("dashboard");
  // terminal
  const [term, setTerm]         = useState("");
  const [termDept, setTermDept] = useState("営業部");
  const [termBusy, setTermBusy] = useState(false);
  const [termLogs, setTermLogs] = useState([
    { dept: "広報",  text: "Threadsの原稿が完成しました",                      time: "12分前", working: false },
    { dept: "営業",  text: "競合調査：ターゲット20代のアカウント分析完了",       time: "45分前", working: false },
    { dept: "マーケ", text: "TikTokトレンドレポート #SideHustle2026",          time: "1時間前", working: false },
  ]);
  const [wsMsg, setWsMsg]           = useState([]);
  const [agentStat, setAgentStat]   = useState("待機中...");
  const [inputs, setInputs]         = useState([]);
  // blog
  const [persona, setPersona]       = useState("ai_work");
  const [topic, setTopic]           = useState("");
  const [keywords, setKeywords]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [article, setArticle]       = useState(null);
  const [genError, setGenError]     = useState("");

  const [history, setHistory]       = useState([]);
  const [copied, setCopied]         = useState(false);
  // setup
  const [phase, setPhase]           = useState(0);
  const [step, setStep]             = useState(0);
  const [done, setDone]             = useState({});

  const p       = PERSONAS[persona];
  const totalS  = SETUP_PHASES.reduce((a, ph) => a + ph.steps.length, 0);
  const doneS   = Object.keys(done).length;
  const pct     = Math.round((doneS / totalS) * 100);

  useEffect(() => { setTimeout(() => setAgentStat("接続完了 (Ready)"), 800); }, []);

  const fetchInputs = useCallback(() => {
    setInputs([
      { taskName: "AI News",   date: "2026-03-19", title: "Claude 4 APIが一般公開、従来比3倍の処理速度を実現",      snippet: "Anthropicは本日、Claude 4 APIの一般公開を発表した。処理速度は従来比3倍に向上し…" },
      { taskName: "DX Trend",  date: "2026-03-18", title: "国内企業のAI導入率が60%を突破、20代社員が主導",         snippet: "経済産業省の調査によると、国内企業のAI活用率が初めて60%を超えた。特に20〜30代…" },
      { taskName: "Marketing", date: "2026-03-17", title: "TikTok副業コンテンツが急増、月収10万円超の20代が続出", snippet: "SNS上で副業収益を公開する20代クリエイターが急増している。AIツールを活用した…" },
    ]);
  }, []);
  useEffect(() => { fetchInputs(); }, []);

  const sendTermCmd = useCallback(() => {
    if (!term.trim()) return;
    setTermBusy(true);
    setWsMsg(prev => [...prev, { role: "user", text: term }]);
    setTermLogs(prev => [{ dept: termDept.replace("部", ""), text: term, time: "たった今", working: true }, ...prev]);
    const cmd = term; setTerm("");
    setTimeout(() => {
      setWsMsg(prev => [...prev, { role: "system", text: `> [Action] sendCommand("${termDept}", "${cmd.slice(0, 30)}...")` }]);
      setTimeout(() => {
        setWsMsg(prev => [...prev, { role: "agent", text: `${termDept}への指令を受理しました。\nGoogle Sheets「指示書」シートに記録し、処理を開始します。\n\nSpreadsheet ID: ${SPREADSHEET_ID}\nステータス: 処理中 → 完了後「アウトプット」シートに書き込みます。` }]);
        setTermBusy(false);
        setAgentStat("待機中...");
      }, 1200);
      setAgentStat("ツール実行中: sendCommand");
    }, 600);
  }, [term, termDept]);

  const startProg = useCallback(() => {
    let idx = 0;
    progRef.current = setInterval(() => {
      if (idx < PROG_STEPS.length) {
        setProgress(PROG_STEPS[idx][0]);
        setProgLabel(PROG_STEPS[idx][1]);
        idx++;
      } else {
        // 96%で止まらず「応答待ち...」に切り替え
        setProgLabel("Claude が応答を返すまで待機中...");
      }
    }, 900);
  }, []);

  const stopProg = useCallback(() => {
    if (progRef.current) clearInterval(progRef.current);
    setProgress(100);
    setProgLabel("生成完了！");
  }, []);

  const generate = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setGenError("");
    setArticle(null);
    setProgress(0);
    setProgLabel("Claude に接続中...");
    startProg();

    const kw = keywords.trim() ? `\nSEOキーワード: ${keywords}` : "";
    const userContent = `テーマ: ${topic}${kw}

以下の構成でブログ記事をMarkdown形式で書いてください。

# （タイトル）

## ① 導入（共感）

## ② Agent1: 調査・分析

## ③ Agent2: コード生成

## ④ Agent3: 執筆・要約

## ⑤ 20代へのメッセージ

## ⑥ アクション（収益）

<!-- meta: SEOメタディスクリプション -->
<!-- tags: タグ1,タグ2,タグ3 -->
<!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`;

    // 60秒タイムアウト
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: p.prompt,
          messages: [{ role: "user", content: userContent }],
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text().catch(() => `ステータス: ${res.status}`);
        throw new Error(`APIエラー (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }

      const raw = (data.content || []).map(b => b.text || "").join("");

      if (!raw || raw.length < 100) {
        throw new Error("生成結果が空または短すぎます。Claude APIのクレジット残高を確認してください → console.anthropic.com");
      }

      const parsed = parseArticle(raw);
      stopProg();
      setArticle(parsed);
      setHistory(prev => [{ persona, topic, parsed, ts: Date.now() }, ...prev.slice(0, 4)]);
      setPage("preview");

    } catch (e) {
      clearTimeout(timeoutId);
      stopProg();
      if (e.name === "AbortError") {
        setGenError("タイムアウト: 60秒以上応答がありませんでした。Claude APIのクレジット残高を確認してください。");
      } else {
        setGenError("エラー: " + e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [topic, keywords, p, persona, startProg, stopProg]);

  const toggleDone = k => setDone(prev => { const n = { ...prev }; n[k] ? delete n[k] : (n[k] = true); return n; });

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const ph   = SETUP_PHASES[phase];
  const st   = ph.steps[step];

  return (
    <div style={{ minHeight: "100vh", background: "#06060f", color: "#e8e8f0", display: "flex", fontFamily: "'DM Mono', monospace" }}>
      <style>{CSS}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside style={{ width: 200, background: "rgba(0,0,0,0.45)", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", padding: "18px 10px", flexShrink: 0, height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
        {/* Logo */}
        <div style={{ padding: "10px 6px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00D4FF", boxShadow: "0 0 8px #00D4FF", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.18em", textTransform: "uppercase" }}>JIBUN-OS</span>
          </div>
          <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
            自分<span style={{ color: "#00D4FF" }}>株式</span>会社
          </div>
          <div style={{ fontSize: 9, color: "#333", marginTop: 3, letterSpacing: "0.1em" }}>Neural Network OS v3</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button key={id} className={`nav-btn ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
              <Icon size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
              <span>{label}</span>
              {page === id && <ChevronRight size={11} style={{ marginLeft: "auto", opacity: 0.4 }} />}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12, marginTop: 12 }}>
          <a href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 6, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", marginBottom: 8 }}>
            <ExternalLink size={11} style={{ color: "#555" }} />
            <span style={{ fontSize: 10, color: "#666", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>統合データ基盤</span>
          </a>
          <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 9, color: "#4ade80" }}>構築進捗</span>
              <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#00D4FF,#4ade80)", borderRadius: 4, transition: "width 0.5s" }} />
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "26px 24px" }}>

        {/* ════ DASHBOARD ═══════════════════════════════════════════════════════ */}
        {page === "dashboard" && (
          <div className="fade-up">
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 5, textTransform: "uppercase" }}>// CEO Command Dashboard</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
                自分<span style={{ color: "#00D4FF" }}>株式会社</span> OS
              </h2>
              <p style={{ fontSize: 12, color: "#555", marginTop: 5, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>統合経営ダッシュボード — Google Sheets 同期中</p>
            </div>

            {/* KPI */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {KPI_DATA.map((k, i) => (
                <div key={i} className="card" style={{ borderBottom: `2px solid ${k.color}`, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{k.icon}</span>
                    <span style={{ fontSize: 9, color: k.color, background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 8, fontFamily: "monospace" }}>LIVE</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#666", fontFamily: "'Zen Kaku Gothic New', sans-serif", marginBottom: 3 }}>{k.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Zen Kaku Gothic New', sans-serif", marginBottom: 3 }}>{k.value}</div>
                  <div style={{ fontSize: 10, color: "#555", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Dept cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {DEPT_DATA.map(d => (
                <div key={d.id} className="card" style={{ borderLeft: `3px solid ${d.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(${d.rgb},0.12)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{d.icon}</div>
                      <div>
                        <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>{d.label}</div>
                        <div style={{ fontSize: 9, color: "#555", fontFamily: "monospace" }}>{d.en}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: d.status === "稼働中" ? `rgba(${d.rgb},0.1)` : "rgba(255,255,255,0.04)", border: `1px solid ${d.status === "稼働中" ? d.color + "55" : "rgba(255,255,255,0.08)"}`, fontSize: 10, color: d.status === "稼働中" ? d.color : "#555", fontFamily: "monospace" }}>
                      {d.status === "稼働中"
                        ? <CircleDashed size={9} style={{ animation: "spin 2s linear infinite" }} />
                        : <CheckCircle2 size={9} />}
                      {d.status}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#555", marginBottom: 3, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{d.metric}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: d.color, fontFamily: "monospace" }}>{d.val}</div>
                    </div>
                    <div style={{ flex: 1, height: 44 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        {d.chart === "bar" ? (
                          <BarChart data={CHART_SALES}><Bar dataKey="v" fill={d.color} radius={[3, 3, 0, 0]} opacity={0.8} /></BarChart>
                        ) : d.chart === "area" ? (
                          <AreaChart data={CHART_PR}>
                            <defs><linearGradient id={`g${d.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={d.color} stopOpacity={0.4} /><stop offset="95%" stopColor={d.color} stopOpacity={0} /></linearGradient></defs>
                            <Area type="monotone" dataKey="v" stroke={d.color} fill={`url(#g${d.id})`} />
                          </AreaChart>
                        ) : (
                          <PieChart><Pie data={CHART_MKT} dataKey="value" innerRadius={12} outerRadius={20} paddingAngle={3} stroke="none">{PIE_COLORS.map((c, ci) => <Cell key={ci} fill={c} />)}</Pie></PieChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Agent + Trends */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="card">
                <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>// AIエージェント稼働状況</div>
                {AGENT_LIST.map((a, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < AGENT_LIST.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: a.color, boxShadow: `0 0 5px ${a.color}`, animation: "pulse 1.5s ease-in-out infinite" }} />
                      <div>
                        <div style={{ fontSize: 12, color: "#ddd", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700 }}>{a.label}</div>
                        <div style={{ fontSize: 10, color: "#555", fontFamily: "'Zen Kaku Gothic New', sans-serif", marginTop: 1 }}>{a.sub}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontSize: 10, color: a.color, fontFamily: "monospace" }}>{a.status}</div>
                      <div style={{ fontSize: 9, color: "#444" }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase" }}>// 収集済みトレンド</div>
                  <button className="cpbtn" onClick={fetchInputs} style={{ display: "flex", alignItems: "center", gap: 4 }}><RefreshCw size={9} /> 更新</button>
                </div>
                {inputs.map((item, i) => (
                  <div key={i} style={{ padding: "9px 0", borderBottom: i < inputs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 7, background: "rgba(0,212,255,0.1)", color: "#00D4FF", fontFamily: "monospace" }}>{item.taskName}</span>
                      <span style={{ fontSize: 9, color: "#444" }}>{item.date}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#ddd", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, marginBottom: 2, lineHeight: 1.4 }}>{item.title}</div>
                    <div style={{ fontSize: 10, color: "#666", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.snippet}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ TERMINAL ════════════════════════════════════════════════════════ */}
        {page === "terminal" && (
          <div className="fade-up">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// Auto-CEO Terminal</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>AIターミナル</h2>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>部門へ指令を送信 — Google Sheetsに自動記録</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
              {/* Terminal window */}
              <div style={{ background: "#0a0a12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Terminal size={13} style={{ color: "#00D4FF" }} />
                    <span style={{ fontSize: 10, color: "#888", fontFamily: "monospace" }}>JIBUN-OS Auto-CEO Terminal</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: agentStat === "オフライン" ? "#ff5555" : "#4ade80", animation: "pulse 1.5s ease-in-out infinite" }} />
                    <span style={{ fontSize: 10, color: "#555", fontFamily: "monospace" }}>{agentStat}</span>
                  </div>
                </div>
                <div style={{ height: 300, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 9 }}>
                  {wsMsg.length === 0 && (
                    <div style={{ color: "#444", fontSize: 11, textAlign: "center", marginTop: 50, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>部門を選択して指令を入力してください</div>
                  )}
                  {wsMsg.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "88%", borderRadius: 8, padding: "7px 11px", fontSize: 12, lineHeight: 1.65, fontFamily: m.role === "system" ? "monospace" : "'Zen Kaku Gothic New', sans-serif", background: m.role === "user" ? "rgba(0,212,255,0.15)" : m.role === "system" ? "#040410" : "rgba(255,255,255,0.05)", color: m.role === "user" ? "#00D4FF" : m.role === "system" ? "#4ade80" : "#ddd", border: `1px solid ${m.role === "user" ? "rgba(0,212,255,0.3)" : m.role === "system" ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)"}` }}>
                        <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit" }}>{m.text}</pre>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "9px 11px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 7 }}>
                  <select value={termDept} onChange={e => setTermDept(e.target.value)}
                    style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "7px 11px", color: "#00D4FF", fontSize: 11, fontFamily: "monospace", outline: "none", cursor: "pointer" }}>
                    <option value="営業部">営業部</option>
                    <option value="広報部">広報部</option>
                    <option value="マーケティング部">マーケ部</option>
                    <option value="経理部">経理部</option>
                  </select>
                  <input value={term} onChange={e => setTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && sendTermCmd()}
                    placeholder="指令を入力... (Enter で送信)"
                    style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, padding: "7px 11px", color: "#e8e8f0", fontSize: 12, fontFamily: "'Zen Kaku Gothic New', sans-serif", outline: "none" }} />
                  <button onClick={sendTermCmd} disabled={!term.trim() || termBusy}
                    style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid rgba(0,212,255,0.4)", background: "rgba(0,212,255,0.1)", color: "#00D4FF", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, opacity: (!term.trim() || termBusy) ? 0.4 : 1 }}>
                    {termBusy ? <CircleDashed size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
                  </button>
                </div>
              </div>

              {/* Right panel - always rendered */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="card">
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 11, textTransform: "uppercase" }}>// 最近のアウトプット</div>
                  {termLogs.map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, padding: "8px 0", borderBottom: i < termLogs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", alignItems: "flex-start" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: l.working ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${l.working ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: l.working ? "#00D4FF" : "#666", fontWeight: 700 }}>
                        {l.dept[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "#ddd", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, marginBottom: 2, lineHeight: 1.4 }}>{l.text}</div>
                        <div style={{ fontSize: 9, color: l.working ? "#00D4FF" : "#555", fontFamily: "monospace" }}>{l.dept}部 · {l.working ? "実行中..." : l.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 11, textTransform: "uppercase" }}>// Sheets連携情報</div>
                  <p style={{ fontSize: 11, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.75, marginBottom: 10 }}>指令はGoogle Sheetsの「指示書」シートに自動記録されます。</p>
                  {[
                    { k: "Spreadsheet ID", v: SPREADSHEET_ID.slice(0, 18) + "..." },
                    { k: "記録シート",       v: "指示書!A2" },
                    { k: "書き込み項目",     v: "ID・時刻・部門・指令" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ fontSize: 10, color: "#555", fontFamily: "monospace" }}>{r.k}</span>
                      <span style={{ fontSize: 10, color: "#00D4FF", fontFamily: "monospace" }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ BLOG ════════════════════════════════════════════════════════════ */}
        {page === "blog" && (
          <div className="fade-up" style={{ "--pc": p.color, "--pcr": p.rgb }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// Blog Automation Engine</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                AI<span style={{ color: "#00D4FF" }}>ブログ</span>生成
              </h2>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>6セクション完全自動生成 — Claude API</p>
            </div>

            {/* Section badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 18, padding: "10px 14px", background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 9 }}>
              {["①導入（共感）", "②Agent1: 調査", "③Agent2: コード", "④Agent3: 執筆", "⑤20代へのメッセージ", "⑥アクション"].map(s => (
                <span key={s} style={{ padding: "3px 9px", borderRadius: 20, background: `rgba(${p.rgb},0.08)`, border: `1px solid rgba(${p.rgb},0.2)`, fontSize: 10, color: p.color, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{s}</span>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: 18, alignItems: "start" }}>
              {/* Left controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>// コンテンツモデル</div>
                  {Object.values(PERSONAS).map(pr => (
                    <button key={pr.id} className={`pers-btn ${persona === pr.id ? "active" : ""}`} style={{ "--pc": pr.color, "--pcr": pr.rgb }} onClick={() => { setPersona(pr.id); setTopic(""); setArticle(null); }}>
                      {pr.icon} {pr.label}
                    </button>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 7, textTransform: "uppercase" }}>// 記事テーマ</div>
                  <textarea className="ibox" rows={3} placeholder="例：AIエージェントを部下として使いこなす方法" value={topic} onChange={e => setTopic(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 7, textTransform: "uppercase" }}>// プリセット</div>
                  {p.presets.map(pr => (
                    <button key={pr} className="preset-pill" onClick={() => setTopic(pr)}>→ {pr}</button>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 6, textTransform: "uppercase" }}>// SEOキーワード（任意）</div>
                  <input className="ibox" placeholder="例：AIエージェント, 20代 副業" value={keywords} onChange={e => setKeywords(e.target.value)} />
                </div>
                <button className="gen-btn" onClick={generate} disabled={loading || !topic.trim()}>
                  {loading ? "生成中..." : "▶ 記事を完全自動生成する"}
                </button>
                {loading && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: p.color, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{progLabel}</span>
                      <span style={{ fontSize: 11, color: "#555" }}>{progress}%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                      <div className="pbar-inner" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
                {genError && <div style={{ padding: 10, borderRadius: 7, background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.25)", color: "#ff8080", fontSize: 12, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>⚠ {genError}</div>}
              </div>

              {/* Right info - always rendered */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="card">
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>// AIペルソナ: Keigo</div>
                  <div style={{ color: p.color, fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>25歳 / 営業DX担当 / 自分株式会社CEO</div>
                  {["都内勤務・副業で自動化を実験中", "GAS・Python独学", "新NISA・カメラ・ヴィンテージ品が趣味", "等身大の失敗談＋実数値で語る文体"].map((t, i) => (
                    <div key={i} style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12, color: "#888", padding: "4px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>· {t}</div>
                  ))}
                </div>
                {inputs.length > 0 && (
                  <div className="card" style={{ border: "1px solid rgba(0,212,255,0.15)" }}>
                    <div style={{ fontSize: 9, color: "#00D4FF", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>// トレンドからテーマを自動生成</div>
                    <p style={{ fontSize: 11, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif", marginBottom: 10, lineHeight: 1.65 }}>収集済みトレンドをワンクリックでテーマに設定できます</p>
                    {inputs.map((item, i) => (
                      <button key={i} className="preset-pill" style={{ "--pc": "#00D4FF", "--pcr": "0,212,255" }} onClick={() => setTopic(item.title)}>
                        [{item.taskName}] {item.title.slice(0, 36)}…
                      </button>
                    ))}
                  </div>
                )}
                {history.length > 0 && (
                  <div className="card">
                    <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>// 生成履歴</div>
                    {history.map((h, i) => (
                      <div key={i} style={{ padding: "7px 0", borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }} onClick={() => { setArticle(h.parsed); setPage("preview"); }}>
                        <div style={{ fontSize: 11, color: PERSONAS[h.persona].color, marginBottom: 2 }}>{h.parsed.title.slice(0, 34)}…</div>
                        <div style={{ fontSize: 9, color: "#444", fontFamily: "monospace" }}>{new Date(h.ts).toLocaleTimeString("ja-JP")} · {h.parsed.chars.toLocaleString()}字</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ PREVIEW ═════════════════════════════════════════════════════════ */}
        {page === "preview" && (
          <div className="fade-up">
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// 生成記事プレビュー</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>記事プレビュー</h2>
            </div>
            {!article ? (
              <div style={{ height: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 11, color: "#444" }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📄</div>
                <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, marginBottom: 14 }}>まだ記事が生成されていません</div>
                <button style={{ padding: "8px 18px", cursor: "pointer", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 6, color: "#00D4FF", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12 }} onClick={() => setPage("blog")}>→ 生成タブへ</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 240px", gap: 18, alignItems: "start" }}>
                {/* Article body */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                    <h1 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.4 }}>{article.title}</h1>
                    <button className="cpbtn" style={{ flexShrink: 0 }} onClick={() => { navigator.clipboard.writeText(article.raw); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                      {copied ? "✓ コピー済" : "MDコピー"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 9, marginBottom: 14 }}>
                    {[{ k: "文字数", v: article.chars.toLocaleString() + "字" }, { k: "読了", v: Math.ceil(article.chars / 500) + "分" }, { k: "SEO", v: article.meta ? "✓ あり" : "—" }].map(s => (
                      <div key={s.k} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "9px 11px" }}>
                        <div style={{ fontSize: 9, color: "#555", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 3 }}>{s.k}</div>
                        <div style={{ fontSize: 13, color: "#00D4FF", fontFamily: "monospace" }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "20px 22px", maxHeight: "65vh", overflowY: "auto" }}>
                    <MdView text={article.body} color="#00D4FF" />
                  </div>
                </div>

                {/* Right meta - always rendered */}
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {article.meta && (
                    <div className="card">
                      <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em", marginBottom: 7, textTransform: "uppercase" }}>// SEOメタ</div>
                      <p style={{ fontSize: 11, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.7 }}>{article.meta}</p>
                    </div>
                  )}
                  {article.tags.length > 0 && (
                    <div className="card">
                      <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>// タグ</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {article.tags.map((t, i) => (
                          <span key={i} style={{ padding: "2px 8px", borderRadius: 11, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", fontSize: 10, color: "#00D4FF", fontFamily: "monospace" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {article.affs.length > 0 && (
                    <div style={{ background: "rgba(255,200,50,0.05)", border: "1px solid rgba(255,200,50,0.15)", borderRadius: 10, padding: "13px 15px" }}>
                      <div style={{ fontSize: 9, color: "#888", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>💰 アフィリエイト</div>
                      {article.affs.map((a, i) => (
                        <div key={i} style={{ marginBottom: 7, paddingBottom: 7, borderBottom: i < article.affs.length - 1 ? "1px solid rgba(255,200,50,0.1)" : "none" }}>
                          <div style={{ fontSize: 12, color: "#fcd34d", fontWeight: 700, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{a.name}</div>
                          {a.desc && <div style={{ fontSize: 10, color: "#888", marginTop: 1, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{a.desc}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="card">
                    <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>// WP投稿手順</div>
                    {["MDコピー", "WP→新規投稿", "コードエディタに貼り付け", "アイキャッチ画像を設定", "アフィリエイトリンク挿入", "公開 or スケジュール"].map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, padding: "5px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <span style={{ color: "#00D4FF", fontSize: 10, fontFamily: "monospace", minWidth: 15 }}>{i + 1}.</span>
                        <span style={{ fontSize: 11, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ ARCH ════════════════════════════════════════════════════════════ */}
        {page === "arch" && (
          <div className="fade-up">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// System Architecture</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>システム構成図</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { title: "インプット層",        color: "#64748b", items: ["RSSフィード（AI/DXニュース自動収集）", "手動テーマ入力（ブログ生成タブ）", "トレンドAPI（Google Trends連携）"] },
                { title: "オーケストレーター",  color: "#00D4FF", items: ["JIBUN-OS（このシステム）", "Claude API（ペルソナ・構成管理）", "WebSocket（リアルタイム指令送受信）"] },
                { title: "3つのAIエージェント", color: "#A855F7", items: ["Agent 1: 調査・分析（Manus AI / OpenClaw）", "Agent 2: コード生成（Claude API / Cursor）", "Agent 3: 執筆・要約（Perplexity / NotebookLM）"] },
                { title: "アウトプット層",       color: "#10b981", items: ["WordPress（GAS + REST API で下書き自動保存）", "Google Sheets（指示書・記事ログ・KPI記録）", "note / Tips（有料コンテンツ配信）"] },
              ].map((s, i) => (
                <div key={i} className="card" style={{ borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 10, color: s.color, letterSpacing: "0.12em", marginBottom: 9, textTransform: "uppercase", fontFamily: "monospace" }}>{s.title}</div>
                  {s.items.map((item, j) => (
                    <div key={j} style={{ display: "flex", gap: 7, padding: "5px 0", borderBottom: j < s.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ color: s.color, fontSize: 11, flexShrink: 0 }}>›</span>
                      <span style={{ fontSize: 12, color: "#aaa", fontFamily: "'Zen Kaku Gothic New', sans-serif", lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>// データフロー（自動化の全体像）</div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0 }}>
                {[
                  { icon: "📡", label: "トピック取得",     sub: "RSS / 手動 / トレンド" },
                  { icon: "⚙️", label: "JIBUN-OS起動",    sub: "Claudeにペルソナ指示" },
                  { icon: "🤖", label: "3エージェント並列", sub: "調査・コード・執筆" },
                  { icon: "🎨", label: "統合フォーマット",  sub: "SEO・アフィリ自動挿入" },
                  { icon: "📊", label: "Sheets記録",       sub: "KPI・ログ自動書き込み" },
                  { icon: "🌐", label: "WP自動投稿",       sub: "下書き保存→公開" },
                ].map((f, i, arr) => (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ textAlign: "center", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", minWidth: 100 }}>
                      <div style={{ fontSize: 20, marginBottom: 5 }}>{f.icon}</div>
                      <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 11, color: "#ddd", fontWeight: 700, marginBottom: 2 }}>{f.label}</div>
                      <div style={{ fontSize: 9, color: "#555", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{f.sub}</div>
                    </div>
                    {i < arr.length - 1 && <div style={{ padding: "0 5px", color: "#333", fontSize: 14 }}>→</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ SETUP ═══════════════════════════════════════════════════════════ */}
        {page === "setup" && (
          <div className="fade-up" style={{ "--pc": ph.color, "--pcr": ph.rgb }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// Setup Guide</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                構築手順 <span style={{ fontSize: 14, color: "#555", fontWeight: 300 }}>{pct}% 完了</span>
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "200px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
              <div>
                {SETUP_PHASES.map((p2, pi) => {
                  const dc = p2.steps.map((_, si) => `${pi}-${si}`).filter(k => done[k]).length;
                  return (
                    <button key={pi} className={`phase-tab ${phase === pi ? "active" : ""}`} style={{ "--pc": p2.color, "--pcr": p2.rgb }} onClick={() => { setPhase(pi); setStep(0); }}>
                      <div style={{ color: p2.color, fontSize: 9, fontFamily: "monospace", marginBottom: 2 }}>{p2.phase} · {p2.duration}</div>
                      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 5 }}>{p2.title}</div>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 3 }}>
                        <div style={{ height: "100%", background: p2.color, borderRadius: 2, width: `${(dc / p2.steps.length) * 100}%`, transition: "width 0.4s" }} />
                      </div>
                      <div style={{ fontSize: 9, color: "#555", fontFamily: "monospace" }}>{dc}/{p2.steps.length}</div>
                    </button>
                  );
                })}
              </div>
              <div>
                <div style={{ background: `rgba(${ph.rgb},0.06)`, border: `1px solid rgba(${ph.rgb},0.2)`, borderRadius: 9, padding: "11px 15px", marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: ph.color, letterSpacing: "0.12em", marginBottom: 3, textTransform: "uppercase" }}>{ph.phase} · {ph.duration}</div>
                  <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 17, fontWeight: 900, color: "#fff" }}>{ph.title}</div>
                </div>
                {ph.steps.map((s2, si) => {
                  const key = `${phase}-${si}`, isDone = done[key];
                  return (
                    <div key={si} className={`step-card ${step === si ? "sact" : ""} ${isDone ? "sdone" : ""}`} onClick={() => setStep(si)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ width: 19, height: 19, borderRadius: "50%", flexShrink: 0, background: isDone ? "rgba(74,222,128,0.2)" : `rgba(${ph.rgb},0.15)`, border: `1px solid ${isDone ? "#4ade8066" : ph.color + "44"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: isDone ? "#4ade80" : ph.color, fontWeight: 700 }}>{isDone ? "✓" : si + 1}</span>
                          <span style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12, fontWeight: 700, color: isDone ? "#4ade80" : step === si ? "#fff" : "#aaa" }}>{s2.title}</span>
                        </div>
                        <span style={{ fontSize: 9, color: "#555", fontFamily: "monospace" }}>⏱ {s2.time}</span>
                      </div>
                    </div>
                  );
                })}
                {st && (
                  <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid rgba(${ph.rgb},0.25)`, borderRadius: 10, padding: "18px 20px", marginTop: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 9, color: ph.color, letterSpacing: "0.12em", marginBottom: 3, textTransform: "uppercase" }}>Step {step + 1}/{ph.steps.length}</div>
                        <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 16, fontWeight: 900, color: "#fff" }}>{st.title}</div>
                      </div>
                      <span style={{ fontSize: 10, color: "#555", fontFamily: "monospace", flexShrink: 0 }}>⏱ {st.time}</span>
                    </div>
                    <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12, color: "#aaa", lineHeight: 1.85, marginBottom: 11 }}>{st.detail}</p>
                    {st.url && <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 6, marginBottom: 11, background: `rgba(${ph.rgb},0.08)`, border: `1px solid rgba(${ph.rgb},0.25)`, fontSize: 10, color: ph.color, fontFamily: "monospace" }}>🔗 {st.url}</div>}
                    {st.code && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em", marginBottom: 5, textTransform: "uppercase" }}>// サンプルコード</div>
                        <div className="code-blk">{st.code}</div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      <button className={`done-btn ${done[`${phase}-${step}`] ? "isdone" : ""}`} onClick={() => toggleDone(`${phase}-${step}`)}>
                        {done[`${phase}-${step}`] ? "✓ 完了済み" : "✓ 完了マーク"}
                      </button>
                      <button className="snav-btn" disabled={step === 0 && phase === 0}
                        onClick={() => { if (step > 0) setStep(s => s - 1); else if (phase > 0) { setPhase(p => p - 1); setStep(SETUP_PHASES[phase - 1].steps.length - 1); } }}>← 前</button>
                      <button className="snav-btn" disabled={step === ph.steps.length - 1 && phase === SETUP_PHASES.length - 1}
                        onClick={() => { if (step < ph.steps.length - 1) setStep(s => s + 1); else if (phase < SETUP_PHASES.length - 1) { setPhase(p => p + 1); setStep(0); } }}>次 →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ ROI ═════════════════════════════════════════════════════════════ */}
        {page === "roi" && (
          <div className="fade-up">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: "#2a2a4a", letterSpacing: "0.2em", marginBottom: 4, textTransform: "uppercase" }}>// Cost & Revenue Analysis</div>
              <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 24, fontWeight: 900, color: "#fff" }}>費用対効果</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { title: "ブログ基盤", color: "#00D4FF", rgb: "0,212,255",   items: [{ n: "ConoHa WING", c: "月1,200円〜", r: "必須" }, { n: "独自ドメイン", c: "年1,000円〜", r: "必須" }, { n: "WordPress", c: "無料", r: "必須" }, { n: "SWELL", c: "買切17,600円", r: "推奨" }] },
                { title: "AIツール",  color: "#A855F7", rgb: "168,85,247", items: [{ n: "Claude API", c: "月500〜3,000円", r: "必須" }, { n: "Perplexity Pro", c: "月2,000円", r: "推奨" }, { n: "Cursor Pro", c: "月2,000円", r: "任意" }, { n: "NotebookLM", c: "無料", r: "推奨" }] },
                { title: "収益化ASP", color: "#f59e0b", rgb: "245,158,11", items: [{ n: "Googleアドセンス", c: "無料", r: "推奨" }, { n: "Amazonアソシエイト", c: "無料", r: "推奨" }, { n: "A8.net", c: "無料", r: "推奨" }, { n: "note / Tips", c: "手数料10〜20%", r: "任意" }] },
              ].map(group => (
                <div key={group.title} className="card" style={{ border: `1px solid rgba(${group.rgb},0.2)` }}>
                  <div style={{ fontSize: 11, color: group.color, fontWeight: 700, marginBottom: 10, fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{group.title}</div>
                  {group.items.map((item, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#ddd", fontFamily: "'Zen Kaku Gothic New', sans-serif", fontWeight: 700 }}>{item.n}</span>
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 9, background: item.r === "必須" ? "rgba(255,80,80,0.15)" : item.r === "推奨" ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.06)", color: item.r === "必須" ? "#ff8080" : item.r === "推奨" ? "#00D4FF" : "#888", fontFamily: "monospace" }}>{item.r}</span>
                      </div>
                      <div style={{ fontSize: 10, color: group.color, fontFamily: "monospace", marginTop: 2 }}>{item.c}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="card">
                <div style={{ fontSize: 9, color: "#ff8080", letterSpacing: "0.12em", marginBottom: 11, textTransform: "uppercase" }}>// 月次コスト試算</div>
                {[{ i: "レンタルサーバー", mn: 1200, mx: 1500 }, { i: "ドメイン（月割）", mn: 83, mx: 125 }, { i: "Claude API", mn: 500, mx: 3000 }, { i: "Perplexity（任意）", mn: 0, mx: 2000 }, { i: "テーマ（月割・任意）", mn: 0, mx: 600 }].map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 12, color: "#aaa", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{c.i}</span>
                    <span style={{ fontSize: 11, color: "#ff8080", fontFamily: "monospace" }}>¥{c.mn.toLocaleString()} 〜 ¥{c.mx.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ marginTop: 11, padding: "11px 13px", background: "rgba(255,80,80,0.08)", borderRadius: 7, border: "1px solid rgba(255,80,80,0.2)" }}>
                  <div style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>月間合計</div>
                  <div style={{ fontSize: 19, color: "#ff8080", fontFamily: "monospace", fontWeight: 700 }}>¥1,783 〜 ¥7,225 / 月</div>
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize: 9, color: "#4ade80", letterSpacing: "0.12em", marginBottom: 11, textTransform: "uppercase" }}>// 収益ロードマップ</div>
                {[{ ph: "0〜3ヶ月", pv: "〜1,000PV/月", inc: "0〜3,000円", c: "#444" }, { ph: "3〜6ヶ月", pv: "〜5,000PV/月", inc: "3,000〜20,000円", c: "#00D4FF" }, { ph: "6〜12ヶ月", pv: "〜20,000PV/月", inc: "20,000〜80,000円", c: "#4ade80" }, { ph: "1年〜", pv: "20,000PV+/月", inc: "80,000〜200,000円+", c: "#fcd34d" }].map((r, i) => (
                  <div key={i} style={{ padding: "9px 11px", marginBottom: 7, background: "rgba(255,255,255,0.02)", borderRadius: 6, borderLeft: `3px solid ${r.c}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 11, color: r.c, fontFamily: "monospace", fontWeight: 700 }}>{r.ph}</span>
                      <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "monospace" }}>{r.inc}</span>
                    </div>
                    <div style={{ fontSize: 9, color: "#888", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{r.pv}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
                {[{ l: "損益分岐点", v: "月3〜5本", s: "アフィリエイト1件で黒字化" }, { l: "初期費用（最小）", v: "約20,000円", s: "サーバー1年+ドメイン+テーマ" }, { l: "時間投資（AI後）", v: "週2〜3時間", s: "テーマ選定+生成+投稿のみ" }, { l: "1年後期待ROI", v: "500〜2,000%", s: "月10万円÷月5,000円" }].map((m, i) => (
                  <div key={i} style={{ textAlign: "center", padding: 10 }}>
                    <div style={{ fontSize: 9, color: "#666", fontFamily: "monospace", marginBottom: 4, letterSpacing: "0.08em" }}>{m.l}</div>
                    <div style={{ fontSize: 17, color: "#4ade80", fontFamily: "monospace", fontWeight: 700, marginBottom: 3 }}>{m.v}</div>
                    <div style={{ fontSize: 10, color: "#666", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{m.s}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "11px 14px", background: "rgba(0,0,0,0.3)", borderRadius: 7 }}>
                <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12, color: "#aaa", lineHeight: 1.85 }}>
                  <strong style={{ color: "#4ade80" }}>結論：</strong>月2,000円以下の投資で始められ、6ヶ月継続すれば投資回収が現実的。このJIBUN-OSで記事量産の時間を<strong style={{ color: "#fff" }}>週10時間→2時間</strong>に圧縮できます。20代のうちにSEO資産を積み上げることで、<strong style={{ color: "#fcd34d" }}>複利的に収益が伸びる</strong>仕組みが完成します。
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
