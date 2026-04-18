import { useState, useEffect, useRef } from "react";

// ── DATA ──────────────────────────────────────────────────────────────────────

const ARCH_NODES = [
  // Row 0 – triggers
  { id: "rss",     label: "RSS\nフィード",     icon: "📡", x: 8,   y: 8,   w: 110, h: 56, color: "#64748b", group: "input" },
  { id: "manual",  label: "手動\nテーマ入力",  icon: "✏️", x: 140, y: 8,   w: 110, h: 56, color: "#64748b", group: "input" },
  { id: "trend",   label: "トレンド\nAPI",     icon: "📈", x: 272, y: 8,   w: 110, h: 56, color: "#64748b", group: "input" },
  // Row 1 – orchestrator
  { id: "orch",    label: "オーケストレーター\n（このシステム）", icon: "⚙️", x: 110, y: 110, w: 170, h: 60, color: "#00D4FF", group: "core" },
  // Row 2 – agents
  { id: "ag1",     label: "Agent 1\n調査・分析",    icon: "🔍", x: 8,   y: 228, w: 120, h: 60, color: "#a855f7", group: "agent" },
  { id: "ag2",     label: "Agent 2\nコード生成",    icon: "💻", x: 150, y: 228, w: 120, h: 60, color: "#f59e0b", group: "agent" },
  { id: "ag3",     label: "Agent 3\n執筆・要約",    icon: "✍️", x: 292, y: 228, w: 120, h: 60, color: "#10b981", group: "agent" },
  // Row 3 – tools
  { id: "manus",   label: "Manus AI\nOpenClaw",    icon: "🤖", x: 8,   y: 344, w: 120, h: 52, color: "#a855f733", group: "tool" },
  { id: "claude",  label: "Claude API\nCursor",    icon: "⚡", x: 150, y: 344, w: 120, h: 52, color: "#f59e0b33", group: "tool" },
  { id: "perp",    label: "Perplexity\nNotebookLM",icon: "📚", x: 292, y: 344, w: 120, h: 52, color: "#10b98133", group: "tool" },
  // Row 4 – formatter
  { id: "fmt",     label: "Markdownフォーマッター\n+ SEO最適化 + アフィリエイト挿入", icon: "🎨", x: 60, y: 450, w: 300, h: 60, color: "#f97316", group: "core" },
  // Row 5 – output
  { id: "wp",      label: "WordPress\n（下書き保存）", icon: "🌐", x: 8,   y: 564, w: 120, h: 56, color: "#3b82f6", group: "output" },
  { id: "note",    label: "note / Tips\n（有料配信）",  icon: "📝", x: 150, y: 564, w: 120, h: 56, color: "#3b82f6", group: "output" },
  { id: "sheets",  label: "Google Sheets\n（ログ管理）", icon: "📊", x: 292, y: 564, w: 120, h: 56, color: "#3b82f6", group: "output" },
];

const ARCH_EDGES = [
  // inputs → orch
  { from: "rss",    to: "orch",   label: "トピック" },
  { from: "manual", to: "orch",   label: "" },
  { from: "trend",  to: "orch",   label: "キーワード" },
  // orch → agents
  { from: "orch",   to: "ag1",    label: "調査依頼" },
  { from: "orch",   to: "ag2",    label: "コード依頼" },
  { from: "orch",   to: "ag3",    label: "執筆依頼" },
  // agents → tools
  { from: "ag1",    to: "manus",  label: "" },
  { from: "ag2",    to: "claude", label: "" },
  { from: "ag3",    to: "perp",   label: "" },
  // tools → formatter (from agents)
  { from: "ag1",    to: "fmt",    label: "分析結果" },
  { from: "ag2",    to: "fmt",    label: "コード" },
  { from: "ag3",    to: "fmt",    label: "原稿" },
  // fmt → outputs
  { from: "fmt",    to: "wp",     label: "投稿" },
  { from: "fmt",    to: "note",   label: "投稿" },
  { from: "fmt",    to: "sheets", label: "記録" },
];

// center of a node
function nc(node) {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

const SETUP_PHASES = [
  {
    phase: "Phase 1",
    title: "ブログ基盤の構築",
    duration: "1〜2時間",
    color: "#00D4FF",
    steps: [
      {
        title: "レンタルサーバー契約",
        detail: "ConoHa WINGの「WINGパック」12ヶ月プランを契約（月1,200円〜）。契約時に独自ドメインが1つ無料でもらえる。",
        url: "conoha.jp/wing",
        time: "15分",
        code: null,
      },
      {
        title: "独自ドメイン取得",
        detail: "サーバー契約時の無料ドメインを使用。.comまたは.jpを推奨。ブランド名（例：jibun-kaisha.com）で取得する。",
        url: null,
        time: "5分",
        code: null,
      },
      {
        title: "WordPressをインストール",
        detail: "ConoHaの管理画面から「かんたんWordPressインストール」を実行。ユーザー名・パスワードをメモしておく。",
        url: null,
        time: "10分",
        code: null,
      },
      {
        title: "WordPressテーマ導入",
        detail: "SWELLをpurchase後、wp-admin → 外観 → テーマ → 新規追加 → ZIPファイルをアップロード。有効化する。",
        url: "swell-theme.com",
        time: "20分",
        code: null,
      },
      {
        title: "必須プラグイン設定",
        detail: "① SEO SIMPLE PACK（SEO設定）② XML Sitemaps（サイトマップ）③ Contact Form 7（問い合わせ）④ Akismet（スパム対策）をインストール＆有効化。",
        url: null,
        time: "20分",
        code: null,
      },
    ],
  },
  {
    phase: "Phase 2",
    title: "Claude API キー取得",
    duration: "30分",
    color: "#a855f7",
    steps: [
      {
        title: "Anthropicアカウント作成",
        detail: "console.anthropic.comにアクセスし、Googleアカウントでサインアップ。メール認証を完了させる。",
        url: "console.anthropic.com",
        time: "5分",
        code: null,
      },
      {
        title: "APIキーを発行",
        detail: "ダッシュボード → 「API Keys」 → 「Create Key」。キー名は「blog-engine」などわかりやすく設定。発行されたキーは必ずメモ（再表示不可）。",
        url: null,
        time: "5分",
        code: null,
      },
      {
        title: "クレジットをチャージ",
        detail: "「Billing」→「Add credit」で$5〜10をチャージ。月500〜3,000円分が目安（記事50〜150本分）。",
        url: null,
        time: "5分",
        code: null,
      },
      {
        title: "このシステムにAPIキーを設定",
        detail: "前回作成した生成エンジンはClaude.ai上で動作するため、APIキーは自動で使用されます。ローカルで動かす場合のみ以下の設定が必要。",
        url: null,
        time: "5分",
        code: "# .envファイルに保存\nANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx\n\n# または環境変数として設定\nexport ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx",
      },
    ],
  },
  {
    phase: "Phase 3",
    title: "AIエージェントツール連携",
    duration: "1時間",
    color: "#f59e0b",
    steps: [
      {
        title: "Perplexity Pro登録（Agent 3）",
        detail: "perplexity.aiにアクセスしてアカウント作成。Proプランに加入（月$20）。無料版でも使えるが、Pro版は検索精度・速度が大幅に向上する。",
        url: "perplexity.ai",
        time: "10分",
        code: null,
      },
      {
        title: "NotebookLM設定（Agent 3）",
        detail: "notebooklm.google.comにアクセス（Googleアカウントでログイン）。新しいノートブックを作成し、参考資料（PDF・URL）を登録しておく。",
        url: "notebooklm.google.com",
        time: "15分",
        code: null,
      },
      {
        title: "Cursor設定（Agent 2・任意）",
        detail: "cursor.comからCursorをインストール。GASやPythonコードを書く際にAIが補完・生成してくれる。「Composer」機能で自然言語からコードを生成できる。",
        url: "cursor.com",
        time: "20分",
        code: null,
      },
      {
        title: "Google Apps Script準備（Agent 2）",
        detail: "script.google.comにアクセス。「新しいプロジェクト」を作成し、ブログ記事の自動投稿スクリプトをデプロイする準備をする。",
        url: "script.google.com",
        time: "10分",
        code: "// GAS: WordPressに自動投稿するスクリプト\nfunction postToWordPress(title, content) {\n  const WP_URL = 'https://your-blog.com/wp-json/wp/v2/posts';\n  const USERNAME = 'your_username';\n  const APP_PASSWORD = 'xxxx xxxx xxxx xxxx';\n  \n  const payload = {\n    title: title,\n    content: content,\n    status: 'draft'  // まず下書きで保存\n  };\n  \n  const options = {\n    method: 'POST',\n    headers: {\n      'Authorization': 'Basic ' + Utilities.base64Encode(USERNAME + ':' + APP_PASSWORD),\n      'Content-Type': 'application/json'\n    },\n    payload: JSON.stringify(payload)\n  };\n  \n  const response = UrlFetchApp.fetch(WP_URL, options);\n  return JSON.parse(response.getContentText());\n}",
      },
    ],
  },
  {
    phase: "Phase 4",
    title: "WordPress自動投稿設定",
    duration: "45分",
    color: "#10b981",
    steps: [
      {
        title: "アプリケーションパスワードを発行",
        detail: "WordPress管理画面 → ユーザー → プロフィール → 「アプリケーションパスワード」セクション → 名前「blog-engine」で生成。表示された文字列をメモ。",
        url: null,
        time: "5分",
        code: null,
      },
      {
        title: "REST APIの動作確認",
        detail: "ブラウザで https://your-blog.com/wp-json/wp/v2/posts にアクセスし、JSONが返ってくれば正常。",
        url: null,
        time: "5分",
        code: "# curlで動作テスト\ncurl -X GET https://your-blog.com/wp-json/wp/v2/posts \\\n  -H 'Content-Type: application/json'\n\n# 成功すると記事のJSON配列が返ってくる",
      },
      {
        title: "GASの自動実行トリガー設定",
        detail: "GASエディタ → 時計アイコン（トリガー）→ 新しいトリガーを追加。「時間ベース」→「週タイマー」で月・水・金の朝9時に実行するよう設定。",
        url: null,
        time: "10分",
        code: null,
      },
      {
        title: "Googleスプレッドシートでログ管理",
        detail: "生成した記事のタイトル・文字数・公開日・収益を記録するシートを作成。GASから自動書き込みされる仕組みにする。",
        url: null,
        time: "20分",
        code: "// GAS: スプレッドシートに記録\nfunction logArticle(title, charCount, status) {\n  const ss = SpreadsheetApp.openById('YOUR_SHEET_ID');\n  const sheet = ss.getSheetByName('記事ログ');\n  sheet.appendRow([\n    new Date(),\n    title,\n    charCount,\n    status,\n    '' // 収益（後で手動入力）\n  ]);\n}",
      },
    ],
  },
  {
    phase: "Phase 5",
    title: "アフィリエイト設定",
    duration: "2時間",
    color: "#f97316",
    steps: [
      {
        title: "Googleアドセンス申請",
        detail: "記事が10本以上になったら申請。adsense.google.comから申請し、審査完了後にサイトにコードを貼る（SWELL専用設定箇所あり）。審査は通常1〜2週間。",
        url: "adsense.google.com",
        time: "30分",
        code: null,
      },
      {
        title: "Amazonアソシエイト登録",
        detail: "affiliate.amazon.co.jpで申請。ガジェット・書籍・カメラ機材の紹介に使う。承認後、各商品のアフィリエイトリンクを生成エンジンに追記する。",
        url: "affiliate.amazon.co.jp",
        time: "30分",
        code: null,
      },
      {
        title: "A8.net / もしもアフィリエイト登録",
        detail: "AIツール（Claude Pro・Perplexity等）や金融系（証券口座・NISA）のアフィリエイト広告を取得。単価が高く（1件1,000〜10,000円）、AI系記事と相性が良い。",
        url: "a8.net",
        time: "30分",
        code: null,
      },
      {
        title: "アフィリエイトリンクをシステムに組み込み",
        detail: "生成エンジンのSYSTEM_PROMPTに「記事末尾のアクションセクションで以下のツールを自然に紹介する」として各ASPのリンクを追記。AIが文脈に合わせて自動挿入する。",
        url: null,
        time: "20分",
        code: "// SYSTEM_PROMPTに追記する内容例\nconst AFFILIATE_LINKS = `\n【アフィリエイト紹介ルール】\n記事の「アクション」セクションで以下を文脈に合わせて紹介：\n- Claude Pro: https://claude.ai （AI執筆に必須）\n- Perplexity: https://perplexity.ai （リサーチ最速化）\n- ConoHa WING: https://conoha.jp/wing （ブログ開設に）\n- SBI証券（新NISA）: A8経由リンクをここに\n自然な文章で、押し売り感なく紹介すること。\n`;",
      },
    ],
  },
];

// ── SVG DIAGRAM COMPONENT ────────────────────────────────────────────────────

function ArchDiagram({ onNodeClick, activeNode }) {
  const SVG_W = 420;
  const SVG_H = 660;

  // compute edge paths
  function edgePath(e) {
    const fromNode = ARCH_NODES.find(n => n.id === e.from);
    const toNode   = ARCH_NODES.find(n => n.id === e.to);
    if (!fromNode || !toNode) return "";
    const f = nc(fromNode);
    const t = nc(toNode);
    const dy = (t.y - f.y) * 0.45;
    return `M${f.x},${f.y + fromNode.h / 2} C${f.x},${f.y + fromNode.h / 2 + dy} ${t.x},${t.y - toNode.h / 2 - dy} ${t.x},${t.y - toNode.h / 2}`;
  }

  const groupColors = {
    input:  "#64748b",
    core:   "#00D4FF",
    agent:  "#a855f7",
    tool:   "#555",
    output: "#3b82f6",
  };

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.25)" />
        </marker>
        <marker id="arr-hl" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#00D4FF" />
        </marker>
        {ARCH_NODES.map(n => (
          <filter key={n.id + "-glow"} id={"glow-" + n.id}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
        <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d0d1a" />
          <stop offset="100%" stopColor="#060610" />
        </linearGradient>
      </defs>

      <rect width={SVG_W} height={SVG_H} fill="url(#bg-grad)" rx="12" />

      {/* grid */}
      {Array.from({ length: 22 }).map((_, i) => (
        <line key={"gv" + i} x1={i * 20} y1={0} x2={i * 20} y2={SVG_H} stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
      ))}
      {Array.from({ length: 34 }).map((_, i) => (
        <line key={"gh" + i} x1={0} y1={i * 20} x2={SVG_W} y2={i * 20} stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
      ))}

      {/* Row labels */}
      {[
        { y: 20, label: "INPUT" },
        { y: 124, label: "ORCHESTRATOR" },
        { y: 240, label: "AI AGENTS" },
        { y: 356, label: "TOOLS" },
        { y: 462, label: "FORMATTER" },
        { y: 576, label: "OUTPUT" },
      ].map(r => (
        <text key={r.label} x={SVG_W - 8} y={r.y} textAnchor="end"
          fill="rgba(255,255,255,0.12)" fontSize="9"
          fontFamily="'DM Mono', monospace" letterSpacing="0.1em">
          {r.label}
        </text>
      ))}

      {/* Edges */}
      {ARCH_EDGES.map((e, i) => {
        const isActive = activeNode && (activeNode === e.from || activeNode === e.to);
        return (
          <g key={i}>
            <path d={edgePath(e)}
              fill="none"
              stroke={isActive ? "#00D4FF" : "rgba(255,255,255,0.12)"}
              strokeWidth={isActive ? 1.5 : 1}
              strokeDasharray={isActive ? "none" : "4 3"}
              markerEnd={isActive ? "url(#arr-hl)" : "url(#arr)"}
              style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
            />
          </g>
        );
      })}

      {/* Nodes */}
      {ARCH_NODES.map(node => {
        const isActive = activeNode === node.id;
        const c = node.color.replace("33", "");
        const center = nc(node);
        return (
          <g key={node.id} onClick={() => onNodeClick(node.id)}
            style={{ cursor: "pointer" }}>
            <rect
              x={node.x} y={node.y} width={node.w} height={node.h}
              rx="8"
              fill={isActive ? c + "22" : "rgba(255,255,255,0.04)"}
              stroke={isActive ? c : "rgba(255,255,255,0.1)"}
              strokeWidth={isActive ? 1.5 : 1}
              filter={isActive ? `url(#glow-${node.id})` : undefined}
              style={{ transition: "all 0.25s" }}
            />
            {/* icon */}
            <text x={node.x + 10} y={node.y + 20}
              fontSize="14" dominantBaseline="middle">
              {node.icon}
            </text>
            {/* label lines */}
            {node.label.split("\n").map((line, li) => (
              <text key={li}
                x={node.x + node.w / 2} y={node.y + (node.h / 2) - 6 + li * 14}
                textAnchor="middle" dominantBaseline="middle"
                fill={isActive ? c : "rgba(255,255,255,0.7)"}
                fontSize="10"
                fontFamily="'Zen Kaku Gothic New', sans-serif"
                fontWeight={isActive ? "700" : "400"}
                style={{ transition: "fill 0.25s" }}>
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {/* Legend */}
      {Object.entries({ INPUT: "#64748b", CORE: "#00D4FF", AGENT: "#a855f7", TOOL: "#555", OUTPUT: "#3b82f6" }).map(([k, v], i) => (
        <g key={k} transform={`translate(${8 + i * 78}, ${SVG_H - 18})`}>
          <rect width="10" height="10" rx="2" fill={v + "44"} stroke={v} strokeWidth="1" />
          <text x="14" y="9" fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="'DM Mono', monospace">{k}</text>
        </g>
      ))}
    </svg>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeNode, setActiveNode]   = useState(null);
  const [activePhase, setActivePhase] = useState(0);
  const [activeStep, setActiveStep]   = useState(0);
  const [doneSteps, setDoneSteps]     = useState({});
  const [tab, setTab]                 = useState("arch"); // arch | setup

  const step = SETUP_PHASES[activePhase]?.steps[activeStep];
  const totalSteps = SETUP_PHASES.reduce((a, p) => a + p.steps.length, 0);
  const completedCount = Object.keys(doneSteps).length;
  const pct = Math.round((completedCount / totalSteps) * 100);

  const toggleDone = (key) => {
    setDoneSteps(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = true;
      return next;
    });
  };

  const nodeInfo = {
    rss:    { title: "RSSフィード", desc: "Feedly等でAI・DX・投資ニュースを購読。新着記事が自動でトピック候補になる。ツール：Feedly / Inoreader" },
    manual: { title: "手動テーマ入力", desc: "このシステムの生成タブに直接テーマを入力。最も手軽な起動方法。" },
    trend:  { title: "トレンドAPI", desc: "Google Trends APIやTwitter APIで旬のキーワードを取得してテーマ候補にする（上級者向け）。" },
    orch:   { title: "オーケストレーター", desc: "このブログ生成エンジン本体。Claudeへのプロンプト設計・各エージェントへの指示・出力の統合を担当。" },
    ag1:    { title: "Agent 1：調査・分析", desc: "競合調査・市場規模・最新トレンドを調査するエージェント。Manus AIやOpenClawに丸投げできる。" },
    ag2:    { title: "Agent 2：コード生成", desc: "GAS・Pythonコードを生成するエージェント。Claude 3.5 SonnetやCursorが主な実装ツール。" },
    ag3:    { title: "Agent 3：執筆・要約", desc: "大量の資料・最新ニュースを5分でまとめるエージェント。PerplexityとNotebookLMを併用する。" },
    manus:  { title: "Manus AI / OpenClaw", desc: "Web上の情報を自律的に収集・分析するAIエージェントサービス。競合ブログや市場動向の調査に使う。" },
    claude: { title: "Claude API / Cursor", desc: "コードを自然言語で指示して生成。プログラミング未経験でも業務自動化スクリプトが作れる。" },
    perp:   { title: "Perplexity / NotebookLM", desc: "Perplexityは最新情報をリアルタイム検索。NotebookLMはPDFや資料を要約して知識化する。" },
    fmt:    { title: "Markdownフォーマッター", desc: "各エージェントの出力を統合してWordPress用Markdownに変換。SEOメタ・タグ・アフィリエイトリンクも自動挿入。" },
    wp:     { title: "WordPress", desc: "メインブログプラットフォーム。GASからREST API経由で下書き自動保存。確認後ワンクリックで公開。" },
    note:   { title: "note / Tips", desc: "有料記事・有料マガジンの配信先。詳細版や実践ガイドを有料提供してLTVを上げる。" },
    sheets: { title: "Google Sheets（ログ管理）", desc: "生成記事のタイトル・文字数・公開日・月間PV・収益をGASで自動記録。事業KPIを可視化。" },
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#07070f",
      color: "#e8e8f0",
      fontFamily: "'DM Mono', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Zen+Kaku+Gothic+New:wght@300;400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .scanline {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.008) 3px, rgba(0,212,255,0.008) 4px);
          pointer-events: none; z-index: 0;
        }

        .tab-btn {
          padding: 9px 22px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 4px;
          font-family: 'DM Mono', monospace; font-size: 12px;
          letter-spacing: 0.08em; background: transparent; color: #555;
          transition: all 0.2s;
        }
        .tab-btn:hover { color: #aaa; }
        .tab-btn.active { background: rgba(0,212,255,0.1); color: #00D4FF; border-color: rgba(0,212,255,0.35); }

        .phase-tab {
          padding: 10px 16px; cursor: pointer; text-align: left;
          border: 1px solid rgba(255,255,255,0.06); border-radius: 6px;
          font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 12px;
          background: rgba(255,255,255,0.02); color: #666;
          transition: all 0.2s; width: 100%;
        }
        .phase-tab:hover { color: #ccc; border-color: rgba(255,255,255,0.15); }
        .phase-tab.active { color: #fff; background: rgba(var(--pc-rgb),0.1); border-color: var(--pc); }

        .step-card {
          border: 1px solid rgba(255,255,255,0.07); border-radius: 8px;
          padding: 14px 16px; cursor: pointer; transition: all 0.2s;
          background: rgba(255,255,255,0.02);
          font-family: 'Zen Kaku Gothic New', sans-serif;
        }
        .step-card:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.04); }
        .step-card.active { border-color: var(--pc); background: rgba(var(--pc-rgb),0.07); }
        .step-card.done { border-color: rgba(74,222,128,0.3); background: rgba(74,222,128,0.04); }

        .code-block {
          background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 16px 18px; overflow-x: auto;
          border-left: 3px solid var(--pc);
          font-family: 'DM Mono', monospace; font-size: 12px;
          color: #a5d6a7; line-height: 1.75; white-space: pre;
        }

        .check-btn {
          padding: 10px 20px; cursor: pointer;
          border-radius: 6px; font-family: 'Zen Kaku Gothic New', sans-serif;
          font-size: 13px; font-weight: 700; transition: all 0.2s;
          border: 1px solid rgba(74,222,128,0.4);
          background: rgba(74,222,128,0.1); color: #4ade80;
        }
        .check-btn:hover { background: rgba(74,222,128,0.2); }
        .check-btn.done { background: rgba(74,222,128,0.25); color: #fff; }

        .nav-btn {
          padding: 10px 18px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
          background: rgba(255,255,255,0.04); color: #aaa;
          font-family: 'Zen Kaku Gothic New', sans-serif; font-size: 13px;
          transition: all 0.2s;
        }
        .nav-btn:hover:not(:disabled) { border-color: rgba(255,255,255,0.3); color: #fff; }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>

      <div className="scanline" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1140, margin: "0 auto", padding: "28px 20px" }}>

        {/* Header */}
        <header style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
              自分株式会社 — System Architecture & Setup Guide
            </div>
            <h1 style={{
              fontFamily: "'Zen Kaku Gothic New', sans-serif",
              fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 900,
              color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em",
            }}>
              システム<span style={{ color: "#00D4FF" }}>構成図</span>と<br />
              <span style={{ fontSize: "0.7em", color: "#555", fontWeight: 300 }}>構築ステップガイド</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`tab-btn ${tab === "arch" ? "active" : ""}`} onClick={() => setTab("arch")}>🗺 構成図</button>
            <button className={`tab-btn ${tab === "setup" ? "active" : ""}`} onClick={() => setTab("setup")}>🛠 構築手順</button>
          </div>
        </header>

        {/* Progress bar (always visible) */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#555" }}>全体の構築進捗</span>
            <span style={{ fontSize: 11, color: "#00D4FF", fontFamily: "'DM Mono', monospace" }}>
              {completedCount} / {totalSteps} ステップ完了 ({pct}%)
            </span>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              width: `${pct}%`,
              background: "linear-gradient(90deg, #00D4FF, #4ade80)",
              boxShadow: "0 0 10px rgba(0,212,255,0.4)",
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>

        {/* ── TAB: ARCH ───────────────────────────────────────────────────── */}
        {tab === "arch" && (
          <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 24, alignItems: "start" }}>

            {/* SVG diagram */}
            <div style={{
              borderRadius: 12, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 0 60px rgba(0,212,255,0.05)",
            }}>
              <ArchDiagram onNodeClick={id => setActiveNode(prev => prev === id ? null : id)} activeNode={activeNode} />
            </div>

            {/* Node info panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {activeNode ? (
                <div style={{
                  background: "rgba(255,255,255,0.03)", borderRadius: 10,
                  border: "1px solid rgba(0,212,255,0.25)", padding: "22px 24px",
                }}>
                  <div style={{ fontSize: 11, color: "#00D4FF", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>
                    // ノード詳細
                  </div>
                  <h3 style={{
                    fontFamily: "'Zen Kaku Gothic New', sans-serif",
                    fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 12,
                  }}>
                    {ARCH_NODES.find(n => n.id === activeNode)?.icon} {nodeInfo[activeNode]?.title}
                  </h3>
                  <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 14, color: "#aaa", lineHeight: 1.85 }}>
                    {nodeInfo[activeNode]?.desc}
                  </p>
                  <button style={{
                    marginTop: 14, padding: "7px 16px", cursor: "pointer",
                    background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 5, color: "#666", fontSize: 12, fontFamily: "'DM Mono', monospace",
                    transition: "all 0.2s",
                  }} onClick={() => setActiveNode(null)}>✕ 閉じる</button>
                </div>
              ) : (
                <div style={{
                  background: "rgba(0,212,255,0.04)", borderRadius: 10,
                  border: "1px solid rgba(0,212,255,0.12)", padding: "18px 20px",
                }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>← ノードをクリックして詳細を確認</div>
                  <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, color: "#666", lineHeight: 1.8 }}>
                    構成図の各ブロックをタップすると、そのコンポーネントの役割・使用ツール・設定方法が表示されます。
                  </div>
                </div>
              )}

              {/* Data flow explanation */}
              <div style={{
                background: "rgba(255,255,255,0.025)", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.07)", padding: "20px 22px",
              }}>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 14, textTransform: "uppercase" }}>
                  // データフロー（自動化の流れ）
                </div>
                {[
                  { step: "1", icon: "📡", title: "トピック取得", desc: "RSSフィードや手動入力からテーマを取得" },
                  { step: "2", icon: "⚙️", title: "オーケストレーター起動", desc: "Claude APIにペルソナ・構成を指示" },
                  { step: "3", icon: "🤖", title: "3エージェント並列実行", desc: "調査・コード生成・執筆を同時進行" },
                  { step: "4", icon: "🎨", title: "統合＆フォーマット", desc: "SEO・アフィリエイトを自動挿入してMarkdown化" },
                  { step: "5", icon: "🌐", title: "自動投稿", desc: "WordPress下書きに保存→確認後ワンクリック公開" },
                ].map((f, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 14, padding: "10px 0",
                    borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: "#00D4FF", fontFamily: "'DM Mono', monospace", fontWeight: 700,
                    }}>{f.step}</div>
                    <div>
                      <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 13, color: "#ddd", fontWeight: 700, marginBottom: 2 }}>
                        {f.icon} {f.title}
                      </div>
                      <div style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 12, color: "#666" }}>
                        {f.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech stack */}
              <div style={{
                background: "rgba(255,255,255,0.025)", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.07)", padding: "20px 22px",
              }}>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 14, textTransform: "uppercase" }}>
                  // 技術スタック
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "フロント", value: "React (Claude.ai上で動作)" },
                    { label: "AI Core", value: "Claude Sonnet 4" },
                    { label: "自動投稿", value: "GAS + WP REST API" },
                    { label: "リサーチ", value: "Perplexity + NotebookLM" },
                    { label: "コード補助", value: "Cursor / Claude Code" },
                    { label: "ログ管理", value: "Google Sheets + GAS" },
                  ].map((t, i) => (
                    <div key={i} style={{ padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: "#ccc", fontFamily: "'Zen Kaku Gothic New', sans-serif" }}>{t.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: SETUP ──────────────────────────────────────────────────── */}
        {tab === "setup" && (
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24, alignItems: "start" }}>

            {/* Phase sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "sticky", top: 20 }}>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", marginBottom: 4, textTransform: "uppercase" }}>
                // フェーズ
              </div>
              {SETUP_PHASES.map((p, pi) => {
                const phaseKeys = p.steps.map((_, si) => `${pi}-${si}`);
                const doneCnt = phaseKeys.filter(k => doneSteps[k]).length;
                return (
                  <button
                    key={pi}
                    className={`phase-tab ${activePhase === pi ? "active" : ""}`}
                    style={{ "--pc": p.color, "--pc-rgb": p.color === "#00D4FF" ? "0,212,255" : p.color === "#a855f7" ? "168,85,247" : p.color === "#f59e0b" ? "245,158,11" : p.color === "#10b981" ? "16,185,129" : "249,115,22" }}
                    onClick={() => { setActivePhase(pi); setActiveStep(0); }}
                  >
                    <div style={{ color: p.color, fontSize: 10, fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>
                      {p.phase} · {p.duration}
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", background: p.color, borderRadius: 2,
                        width: `${(doneCnt / p.steps.length) * 100}%`, transition: "width 0.4s",
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                      {doneCnt}/{p.steps.length}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step detail */}
            {(() => {
              const phase = SETUP_PHASES[activePhase];
              const pc = phase.color;
              const pcRgb = pc === "#00D4FF" ? "0,212,255" : pc === "#a855f7" ? "168,85,247" : pc === "#f59e0b" ? "245,158,11" : pc === "#10b981" ? "16,185,129" : "249,115,22";
              return (
                <div style={{ "--pc": pc, "--pc-rgb": pcRgb }}>
                  {/* Phase header */}
                  <div style={{
                    background: `rgba(${pcRgb},0.06)`, border: `1px solid rgba(${pcRgb},0.2)`,
                    borderRadius: 10, padding: "16px 20px", marginBottom: 20,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: pc, letterSpacing: "0.12em", marginBottom: 4, textTransform: "uppercase" }}>
                        {phase.phase} · 所要時間: {phase.duration}
                      </div>
                      <h2 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 22, fontWeight: 900, color: "#fff" }}>
                        {phase.title}
                      </h2>
                    </div>
                  </div>

                  {/* Steps list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {phase.steps.map((s, si) => {
                      const key = `${activePhase}-${si}`;
                      const isDone = doneSteps[key];
                      return (
                        <div key={si}
                          className={`step-card ${activeStep === si ? "active" : ""} ${isDone ? "done" : ""}`}
                          style={{ "--pc": pc, "--pc-rgb": pcRgb }}
                          onClick={() => setActiveStep(si)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <span style={{
                                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                                background: isDone ? "rgba(74,222,128,0.2)" : `rgba(${pcRgb},0.15)`,
                                border: `1px solid ${isDone ? "#4ade8066" : pc + "44"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, color: isDone ? "#4ade80" : pc,
                                fontFamily: "'DM Mono', monospace", fontWeight: 700,
                              }}>
                                {isDone ? "✓" : si + 1}
                              </span>
                              <span style={{
                                fontFamily: "'Zen Kaku Gothic New', sans-serif",
                                fontSize: 14, fontWeight: 700,
                                color: isDone ? "#4ade80" : activeStep === si ? "#fff" : "#aaa",
                              }}>
                                {s.title}
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono', monospace" }}>
                              ⏱ {s.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active step detail */}
                  {step && (
                    <div style={{
                      background: "rgba(255,255,255,0.03)", border: `1px solid rgba(${pcRgb},0.25)`,
                      borderRadius: 12, padding: "24px 26px",
                    }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "flex-start", marginBottom: 16, gap: 12,
                      }}>
                        <div>
                          <div style={{ fontSize: 11, color: pc, letterSpacing: "0.12em", marginBottom: 6, textTransform: "uppercase" }}>
                            Step {activeStep + 1} / {phase.steps.length}
                          </div>
                          <h3 style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 20, fontWeight: 900, color: "#fff" }}>
                            {step.title}
                          </h3>
                        </div>
                        <span style={{ fontSize: 12, color: "#555", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                          ⏱ {step.time}
                        </span>
                      </div>

                      <p style={{ fontFamily: "'Zen Kaku Gothic New', sans-serif", fontSize: 14, color: "#aaa", lineHeight: 1.9, marginBottom: 16 }}>
                        {step.detail}
                      </p>

                      {step.url && (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          padding: "8px 14px", borderRadius: 6, marginBottom: 16,
                          background: `rgba(${pcRgb},0.08)`, border: `1px solid rgba(${pcRgb},0.25)`,
                          fontSize: 12, color: pc, fontFamily: "'DM Mono', monospace",
                        }}>
                          🔗 {step.url}
                        </div>
                      )}

                      {step.code && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
                            // サンプルコード
                          </div>
                          <div className="code-block" style={{ "--pc": pc }}>{step.code}</div>
                        </div>
                      )}

                      {/* Done button + navigation */}
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          className={`check-btn ${doneSteps[`${activePhase}-${activeStep}`] ? "done" : ""}`}
                          onClick={() => toggleDone(`${activePhase}-${activeStep}`)}>
                          {doneSteps[`${activePhase}-${activeStep}`] ? "✓ 完了済み" : "✓ 完了マーク"}
                        </button>
                        <button className="nav-btn"
                          disabled={activeStep === 0 && activePhase === 0}
                          onClick={() => {
                            if (activeStep > 0) setActiveStep(s => s - 1);
                            else if (activePhase > 0) { setActivePhase(p => p - 1); setActiveStep(SETUP_PHASES[activePhase - 1].steps.length - 1); }
                          }}>
                          ← 前のステップ
                        </button>
                        <button className="nav-btn"
                          disabled={activeStep === phase.steps.length - 1 && activePhase === SETUP_PHASES.length - 1}
                          onClick={() => {
                            if (activeStep < phase.steps.length - 1) setActiveStep(s => s + 1);
                            else if (activePhase < SETUP_PHASES.length - 1) { setActivePhase(p => p + 1); setActiveStep(0); }
                          }}>
                          次のステップ →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: 40, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#2a2a3a" }}>自分株式会社 — System Architecture v2.0</span>
          <span style={{ fontSize: 10, color: "#2a2a3a" }}>完了: {pct}% ({completedCount}/{totalSteps})</span>
        </footer>
      </div>
    </div>
  );
}
