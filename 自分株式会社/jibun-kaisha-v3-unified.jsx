import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════════

const PERSONAS = {
  ai_work: {
    id: "ai_work", label: "AI実務・自動化", icon: "⚡", color: "#00D4FF", rgb: "0,212,255",
    prompt: `あなたは25歳の営業DX担当者「Keigo」です。GAS・Python・AIエージェントを使って業務効率化を実践しています。
読者は「AIに興味はあるが使いこなせていない20代ビジネスパーソン」です。
トーン：丁寧すぎず、実体験ベースの等身大な語り口。専門用語は使うが必ず一言で解説する。
構成：①なぜ必要か（20代の悩み共感）→②Agent1調査・分析→③Agent2コード生成→④Agent3執筆・要約→⑤20代へのメッセージ→⑥アクション（収益）
記事末尾に必ず: <!-- meta: SEOメタ120字 --> <!-- tags: タグ1,タグ2,タグ3 --> <!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    affiliates: ["AIツール（SaaS）", "プログラミングスクール", "Kindle技術書"],
    presets: ["GASでSlack通知を自動化した話", "ChatGPT APIをExcelに繋いだら会議資料が10分で完成", "AIエージェントで日報生成を完全自動化してみた", "Cursorを使えばコードが書けなくても自動化できる"],
  },
  qol_tech: {
    id: "qol_tech", label: "20代QOL×テック", icon: "🎯", color: "#FF6B35", rgb: "255,107,53",
    prompt: `あなたは投資・ガジェット・カメラが趣味の25歳「Keigo」です。新NISA・ヴィンテージ品・ZV-E10を使ったVlogも発信しています。
読者は「お金と趣味を賢く両立したい20代」です。
トーン：友人に話しかけるような親しみやすさ。失敗談も正直に書く。
構成：①なぜ必要か（20代の悩み共感）→②Agent1調査・分析→③Agent2コード生成→④Agent3執筆・要約→⑤20代へのメッセージ→⑥アクション（収益）
記事末尾に必ず: <!-- meta: SEOメタ120字 --> <!-- tags: タグ1,タグ2,タグ3 --> <!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    affiliates: ["証券口座開設", "ガジェット（Amazon/楽天）", "中古買取サービス"],
    presets: ["新NISAを半年続けた正直な結果と反省点", "ZV-E10でVlogを始めて3ヶ月でわかったこと", "ヴィンテージ時計の相場をPythonで監視するシステム", "25歳のガジェット環境：本当に使ったものだけ紹介"],
  },
  jibun_kaisha: {
    id: "jibun_kaisha", label: "自分株式会社ログ", icon: "🏢", color: "#A855F7", rgb: "168,85,247",
    prompt: `あなたは「一人で会社のような仕組みを作る」実験をしている25歳「Keigo」です。AIで自動化・収益化の過程をリアルに公開しています。
読者は「副業・独立を考えている20代」です。
トーン：ビルドインパブリックスタイル。数字と失敗を隠さない。
構成：①なぜ必要か（20代の悩み共感）→②Agent1調査・分析→③Agent2コード生成→④Agent3執筆・要約→⑤20代へのメッセージ→⑥アクション（収益）
記事末尾に必ず: <!-- meta: SEOメタ120字 --> <!-- tags: タグ1,タグ2,タグ3 --> <!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    affiliates: ["サーバー契約", "Notion/ツール系", "有料note/Tips"],
    presets: ["個人ブログをAIで半自動化して月1万円稼ぐまでの記録", "自分株式会社の月次レポート：収益・学び・失敗まとめ", "NotionとClaudeを繋いでコンテンツ管理を自動化した", "ブログ記事をClaudeに書かせる仕組みと品質管理の実態"],
  },
};

const ARCH_NODES = [
  { id:"rss",    label:"RSS\nフィード",    icon:"📡", x:8,   y:8,   w:110, h:56, group:"input"  },
  { id:"manual", label:"手動\nテーマ入力", icon:"✏️", x:140, y:8,   w:110, h:56, group:"input"  },
  { id:"trend",  label:"トレンド\nAPI",    icon:"📈", x:272, y:8,   w:110, h:56, group:"input"  },
  { id:"orch",   label:"オーケストレーター\n（このシステム）",icon:"⚙️",x:110,y:110,w:170,h:60,group:"core"},
  { id:"ag1",    label:"Agent 1\n調査・分析",   icon:"🔍",x:8,  y:228,w:120,h:60,group:"agent" },
  { id:"ag2",    label:"Agent 2\nコード生成",   icon:"💻",x:150,y:228,w:120,h:60,group:"agent" },
  { id:"ag3",    label:"Agent 3\n執筆・要約",   icon:"✍️",x:292,y:228,w:120,h:60,group:"agent" },
  { id:"manus",  label:"Manus AI\nOpenClaw",   icon:"🤖",x:8,  y:344,w:120,h:52,group:"tool"  },
  { id:"claude", label:"Claude API\nCursor",   icon:"⚡",x:150,y:344,w:120,h:52,group:"tool"  },
  { id:"perp",   label:"Perplexity\nNotebookLM",icon:"📚",x:292,y:344,w:120,h:52,group:"tool"},
  { id:"fmt",    label:"Markdownフォーマッター\n+ SEO + アフィリエイト挿入",icon:"🎨",x:60,y:450,w:300,h:60,group:"core"},
  { id:"wp",     label:"WordPress\n（下書き保存）",icon:"🌐",x:8,  y:564,w:120,h:56,group:"output"},
  { id:"note",   label:"note / Tips\n（有料配信）",icon:"📝",x:150,y:564,w:120,h:56,group:"output"},
  { id:"sheets", label:"Google Sheets\n（ログ管理）",icon:"📊",x:292,y:564,w:120,h:56,group:"output"},
];
const ARCH_EDGES = [
  {from:"rss",to:"orch"},{from:"manual",to:"orch"},{from:"trend",to:"orch"},
  {from:"orch",to:"ag1"},{from:"orch",to:"ag2"},{from:"orch",to:"ag3"},
  {from:"ag1",to:"manus"},{from:"ag2",to:"claude"},{from:"ag3",to:"perp"},
  {from:"ag1",to:"fmt"},{from:"ag2",to:"fmt"},{from:"ag3",to:"fmt"},
  {from:"fmt",to:"wp"},{from:"fmt",to:"note"},{from:"fmt",to:"sheets"},
];
function nc(n){ return {x:n.x+n.w/2, y:n.y+n.h/2}; }

const NODE_INFO = {
  rss:    {title:"RSSフィード",    desc:"Feedly等でAI・DX・投資ニュースを購読。新着記事が自動でトピック候補になる。"},
  manual: {title:"手動テーマ入力", desc:"生成タブに直接テーマを入力する最もシンプルな起動方法。"},
  trend:  {title:"トレンドAPI",    desc:"Google Trends APIやSNSで旬のキーワードを取得（上級者向け）。"},
  orch:   {title:"オーケストレーター",desc:"このシステム本体。Claudeへのプロンプト設計・各エージェントへの指示・出力の統合を担当。"},
  ag1:    {title:"Agent 1：調査・分析",desc:"競合調査・市場規模・最新トレンドを調査するエージェント。Manus AI等に丸投げできる。"},
  ag2:    {title:"Agent 2：コード生成",desc:"GAS・Pythonを生成するエージェント。Claude APIやCursorが主な実装ツール。"},
  ag3:    {title:"Agent 3：執筆・要約",desc:"大量の資料・最新ニュースを5分でまとめる。PerplexityとNotebookLMを併用。"},
  manus:  {title:"Manus AI / OpenClaw",desc:"Web情報を自律的に収集・分析するAIエージェント。競合ブログや市場動向の調査に使う。"},
  claude: {title:"Claude API / Cursor",desc:"自然言語でコードを指示して生成。プログラミング未経験でも業務自動化スクリプトが作れる。"},
  perp:   {title:"Perplexity / NotebookLM",desc:"Perplexityは最新情報をリアルタイム検索。NotebookLMはPDFや資料を要約して知識化する。"},
  fmt:    {title:"Markdownフォーマッター",desc:"各エージェントの出力を統合してWordPress用Markdownに変換。SEOメタ・タグ・アフィリエイトリンクも自動挿入。"},
  wp:     {title:"WordPress",      desc:"メインブログ。GASからREST API経由で下書き自動保存。確認後ワンクリック公開。"},
  note:   {title:"note / Tips",    desc:"有料記事・有料マガジンの配信先。詳細版を有料提供してLTVを上げる。"},
  sheets: {title:"Google Sheets",  desc:"生成記事のタイトル・文字数・公開日・月間PV・収益をGASで自動記録。KPIを可視化。"},
};

const SETUP_PHASES = [
  { phase:"Phase 1", title:"WordPress基盤構築",       duration:"1〜2時間", color:"#00D4FF", rgb:"0,212,255",
    steps:[
      {title:"レンタルサーバー契約",time:"15分",url:"conoha.jp/wing",code:null,
       detail:"ConoHa WINGの「WINGパック」12ヶ月プランを契約（月1,200円〜）。契約時に独自ドメインが1つ無料でもらえる。"},
      {title:"独自ドメイン取得",time:"5分",url:null,code:null,
       detail:".comまたは.jpを推奨。ブランド名（例：jibun-kaisha.com）で取得。サーバー契約時の無料ドメインを使用するのが最安。"},
      {title:"WordPressインストール",time:"10分",url:null,code:null,
       detail:"ConoHa管理画面から「かんたんWordPressインストール」を実行。ユーザー名・パスワードをメモしておく。"},
      {title:"テーマ・プラグイン設定",time:"30分",url:"swell-theme.com",code:null,
       detail:"SWELLをインストール後、SEO SIMPLE PACK・XML Sitemaps・Akismetの3プラグインを導入。"},
    ]},
  { phase:"Phase 2", title:"Claude APIキー取得",       duration:"30分",    color:"#A855F7", rgb:"168,85,247",
    steps:[
      {title:"Anthropicアカウント作成",time:"5分",url:"console.anthropic.com",code:null,
       detail:"console.anthropic.comにアクセスし、Googleアカウントでサインアップ。メール認証を完了させる。"},
      {title:"APIキーを発行",time:"5分",url:null,code:null,
       detail:"ダッシュボード → 「API Keys」→「Create Key」。名前は「blog-engine」等わかりやすく。キーは再表示不可なので必ずメモ。"},
      {title:"クレジットチャージ",time:"5分",url:null,code:null,
       detail:"「Billing」→「Add credit」で$5〜10チャージ。月500〜3,000円が目安（記事50〜150本分）。"},
      {title:"環境変数に設定（ローカル運用時）",time:"5分",url:null,
       code:"# .envファイルに保存\nANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx\n\n# またはターミナルで設定\nexport ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx",
       detail:"Claude.ai上でこのシステムを動かす場合はAPIキーの設定不要。ローカルでNext.js等に組み込む場合のみ必要。"},
    ]},
  { phase:"Phase 3", title:"AIエージェントツール連携",  duration:"1時間",   color:"#FF6B35", rgb:"255,107,53",
    steps:[
      {title:"Perplexity Pro登録（Agent 3）",time:"10分",url:"perplexity.ai",code:null,
       detail:"perplexity.aiでアカウント作成。Proプラン（月$20）に加入。無料版でも動くがPro版は検索精度・速度が大幅に向上。"},
      {title:"NotebookLM設定（Agent 3）",time:"15分",url:"notebooklm.google.com",code:null,
       detail:"Googleアカウントでログイン。新しいノートブックを作成し、参考資料（PDF・URL）を登録しておく。"},
      {title:"Cursor設定（Agent 2・任意）",time:"20分",url:"cursor.com",code:null,
       detail:"cursor.comからインストール。GAS・PythonコードをAIが補完・生成。「Composer」機能で自然言語からコードを生成できる。"},
      {title:"GASプロジェクト準備",time:"10分",url:"script.google.com",
       code:"// GAS: WordPressに自動投稿\nfunction postToWordPress(title, content) {\n  const WP_URL = 'https://your-blog.com/wp-json/wp/v2/posts';\n  const USERNAME = 'your_username';\n  const APP_PASS = 'xxxx xxxx xxxx xxxx';\n  const options = {\n    method: 'POST',\n    headers: {\n      'Authorization': 'Basic ' + Utilities.base64Encode(USERNAME+':'+APP_PASS),\n      'Content-Type': 'application/json'\n    },\n    payload: JSON.stringify({title, content, status:'draft'})\n  };\n  return UrlFetchApp.fetch(WP_URL, options);\n}",
       detail:"script.google.comで新しいプロジェクトを作成。上記コードを貼り付けてWordPress自動投稿の準備をする。"},
    ]},
  { phase:"Phase 4", title:"WordPress自動投稿設定",     duration:"45分",    color:"#10b981", rgb:"16,185,129",
    steps:[
      {title:"アプリケーションパスワード発行",time:"5分",url:null,code:null,
       detail:"WordPress管理画面 → ユーザー → プロフィール → 「アプリケーションパスワード」で「blog-engine」という名前で生成。表示された文字列をメモ。"},
      {title:"REST API動作確認",time:"5分",url:null,
       code:"# curlで動作テスト\ncurl -X GET https://your-blog.com/wp-json/wp/v2/posts \\\n  -H 'Content-Type: application/json'\n# 成功するとJSONが返ってくる",
       detail:"ブラウザで https://your-blog.com/wp-json/wp/v2/posts にアクセスしてJSONが返れば正常。"},
      {title:"GASトリガー設定",time:"10分",url:null,code:null,
       detail:"GASエディタ → 時計アイコン → 新しいトリガー追加。「時間ベース」→「週タイマー」で月・水・金の朝9時に実行。"},
      {title:"Sheetsでログ管理",time:"20分",url:null,
       code:"// GAS: スプレッドシートに記録\nfunction logArticle(title, charCount, status) {\n  const sheet = SpreadsheetApp\n    .openById('YOUR_SHEET_ID')\n    .getSheetByName('記事ログ');\n  sheet.appendRow([new Date(), title, charCount, status, '']);\n}",
       detail:"生成記事のタイトル・文字数・公開日・収益を記録するシートを作成。GASから自動書き込みされる仕組みにする。"},
    ]},
  { phase:"Phase 5", title:"アフィリエイト設定",         duration:"2時間",   color:"#f97316", rgb:"249,115,22",
    steps:[
      {title:"Googleアドセンス申請",time:"30分",url:"adsense.google.com",code:null,
       detail:"記事10本以上になったら申請。審査通過後にサイトにコードを貼る（SWELL専用設定箇所あり）。審査は通常1〜2週間。"},
      {title:"Amazonアソシエイト登録",time:"30分",url:"affiliate.amazon.co.jp",code:null,
       detail:"ガジェット・書籍・カメラ機材の紹介に使う。承認後、各商品のアフィリエイトリンクを生成エンジンに追記する。"},
      {title:"A8.net登録",time:"30分",url:"a8.net",code:null,
       detail:"AIツール・金融系（証券口座・NISA）のアフィリエイト広告を取得。単価が高く（1件1,000〜10,000円）AI系記事と相性が良い。"},
      {title:"アフィリエイトリンクをシステムに組み込み",time:"20分",url:null,
       code:"// SYSTEM_PROMPTに追記する内容例\nconst AFFILIATE = `\n記事の「アクション」セクションで以下を文脈に合わせて紹介：\n- Claude Pro: https://claude.ai\n- Perplexity: https://perplexity.ai\n- ConoHa WING: https://conoha.jp/wing\n- SBI証券（新NISA）: A8経由リンク\n自然な文章で押し売り感なく紹介すること。\n`;",
       detail:"生成エンジンのシステムプロンプトに各ASPのリンクを追記。AIが文脈に合わせて自動挿入する。"},
    ]},
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function parseArticle(raw) {
  const titleM   = raw.match(/^#\s+(.+)/m);
  const metaM    = raw.match(/<!--\s*meta:\s*([\s\S]*?)\s*-->/);
  const tagsM    = raw.match(/<!--\s*tags:\s*([\s\S]*?)\s*-->/);
  const affM     = raw.match(/<!--\s*affiliate:\s*([\s\S]*?)\s*-->/);
  const body     = raw.replace(/^#\s+.+\n?/m,"").replace(/<!--[\s\S]*?-->/g,"").trim();
  return {
    title:      titleM ? titleM[1].trim() : "記事",
    meta:       metaM  ? metaM[1].trim()  : "",
    tags:       tagsM  ? tagsM[1].trim().split(",").map(t=>t.trim()) : [],
    affiliates: affM   ? affM[1].trim().split(",").map(a=>{ const [n,d]=a.split("|"); return {name:n?.trim(),desc:d?.trim()}; }) : [],
    body, charCount: body.replace(/[#*`\[\]\(\)\n]/g,"").length, raw,
  };
}

function inlineFmt(text, c="#00D4FF") {
  return text
    .replace(/\*\*(.*?)\*\*/g,`<strong style="color:#fff;font-weight:700">$1</strong>`)
    .replace(/`(.*?)`/g,`<code style="background:rgba(0,0,0,0.45);padding:2px 6px;border-radius:3px;font-size:12px;color:#7ee787;font-family:'DM Mono',monospace">$1</code>`)
    .replace(/\[(.*?)\]\((.*?)\)/g,`<a href="$2" style="color:#60a5fa;text-decoration:underline" target="_blank">$1</a>`);
}

function RenderMd({ text, color }) {
  if (!text) return null;
  const lines = text.split("\n");
  const els = []; let code=false, codeLines=[], lang="";
  for (let i=0;i<lines.length;i++) {
    const L=lines[i];
    if (L.startsWith("```")) {
      if (code) {
        els.push(<pre key={i} style={{background:"rgba(0,0,0,0.55)",padding:"14px 16px",borderRadius:8,overflowX:"auto",margin:"12px 0",borderLeft:`3px solid ${color}`,fontSize:12,lineHeight:1.7}}>
          {lang&&<div style={{fontSize:10,color,marginBottom:6,letterSpacing:"0.1em"}}>{lang.toUpperCase()}</div>}
          <code style={{color:"#a5d6a7",fontFamily:"'DM Mono',monospace"}}>{codeLines.join("\n")}</code>
        </pre>);
        code=false; codeLines=[]; lang="";
      } else { code=true; lang=L.replace("```","").trim(); }
      continue;
    }
    if (code) { codeLines.push(L); continue; }
    if (L.startsWith("## ")) {
      els.push(<h2 key={i} style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:19,fontWeight:900,color,margin:"28px 0 12px",paddingBottom:7,borderBottom:`1px solid ${color}33`}}>{L.replace("## ","")}</h2>);
    } else if (L.startsWith("### ")) {
      els.push(<h3 key={i} style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:15,fontWeight:700,color:"#e8e8f0",margin:"18px 0 8px"}}>{L.replace("### ","")}</h3>);
    } else if (L.startsWith("- ")||L.startsWith("* ")) {
      els.push(<div key={i} style={{display:"flex",gap:10,margin:"5px 0",paddingLeft:8}}>
        <span style={{color,flexShrink:0,marginTop:2}}>›</span>
        <p style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:14,lineHeight:1.9,color:"#c8c8d8",margin:0}} dangerouslySetInnerHTML={{__html:inlineFmt(L.replace(/^[-*]\s/,""),color)}}/>
      </div>);
    } else if (L.match(/^\d+\.\s/)) {
      const [n,...r]=L.split(/\.\s/);
      els.push(<div key={i} style={{display:"flex",gap:12,margin:"7px 0",paddingLeft:8}}>
        <span style={{color,fontSize:12,fontFamily:"'DM Mono',monospace",minWidth:20,fontWeight:700,marginTop:3}}>{n}.</span>
        <p style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:14,lineHeight:1.9,color:"#c8c8d8",margin:0}} dangerouslySetInnerHTML={{__html:inlineFmt(r.join(". "),color)}}/>
      </div>);
    } else if (L.trim()==="") {
      els.push(<div key={i} style={{height:7}}/>);
    } else {
      els.push(<p key={i} style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:14,lineHeight:1.95,color:"#c8c8d8",margin:"5px 0"}} dangerouslySetInnerHTML={{__html:inlineFmt(L,color)}}/>);
    }
  }
  return <>{els}</>;
}

function ArchDiagram({ onNodeClick, activeNode }) {
  const W=420, H=660;
  function edgePath(e) {
    const f=ARCH_NODES.find(n=>n.id===e.from), t=ARCH_NODES.find(n=>n.id===e.to);
    if(!f||!t) return "";
    const fc=nc(f), tc=nc(t), dy=(tc.y-fc.y)*0.45;
    return `M${fc.x},${fc.y+f.h/2} C${fc.x},${fc.y+f.h/2+dy} ${tc.x},${tc.y-t.h/2-dy} ${tc.x},${tc.y-t.h/2}`;
  }
  const gColors={input:"#64748b",core:"#00D4FF",agent:"#a855f7",tool:"#444",output:"#3b82f6"};
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto"}}>
      <defs>
        <marker id="ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.2)"/></marker>
        <marker id="ar2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#00D4FF"/></marker>
        <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d0d1a"/><stop offset="100%" stopColor="#060610"/></linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#bg2)" rx="12"/>
      {Array.from({length:22}).map((_,i)=><line key={"gv"+i} x1={i*20} y1={0} x2={i*20} y2={H} stroke="rgba(255,255,255,0.022)" strokeWidth="1"/>)}
      {Array.from({length:34}).map((_,i)=><line key={"gh"+i} x1={0} y1={i*20} x2={W} y2={i*20} stroke="rgba(255,255,255,0.022)" strokeWidth="1"/>)}
      {[{y:20,l:"INPUT"},{y:124,l:"ORCHESTRATOR"},{y:240,l:"AI AGENTS"},{y:356,l:"TOOLS"},{y:462,l:"FORMATTER"},{y:576,l:"OUTPUT"}].map(r=>(
        <text key={r.l} x={W-8} y={r.y} textAnchor="end" fill="rgba(255,255,255,0.1)" fontSize="9" fontFamily="'DM Mono',monospace" letterSpacing="0.1em">{r.l}</text>
      ))}
      {ARCH_EDGES.map((e,i)=>{
        const act=activeNode&&(activeNode===e.from||activeNode===e.to);
        return <path key={i} d={edgePath(e)} fill="none" stroke={act?"#00D4FF":"rgba(255,255,255,0.1)"} strokeWidth={act?1.5:1} strokeDasharray={act?"none":"4 3"} markerEnd={act?"url(#ar2)":"url(#ar)"} style={{transition:"stroke 0.3s"}}/>;
      })}
      {ARCH_NODES.map(node=>{
        const act=activeNode===node.id;
        const c=gColors[node.group];
        return (
          <g key={node.id} onClick={()=>onNodeClick(node.id)} style={{cursor:"pointer"}}>
            <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="8"
              fill={act?c+"22":"rgba(255,255,255,0.035)"} stroke={act?c:"rgba(255,255,255,0.09)"} strokeWidth={act?1.5:1}
              style={{transition:"all 0.25s",filter:act?`drop-shadow(0 0 6px ${c}88)`:undefined}}/>
            <text x={node.x+10} y={node.y+18} fontSize="13" dominantBaseline="middle">{node.icon}</text>
            {node.label.split("\n").map((line,li)=>(
              <text key={li} x={node.x+node.w/2} y={node.y+(node.h/2)-5+li*13} textAnchor="middle" dominantBaseline="middle"
                fill={act?c:"rgba(255,255,255,0.65)"} fontSize="10" fontFamily="'Zen Kaku Gothic New',sans-serif"
                fontWeight={act?"700":"400"} style={{transition:"fill 0.25s"}}>{line}</text>
            ))}
          </g>
        );
      })}
      {[["INPUT","#64748b"],["CORE","#00D4FF"],["AGENT","#a855f7"],["TOOL","#666"],["OUTPUT","#3b82f6"]].map(([k,v],i)=>(
        <g key={k} transform={`translate(${8+i*80},${H-18})`}>
          <rect width="10" height="10" rx="2" fill={v+"44"} stroke={v} strokeWidth="1"/>
          <text x="14" y="9" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="'DM Mono',monospace">{k}</text>
        </g>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

const PROGRESS_STEPS = [
  [12,"Claude に接続中..."],
  [28,"Agent 1: 調査・分析セクション生成中..."],
  [45,"Agent 2: コード生成セクション生成中..."],
  [62,"Agent 3: 執筆・要約セクション生成中..."],
  [76,"20代へのメッセージを生成中..."],
  [88,"アフィリエイト導線を最適化中..."],
  [95,"SEOメタデータを生成中..."],
];

export default function App() {
  // ── navigation
  const [page, setPage] = useState("generator"); // generator | preview | arch | setup | roi

  // ── generator state
  const [persona,  setPersona]  = useState("ai_work");
  const [topic,    setTopic]    = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [article,  setArticle]  = useState(null);
  const [error,    setError]    = useState("");
  const [progress, setProgress] = useState(0);
  const [progLabel,setProgLabel]= useState("");
  const [history,  setHistory]  = useState([]);
  const [copied,   setCopied]   = useState(false);
  const progRef = useRef(null);

  // ── arch state
  const [activeNode, setActiveNode] = useState(null);

  // ── setup state
  const [activePhase, setActivePhase] = useState(0);
  const [activeStep,  setActiveStep]  = useState(0);
  const [doneSteps,   setDoneSteps]   = useState({});

  const p = PERSONAS[persona];
  const totalSetupSteps = SETUP_PHASES.reduce((a,ph)=>a+ph.steps.length,0);
  const completedCount  = Object.keys(doneSteps).length;
  const setupPct        = Math.round((completedCount/totalSetupSteps)*100);

  // ── progress animation
  const startProg = useCallback(()=>{
    let idx=0;
    progRef.current = setInterval(()=>{
      if(idx<PROGRESS_STEPS.length){
        setProgress(PROGRESS_STEPS[idx][0]);
        setProgLabel(PROGRESS_STEPS[idx][1]);
        idx++;
      }
    },900);
  },[]);
  const stopProg = useCallback(()=>{
    if(progRef.current) clearInterval(progRef.current);
    setProgress(100); setProgLabel("生成完了！");
  },[]);

  // ── generate
  const generate = async () => {
    if(!topic.trim()) return;
    setLoading(true); setError(""); setArticle(null); setProgress(0);
    setProgLabel("Claude に接続中..."); startProg();
    const kw = keywords.trim()?`\nSEOキーワード: ${keywords}`:"";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          system: p.prompt,
          messages:[{role:"user",content:`以下のテーマでブログ記事を生成してください。\nテーマ: ${topic}${kw}\nアフィリエイト想定: ${p.affiliates.join("、")}\n全セクション（導入・Agent1・Agent2・Agent3・20代へのメッセージ・アクション）を必ず含め、Markdown形式で出力してください。文字数2000〜3000字。`}],
        }),
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error.message);
      const raw = data.content?.map(b=>b.text||"").join("")||"";
      const parsed = parseArticle(raw);
      stopProg();
      setArticle(parsed);
      setHistory(prev=>[{persona,topic,parsed,ts:Date.now()},...prev.slice(0,4)]);
      setPage("preview");
    } catch(e) {
      stopProg(); setError("生成に失敗しました: "+e.message);
    } finally { setLoading(false); }
  };

  const toggleDone = key => setDoneSteps(prev=>{ const n={...prev}; n[key]?delete n[key]:(n[key]=true); return n; });
  const handleCopy = text => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const NAV = [
    {id:"generator", label:"⚡ 生成"},
    {id:"preview",   label:"📄 プレビュー"},
    {id:"arch",      label:"🗺 構成図"},
    {id:"setup",     label:"🛠 構築手順"},
    {id:"roi",       label:"💰 費用対効果"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#07070f",color:"#e8e8f0",fontFamily:"'DM Mono',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Zen+Kaku+Gothic+New:wght@300;400;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .scanline{position:fixed;top:0;left:0;width:100%;height:100%;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.007) 3px,rgba(0,212,255,0.007) 4px);pointer-events:none;z-index:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes blink{50%{opacity:0}}
        .nav-btn{padding:8px 16px;cursor:pointer;border:1px solid rgba(255,255,255,0.07);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.07em;background:transparent;color:#555;transition:all 0.2s;white-space:nowrap;}
        .nav-btn:hover{color:#aaa;border-color:rgba(255,255,255,0.15);}
        .nav-btn.active{background:rgba(0,212,255,0.1);color:#00D4FF;border-color:rgba(0,212,255,0.35);}
        .persona-btn{cursor:pointer;padding:10px 14px;border-radius:5px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);transition:all 0.2s;font-family:'Zen Kaku Gothic New',sans-serif;font-size:13px;text-align:left;}
        .persona-btn:hover{background:rgba(255,255,255,0.05);}
        .persona-btn.active{border-color:var(--pc);background:rgba(var(--pcr),0.1);color:var(--pc);}
        .preset-pill{cursor:pointer;padding:6px 13px;border-radius:20px;border:1px solid rgba(255,255,255,0.07);font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;background:transparent;color:#777;transition:all 0.2s;text-align:left;}
        .preset-pill:hover{border-color:var(--pc);color:var(--pc);background:rgba(var(--pcr),0.07);}
        .gen-btn{width:100%;padding:17px;cursor:pointer;background:linear-gradient(135deg,rgba(var(--pcr),0.14),rgba(var(--pcr),0.07));border:1px solid rgba(var(--pcr),0.4);border-radius:8px;color:var(--pc);font-family:'Zen Kaku Gothic New',sans-serif;font-size:15px;font-weight:900;letter-spacing:0.08em;transition:all 0.25s;overflow:hidden;}
        .gen-btn:not(:disabled):hover{background:linear-gradient(135deg,rgba(var(--pcr),0.24),rgba(var(--pcr),0.16));transform:translateY(-2px);box-shadow:0 8px 28px rgba(var(--pcr),0.18);}
        .gen-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .ibox{width:100%;padding:12px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);border-radius:7px;color:#e8e8f0;font-family:'Zen Kaku Gothic New',sans-serif;font-size:14px;transition:border-color 0.2s;resize:vertical;}
        .ibox:focus{outline:none;border-color:rgba(var(--pcr),0.5);}
        .ibox::placeholder{color:rgba(255,255,255,0.2);}
        .pbar-inner{height:100%;background:linear-gradient(90deg,var(--pc),rgba(var(--pcr),0.6));border-radius:4px;transition:width 0.8s ease;box-shadow:0 0 10px rgba(var(--pcr),0.4);}
        .card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:20px 22px;}
        .phase-tab{padding:10px 14px;cursor:pointer;text-align:left;border:1px solid rgba(255,255,255,0.06);border-radius:6px;font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;background:rgba(255,255,255,0.02);color:#666;transition:all 0.2s;width:100%;}
        .phase-tab:hover{color:#ccc;border-color:rgba(255,255,255,0.14);}
        .phase-tab.active{color:#fff;background:rgba(var(--pcr),0.1);border-color:var(--pc);}
        .step-card{border:1px solid rgba(255,255,255,0.07);border-radius:7px;padding:12px 14px;cursor:pointer;transition:all 0.2s;background:rgba(255,255,255,0.02);}
        .step-card:hover{border-color:rgba(255,255,255,0.16);background:rgba(255,255,255,0.04);}
        .step-card.sactive{border-color:var(--pc);background:rgba(var(--pcr),0.06);}
        .step-card.sdone{border-color:rgba(74,222,128,0.3);background:rgba(74,222,128,0.04);}
        .code-blk{background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:14px 16px;overflow-x:auto;border-left:3px solid var(--pc);font-family:'DM Mono',monospace;font-size:12px;color:#a5d6a7;line-height:1.75;white-space:pre;}
        .done-btn{padding:10px 18px;cursor:pointer;border-radius:6px;font-family:'Zen Kaku Gothic New',sans-serif;font-size:13px;font-weight:700;transition:all 0.2s;border:1px solid rgba(74,222,128,0.4);background:rgba(74,222,128,0.1);color:#4ade80;}
        .done-btn:hover{background:rgba(74,222,128,0.2);}
        .done-btn.isdone{background:rgba(74,222,128,0.25);color:#fff;}
        .snav-btn{padding:9px 16px;cursor:pointer;border:1px solid rgba(255,255,255,0.09);border-radius:6px;background:rgba(255,255,255,0.03);color:#aaa;font-family:'Zen Kaku Gothic New',sans-serif;font-size:13px;transition:all 0.2s;}
        .snav-btn:hover:not(:disabled){border-color:rgba(255,255,255,0.28);color:#fff;}
        .snav-btn:disabled{opacity:0.3;cursor:not-allowed;}
        .copy-btn{padding:8px 15px;cursor:pointer;border:1px solid rgba(255,255,255,0.11);border-radius:5px;background:transparent;color:#888;font-family:'DM Mono',monospace;font-size:11px;transition:all 0.2s;}
        .copy-btn:hover{border-color:#fff;color:#fff;}
        .aff-card{background:rgba(255,200,50,0.05);border:1px solid rgba(255,200,50,0.15);border-radius:8px;padding:14px 16px;font-family:'Zen Kaku Gothic New',sans-serif;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
      `}</style>
      <style>{`
        :root{--pc:${p.color};--pcr:${p.rgb};}
      `}</style>
      <div className="scanline"/>

      <div style={{position:"relative",zIndex:1,maxWidth:1160,margin:"0 auto",padding:"24px 18px"}}>

        {/* ── HEADER ── */}
        <header style={{marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:14,marginBottom:16}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#00D4FF",boxShadow:"0 0 10px #00D4FF",animation:"pulse 2s ease-in-out infinite"}}/>
                <span style={{fontSize:10,color:"#3a3a5a",letterSpacing:"0.2em",textTransform:"uppercase"}}>
                  自分株式会社 — Blog Automation Engine v3.0
                </span>
              </div>
              <h1 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:"clamp(22px,3.8vw,36px)",fontWeight:900,color:"#fff",lineHeight:1.1,letterSpacing:"-0.02em"}}>
                AI<span style={{color:"#00D4FF"}}>ブログ</span>自動化<span style={{color:"#00D4FF"}}>ダッシュボード</span>
              </h1>
            </div>
            {/* progress pill */}
            <div style={{background:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:20,padding:"6px 14px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:11,color:"#4ade80",fontFamily:"'DM Mono',monospace"}}>構築進捗</span>
              <span style={{fontSize:14,color:"#4ade80",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{setupPct}%</span>
              <span style={{fontSize:11,color:"#2d6a3f",fontFamily:"'DM Mono',monospace"}}>{completedCount}/{totalSetupSteps}</span>
            </div>
          </div>
          {/* nav */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {NAV.map(n=>(
              <button key={n.id} className={`nav-btn ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>{n.label}</button>
            ))}
          </div>
          {/* global progress bar */}
          <div style={{marginTop:14,height:3,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:4,width:`${setupPct}%`,background:"linear-gradient(90deg,#00D4FF,#4ade80)",transition:"width 0.5s ease"}}/>
          </div>
        </header>

        {/* ════════════════ GENERATOR ════════════════ */}
        {page==="generator" && (
          <div style={{display:"grid",gridTemplateColumns:"330px 1fr",gap:22,alignItems:"start"}}>
            {/* left */}
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {/* section overview */}
              <div style={{background:`rgba(${p.rgb},0.04)`,border:`1px solid rgba(${p.rgb},0.13)`,borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:10,textTransform:"uppercase"}}>// 自動生成セクション</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {["①導入","②Agent1調査","③Agent2コード","④Agent3執筆","⑤20代へ","⑥アクション"].map(s=>(
                    <span key={s} style={{padding:"4px 10px",borderRadius:20,background:`rgba(${p.rgb},0.08)`,border:`1px solid rgba(${p.rgb},0.2)`,fontSize:11,color:p.color,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{s}</span>
                  ))}
                </div>
              </div>
              {/* personas */}
              <div>
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:9,textTransform:"uppercase"}}>// コンテンツモデル</div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {Object.values(PERSONAS).map(pr=>(
                    <button key={pr.id} className={`persona-btn ${persona===pr.id?"active":""}`}
                      style={{"--pc":pr.color,"--pcr":pr.rgb}}
                      onClick={()=>{setPersona(pr.id);setTopic("");setArticle("");}}>
                      <span style={{marginRight:7}}>{pr.icon}</span>{pr.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* affiliates */}
              <div>
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:7,textTransform:"uppercase"}}>// 想定アフィリエイト</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {p.affiliates.map(a=>(
                    <span key={a} style={{padding:"3px 9px",borderRadius:12,background:`rgba(${p.rgb},0.08)`,border:`1px solid rgba(${p.rgb},0.2)`,fontSize:11,color:p.color,fontFamily:"'DM Mono',monospace"}}>{a}</span>
                  ))}
                </div>
              </div>
              {/* topic */}
              <div>
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:8,textTransform:"uppercase"}}>// 記事テーマ</div>
                <textarea className="ibox" rows={3} placeholder="例：AIエージェントを部下として使いこなす方法" value={topic} onChange={e=>setTopic(e.target.value)}/>
              </div>
              {/* presets */}
              <div>
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:7,textTransform:"uppercase"}}>// プリセット</div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {p.presets.map(pr=>(
                    <button key={pr} className="preset-pill" onClick={()=>setTopic(pr)}>→ {pr}</button>
                  ))}
                </div>
              </div>
              {/* keywords */}
              <div>
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:7,textTransform:"uppercase"}}>// SEOキーワード（任意）</div>
                <input className="ibox" placeholder="例：AIエージェント, 20代 副業, 業務効率化" value={keywords} onChange={e=>setKeywords(e.target.value)}/>
              </div>
              {/* gen btn */}
              <button className="gen-btn" onClick={generate} disabled={loading||!topic.trim()}>
                {loading?"生成中...":"▶ 記事を完全自動生成する"}
              </button>
              {loading&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:12,color:p.color,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{progLabel}</span>
                    <span style={{fontSize:12,color:"#555"}}>{progress}%</span>
                  </div>
                  <div style={{height:5,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
                    <div className="pbar-inner" style={{width:`${progress}%`}}/>
                  </div>
                </div>
              )}
              {error&&<div style={{padding:12,borderRadius:8,background:"rgba(255,60,60,0.08)",border:"1px solid rgba(255,60,60,0.25)",color:"#ff8080",fontSize:13,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>⚠ {error}</div>}
            </div>
            {/* right */}
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="card">
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:10,textTransform:"uppercase"}}>// AIペルソナ</div>
                <div style={{color:p.color,fontFamily:"'Zen Kaku Gothic New',sans-serif",fontWeight:700,fontSize:15,marginBottom:8}}>Keigo / 25歳 営業DX担当</div>
                {["都内勤務・副業で自動化を実験中","GAS・Python独学","新NISA・カメラ・ヴィンテージ品が趣味","等身大の失敗談＋実数値で語る文体"].map((t,i)=>(
                  <div key={i} style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13,color:"#888",padding:"4px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none"}}>· {t}</div>
                ))}
              </div>
              {history.length>0&&(
                <div className="card">
                  <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:10,textTransform:"uppercase"}}>// 生成履歴</div>
                  {history.map((h,i)=>(
                    <div key={i} style={{padding:"9px 0",borderBottom:i<history.length-1?"1px solid rgba(255,255,255,0.04)":"none",cursor:"pointer"}}
                      onClick={()=>{setArticle(h.parsed);setPage("preview");}}>
                      <div style={{fontSize:12,color:PERSONAS[h.persona].color,marginBottom:2}}>{h.parsed.title.slice(0,38)}…</div>
                      <div style={{fontSize:11,color:"#444",fontFamily:"'DM Mono',monospace"}}>{new Date(h.ts).toLocaleTimeString("ja-JP")} · {h.parsed.charCount.toLocaleString()}字</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="card" style={{background:`rgba(${p.rgb},0.04)`,border:`1px solid rgba(${p.rgb},0.15)`}}>
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:10,textTransform:"uppercase"}}>// 使い方</div>
                {["テーマを入力 or プリセット選択","▶ 記事を完全自動生成 をクリック","「プレビュー」タブで確認","MarkdownをコピーしてWordPressに貼り付け"].map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none"}}>
                    <span style={{color:p.color,fontSize:11,fontFamily:"'DM Mono',monospace",minWidth:18}}>{i+1}.</span>
                    <span style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13,color:"#888"}}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ PREVIEW ════════════════ */}
        {page==="preview" && (
          <div>
            {!article?(
              <div style={{height:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"1px dashed rgba(255,255,255,0.07)",borderRadius:12,color:"#444"}}>
                <div style={{fontSize:40,marginBottom:12,opacity:0.3}}>📄</div>
                <div style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:14,marginBottom:16}}>まだ記事が生成されていません</div>
                <button style={{padding:"8px 20px",cursor:"pointer",background:`rgba(${p.rgb},0.1)`,border:`1px solid rgba(${p.rgb},0.3)`,borderRadius:6,color:p.color,fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13}} onClick={()=>setPage("generator")}>→ 生成タブへ</button>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"1fr 270px",gap:22,alignItems:"start"}}>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14,marginBottom:20}}>
                    <div>
                      <div style={{fontSize:10,color:"#555",letterSpacing:"0.1em",marginBottom:7}}>// 生成記事プレビュー</div>
                      <h1 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:"clamp(18px,2.5vw,24px)",fontWeight:900,color:"#fff",lineHeight:1.4}}>{article.title}</h1>
                    </div>
                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      <button className="copy-btn" onClick={()=>handleCopy(article.raw)}>{copied?"✓ コピー済":"Markdownコピー"}</button>
                      <button className="copy-btn" onClick={()=>setPage("generator")}>← 戻る</button>
                    </div>
                  </div>
                  {/* stats */}
                  <div style={{display:"flex",gap:10,marginBottom:18}}>
                    {[{k:"文字数",v:article.charCount.toLocaleString()+"字"},{k:"読了",v:Math.ceil(article.charCount/500)+"分"},{k:"セクション",v:"6/6"},{k:"SEO",v:article.meta?"✓ あり":"—"}].map(s=>(
                      <div key={s.k} style={{flex:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:7,padding:"10px 12px"}}>
                        <div style={{fontSize:10,color:"#555",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",marginBottom:4}}>{s.k}</div>
                        <div style={{fontSize:13,color:p.color,fontFamily:"'DM Mono',monospace"}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"24px 28px",maxHeight:"68vh",overflowY:"auto"}}>
                    <RenderMd text={article.body} color={p.color}/>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {article.meta&&(
                    <div className="card">
                      <div style={{fontSize:10,color:"#555",letterSpacing:"0.1em",marginBottom:8,textTransform:"uppercase"}}>// SEOメタ</div>
                      <p style={{fontSize:12,color:"#888",fontFamily:"'Zen Kaku Gothic New',sans-serif",lineHeight:1.7}}>{article.meta}</p>
                    </div>
                  )}
                  {article.tags.length>0&&(
                    <div className="card">
                      <div style={{fontSize:10,color:"#555",letterSpacing:"0.1em",marginBottom:9,textTransform:"uppercase"}}>// タグ</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {article.tags.map((t,i)=>(
                          <span key={i} style={{padding:"3px 9px",borderRadius:12,background:`rgba(${p.rgb},0.08)`,border:`1px solid rgba(${p.rgb},0.2)`,fontSize:11,color:p.color,fontFamily:"'DM Mono',monospace"}}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {article.affiliates.length>0&&(
                    <div className="aff-card">
                      <div style={{fontSize:10,color:"#888",letterSpacing:"0.1em",marginBottom:9,textTransform:"uppercase"}}>💰 アフィリエイト導線</div>
                      {article.affiliates.map((a,i)=>(
                        <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<article.affiliates.length-1?"1px solid rgba(255,200,50,0.1)":"none"}}>
                          <div style={{fontSize:13,color:"#fcd34d",fontWeight:700,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{a.name}</div>
                          {a.desc&&<div style={{fontSize:11,color:"#888",marginTop:2,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{a.desc}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="card">
                    <div style={{fontSize:10,color:"#555",letterSpacing:"0.1em",marginBottom:9,textTransform:"uppercase"}}>// WordPress投稿手順</div>
                    {["Markdownコピー","WP管理画面→新規投稿","コードエディタに貼り付け","アイキャッチ画像を設定","アフィリエイトリンクを挿入","公開 or スケジュール設定"].map((s,i)=>(
                      <div key={i} style={{display:"flex",gap:9,padding:"6px 0",borderBottom:i<5?"1px solid rgba(255,255,255,0.04)":"none"}}>
                        <span style={{color:p.color,fontSize:11,fontFamily:"'DM Mono',monospace",minWidth:18}}>{i+1}.</span>
                        <span style={{fontSize:12,color:"#888",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ ARCH ════════════════ */}
        {page==="arch" && (
          <div style={{display:"grid",gridTemplateColumns:"420px 1fr",gap:22,alignItems:"start"}}>
            <div style={{borderRadius:12,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)",boxShadow:"0 0 50px rgba(0,212,255,0.04)"}}>
              <ArchDiagram onNodeClick={id=>setActiveNode(prev=>prev===id?null:id)} activeNode={activeNode}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {activeNode?(
                <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid rgba(0,212,255,0.25)",padding:"20px 22px"}}>
                  <div style={{fontSize:10,color:"#00D4FF",letterSpacing:"0.12em",marginBottom:9,textTransform:"uppercase"}}>// ノード詳細</div>
                  <h3 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:20,fontWeight:900,color:"#fff",marginBottom:10}}>
                    {ARCH_NODES.find(n=>n.id===activeNode)?.icon} {NODE_INFO[activeNode]?.title}
                  </h3>
                  <p style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:14,color:"#aaa",lineHeight:1.85}}>{NODE_INFO[activeNode]?.desc}</p>
                  <button style={{marginTop:12,padding:"6px 14px",cursor:"pointer",background:"transparent",border:"1px solid rgba(255,255,255,0.09)",borderRadius:5,color:"#666",fontSize:11,fontFamily:"'DM Mono',monospace"}} onClick={()=>setActiveNode(null)}>✕ 閉じる</button>
                </div>
              ):(
                <div style={{background:"rgba(0,212,255,0.04)",borderRadius:10,border:"1px solid rgba(0,212,255,0.1)",padding:"16px 18px"}}>
                  <div style={{fontSize:11,color:"#555",marginBottom:7}}>← ノードをクリックして詳細を確認</div>
                  <div style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13,color:"#666",lineHeight:1.8}}>構成図の各ブロックをタップすると、そのコンポーネントの役割・使用ツール・設定方法が表示されます。</div>
                </div>
              )}
              <div className="card">
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:12,textTransform:"uppercase"}}>// データフロー</div>
                {[{n:"1",icon:"📡",t:"トピック取得",d:"RSSフィードや手動入力からテーマを取得"},{n:"2",icon:"⚙️",t:"オーケストレーター起動",d:"Claude APIにペルソナ・構成を指示"},{n:"3",icon:"🤖",t:"3エージェント実行",d:"調査・コード生成・執筆を並列処理"},{n:"4",icon:"🎨",t:"統合＆フォーマット",d:"SEO・アフィリエイトを自動挿入してMarkdown化"},{n:"5",icon:"🌐",t:"自動投稿",d:"WordPress下書き保存→確認後ワンクリック公開"}].map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"9px 0",borderBottom:i<4?"1px solid rgba(255,255,255,0.05)":"none",alignItems:"flex-start"}}>
                    <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#00D4FF",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{f.n}</div>
                    <div>
                      <div style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13,color:"#ddd",fontWeight:700,marginBottom:2}}>{f.icon} {f.t}</div>
                      <div style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:12,color:"#666"}}>{f.d}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:12,textTransform:"uppercase"}}>// 技術スタック</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[{l:"フロント",v:"React (Claude.ai)"},{l:"AI Core",v:"Claude Sonnet 4"},{l:"自動投稿",v:"GAS + WP REST API"},{l:"リサーチ",v:"Perplexity + NotebookLM"},{l:"コード補助",v:"Cursor / Claude Code"},{l:"ログ管理",v:"Google Sheets + GAS"}].map((t,i)=>(
                    <div key={i} style={{padding:"8px 10px",background:"rgba(0,0,0,0.2)",borderRadius:6}}>
                      <div style={{fontSize:10,color:"#555",fontFamily:"'DM Mono',monospace",marginBottom:3}}>{t.l}</div>
                      <div style={{fontSize:12,color:"#ccc",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{t.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ SETUP ════════════════ */}
        {page==="setup" && (()=>{
          const ph   = SETUP_PHASES[activePhase];
          const pc   = ph.color;
          const pcr  = ph.rgb;
          const step = ph.steps[activeStep];
          return (
            <div style={{display:"grid",gridTemplateColumns:"230px 1fr",gap:22,alignItems:"start"}}>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:4,textTransform:"uppercase"}}>// フェーズ</div>
                {SETUP_PHASES.map((p2,pi)=>{
                  const doneCnt=p2.steps.map((_,si)=>`${pi}-${si}`).filter(k=>doneSteps[k]).length;
                  return (
                    <button key={pi} className={`phase-tab ${activePhase===pi?"active":""}`}
                      style={{"--pc":p2.color,"--pcr":p2.rgb}}
                      onClick={()=>{setActivePhase(pi);setActiveStep(0);}}>
                      <div style={{color:p2.color,fontSize:10,fontFamily:"'DM Mono',monospace",marginBottom:3}}>{p2.phase} · {p2.duration}</div>
                      <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>{p2.title}</div>
                      <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden",marginBottom:4}}>
                        <div style={{height:"100%",background:p2.color,borderRadius:2,width:`${(doneCnt/p2.steps.length)*100}%`,transition:"width 0.4s"}}/>
                      </div>
                      <div style={{fontSize:10,color:"#555",fontFamily:"'DM Mono',monospace"}}>{doneCnt}/{p2.steps.length}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{"--pc":pc,"--pcr":pcr}}>
                <div style={{background:`rgba(${pcr},0.06)`,border:`1px solid rgba(${pcr},0.2)`,borderRadius:10,padding:"14px 18px",marginBottom:18}}>
                  <div style={{fontSize:10,color:pc,letterSpacing:"0.12em",marginBottom:4,textTransform:"uppercase"}}>{ph.phase} · 所要時間: {ph.duration}</div>
                  <h2 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:20,fontWeight:900,color:"#fff"}}>{ph.title}</h2>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:18}}>
                  {ph.steps.map((s,si)=>{
                    const key=`${activePhase}-${si}`, isDone=doneSteps[key];
                    return (
                      <div key={si} className={`step-card ${activeStep===si?"sactive":""} ${isDone?"sdone":""}`}
                        onClick={()=>setActiveStep(si)}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",gap:10,alignItems:"center"}}>
                            <span style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:isDone?"rgba(74,222,128,0.2)":`rgba(${pcr},0.15)`,border:`1px solid ${isDone?"#4ade8066":pc+"44"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:isDone?"#4ade80":pc,fontFamily:"'DM Mono',monospace",fontWeight:700}}>
                              {isDone?"✓":si+1}
                            </span>
                            <span style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13,fontWeight:700,color:isDone?"#4ade80":activeStep===si?"#fff":"#aaa"}}>{s.title}</span>
                          </div>
                          <span style={{fontSize:11,color:"#555",fontFamily:"'DM Mono',monospace"}}>⏱ {s.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {step&&(
                  <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid rgba(${pcr},0.25)`,borderRadius:12,padding:"22px 24px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,gap:12}}>
                      <div>
                        <div style={{fontSize:10,color:pc,letterSpacing:"0.12em",marginBottom:5,textTransform:"uppercase"}}>Step {activeStep+1} / {ph.steps.length}</div>
                        <h3 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:19,fontWeight:900,color:"#fff"}}>{step.title}</h3>
                      </div>
                      <span style={{fontSize:12,color:"#555",fontFamily:"'DM Mono',monospace",flexShrink:0}}>⏱ {step.time}</span>
                    </div>
                    <p style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:14,color:"#aaa",lineHeight:1.9,marginBottom:14}}>{step.detail}</p>
                    {step.url&&(
                      <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"7px 13px",borderRadius:6,marginBottom:14,background:`rgba(${pcr},0.08)`,border:`1px solid rgba(${pcr},0.25)`,fontSize:12,color:pc,fontFamily:"'DM Mono',monospace"}}>
                        🔗 {step.url}
                      </div>
                    )}
                    {step.code&&(
                      <div style={{marginBottom:18}}>
                        <div style={{fontSize:10,color:"#555",letterSpacing:"0.1em",marginBottom:7,textTransform:"uppercase"}}>// サンプルコード</div>
                        <div className="code-blk">{step.code}</div>
                      </div>
                    )}
                    <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
                      <button className={`done-btn ${doneSteps[`${activePhase}-${activeStep}`]?"isdone":""}`} onClick={()=>toggleDone(`${activePhase}-${activeStep}`)}>
                        {doneSteps[`${activePhase}-${activeStep}`]?"✓ 完了済み":"✓ 完了マーク"}
                      </button>
                      <button className="snav-btn" disabled={activeStep===0&&activePhase===0}
                        onClick={()=>{ if(activeStep>0) setActiveStep(s=>s-1); else if(activePhase>0){setActivePhase(p=>p-1);setActiveStep(SETUP_PHASES[activePhase-1].steps.length-1);} }}>← 前</button>
                      <button className="snav-btn" disabled={activeStep===ph.steps.length-1&&activePhase===SETUP_PHASES.length-1}
                        onClick={()=>{ if(activeStep<ph.steps.length-1) setActiveStep(s=>s+1); else if(activePhase<SETUP_PHASES.length-1){setActivePhase(p=>p+1);setActiveStep(0);} }}>次 →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ════════════════ ROI ════════════════ */}
        {page==="roi" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
            {/* 必要サービス */}
            <div style={{gridColumn:"1 / -1"}}>
              <div className="card" style={{border:"1px solid rgba(0,212,255,0.2)"}}>
                <div style={{fontSize:10,color:"#00D4FF",letterSpacing:"0.15em",marginBottom:14,textTransform:"uppercase"}}>// 必要なサービス一覧</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
                  {[
                    {cat:"ブログ基盤",color:"#00D4FF",rgb:"0,212,255",items:[
                      {name:"ConoHa WING",desc:"レンタルサーバー（WINGパック）",cost:"月1,200円〜",req:"必須"},
                      {name:"独自ドメイン",desc:"お名前.com / Cloudflare",cost:"年1,000〜1,500円",req:"必須"},
                      {name:"WordPress",desc:"無料CMS（サーバーに自動インストール）",cost:"無料",req:"必須"},
                      {name:"SWELL",desc:"WordPressテーマ（SEO最適化）",cost:"買切17,600円",req:"推奨"},
                    ]},
                    {cat:"AIツール",color:"#A855F7",rgb:"168,85,247",items:[
                      {name:"Claude API",desc:"本システムで使用（記事50〜150本/月）",cost:"月500〜3,000円",req:"必須"},
                      {name:"Perplexity Pro",desc:"Agent 3: リサーチ用",cost:"月2,000円（無料枠あり）",req:"推奨"},
                      {name:"Cursor Pro",desc:"Agent 2: コード生成補助",cost:"月2,000円（無料枠あり）",req:"任意"},
                      {name:"NotebookLM",desc:"Agent 3: 資料要約（Google）",cost:"無料",req:"推奨"},
                    ]},
                    {cat:"収益化",color:"#f59e0b",rgb:"245,158,11",items:[
                      {name:"Googleアドセンス",desc:"表示型広告（審査あり）",cost:"無料",req:"推奨"},
                      {name:"Amazonアソシエイト",desc:"ガジェット・書籍アフィリエイト",cost:"無料",req:"推奨"},
                      {name:"A8.net",desc:"SaaS・金融系アフィリエイト（高単価）",cost:"無料",req:"推奨"},
                      {name:"note / Tips",desc:"有料記事・サブスク販売",cost:"無料（手数料10〜20%）",req:"任意"},
                    ]},
                  ].map(group=>(
                    <div key={group.cat} style={{background:"rgba(255,255,255,0.02)",borderRadius:8,border:`1px solid rgba(${group.rgb},0.15)`,padding:"14px 16px"}}>
                      <div style={{fontSize:12,color:group.color,fontWeight:700,marginBottom:10,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{group.cat}</div>
                      {group.items.map((item,i)=>(
                        <div key={i} style={{padding:"7px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontSize:13,color:"#ddd",fontFamily:"'Zen Kaku Gothic New',sans-serif",fontWeight:700}}>{item.name}</span>
                            <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:item.req==="必須"?"rgba(255,80,80,0.15)":item.req==="推奨"?"rgba(0,212,255,0.1)":"rgba(255,255,255,0.06)",color:item.req==="必須"?"#ff8080":item.req==="推奨"?"#00D4FF":"#888",border:`1px solid ${item.req==="必須"?"rgba(255,80,80,0.3)":item.req==="推奨"?"rgba(0,212,255,0.2)":"rgba(255,255,255,0.1)"}`,fontFamily:"'DM Mono',monospace"}}>{item.req}</span>
                          </div>
                          <div style={{fontSize:11,color:"#666",margin:"2px 0",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{item.desc}</div>
                          <div style={{fontSize:11,color:group.color,fontFamily:"'DM Mono',monospace"}}>{item.cost}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* 費用 */}
            <div className="card">
              <div style={{fontSize:10,color:"#ff8080",letterSpacing:"0.15em",marginBottom:14,textTransform:"uppercase"}}>// 月次コスト試算</div>
              {[{item:"レンタルサーバー",min:1200,max:1500},{item:"ドメイン（月割）",min:83,max:125},{item:"Claude API",min:500,max:3000},{item:"Perplexity（任意）",min:0,max:2000},{item:"テーマ（月割・任意）",min:0,max:600}].map((c,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{fontSize:13,color:"#aaa",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{c.item}</span>
                  <span style={{fontSize:13,color:"#ff8080",fontFamily:"'DM Mono',monospace"}}>¥{c.min.toLocaleString()} 〜 ¥{c.max.toLocaleString()}</span>
                </div>
              ))}
              <div style={{marginTop:14,padding:"12px 14px",background:"rgba(255,80,80,0.08)",borderRadius:6,border:"1px solid rgba(255,80,80,0.2)"}}>
                <div style={{fontSize:11,color:"#888",marginBottom:4}}>月間合計（最小〜フル）</div>
                <div style={{fontSize:22,color:"#ff8080",fontFamily:"'DM Mono',monospace",fontWeight:700}}>¥1,783 〜 ¥7,225 / 月</div>
                <div style={{fontSize:11,color:"#666",marginTop:4,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>※最小構成（API+サーバー）なら月2,000円以下</div>
              </div>
            </div>
            {/* 収益 */}
            <div className="card">
              <div style={{fontSize:10,color:"#4ade80",letterSpacing:"0.15em",marginBottom:14,textTransform:"uppercase"}}>// 収益ロードマップ</div>
              {[{phase:"0〜3ヶ月",pv:"〜1,000PV/月",income:"0〜3,000円",action:"記事30本・SEO基盤構築",color:"#444"},{phase:"3〜6ヶ月",pv:"1,000〜5,000PV/月",income:"3,000〜20,000円",action:"アドセンス審査+アフィリエイト開始",color:"#00D4FF"},{phase:"6〜12ヶ月",pv:"5,000〜20,000PV/月",income:"20,000〜80,000円",action:"検索上位記事を軸に収益記事強化",color:"#4ade80"},{phase:"1年〜",pv:"20,000PV+/月",income:"80,000〜200,000円+",action:"有料note・サブスク・スポンサー追加",color:"#fcd34d"}].map((p2,i)=>(
                <div key={i} style={{padding:"11px 13px",marginBottom:8,background:"rgba(255,255,255,0.02)",borderRadius:6,borderLeft:`3px solid ${p2.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontSize:12,color:p2.color,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{p2.phase}</span>
                    <span style={{fontSize:14,color:"#4ade80",fontFamily:"'DM Mono',monospace"}}>{p2.income}</span>
                  </div>
                  <div style={{fontSize:11,color:"#888",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{p2.pv} · {p2.action}</div>
                </div>
              ))}
            </div>
            {/* ROI summary */}
            <div style={{gridColumn:"1 / -1"}}>
              <div className="card" style={{background:"rgba(74,222,128,0.04)",border:"1px solid rgba(74,222,128,0.2)"}}>
                <div style={{fontSize:10,color:"#4ade80",letterSpacing:"0.15em",marginBottom:14,textTransform:"uppercase"}}>// 費用対効果サマリー</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:18}}>
                  {[{label:"損益分岐点",value:"月3〜5本",sub:"アフィリエイト1件で黒字化"},{label:"初期費用（最小）",value:"約20,000円",sub:"サーバー1年+ドメイン+テーマ"},{label:"時間投資（AI後）",value:"週2〜3時間",sub:"テーマ選定+生成+投稿のみ"},{label:"1年後期待ROI",value:"500〜2,000%",sub:"月10万円÷月5,000円コスト"}].map((m,i)=>(
                    <div key={i} style={{textAlign:"center",padding:14}}>
                      <div style={{fontSize:10,color:"#666",fontFamily:"'DM Mono',monospace",marginBottom:5,letterSpacing:"0.1em"}}>{m.label}</div>
                      <div style={{fontSize:20,color:"#4ade80",fontFamily:"'DM Mono',monospace",fontWeight:700,marginBottom:3}}>{m.value}</div>
                      <div style={{fontSize:11,color:"#666",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"14px 16px",background:"rgba(0,0,0,0.3)",borderRadius:8}}>
                  <p style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13,color:"#aaa",lineHeight:1.85}}>
                    <strong style={{color:"#4ade80"}}>結論：</strong>月2,000円以下の投資で始められ、6ヶ月継続すれば投資回収が現実的。このシステムで記事量産にかかる時間を<strong style={{color:"#fff"}}>週10時間→2時間</strong>に圧縮できるため、時間コストを含めた実質ROIはさらに高くなります。20代のうちにSEO資産（記事）を積み上げることで、<strong style={{color:"#fcd34d"}}>複利的に収益が伸びる</strong>仕組みが作れます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* footer */}
        <footer style={{marginTop:36,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <span style={{fontSize:10,color:"#222",fontFamily:"'DM Mono',monospace"}}>自分株式会社 — Blog Automation Engine v3.0</span>
          <span style={{fontSize:10,color:"#222",fontFamily:"'DM Mono',monospace"}}>powered by Claude API · 構築進捗 {setupPct}%</span>
        </footer>
      </div>
    </div>
  );
}
