import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Terminal, FileText, Map, Wrench, DollarSign,
  Cpu, Megaphone, Store, PieChart as PieIcon, Send, RefreshCw,
  TrendingUp, Heart, Server, Layers, Activity, ChevronRight,
  CircleDashed, CheckCircle2, Zap, BookOpen, Settings, ExternalLink
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip
} from "recharts";

// ═══════════════════════════════════════════════════════
// CONSTANTS & DATA
// ═══════════════════════════════════════════════════════

const SPREADSHEET_ID = "1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M";

const PERSONAS = {
  ai_work:      { id:"ai_work",      label:"AI実務・自動化",  icon:"⚡", color:"#00D4FF", rgb:"0,212,255",
    prompt:`あなたは25歳の営業DX担当者「Keigo」です。GAS・Python・AIエージェントを使って業務効率化を実践しています。読者は「AIに興味はあるが使いこなせていない20代ビジネスパーソン」です。トーン：丁寧すぎず、実体験ベースの等身大な語り口。構成：①なぜ必要か→②Agent1調査→③Agent2コード→④Agent3執筆→⑤20代へのメッセージ→⑥アクション。記事末尾に必ず: <!-- meta: SEOメタ120字 --> <!-- tags: タグ1,タグ2,タグ3 --> <!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets:["GASでSlack通知を自動化した話","AIエージェントを部下として使いこなす方法","Cursorを使えばコードが書けなくても自動化できる","ChatGPT APIをExcelに繋いだら会議資料が10分で完成"] },
  qol_tech:     { id:"qol_tech",     label:"20代QOL×テック", icon:"🎯", color:"#FF6B35", rgb:"255,107,53",
    prompt:`あなたは投資・ガジェット・カメラが趣味の25歳「Keigo」です。新NISA・ヴィンテージ品・ZV-E10を使ったVlogも発信しています。読者は「お金と趣味を賢く両立したい20代」です。トーン：友人に話しかけるような親しみやすさ。失敗談も正直に書く。構成：①なぜ必要か→②Agent1調査→③Agent2コード→④Agent3執筆→⑤20代へのメッセージ→⑥アクション。記事末尾に必ず: <!-- meta: SEOメタ120字 --> <!-- tags: タグ1,タグ2,タグ3 --> <!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets:["新NISAを半年続けた正直な結果と反省点","ZV-E10でVlogを始めて3ヶ月でわかったこと","ヴィンテージ時計の相場をPythonで監視するシステム","25歳のガジェット環境：本当に使ったものだけ紹介"] },
  jibun_kaisha: { id:"jibun_kaisha", label:"自分株式会社ログ", icon:"🏢", color:"#A855F7", rgb:"168,85,247",
    prompt:`あなたは「一人で会社のような仕組みを作る」実験をしている25歳「Keigo」です。AIで自動化・収益化の過程をリアルに公開しています。読者は「副業・独立を考えている20代」です。トーン：ビルドインパブリックスタイル。数字と失敗を隠さない。構成：①なぜ必要か→②Agent1調査→③Agent2コード→④Agent3執筆→⑤20代へのメッセージ→⑥アクション。記事末尾に必ず: <!-- meta: SEOメタ120字 --> <!-- tags: タグ1,タグ2,タグ3 --> <!-- affiliate: ツール名1|説明1, ツール名2|説明2 -->`,
    presets:["個人ブログをAIで半自動化して月1万円稼ぐまでの記録","自分株式会社の月次レポート：収益・学び・失敗まとめ","NotionとClaudeを繋いでコンテンツ管理を自動化した","ブログ記事をClaudeに書かせる仕組みと品質管理の実態"] },
};

const DEPT_DATA = [
  { id:"sales",      label:"営業部",          en:"Sales",      color:"#00D4FF", rgb:"0,212,255",   icon:"🏪", status:"待機中", metric:"リード数",      val:"19",    chart:"bar"  },
  { id:"pr",         label:"広報部",          en:"PR",         color:"#10b981", rgb:"16,185,129",  icon:"📣", status:"稼働中", metric:"メディアリーチ", val:"182万", chart:"area" },
  { id:"marketing",  label:"マーケティング部", en:"Marketing",  color:"#3b82f6", rgb:"59,130,246",  icon:"📊", status:"待機中", metric:"キャンペーン",   val:"5",     chart:"pie"  },
  { id:"accounting", label:"経理部",          en:"Accounting", color:"#A855F7", rgb:"168,85,247",  icon:"💴", status:"待機中", metric:"バーンレート",   val:"¥4.2M", chart:"bar"  },
];

const KPI_DATA = [
  { label:"総資産 (推定)", value:"$203,686,000", sub:"+12.4% 年初来",   color:"#00D4FF", icon:"📈" },
  { label:"月間利益率",    value:"65.38%",        sub:"目標 60.0% 達成", color:"#10b981", icon:"⚡" },
  { label:"ライフスコア",  value:"クラスA",        sub:"進捗 82% / 100",  color:"#f59e0b", icon:"❤️" },
  { label:"システム負荷",  value:"92.4%",          sub:"安定稼働中",       color:"#A855F7", icon:"🖥️" },
];

const AGENT_STATUS = [
  { label:"トレンド収集エージェント",  sub:"Google NewsからAI/DXトレンドを自動抽出",   status:"稼働中",  time:"最終実行: 本日 23:30", color:"#10b981" },
  { label:"人生戦略ロードマップ・ワーカー", sub:"音声メモをGeminiで解析・自動記帳",   status:"監視中", time:"監視フォルダ: VRS_Audio_Input", color:"#3b82f6" },
];

const SETUP_PHASES = [
  { phase:"Phase 1", title:"WordPress基盤構築",    duration:"1〜2時間", color:"#00D4FF", rgb:"0,212,255",
    steps:[{title:"レンタルサーバー契約",time:"15分",url:"conoha.jp/wing",code:null,detail:"ConoHa WINGの「WINGパック」12ヶ月プランを契約（月1,200円〜）。契約時に独自ドメインが1つ無料でもらえる。"},{title:"WordPress インストール",time:"10分",url:null,code:null,detail:"ConoHa管理画面から「かんたんWordPressインストール」を実行。ユーザー名・パスワードをメモしておく。"},{title:"テーマ・プラグイン設定",time:"30分",url:"swell-theme.com",code:null,detail:"SWELLをインストール後、SEO SIMPLE PACK・XML Sitemaps・Akismetの3プラグインを導入。"}]},
  { phase:"Phase 2", title:"Claude APIキー取得",    duration:"30分",    color:"#A855F7", rgb:"168,85,247",
    steps:[{title:"Anthropicアカウント作成",time:"5分",url:"console.anthropic.com",code:null,detail:"console.anthropic.comにアクセスし、Googleアカウントでサインアップ。"},{title:"APIキーを発行",time:"5分",url:null,code:"# .envファイルに保存\nANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx",detail:"ダッシュボード→「API Keys」→「Create Key」。キーは再表示不可なので必ずメモ。"},{title:"クレジットチャージ",time:"5分",url:null,code:null,detail:"「Billing」→「Add credit」で$5〜10チャージ。月500〜3,000円が目安（記事50〜150本分）。"}]},
  { phase:"Phase 3", title:"Google Sheets連携",    duration:"1時間",   color:"#FF6B35", rgb:"255,107,53",
    steps:[{title:"スプレッドシート準備",time:"10分",url:null,code:null,detail:"Google Sheetsに「指示書」「記事ログ」「KPI」の3シートを作成。既存のSpreadsheet ID（1AKQuY8...）を流用可。"},{title:"GAS自動投稿スクリプト設置",time:"20分",url:"script.google.com",code:"function postToWordPress(title, content) {\n  const WP_URL = 'https://your-blog.com/wp-json/wp/v2/posts';\n  const options = {\n    method: 'POST',\n    headers: { 'Authorization': 'Basic ' + Utilities.base64Encode('user:app_password') },\n    payload: JSON.stringify({title, content, status:'draft'})\n  };\n  return UrlFetchApp.fetch(WP_URL, options);\n}",detail:"script.google.comで新しいプロジェクトを作成。上記コードを貼り付けてWordPress自動投稿の準備をする。"},{title:"トリガー設定",time:"10分",url:null,code:null,detail:"GASエディタ→時計アイコン→新しいトリガー追加。週タイマーで月・水・金の朝9時に自動実行。"}]},
  { phase:"Phase 4", title:"アフィリエイト設定",    duration:"2時間",   color:"#10b981", rgb:"16,185,129",
    steps:[{title:"Googleアドセンス申請",time:"30分",url:"adsense.google.com",code:null,detail:"記事10本以上になったら申請。審査通過後にサイトにコードを貼る。審査は通常1〜2週間。"},{title:"Amazonアソシエイト登録",time:"30分",url:"affiliate.amazon.co.jp",code:null,detail:"ガジェット・書籍・カメラ機材の紹介に使う。承認後、各商品のアフィリエイトリンクをシステムに追記。"},{title:"A8.net登録",time:"30分",url:"a8.net",code:null,detail:"AIツール・金融系（証券口座・NISA）のアフィリエイト広告を取得。単価が高く（1件1,000〜10,000円）AI系記事と相性が良い。"}]},
];

const PROG_STEPS = [[12,"接続中..."],[28,"Agent 1: 調査・分析..."],[45,"Agent 2: コード生成..."],[62,"Agent 3: 執筆・要約..."],[78,"20代へのメッセージ..."],[90,"SEO最適化..."],[96,"アフィリエイト挿入..."]];

const CHART_SALES  = [{n:"M",v:40},{n:"T",v:30},{n:"W",v:60},{n:"T",v:45},{n:"F",v:70}];
const CHART_PR     = [{n:"W1",v:100},{n:"W2",v:150},{n:"W3",v:200},{n:"W4",v:350}];
const CHART_MKT    = [{name:"戦略",value:53},{name:"トレンド",value:23},{name:"広告",value:24}];
const PIE_COLORS   = ["#00D4FF","#3b82f6","#1e293b"];

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

function parseArticle(raw) {
  const tM = raw.match(/^#\s+(.+)/m);
  const mM = raw.match(/<!--\s*meta:\s*([\s\S]*?)\s*-->/);
  const tgM= raw.match(/<!--\s*tags:\s*([\s\S]*?)\s*-->/);
  const aM = raw.match(/<!--\s*affiliate:\s*([\s\S]*?)\s*-->/);
  const body= raw.replace(/^#\s+.+\n?/m,"").replace(/<!--[\s\S]*?-->/g,"").trim();
  return {
    title: tM?tM[1].trim():"記事",
    meta:  mM?mM[1].trim():"",
    tags:  tgM?tgM[1].trim().split(",").map(t=>t.trim()):[],
    affs:  aM?aM[1].trim().split(",").map(a=>{const[n,d]=a.split("|");return{name:n?.trim(),desc:d?.trim()};}):[],
    body, chars: body.replace(/[#*`\[\]\(\)\n]/g,"").length, raw,
  };
}

function inlineFmt(t) {
  return t
    .replace(/\*\*(.*?)\*\*/g,'<strong style="color:#fff;font-weight:700">$1</strong>')
    .replace(/`(.*?)`/g,'<code style="background:rgba(0,0,0,0.5);padding:2px 6px;border-radius:3px;font-size:12px;color:#7ee787;font-family:\'DM Mono\',monospace">$1</code>');
}

function MdView({ text, color }) {
  if (!text) return null;
  const lines=text.split("\n"); const els=[]; let code=false,cl=[],lang="";
  for(let i=0;i<lines.length;i++){
    const L=lines[i];
    if(L.startsWith("```")){
      if(code){els.push(<pre key={i} style={{background:"rgba(0,0,0,0.6)",padding:"14px 16px",borderRadius:8,overflowX:"auto",margin:"12px 0",borderLeft:`3px solid ${color}`,fontSize:12,lineHeight:1.7}}><code style={{color:"#a5d6a7",fontFamily:"'DM Mono',monospace"}}>{cl.join("\n")}</code></pre>);code=false;cl=[];lang="";}
      else{code=true;lang=L.replace("```","").trim();}continue;
    }
    if(code){cl.push(L);continue;}
    if(L.startsWith("## ")) els.push(<h2 key={i} style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:18,fontWeight:900,color,margin:"26px 0 10px",paddingBottom:6,borderBottom:`1px solid ${color}33`}}>{L.replace("## ","")}</h2>);
    else if(L.startsWith("### ")) els.push(<h3 key={i} style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:15,fontWeight:700,color:"#e8e8f0",margin:"16px 0 8px"}}>{L.replace("### ","")}</h3>);
    else if(L.startsWith("- ")||L.startsWith("* ")) els.push(<div key={i} style={{display:"flex",gap:10,margin:"5px 0 5px 8px"}}><span style={{color,flexShrink:0}}>›</span><p style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13,lineHeight:1.9,color:"#c8c8d8",margin:0}} dangerouslySetInnerHTML={{__html:inlineFmt(L.replace(/^[-*]\s/,""))}}/></div>);
    else if(L.trim()==="") els.push(<div key={i} style={{height:6}}/>);
    else els.push(<p key={i} style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13,lineHeight:1.9,color:"#c8c8d8",margin:"4px 0"}} dangerouslySetInnerHTML={{__html:inlineFmt(L)}}/>);
  }
  return <>{els}</>;
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════

const NAV = [
  {id:"dashboard", label:"ダッシュボード", icon:<LayoutDashboard size={16}/>},
  {id:"terminal",  label:"AIターミナル",   icon:<Terminal size={16}/>},
  {id:"blog",      label:"ブログ生成",     icon:<FileText size={16}/>},
  {id:"preview",   label:"記事プレビュー", icon:<BookOpen size={16}/>},
  {id:"arch",      label:"構成図",         icon:<Map size={16}/>},
  {id:"setup",     label:"構築手順",       icon:<Wrench size={16}/>},
  {id:"roi",       label:"費用対効果",     icon:<DollarSign size={16}/>},
];

export default function App() {
  const [page, setPage]           = useState("dashboard");
  // terminal
  const [term, setTerm]           = useState("");
  const [termDept, setTermDept]   = useState("営業部");
  const [termSending, setTermSending] = useState(false);
  const [termLogs, setTermLogs]   = useState([
    {dept:"広報",text:"Threadsの原稿が完成しました",time:"12分前",working:false},
    {dept:"営業",text:"競合調査：ターゲット20代のアカウント分析完了",time:"45分前",working:false},
    {dept:"マーケ",text:"TikTokトレンドレポート #SideHustle2026",time:"1時間前",working:false},
  ]);
  const [agentStatus, setAgentStatus] = useState("待機中...");
  const [wsMsg, setWsMsg]         = useState([]);
  const [inputs, setInputs]       = useState([]);
  // blog gen
  const [persona, setPersona]     = useState("ai_work");
  const [topic, setTopic]         = useState("");
  const [keywords, setKeywords]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [article, setArticle]     = useState(null);
  const [error, setError]         = useState("");
  const [progress, setProgress]   = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [history, setHistory]     = useState([]);
  const [copied, setCopied]       = useState(false);
  // setup
  const [activePhase, setActivePhase] = useState(0);
  const [activeStep,  setActiveStep]  = useState(0);
  const [doneSteps,   setDoneSteps]   = useState({});

  const progRef = useRef(null);
  const p = PERSONAS[persona];
  const setupTotal = SETUP_PHASES.reduce((a,ph)=>a+ph.steps.length,0);
  const setupDone  = Object.keys(doneSteps).length;
  const setupPct   = Math.round((setupDone/setupTotal)*100);

  // Simulated WS status on mount
  useEffect(()=>{ setTimeout(()=>setAgentStatus("接続完了 (Ready)"),800); },[]);

  // Fetch inputs mock
  const fetchInputs = useCallback(async()=>{
    setInputs([
      {taskName:"AI News",date:"2026-03-19",title:"Claude 4 APIが一般公開、従来比3倍の処理速度を実現",snippet:"Anthropicは本日、Claude 4 APIの一般公開を発表した。処理速度は従来比3倍に向上し...",url:"#"},
      {taskName:"DX Trend",date:"2026-03-18",title:"国内企業のAI導入率が60%を突破、20代社員が主導",snippet:"経済産業省の調査によると、国内企業のAI活用率が初めて60%を超えた。特に20〜30代...",url:"#"},
      {taskName:"Marketing",date:"2026-03-17",title:"TikTok副業コンテンツが急増、月収10万円超の20代が続出",snippet:"SNS上で副業収益を公開する20代クリエイターが急増している。中でもAIツールを活用した...",url:"#"},
    ]);
  },[]);
  useEffect(()=>{ fetchInputs(); },[]);

  // Terminal send
  const sendTermCmd = useCallback(async()=>{
    if(!term.trim()) return;
    setTermSending(true);
    const newLog={dept:termDept.replace("部",""),text:term,time:"たった今",working:true};
    setTermLogs(prev=>[newLog,...prev]);
    setWsMsg(prev=>[...prev,{role:"user",text:term}]);
    // Simulate agent response
    setTimeout(()=>{
      setWsMsg(prev=>[...prev,{role:"system",text:`> [Action] sendCommand("${termDept}", "${term.slice(0,30)}...")`}]);
      setTimeout(()=>{
        setWsMsg(prev=>[...prev,{role:"agent",text:`${termDept}への指令を受理しました。Google Sheetsの「指示書」シートに記録し、処理を開始します。\n\nSpreadsheet ID: ${SPREADSHEET_ID}\nステータス: 処理中 → 待機中に変更後、結果を「アウトプット」シートに書き込みます。`}]);
        setTermSending(false);
        setAgentStatus("待機中...");
      },1200);
      setAgentStatus(`ツール実行中: sendCommand`);
    },600);
    setTerm("");
  },[term, termDept]);

  // Blog progress
  const startProg = useCallback(()=>{
    let idx=0;
    progRef.current=setInterval(()=>{ if(idx<PROG_STEPS.length){setProgress(PROG_STEPS[idx][0]);setProgLabel(PROG_STEPS[idx][1]);idx++;} },900);
  },[]);
  const stopProg = useCallback(()=>{ if(progRef.current) clearInterval(progRef.current); setProgress(100);setProgLabel("生成完了！"); },[]);

  const generate = useCallback(async()=>{
    if(!topic.trim()) return;
    setLoading(true);setError("");setArticle(null);setProgress(0);setProgLabel("Claude に接続中...");startProg();
    const kw=keywords.trim()?`\nSEOキーワード: ${keywords}`:"";
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:p.prompt,
          messages:[{role:"user",content:`テーマ: ${topic}${kw}\n全セクション（導入・Agent1・Agent2・Agent3・20代へのメッセージ・アクション）を必ず含め、Markdown形式で出力してください。文字数2000〜3000字。`}]}),
      });
      const data=await res.json();
      if(data.error) throw new Error(data.error.message);
      const raw=data.content?.map(b=>b.text||"").join("")||"";
      const parsed=parseArticle(raw);
      stopProg();setArticle(parsed);
      setHistory(prev=>[{persona,topic,parsed,ts:Date.now()},...prev.slice(0,4)]);
      setPage("preview");
    } catch(e){stopProg();setError("生成に失敗しました: "+e.message);}
    finally{setLoading(false);}
  },[topic,keywords,p,persona,startProg,stopProg]);

  const toggleDone = k=>setDoneSteps(prev=>{const n={...prev};n[k]?delete n[k]:(n[k]=true);return n;});

  // ── RENDER ──────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#06060f",color:"#e8e8f0",fontFamily:"'DM Mono',monospace",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Zen+Kaku+Gothic+New:wght@300;400;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{50%{opacity:0}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .scanline{position:fixed;top:0;left:0;width:100%;height:100%;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.006) 3px,rgba(0,212,255,0.006) 4px);pointer-events:none;z-index:0;}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;transition:all 0.2s;border:1px solid transparent;font-family:'Zen Kaku Gothic New',sans-serif;font-size:13px;color:#555;width:100%;background:transparent;}
        .nav-item:hover{color:#aaa;background:rgba(255,255,255,0.03);}
        .nav-item.active{color:#00D4FF;background:rgba(0,212,255,0.08);border-color:rgba(0,212,255,0.2);}
        .card{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 22px;}
        .ibox{width:100%;padding:11px 13px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);border-radius:7px;color:#e8e8f0;font-family:'Zen Kaku Gothic New',sans-serif;font-size:13px;transition:border-color 0.2s;resize:vertical;}
        .ibox:focus{outline:none;border-color:rgba(0,212,255,0.5);}
        .ibox::placeholder{color:rgba(255,255,255,0.2);}
        .gen-btn{width:100%;padding:15px;cursor:pointer;background:linear-gradient(135deg,rgba(0,212,255,0.13),rgba(0,212,255,0.07));border:1px solid rgba(0,212,255,0.4);border-radius:8px;color:#00D4FF;font-family:'Zen Kaku Gothic New',sans-serif;font-size:14px;font-weight:900;letter-spacing:0.08em;transition:all 0.2s;}
        .gen-btn:not(:disabled):hover{background:linear-gradient(135deg,rgba(0,212,255,0.22),rgba(0,212,255,0.14));transform:translateY(-1px);}
        .gen-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .persona-btn{cursor:pointer;padding:10px 13px;border-radius:6px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;text-align:left;transition:all 0.2s;width:100%;}
        .persona-btn.active{border-color:var(--pc);background:rgba(var(--pcr),0.1);color:var(--pc);}
        .preset-pill{cursor:pointer;padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.07);font-family:'Zen Kaku Gothic New',sans-serif;font-size:11px;background:transparent;color:#777;transition:all 0.2s;text-align:left;}
        .preset-pill:hover{border-color:var(--pc);color:var(--pc);background:rgba(var(--pcr),0.07);}
        .pbar{height:100%;background:linear-gradient(90deg,#00D4FF,rgba(0,212,255,0.5));border-radius:4px;transition:width 0.8s ease;box-shadow:0 0 8px rgba(0,212,255,0.4);}
        .phase-tab{padding:10px 13px;cursor:pointer;text-align:left;border:1px solid rgba(255,255,255,0.06);border-radius:6px;font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;background:rgba(255,255,255,0.02);color:#666;transition:all 0.2s;width:100%;}
        .phase-tab.active{color:#fff;background:rgba(var(--pcr),0.1);border-color:var(--pc);}
        .step-card{border:1px solid rgba(255,255,255,0.07);border-radius:7px;padding:11px 13px;cursor:pointer;transition:all 0.2s;background:rgba(255,255,255,0.02);}
        .step-card.sactive{border-color:var(--pc);background:rgba(var(--pcr),0.06);}
        .step-card.sdone{border-color:rgba(74,222,128,0.3);background:rgba(74,222,128,0.04);}
        .code-blk{background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.07);border-radius:7px;padding:13px 15px;overflow-x:auto;border-left:3px solid var(--pc,#00D4FF);font-family:'DM Mono',monospace;font-size:11px;color:#a5d6a7;line-height:1.75;white-space:pre;}
        .done-btn{padding:9px 16px;cursor:pointer;border-radius:6px;font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;font-weight:700;transition:all 0.2s;border:1px solid rgba(74,222,128,0.4);background:rgba(74,222,128,0.1);color:#4ade80;}
        .done-btn.isdone{background:rgba(74,222,128,0.2);color:#fff;}
        .snav-btn{padding:8px 15px;cursor:pointer;border:1px solid rgba(255,255,255,0.09);border-radius:6px;background:rgba(255,255,255,0.03);color:#aaa;font-family:'Zen Kaku Gothic New',sans-serif;font-size:12px;transition:all 0.2s;}
        .snav-btn:hover:not(:disabled){border-color:rgba(255,255,255,0.28);color:#fff;}
        .snav-btn:disabled{opacity:0.3;cursor:not-allowed;}
        .copy-btn{padding:7px 13px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);border-radius:5px;background:transparent;color:#888;font-family:'DM Mono',monospace;font-size:11px;transition:all 0.2s;}
        .copy-btn:hover{border-color:#fff;color:#fff;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px;}
        .slide-in{animation:slideIn 0.25s ease;}
      `}</style>
      <div className="scanline"/>

      <div style={{display:"flex",flex:1,position:"relative",zIndex:1}}>

        {/* ── SIDEBAR ───────────────────────────────── */}
        <aside style={{width:220,background:"rgba(0,0,0,0.4)",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",padding:"20px 12px",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          {/* Logo */}
          <div style={{padding:"12px 8px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#00D4FF",boxShadow:"0 0 8px #00D4FF",animation:"pulse 2s ease-in-out infinite"}}/>
              <span style={{fontSize:9,color:"#3a3a5a",letterSpacing:"0.2em",textTransform:"uppercase"}}>JIBUN-OS v3.0</span>
            </div>
            <h1 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em",lineHeight:1.1}}>
              自分<span style={{color:"#00D4FF"}}>株式</span>会社
            </h1>
            <p style={{fontSize:9,color:"#444",marginTop:4,letterSpacing:"0.1em"}}>Neural Network OS</p>
          </div>

          {/* Nav */}
          <nav style={{display:"flex",flexDirection:"column",gap:4,flex:1}}>
            {NAV.map(n=>(
              <button key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>
                <span style={{opacity:0.7}}>{n.icon}</span>
                <span>{n.label}</span>
                {page===n.id && <ChevronRight size={12} style={{marginLeft:"auto",opacity:0.5}}/>}
              </button>
            ))}
          </nav>

          {/* Bottom status */}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:14,marginTop:14}}>
            {/* Sheets link */}
            <a href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`} target="_blank" rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",borderRadius:6,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",textDecoration:"none",marginBottom:8}}>
              <ExternalLink size={12} style={{color:"#666"}}/>
              <span style={{fontSize:11,color:"#666",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>統合データ基盤</span>
            </a>
            {/* Progress */}
            <div style={{padding:"8px 10px",borderRadius:6,background:"rgba(74,222,128,0.04)",border:"1px solid rgba(74,222,128,0.15)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:9,color:"#4ade80",letterSpacing:"0.1em"}}>構築進捗</span>
                <span style={{fontSize:11,color:"#4ade80",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{setupPct}%</span>
              </div>
              <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${setupPct}%`,background:"linear-gradient(90deg,#00D4FF,#4ade80)",borderRadius:4,transition:"width 0.5s"}}/>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────── */}
        <main style={{flex:1,overflowY:"auto",padding:"28px 28px",minHeight:"100vh"}}>

          {/* ═══ DASHBOARD ═══════════════════════════ */}
          {page==="dashboard" && (
            <div className="slide-in">
              <div style={{marginBottom:28}}>
                <div style={{fontSize:10,color:"#3a3a5a",letterSpacing:"0.2em",marginBottom:6,textTransform:"uppercase"}}>// CEO Command Dashboard</div>
                <h2 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:32,fontWeight:900,color:"#fff",lineHeight:1.1,letterSpacing:"-0.02em"}}>
                  自分<span style={{color:"#00D4FF"}}>株式会社</span> OS
                </h2>
                <p style={{fontSize:12,color:"#555",marginTop:6,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>統合経営ダッシュボード — Google Sheets 同期中</p>
              </div>

              {/* KPI Row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
                {KPI_DATA.map((k,i)=>(
                  <div key={i} className="card" style={{borderBottom:`2px solid ${k.color}`,padding:"18px 20px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div style={{width:36,height:36,borderRadius:8,background:`rgba(${k.color==="#00D4FF"?"0,212,255":k.color==="#10b981"?"16,185,129":k.color==="#f59e0b"?"245,158,11":"168,85,247"},0.1)`,display:"flex",alignItems:"center",justifyContent:"center",color:k.color}}>{k.icon}</div>
                      <span style={{fontSize:9,color:k.color,background:`rgba(${k.color==="#00D4FF"?"0,212,255":k.color==="#10b981"?"16,185,129":k.color==="#f59e0b"?"245,158,11":"168,85,247"},0.1)`,padding:"2px 8px",borderRadius:10,fontFamily:"'DM Mono',monospace"}}>LIVE</span>
                    </div>
                    <div style={{fontSize:10,color:"#666",fontFamily:"'Zen Kaku Gothic New',sans-serif",marginBottom:4}}>{k.label}</div>
                    <div style={{fontSize:20,fontWeight:900,color:"#fff",fontFamily:"'Zen Kaku Gothic New',sans-serif",marginBottom:4}}>{k.value}</div>
                    <div style={{fontSize:10,color:"#555",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Dept Cards */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
                {DEPT_DATA.map(dept=>(
                  <div key={dept.id} className="card" style={{borderLeft:`3px solid ${dept.color}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:32,height:32,borderRadius:8,background:`rgba(${dept.rgb},0.12)`,display:"flex",alignItems:"center",justifyContent:"center",color:dept.color}}>{dept.icon}</div>
                        <div>
                          <div style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:14,fontWeight:700,color:"#fff"}}>{dept.label}</div>
                          <div style={{fontSize:10,color:"#555",fontFamily:"'DM Mono',monospace"}}>{dept.en}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,background:dept.status==="稼働中"?`rgba(${dept.rgb},0.1)`:"rgba(255,255,255,0.04)",border:`1px solid ${dept.status==="稼働中"?dept.color+"44":"rgba(255,255,255,0.08)"}`,fontSize:10,color:dept.status==="稼働中"?dept.color:"#555",fontFamily:"'DM Mono',monospace"}}>
                        {dept.status==="稼働中"?<CircleDashed size={10} style={{animation:"spin 2s linear infinite"}}/>:<CheckCircle2 size={10}/>}
                        {dept.status}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"flex-end",gap:16}}>
                      <div>
                        <div style={{fontSize:10,color:"#555",marginBottom:4,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{dept.metric}</div>
                        <div style={{fontSize:24,fontWeight:900,color:dept.color,fontFamily:"'DM Mono',monospace"}}>{dept.val}</div>
                      </div>
                      <div style={{flex:1,height:48}}>
                        <ResponsiveContainer width="100%" height="100%">
                          {dept.chart==="bar"?<BarChart data={CHART_SALES}><Bar dataKey="v" fill={dept.color} radius={[3,3,0,0]} opacity={0.8}/></BarChart>
                           :dept.chart==="area"?<AreaChart data={CHART_PR}><defs><linearGradient id={`g${dept.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={dept.color} stopOpacity={0.4}/><stop offset="95%" stopColor={dept.color} stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="v" stroke={dept.color} fill={`url(#g${dept.id})`}/></AreaChart>
                           :<PieChart><Pie data={CHART_MKT} dataKey="value" innerRadius={14} outerRadius={22} paddingAngle={3} stroke="none">{PIE_COLORS.map((c,i)=><Cell key={i} fill={c}/>)}</Pie></PieChart>}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Agent Status + Trend Feed */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div className="card">
                  <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:14,textTransform:"uppercase"}}>// AIエージェント稼働状況</div>
                  {AGENT_STATUS.map((a,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<AGENT_STATUS.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:a.color,boxShadow:`0 0 6px ${a.color}`,animation:a.status==="稼働中"?"pulse 1.5s ease-in-out infinite":"none"}}/>
                        <div>
                          <div style={{fontSize:12,color:"#ddd",fontFamily:"'Zen Kaku Gothic New',sans-serif",fontWeight:700}}>{a.label}</div>
                          <div style={{fontSize:10,color:"#555",fontFamily:"'Zen Kaku Gothic New',sans-serif",marginTop:2}}>{a.sub}</div>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:10,color:a.color,fontFamily:"'DM Mono',monospace",marginBottom:2}}>{a.status}</div>
                        <div style={{fontSize:9,color:"#444",fontFamily:"'DM Mono',monospace"}}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",textTransform:"uppercase"}}>// 収集済みトレンド情報</div>
                    <button className="copy-btn" onClick={fetchInputs} style={{display:"flex",alignItems:"center",gap:4}}>
                      <RefreshCw size={10}/> 更新
                    </button>
                  </div>
                  {inputs.slice(0,3).map((item,i)=>(
                    <div key={i} style={{padding:"10px 0",borderBottom:i<2?"1px solid rgba(255,255,255,0.05)":"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                        <span style={{fontSize:9,padding:"1px 7px",borderRadius:8,background:"rgba(0,212,255,0.1)",color:"#00D4FF",fontFamily:"'DM Mono',monospace"}}>{item.taskName}</span>
                        <span style={{fontSize:9,color:"#444",fontFamily:"'DM Mono',monospace"}}>{item.date}</span>
                      </div>
                      <div style={{fontSize:12,color:"#ddd",fontFamily:"'Zen Kaku Gothic New',sans-serif",fontWeight:700,marginBottom:2,lineHeight:1.4}}>{item.title}</div>
                      <div style={{fontSize:10,color:"#666",fontFamily:"'Zen Kaku Gothic New',sans-serif",lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.snippet}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ TERMINAL ════════════════════════════ */}
          {page==="terminal" && (
            <div className="slide-in">
              <div style={{marginBottom:22}}>
                <div style={{fontSize:10,color:"#3a3a5a",letterSpacing:"0.2em",marginBottom:5,textTransform:"uppercase"}}>// Auto-CEO Terminal</div>
                <h2 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:26,fontWeight:900,color:"#fff",lineHeight:1.1}}>AIターミナル</h2>
                <p style={{fontSize:12,color:"#555",marginTop:5,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>部門へ指令を送信 — Google Sheetsに自動記録</p>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:18,alignItems:"start"}}>
                {/* Terminal window */}
                <div>
                  <div style={{background:"#0d0d14",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,overflow:"hidden",marginBottom:16}}>
                    <div style={{background:"rgba(255,255,255,0.04)",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <Terminal size={14} style={{color:"#00D4FF"}}/>
                        <span style={{fontSize:11,color:"#888",fontFamily:"'DM Mono',monospace"}}>JIBUN-OS Auto-CEO Terminal</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:agentStatus==="オフライン"?"#ff5555":"#4ade80",animation:agentStatus!=="オフライン"?"pulse 1.5s ease-in-out infinite":"none"}}/>
                        <span style={{fontSize:10,color:"#555",fontFamily:"'DM Mono',monospace"}}>{agentStatus}</span>
                      </div>
                    </div>
                    <div style={{height:320,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
                      {wsMsg.length===0&&(
                        <div style={{color:"#444",fontSize:11,textAlign:"center",marginTop:60,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>
                          部門を選択して指令を入力してください
                        </div>
                      )}
                      {wsMsg.map((m,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                          <div style={{maxWidth:"85%",borderRadius:8,padding:"8px 12px",fontSize:12,lineHeight:1.7,fontFamily:m.role==="system"?"'DM Mono',monospace":"'Zen Kaku Gothic New',sans-serif",background:m.role==="user"?"rgba(0,212,255,0.15)":m.role==="system"?"#000":"rgba(255,255,255,0.05)",color:m.role==="user"?"#00D4FF":m.role==="system"?"#4ade80":"#ddd",border:`1px solid ${m.role==="user"?"rgba(0,212,255,0.3)":m.role==="system"?"rgba(74,222,128,0.2)":"rgba(255,255,255,0.07)"}`}}>
                            <pre style={{whiteSpace:"pre-wrap",margin:0}}>{m.text}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"rgba(255,255,255,0.03)",padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:8}}>
                      <select value={termDept} onChange={e=>setTermDept(e.target.value)}
                        style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"8px 12px",color:"#00D4FF",fontSize:12,fontFamily:"'DM Mono',monospace",outline:"none",cursor:"pointer"}}>
                        <option value="営業部">営業部</option>
                        <option value="広報部">広報部</option>
                        <option value="マーケティング部">マーケ部</option>
                        <option value="経理部">経理部</option>
                      </select>
                      <input value={term} onChange={e=>setTerm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendTermCmd()}
                        placeholder="指令を入力... (Enter で送信)"
                        style={{flex:1,background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:6,padding:"8px 12px",color:"#e8e8f0",fontSize:12,fontFamily:"'Zen Kaku Gothic New',sans-serif",outline:"none"}}/>
                      <button onClick={sendTermCmd} disabled={!term.trim()||termSending}
                        style={{padding:"8px 16px",borderRadius:6,border:"1px solid rgba(0,212,255,0.4)",background:"rgba(0,212,255,0.1)",color:"#00D4FF",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:12,fontFamily:"'DM Mono',monospace",opacity:(!term.trim()||termSending)?0.4:1}}>
                        {termSending?<CircleDashed size={14} style={{animation:"spin 1s linear infinite"}}/>:<Send size={14}/>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Activity log */}
                <div>
                  <div className="card" style={{marginBottom:14}}>
                    <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:12,textTransform:"uppercase"}}>// 最近のアウトプット</div>
                    {termLogs.map((l,i)=>(
                      <div key={i} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:i<termLogs.length-1?"1px solid rgba(255,255,255,0.05)":"none",alignItems:"flex-start"}}>
                        <div style={{width:32,height:32,borderRadius:8,flexShrink:0,background:l.working?"rgba(0,212,255,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${l.working?"rgba(0,212,255,0.3)":"rgba(255,255,255,0.08)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:l.working?"#00D4FF":"#666",fontWeight:700,animation:l.working?"pulse 1.5s ease-in-out infinite":"none"}}>
                          {l.dept[0]}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,color:"#ddd",fontFamily:"'Zen Kaku Gothic New',sans-serif",fontWeight:700,marginBottom:2,lineHeight:1.4}}>{l.text}</div>
                          <div style={{fontSize:9,color:l.working?"#00D4FF":"#555",fontFamily:"'DM Mono',monospace"}}>{l.dept}部 · {l.working?"実行中...":l.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:12,textTransform:"uppercase"}}>// Sheets連携情報</div>
                    <div style={{fontSize:11,color:"#888",fontFamily:"'Zen Kaku Gothic New',sans-serif",lineHeight:1.8,marginBottom:10}}>
                      指令はGoogle Sheetsの「指示書」シートに自動記録されます。
                    </div>
                    {[{k:"SpreadsheetID",v:SPREADSHEET_ID.slice(0,20)+"..."},{k:"記録シート",v:"指示書!A2"},{k:"書き込み項目",v:"ID・時刻・部門・指令・ステータス"}].map((r,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<2?"1px solid rgba(255,255,255,0.05)":"none"}}>
                        <span style={{fontSize:10,color:"#555",fontFamily:"'DM Mono',monospace"}}>{r.k}</span>
                        <span style={{fontSize:10,color:"#00D4FF",fontFamily:"'DM Mono',monospace"}}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ BLOG GENERATION ════════════════════ */}
          {page==="blog" && (
            <div className="slide-in" style={{"--pc":p.color,"--pcr":p.rgb}}>
              <div style={{marginBottom:22}}>
                <div style={{fontSize:10,color:"#3a3a5a",letterSpacing:"0.2em",marginBottom:5,textTransform:"uppercase"}}>// Blog Automation Engine</div>
                <h2 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:26,fontWeight:900,color:"#fff",lineHeight:1.1}}>
                  AI<span style={{color:"#00D4FF"}}>ブログ</span>生成
                </h2>
                <p style={{fontSize:12,color:"#555",marginTop:5,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>6セクション完全自動生成 — Claude API</p>
              </div>

              {/* Section badges */}
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:22,padding:"12px 16px",background:"rgba(0,212,255,0.03)",border:"1px solid rgba(0,212,255,0.1)",borderRadius:10}}>
                {["①導入（共感）","②Agent1: 調査・分析","③Agent2: コード生成","④Agent3: 執筆・要約","⑤20代へのメッセージ","⑥アクション（収益）"].map(s=>(
                  <span key={s} style={{padding:"4px 10px",borderRadius:20,background:`rgba(${p.rgb},0.08)`,border:`1px solid rgba(${p.rgb},0.2)`,fontSize:11,color:p.color,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{s}</span>
                ))}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:20,alignItems:"start"}}>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {/* Personas */}
                  <div>
                    <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:9,textTransform:"uppercase"}}>// コンテンツモデル</div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {Object.values(PERSONAS).map(pr=>(
                        <button key={pr.id} className={`persona-btn ${persona===pr.id?"active":""}`} style={{"--pc":pr.color,"--pcr":pr.rgb}} onClick={()=>{setPersona(pr.id);setTopic("");setArticle(null);}}>
                          <span style={{marginRight:7}}>{pr.icon}</span>{pr.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Topic */}
                  <div>
                    <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:7,textTransform:"uppercase"}}>// 記事テーマ</div>
                    <textarea className="ibox" rows={3} placeholder="例：AIエージェントを部下として使いこなす方法" value={topic} onChange={e=>setTopic(e.target.value)}/>
                  </div>
                  {/* Presets */}
                  <div>
                    <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:7,textTransform:"uppercase"}}>// プリセット</div>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {p.presets.map(pr=>(<button key={pr} className="preset-pill" onClick={()=>setTopic(pr)}>→ {pr}</button>))}
                    </div>
                  </div>
                  {/* Keywords */}
                  <div>
                    <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:7,textTransform:"uppercase"}}>// SEOキーワード（任意）</div>
                    <input className="ibox" placeholder="例：AIエージェント, 20代 副業" value={keywords} onChange={e=>setKeywords(e.target.value)}/>
                  </div>
                  {/* Button */}
                  <button className="gen-btn" onClick={generate} disabled={loading||!topic.trim()}>
                    {loading?"生成中...":"▶ 記事を完全自動生成する"}
                  </button>
                  {loading&&(
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{fontSize:11,color:p.color,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{progLabel}</span>
                        <span style={{fontSize:11,color:"#555"}}>{progress}%</span>
                      </div>
                      <div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
                        <div className="pbar" style={{width:`${progress}%`}}/>
                      </div>
                    </div>
                  )}
                  {error&&<div style={{padding:10,borderRadius:7,background:"rgba(255,60,60,0.08)",border:"1px solid rgba(255,60,60,0.25)",color:"#ff8080",fontSize:12,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>⚠ {error}</div>}
                </div>
                {/* Right info */}
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div className="card">
                    <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:12,textTransform:"uppercase"}}>// AIペルソナ: Keigo</div>
                    <div style={{color:p.color,fontFamily:"'Zen Kaku Gothic New',sans-serif",fontWeight:700,fontSize:14,marginBottom:10}}>25歳 / 営業DX担当 / 自分株式会社CEO</div>
                    {["都内勤務・副業で自動化を実験中","GAS・Python独学","新NISA・カメラ・ヴィンテージ品が趣味","等身大の失敗談＋実数値で語る文体"].map((t,i)=>(
                      <div key={i} style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:12,color:"#888",padding:"5px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none"}}>· {t}</div>
                    ))}
                  </div>
                  {history.length>0&&(
                    <div className="card">
                      <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:12,textTransform:"uppercase"}}>// 生成履歴</div>
                      {history.map((h,i)=>(
                        <div key={i} style={{padding:"8px 0",borderBottom:i<history.length-1?"1px solid rgba(255,255,255,0.04)":"none",cursor:"pointer"}} onClick={()=>{setArticle(h.parsed);setPage("preview");}}>
                          <div style={{fontSize:11,color:PERSONAS[h.persona].color,marginBottom:2}}>{h.parsed.title.slice(0,36)}…</div>
                          <div style={{fontSize:10,color:"#444",fontFamily:"'DM Mono',monospace"}}>{new Date(h.ts).toLocaleTimeString("ja-JP")} · {h.parsed.chars.toLocaleString()}字</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* トレンドをテーマに使う */}
                  {inputs.length>0&&(
                    <div className="card" style={{border:"1px solid rgba(0,212,255,0.15)"}}>
                      <div style={{fontSize:10,color:"#00D4FF",letterSpacing:"0.12em",marginBottom:12,textTransform:"uppercase"}}>// トレンドからテーマを自動生成</div>
                      <div style={{fontSize:11,color:"#888",fontFamily:"'Zen Kaku Gothic New',sans-serif",marginBottom:10,lineHeight:1.7}}>収集済みのトレンド情報をそのままテーマに使えます</div>
                      {inputs.map((item,i)=>(
                        <button key={i} className="preset-pill" style={{display:"block",width:"100%",marginBottom:6,"--pc":"#00D4FF","--pcr":"0,212,255"}} onClick={()=>setTopic(item.title)}>
                          [{item.taskName}] {item.title.slice(0,40)}…
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ PREVIEW ════════════════════════════ */}
          {page==="preview" && (
            <div className="slide-in">
              <div style={{marginBottom:20}}>
                <div style={{fontSize:10,color:"#3a3a5a",letterSpacing:"0.2em",marginBottom:5,textTransform:"uppercase"}}>// 生成記事プレビュー</div>
                <h2 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:26,fontWeight:900,color:"#fff",lineHeight:1.1}}>記事プレビュー</h2>
              </div>
              {!article?(
                <div style={{height:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"1px dashed rgba(255,255,255,0.07)",borderRadius:12,color:"#444"}}>
                  <div style={{fontSize:40,marginBottom:12,opacity:0.3}}>📄</div>
                  <div style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:14,marginBottom:16}}>まだ記事が生成されていません</div>
                  <button style={{padding:"8px 18px",cursor:"pointer",background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.3)",borderRadius:6,color:"#00D4FF",fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:12}} onClick={()=>setPage("blog")}>→ 生成タブへ</button>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:20,alignItems:"start"}}>
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14,marginBottom:18}}>
                      <h1 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:22,fontWeight:900,color:"#fff",lineHeight:1.4}}>{article.title}</h1>
                      <div style={{display:"flex",gap:7,flexShrink:0}}>
                        <button className="copy-btn" onClick={()=>{navigator.clipboard.writeText(article.raw);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>
                          {copied?"✓ コピー済":"Markdownコピー"}
                        </button>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,marginBottom:16}}>
                      {[{k:"文字数",v:article.chars.toLocaleString()+"字"},{k:"読了",v:Math.ceil(article.chars/500)+"分"},{k:"SEO",v:article.meta?"✓ あり":"—"}].map(s=>(
                        <div key={s.k} style={{flex:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:7,padding:"10px 12px"}}>
                          <div style={{fontSize:9,color:"#555",fontFamily:"'DM Mono',monospace",textTransform:"uppercase",marginBottom:4}}>{s.k}</div>
                          <div style={{fontSize:13,color:"#00D4FF",fontFamily:"'DM Mono',monospace"}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"22px 26px",maxHeight:"62vh",overflowY:"auto"}}>
                      <MdView text={article.body} color="#00D4FF"/>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {article.meta&&(<div className="card"><div style={{fontSize:9,color:"#555",letterSpacing:"0.1em",marginBottom:7,textTransform:"uppercase"}}>// SEOメタ</div><p style={{fontSize:11,color:"#888",fontFamily:"'Zen Kaku Gothic New',sans-serif",lineHeight:1.7}}>{article.meta}</p></div>)}
                    {article.tags.length>0&&(<div className="card"><div style={{fontSize:9,color:"#555",letterSpacing:"0.1em",marginBottom:9,textTransform:"uppercase"}}>// タグ</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{article.tags.map((t,i)=>(<span key={i} style={{padding:"3px 9px",borderRadius:12,background:"rgba(0,212,255,0.08)",border:"1px solid rgba(0,212,255,0.2)",fontSize:10,color:"#00D4FF",fontFamily:"'DM Mono',monospace"}}>{t}</span>))}</div></div>)}
                    {article.affs.length>0&&(<div style={{background:"rgba(255,200,50,0.05)",border:"1px solid rgba(255,200,50,0.15)",borderRadius:10,padding:"14px 16px"}}><div style={{fontSize:9,color:"#888",letterSpacing:"0.1em",marginBottom:9,textTransform:"uppercase"}}>💰 アフィリエイト</div>{article.affs.map((a,i)=>(<div key={i} style={{marginBottom:7,paddingBottom:7,borderBottom:i<article.affs.length-1?"1px solid rgba(255,200,50,0.1)":"none"}}><div style={{fontSize:12,color:"#fcd34d",fontWeight:700,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{a.name}</div>{a.desc&&<div style={{fontSize:10,color:"#888",marginTop:2,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{a.desc}</div>}</div>))}</div>)}
                    <div className="card">
                      <div style={{fontSize:9,color:"#555",letterSpacing:"0.1em",marginBottom:9,textTransform:"uppercase"}}>// WP投稿手順</div>
                      {["Markdownコピー","WP→新規投稿","コードエディタに貼り付け","アイキャッチ画像を設定","アフィリエイトリンク挿入","公開 or スケジュール設定"].map((s,i)=>(
                        <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<5?"1px solid rgba(255,255,255,0.04)":"none"}}>
                          <span style={{color:"#00D4FF",fontSize:10,fontFamily:"'DM Mono',monospace",minWidth:16}}>{i+1}.</span>
                          <span style={{fontSize:11,color:"#888",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ ARCH ════════════════════════════════ */}
          {page==="arch" && (
            <div className="slide-in">
              <div style={{marginBottom:22}}>
                <div style={{fontSize:10,color:"#3a3a5a",letterSpacing:"0.2em",marginBottom:5,textTransform:"uppercase"}}>// System Architecture</div>
                <h2 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:26,fontWeight:900,color:"#fff",lineHeight:1.1}}>システム構成図</h2>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
                {[
                  {title:"インプット層",color:"#64748b",items:["RSSフィード（AI/DXニュース自動収集）","手動テーマ入力（このブログ生成タブ）","トレンドAPI（Google Trends連携）"]},
                  {title:"オーケストレーター",color:"#00D4FF",items:["JIBUN-OS（このシステム）","Claude API（ペルソナ・構成管理）","WebSocket（リアルタイム指令送受信）"]},
                  {title:"3つのAIエージェント",color:"#A855F7",items:["Agent 1: 調査・分析（Manus AI / OpenClaw）","Agent 2: コード生成（Claude API / Cursor）","Agent 3: 執筆・要約（Perplexity / NotebookLM）"]},
                  {title:"アウトプット層",color:"#10b981",items:["WordPress（GAS + REST API で下書き自動保存）","Google Sheets（指示書・記事ログ・KPI記録）","note / Tips（有料コンテンツ配信）"]},
                ].map((s,i)=>(
                  <div key={i} className="card" style={{borderLeft:`3px solid ${s.color}`}}>
                    <div style={{fontSize:10,color:s.color,letterSpacing:"0.12em",marginBottom:10,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{s.title}</div>
                    {s.items.map((item,j)=>(
                      <div key={j} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:j<s.items.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                        <span style={{color:s.color,fontSize:11}}>›</span>
                        <span style={{fontSize:12,color:"#aaa",fontFamily:"'Zen Kaku Gothic New',sans-serif",lineHeight:1.5}}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {/* Flow */}
              <div className="card">
                <div style={{fontSize:10,color:"#555",letterSpacing:"0.12em",marginBottom:14,textTransform:"uppercase"}}>// データフロー（自動化の全体像）</div>
                <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:0}}>
                  {[
                    {icon:"📡",label:"トピック取得",sub:"RSS / 手動 / トレンド"},
                    {icon:"⚙️",label:"JIBUN-OS起動",sub:"Claude APIにペルソナ指示"},
                    {icon:"🤖",label:"3エージェント並列",sub:"調査・コード・執筆"},
                    {icon:"🎨",label:"統合フォーマット",sub:"SEO・アフィリ自動挿入"},
                    {icon:"📊",label:"Sheets記録",sub:"KPI・ログ自動書き込み"},
                    {icon:"🌐",label:"WP自動投稿",sub:"下書き保存→ワンクリック公開"},
                  ].map((f,i,arr)=>(
                    <div key={i} style={{display:"flex",alignItems:"center"}}>
                      <div style={{textAlign:"center",padding:"12px 16px",borderRadius:8,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",minWidth:120}}>
                        <div style={{fontSize:22,marginBottom:6}}>{f.icon}</div>
                        <div style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:12,color:"#ddd",fontWeight:700,marginBottom:3}}>{f.label}</div>
                        <div style={{fontSize:10,color:"#555",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{f.sub}</div>
                      </div>
                      {i<arr.length-1&&<div style={{padding:"0 6px",color:"#333",fontSize:16}}>→</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ SETUP ═══════════════════════════════ */}
          {page==="setup" && (()=>{
            const ph=SETUP_PHASES[activePhase];
            const pc=ph.color; const pcr=ph.rgb;
            const step=ph.steps[activeStep];
            return (
              <div className="slide-in" style={{"--pc":pc,"--pcr":pcr}}>
                <div style={{marginBottom:22}}>
                  <div style={{fontSize:10,color:"#3a3a5a",letterSpacing:"0.2em",marginBottom:5,textTransform:"uppercase"}}>// Setup Guide</div>
                  <h2 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:26,fontWeight:900,color:"#fff",lineHeight:1.1}}>構築手順 <span style={{fontSize:16,color:"#555",fontWeight:300}}>{setupPct}% 完了</span></h2>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:18,alignItems:"start"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {SETUP_PHASES.map((p2,pi)=>{
                      const dc=p2.steps.map((_,si)=>`${pi}-${si}`).filter(k=>doneSteps[k]).length;
                      return (<button key={pi} className={`phase-tab ${activePhase===pi?"active":""}`} style={{"--pc":p2.color,"--pcr":p2.rgb}} onClick={()=>{setActivePhase(pi);setActiveStep(0);}}>
                        <div style={{color:p2.color,fontSize:9,fontFamily:"'DM Mono',monospace",marginBottom:3}}>{p2.phase} · {p2.duration}</div>
                        <div style={{fontWeight:700,fontSize:12,marginBottom:6}}>{p2.title}</div>
                        <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden",marginBottom:4}}>
                          <div style={{height:"100%",background:p2.color,borderRadius:2,width:`${(dc/p2.steps.length)*100}%`,transition:"width 0.4s"}}/>
                        </div>
                        <div style={{fontSize:9,color:"#555",fontFamily:"'DM Mono',monospace"}}>{dc}/{p2.steps.length}</div>
                      </button>);
                    })}
                  </div>
                  <div>
                    <div style={{background:`rgba(${pcr},0.06)`,border:`1px solid rgba(${pcr},0.2)`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
                      <div style={{fontSize:9,color:pc,letterSpacing:"0.12em",marginBottom:3,textTransform:"uppercase"}}>{ph.phase} · {ph.duration}</div>
                      <h3 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:18,fontWeight:900,color:"#fff"}}>{ph.title}</h3>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
                      {ph.steps.map((s,si)=>{
                        const key=`${activePhase}-${si}`,isDone=doneSteps[key];
                        return (<div key={si} className={`step-card ${activeStep===si?"sactive":""} ${isDone?"sdone":""}`} onClick={()=>setActiveStep(si)}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{display:"flex",gap:9,alignItems:"center"}}>
                              <span style={{width:20,height:20,borderRadius:"50%",flexShrink:0,background:isDone?"rgba(74,222,128,0.2)":`rgba(${pcr},0.15)`,border:`1px solid ${isDone?"#4ade8066":pc+"44"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:isDone?"#4ade80":pc,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{isDone?"✓":si+1}</span>
                              <span style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:12,fontWeight:700,color:isDone?"#4ade80":activeStep===si?"#fff":"#aaa"}}>{s.title}</span>
                            </div>
                            <span style={{fontSize:10,color:"#555",fontFamily:"'DM Mono',monospace"}}>⏱ {s.time}</span>
                          </div>
                        </div>);
                      })}
                    </div>
                    {step&&(
                      <div style={{background:"rgba(255,255,255,0.025)",border:`1px solid rgba(${pcr},0.25)`,borderRadius:10,padding:"20px 22px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,gap:12}}>
                          <div>
                            <div style={{fontSize:9,color:pc,letterSpacing:"0.12em",marginBottom:4,textTransform:"uppercase"}}>Step {activeStep+1}/{ph.steps.length}</div>
                            <h3 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:17,fontWeight:900,color:"#fff"}}>{step.title}</h3>
                          </div>
                          <span style={{fontSize:11,color:"#555",fontFamily:"'DM Mono',monospace",flexShrink:0}}>⏱ {step.time}</span>
                        </div>
                        <p style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13,color:"#aaa",lineHeight:1.9,marginBottom:12}}>{step.detail}</p>
                        {step.url&&(<div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"6px 12px",borderRadius:6,marginBottom:12,background:`rgba(${pcr},0.08)`,border:`1px solid rgba(${pcr},0.25)`,fontSize:11,color:pc,fontFamily:"'DM Mono',monospace"}}>🔗 {step.url}</div>)}
                        {step.code&&(<div style={{marginBottom:16}}><div style={{fontSize:9,color:"#555",letterSpacing:"0.1em",marginBottom:6,textTransform:"uppercase"}}>// サンプルコード</div><div className="code-blk">{step.code}</div></div>)}
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          <button className={`done-btn ${doneSteps[`${activePhase}-${activeStep}`]?"isdone":""}`} onClick={()=>toggleDone(`${activePhase}-${activeStep}`)}>{doneSteps[`${activePhase}-${activeStep}`]?"✓ 完了済み":"✓ 完了マーク"}</button>
                          <button className="snav-btn" disabled={activeStep===0&&activePhase===0} onClick={()=>{if(activeStep>0)setActiveStep(s=>s-1);else if(activePhase>0){setActivePhase(p=>p-1);setActiveStep(SETUP_PHASES[activePhase-1].steps.length-1);}}}>← 前</button>
                          <button className="snav-btn" disabled={activeStep===ph.steps.length-1&&activePhase===SETUP_PHASES.length-1} onClick={()=>{if(activeStep<ph.steps.length-1)setActiveStep(s=>s+1);else if(activePhase<SETUP_PHASES.length-1){setActivePhase(p=>p+1);setActiveStep(0);}}}>次 →</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ═══ ROI ═════════════════════════════════ */}
          {page==="roi" && (
            <div className="slide-in">
              <div style={{marginBottom:22}}>
                <div style={{fontSize:10,color:"#3a3a5a",letterSpacing:"0.2em",marginBottom:5,textTransform:"uppercase"}}>// Cost & Revenue Analysis</div>
                <h2 style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:26,fontWeight:900,color:"#fff",lineHeight:1.1}}>費用対効果</h2>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:18}}>
                {[
                  {title:"ブログ基盤",color:"#00D4FF",rgb:"0,212,255",items:[{n:"ConoHa WING",c:"月1,200円〜",r:"必須"},{n:"独自ドメイン",c:"年1,000円〜",r:"必須"},{n:"WordPress",c:"無料",r:"必須"},{n:"SWELL",c:"買切17,600円",r:"推奨"}]},
                  {title:"AIツール",color:"#A855F7",rgb:"168,85,247",items:[{n:"Claude API",c:"月500〜3,000円",r:"必須"},{n:"Perplexity Pro",c:"月2,000円",r:"推奨"},{n:"Cursor Pro",c:"月2,000円",r:"任意"},{n:"NotebookLM",c:"無料",r:"推奨"}]},
                  {title:"収益化ASP",color:"#f59e0b",rgb:"245,158,11",items:[{n:"Googleアドセンス",c:"無料",r:"推奨"},{n:"Amazonアソシエイト",c:"無料",r:"推奨"},{n:"A8.net",c:"無料",r:"推奨"},{n:"note / Tips",c:"手数料10〜20%",r:"任意"}]},
                ].map(group=>(
                  <div key={group.title} className="card" style={{border:`1px solid rgba(${group.rgb},0.2)`}}>
                    <div style={{fontSize:11,color:group.color,fontWeight:700,marginBottom:12,fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{group.title}</div>
                    {group.items.map((item,i)=>(
                      <div key={i} style={{padding:"7px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:12,color:"#ddd",fontFamily:"'Zen Kaku Gothic New',sans-serif",fontWeight:700}}>{item.n}</span>
                          <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:item.r==="必須"?"rgba(255,80,80,0.15)":item.r==="推奨"?"rgba(0,212,255,0.1)":"rgba(255,255,255,0.06)",color:item.r==="必須"?"#ff8080":item.r==="推奨"?"#00D4FF":"#888",fontFamily:"'DM Mono',monospace"}}>{item.r}</span>
                        </div>
                        <div style={{fontSize:11,color:group.color,fontFamily:"'DM Mono',monospace",marginTop:2}}>{item.c}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                <div className="card">
                  <div style={{fontSize:10,color:"#ff8080",letterSpacing:"0.12em",marginBottom:12,textTransform:"uppercase"}}>// 月次コスト試算</div>
                  {[{i:"レンタルサーバー",mn:1200,mx:1500},{i:"ドメイン（月割）",mn:83,mx:125},{i:"Claude API",mn:500,mx:3000},{i:"Perplexity（任意）",mn:0,mx:2000},{i:"テーマ（月割・任意）",mn:0,mx:600}].map((c,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <span style={{fontSize:12,color:"#aaa",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{c.i}</span>
                      <span style={{fontSize:12,color:"#ff8080",fontFamily:"'DM Mono',monospace"}}>¥{c.mn.toLocaleString()} 〜 ¥{c.mx.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{marginTop:12,padding:"12px 14px",background:"rgba(255,80,80,0.08)",borderRadius:8,border:"1px solid rgba(255,80,80,0.2)"}}>
                    <div style={{fontSize:10,color:"#888",marginBottom:4}}>月間合計</div>
                    <div style={{fontSize:20,color:"#ff8080",fontFamily:"'DM Mono',monospace",fontWeight:700}}>¥1,783 〜 ¥7,225 / 月</div>
                  </div>
                </div>
                <div className="card">
                  <div style={{fontSize:10,color:"#4ade80",letterSpacing:"0.12em",marginBottom:12,textTransform:"uppercase"}}>// 収益ロードマップ</div>
                  {[{ph:"0〜3ヶ月",pv:"〜1,000PV/月",inc:"0〜3,000円",c:"#444"},{ph:"3〜6ヶ月",pv:"〜5,000PV/月",inc:"3,000〜20,000円",c:"#00D4FF"},{ph:"6〜12ヶ月",pv:"〜20,000PV/月",inc:"20,000〜80,000円",c:"#4ade80"},{ph:"1年〜",pv:"20,000PV+/月",inc:"80,000〜200,000円+",c:"#fcd34d"}].map((r,i)=>(
                    <div key={i} style={{padding:"10px 12px",marginBottom:7,background:"rgba(255,255,255,0.02)",borderRadius:6,borderLeft:`3px solid ${r.c}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,color:r.c,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{r.ph}</span>
                        <span style={{fontSize:13,color:"#4ade80",fontFamily:"'DM Mono',monospace"}}>{r.inc}</span>
                      </div>
                      <div style={{fontSize:10,color:"#888",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{r.pv}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{background:"rgba(74,222,128,0.04)",border:"1px solid rgba(74,222,128,0.2)"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:16}}>
                  {[{l:"損益分岐点",v:"月3〜5本",s:"アフィリエイト1件で黒字化"},{l:"初期費用（最小）",v:"約20,000円",s:"サーバー1年+ドメイン+テーマ"},{l:"時間投資（AI後）",v:"週2〜3時間",s:"テーマ選定+生成+投稿のみ"},{l:"1年後期待ROI",v:"500〜2,000%",s:"月10万円÷月5,000円"}].map((m,i)=>(
                    <div key={i} style={{textAlign:"center",padding:12}}>
                      <div style={{fontSize:9,color:"#666",fontFamily:"'DM Mono',monospace",marginBottom:5,letterSpacing:"0.1em"}}>{m.l}</div>
                      <div style={{fontSize:18,color:"#4ade80",fontFamily:"'DM Mono',monospace",fontWeight:700,marginBottom:3}}>{m.v}</div>
                      <div style={{fontSize:10,color:"#666",fontFamily:"'Zen Kaku Gothic New',sans-serif"}}>{m.s}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"12px 16px",background:"rgba(0,0,0,0.3)",borderRadius:8}}>
                  <p style={{fontFamily:"'Zen Kaku Gothic New',sans-serif",fontSize:13,color:"#aaa",lineHeight:1.85}}>
                    <strong style={{color:"#4ade80"}}>結論：</strong>月2,000円以下の投資で始められ、6ヶ月継続すれば投資回収が現実的。このJIBUN-OSで記事量産の時間を<strong style={{color:"#fff"}}>週10時間→2時間</strong>に圧縮できます。20代のうちにSEO資産を積み上げることで、<strong style={{color:"#fcd34d"}}>複利的に収益が伸びる</strong>仕組みが完成します。
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
