import { useState, useEffect } from 'react';
import {
  Bot, Zap, Brain, Database, LayoutDashboard, GitBranch,
  ExternalLink, CheckCircle, ChevronRight,
  Cpu, Globe, Layers, Workflow, BookOpen, Sparkles,
  Terminal, Package, ArrowRight, AlertCircle, RefreshCw,
  Network, Shield, TrendingUp, Star, Clock, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Separator } from './components/ui/separator';
import { PageHeader } from './components/layout/PageHeader';

const OSS_TOOLS = [
  {
    id: 'flowise', name: 'Flowise', category: 'AI エージェント', icon: Bot,
    accentClass: 'text-violet-600', bgClass: 'bg-violet-50',
    gradientFrom: '#7c3aed', gradientTo: '#4f46e5',
    description: 'ノーコードでLLMエージェント・チャットボットをビジュアル構築。Geminiと即接続可能。',
    github: 'https://github.com/FlowiseAI/Flowise', stars: '35k+',
    port: 3000, installCmd: 'npx flowise start', localUrl: 'http://localhost:3000',
    status: 'not_installed', useCase: 'ブログAI生成 / 壁打ち相手 / 記事自動生成',
  },
  {
    id: 'n8n', name: 'n8n', category: '自動化フロー', icon: Workflow,
    accentClass: 'text-orange-600', bgClass: 'bg-orange-50',
    gradientFrom: '#ea580c', gradientTo: '#dc2626',
    description: 'ZapierのOSS版。400以上のアプリ連携で全業務を全自動化。すでに導入済み。',
    github: 'https://github.com/n8n-io/n8n', stars: '47k+',
    port: 5678, installCmd: 'npx n8n', localUrl: 'http://localhost:5678',
    status: 'installed', useCase: 'SNS自動投稿 / トレンド収集 / アフィリエイト生成',
  },
  {
    id: 'anythingllm', name: 'AnythingLLM', category: 'ナレッジベース', icon: Brain,
    accentClass: 'text-blue-600', bgClass: 'bg-blue-50',
    gradientFrom: '#2563eb', gradientTo: '#0891b2',
    description: '自分のPDF・ドキュメントをAIに読み込ませて質問できる「第二の脳」。',
    github: 'https://github.com/Mintplex-Labs/anything-llm', stars: '32k+',
    port: 3001, installCmd: 'docker pull mintplexlabs/anythingllm', localUrl: 'http://localhost:3001',
    status: 'not_installed', useCase: 'Kindle書籍の検索 / 業務ナレッジ管理 / AI壁打ち',
  },
  {
    id: 'pocketbase', name: 'PocketBase', category: 'データベース', icon: Database,
    accentClass: 'text-emerald-600', bgClass: 'bg-emerald-50',
    gradientFrom: '#059669', gradientTo: '#0d9488',
    description: 'ゼロ設定で動く超軽量データベース＋認証サーバー。単一バイナリで即起動。',
    github: 'https://github.com/pocketbase/pocketbase', stars: '43k+',
    port: 8090, installCmd: './pocketbase serve', localUrl: 'http://localhost:8090/_/',
    status: 'not_installed', useCase: 'アフィリ実績管理 / 顧客リスト / タスクDB',
  },
  {
    id: 'appsmith', name: 'Appsmith', category: 'UI ビルダー', icon: LayoutDashboard,
    accentClass: 'text-pink-600', bgClass: 'bg-pink-50',
    gradientFrom: '#db2777', gradientTo: '#e11d48',
    description: 'ドラッグ&ドロップで社内管理画面を爆速作成。',
    github: 'https://github.com/appsmithorg/appsmith', stars: '34k+',
    port: 8080, installCmd: 'docker run -p 8080:80 appsmith/appsmith-ce', localUrl: 'http://localhost:8080',
    status: 'not_installed', useCase: 'データ入力画面 / KPIダッシュボード / 社内CRM',
  },
  {
    id: 'dify', name: 'Dify', category: 'AIプラットフォーム', icon: Sparkles,
    accentClass: 'text-indigo-600', bgClass: 'bg-indigo-50',
    gradientFrom: '#4f46e5', gradientTo: '#2563eb',
    description: 'LLMアプリ開発プラットフォーム。RAG・エージェント・チャットフローをGUIで設計。',
    github: 'https://github.com/langgenius/dify', stars: '60k+',
    port: 80, installCmd: 'docker compose up -d', localUrl: 'http://localhost',
    status: 'not_installed', useCase: 'ブログ自動生成 / リサーチAI / 社内チャットボット',
  },
];

const N8N_WORKFLOWS = [
  {
    id: 'gemini-blog', name: 'Gemini × WordPress 自動ブログ投稿',
    description: 'Google NewsからトレンドをRSS取得 → Gemini 1.5 Flash で記事生成 → WordPress REST APIで自動投稿',
    nodes: ['Schedule', 'RSS Feed', 'Gemini API', 'WordPress'], difficulty: '簡単', estimatedTime: '30分', icon: Globe,
  },
  {
    id: 'gemini-sns', name: 'Gemini × SNS アフィリエイト自動投稿',
    description: 'アフィリリンクDBを定期読み込み → Gemini でSNS用コピーを生成 → Twitter/Xへ自動投稿',
    nodes: ['Schedule', 'PocketBase', 'Gemini API', 'Twitter'], difficulty: '中級', estimatedTime: '45分', icon: TrendingUp,
  },
  {
    id: 'kindle-rag', name: 'Kindle スクショ → AnythingLLM 自動取込',
    description: 'Google Driveの新規PDFを検知 → AnythingLLM APIで自動ドキュメント登録 → 即検索可能に',
    nodes: ['Google Drive', 'HTTP Request', 'AnythingLLM'], difficulty: '中級', estimatedTime: '60分', icon: BookOpen,
  },
  {
    id: 'daily-brief', name: '朝の自動ブリーフィング生成',
    description: '毎朝7時にニュース・RSS・タスクを収集 → Gemini で要約 → メールまたはSlackで受信',
    nodes: ['Schedule', 'Google News', 'Gemini API', 'Gmail'], difficulty: '簡単', estimatedTime: '20分', icon: Clock,
  },
];

function GeminiTester() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('日本のAIトレンドを3行でまとめて');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testGemini = async () => {
    if (!apiKey) { setError('APIキーを入力してください'); return; }
    setLoading(true); setError(''); setResult('');
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'API Error');
      setResult(data.candidates?.[0]?.content?.parts?.[0]?.text || '(空の応答)');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
          Gemini API Key（無料取得: aistudio.google.com）
        </label>
        <div className="flex gap-2">
          <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIzaSy..." className="flex-1" />
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">無料取得 <ExternalLink size={12} /></Button>
          </a>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">テスト用プロンプト</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-md border border-[hsl(var(--input))] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] bg-transparent"
        />
      </div>
      <Button onClick={testGemini} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0">
        {loading ? <><RefreshCw size={14} className="animate-spin" /> テスト中...</> : <><Sparkles size={14} /> Gemini Flash でテスト実行</>}
      </Button>
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 bg-red-50">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      {result && (
        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
          <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1"><CheckCircle size={12} /> Gemini からの応答</p>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}

function ToolCard({ tool }: { tool: typeof OSS_TOOLS[0] }) {
  const Icon = tool.icon;
  const isInstalled = tool.status === 'installed';

  return (
    <Card className={`flex flex-col overflow-hidden hover:shadow-md transition-shadow ${isInstalled ? 'ring-1 ring-emerald-200' : ''}`}>
      {/* カラーバー */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${tool.gradientFrom}, ${tool.gradientTo})` }} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${tool.bgClass} flex items-center justify-center`}>
              <Icon size={18} className={tool.accentClass} />
            </div>
            <div>
              <CardTitle className="text-sm">{tool.name}</CardTitle>
              <CardDescription className="text-xs">{tool.category}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
              <Star size={10} className="fill-amber-400 text-amber-400" /> {tool.stars}
            </div>
            {isInstalled && <Badge variant="success" className="text-[10px]">導入済み</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{tool.description}</p>
        <div className={`${tool.bgClass} rounded-lg p-2.5`}>
          <p className={`text-[10px] font-semibold ${tool.accentClass} mb-0.5`}>活用シーン</p>
          <p className="text-xs text-zinc-600">{tool.useCase}</p>
        </div>
        <div className="bg-zinc-950 rounded-lg px-3 py-2 flex items-center gap-2 overflow-x-auto">
          <Terminal size={11} className="text-emerald-400 shrink-0" />
          <code className="text-xs text-emerald-300 whitespace-nowrap">{tool.installCmd}</code>
        </div>
        <div className="flex gap-2 pt-1">
          <a href={tool.localUrl} target="_blank" rel="noopener noreferrer"
            className={`flex-1 py-1.5 rounded-md text-xs font-medium text-center transition ${
              isInstalled ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] cursor-not-allowed'
            }`}
            onClick={e => !isInstalled && e.preventDefault()}
          >
            {isInstalled ? '開く' : '未起動'}
          </a>
          <a href={tool.github} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="text-xs">
              <GitBranch size={11} /> GitHub
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowCard({ wf }: { wf: typeof N8N_WORKFLOWS[0] }) {
  const Icon = wf.icon;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm leading-tight">{wf.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={wf.difficulty === '簡単' ? 'success' : 'warning'} className="text-[10px]">{wf.difficulty}</Badge>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] flex items-center gap-0.5">
                <Clock size={9} /> {wf.estimatedTime}
              </span>
              <Badge variant="secondary" className="text-[10px]">完全無料</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed mb-3">{wf.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {wf.nodes.map((node, i) => (
            <span key={i} className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-1 rounded font-mono flex items-center gap-1">
              {i > 0 && <ChevronRight size={7} className="text-zinc-600" />}
              {node}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ArchitectureView() {
  const layers = [
    { name: '脳層 — AI・思考', desc: 'Gemini Flash / Flowise / Dify / AnythingLLM', icon: Brain, color: 'bg-violet-50 text-violet-600', items: ['Gemini 1.5 Flash', 'Flowise エージェント', 'AnythingLLM RAG'] },
    { name: '神経層 — 自動化', desc: 'n8n でアプリ間の自動連携フロー', icon: Workflow, color: 'bg-orange-50 text-orange-600', items: ['n8n SNSフロー', 'n8n Gemini連携', 'n8n スケジューラー'] },
    { name: '記憶層 — データ', desc: 'PocketBase で全データを一元管理', icon: Database, color: 'bg-emerald-50 text-emerald-600', items: ['アフィリ実績DB', 'タスク管理', 'コンテンツアーカイブ'] },
    { name: '顔層 — UI', desc: 'このダッシュボード + Appsmith', icon: LayoutDashboard, color: 'bg-blue-50 text-blue-600', items: ['JIBUN-OS Hub', 'Appsmith画面', 'モバイルアプリ'] },
  ];

  return (
    <div className="space-y-3">
      {layers.map((layer, i) => {
        const Icon = layer.icon;
        return (
          <div key={i} className="flex items-stretch gap-3">
            <div className={`w-1 rounded-full ${layer.color.split(' ')[0]}`} />
            <Card className="flex-1">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${layer.color} flex items-center justify-center shrink-0`}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{layer.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{layer.desc}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {layer.items.map((item, j) => (
                    <Badge key={j} variant="secondary" className="text-xs font-normal">{item}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
      <div className="flex items-center justify-center gap-2 pt-2">
        <ArrowRight size={13} className="text-[hsl(var(--muted-foreground))]" />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">各層はn8nが繋ぎ、Gemini AIが頭脳として機能します</p>
      </div>
    </div>
  );
}

type Tab = 'tools' | 'workflows' | 'gemini' | 'architecture';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'tools', label: 'OSSツール', icon: Package },
  { id: 'workflows', label: 'n8n フロー', icon: Workflow },
  { id: 'gemini', label: 'Gemini テスター', icon: Sparkles },
  { id: 'architecture', label: 'アーキテクチャ', icon: Network },
];

export default function JibunOS_Hub() {
  const [activeTab, setActiveTab] = useState<Tab>('tools');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="OSS統合ハブ"
        description="GitHub OSSを組み合わせた最強の自動化システム"
        icon={<Cpu size={16} />}
        actions={
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">現在時刻</p>
              <p className="text-xs font-mono">{time.toLocaleTimeString('ja-JP')}</p>
            </div>
            <Badge variant="success">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              システム稼働中
            </Badge>
          </div>
        }
      />

      {/* クイックステータス */}
      <div className="px-6 py-3 border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '導入済みツール', value: '1 / 6', icon: Package, color: 'text-orange-500' },
            { label: '無料API枠', value: 'Gemini Flash', icon: Sparkles, color: 'text-violet-500' },
            { label: 'n8n フロー', value: '1 稼働中', icon: Workflow, color: 'text-emerald-500' },
            { label: 'OSSスター合計', value: '250k+', icon: Star, color: 'text-amber-500' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                <Icon size={16} className={stat.color} />
                <div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{stat.label}</p>
                  <p className="text-xs font-semibold">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* タブバー */}
      <div className="px-6 border-b bg-[hsl(var(--card))]">
        <div className="flex gap-0 -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-[hsl(var(--foreground))] text-[hsl(var(--foreground))]'
                    : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="p-6">

          {activeTab === 'tools' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {OSS_TOOLS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings size={14} />
                    <CardTitle className="text-sm">推奨セットアップ順序</CardTitle>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-2">
                  {[
                    { step: 1, tool: 'n8n（すでに入っています！）', desc: 'まずSNS自動投稿フローを完成させる', done: true },
                    { step: 2, tool: 'Flowise', desc: 'Gemini APIキーを接続してAIアシスタントを作成', done: false },
                    { step: 3, tool: 'PocketBase', desc: 'アフィリエイト実績データをDBに移行', done: false },
                    { step: 4, tool: 'AnythingLLM', desc: 'KindleスクショPDFを読み込ませる', done: false },
                    { step: 5, tool: 'Dify', desc: '本格的なAIエージェントチームを構築', done: false },
                  ].map(step => (
                    <div key={step.step} className="flex items-center gap-3 py-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.done ? 'bg-emerald-500 text-white' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}>
                        {step.done ? '✓' : step.step}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${step.done ? 'text-emerald-600 line-through' : ''}`}>{step.tool}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">{step.desc}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {N8N_WORKFLOWS.map(wf => <WorkflowCard key={wf.id} wf={wf} />)}
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Workflow size={14} className="text-orange-500" />
                    <CardTitle className="text-sm">Gemini APIキーをn8nで使う方法</CardTitle>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <ol className="space-y-2 text-sm">
                    {[
                      <>n8nを起動 → 右上メニュー → <strong>Credentials</strong></>,
                      <>「Google Gemini」または「HTTP Request」ノードを追加</>,
                      <>APIキーを入力（<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">aistudio.google.com</a> から無料取得）</>,
                      <>モデルに <code className="bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded text-sm">gemini-1.5-flash</code> を指定（無料枠最大）</>,
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[hsl(var(--muted-foreground))]">
                        <span className="text-orange-500 font-bold shrink-0 text-xs mt-0.5">{i + 1}.</span>
                        <span className="text-xs">{item}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4">
                    <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer">
                      <Button className="bg-orange-600 hover:bg-orange-500 text-white border-0">
                        <ExternalLink size={13} /> n8n を開く (localhost:5678)
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'gemini' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-sm font-semibold mb-0.5">Gemini 無料API テスター</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Google AI Studioで取得したAPIキーで動作確認できます。
                  <span className="text-violet-600 font-semibold"> 月100万トークン無料</span>（Gemini 1.5 Flash）
                </p>
              </div>
              <Card><CardContent className="pt-5"><GeminiTester /></CardContent></Card>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-blue-500" />
                    <CardTitle className="text-sm">無料枠ガイド</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { model: 'Gemini 1.5 Flash', limit: '100万トークン/日', rec: '★ 最推奨' },
                      { model: 'Gemini 1.5 Pro', limit: '50万トークン/月', rec: '複雑な作業向け' },
                      { model: 'Gemini 2.0 Flash', limit: '100万トークン/月', rec: '最新モデル' },
                      { model: 'Gemini Embedding', limit: '100万tokens/分', rec: 'RAG検索向け' },
                    ].map((m, i) => (
                      <div key={i} className="p-3 rounded-lg border">
                        <p className="text-xs font-semibold">{m.model}</p>
                        <p className="text-xs text-emerald-600 mt-0.5 font-medium">{m.limit}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{m.rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="max-w-3xl space-y-6">
              <ArchitectureView />
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <CardTitle className="text-sm">月間コスト試算（完全ローカル運用）</CardTitle>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="space-y-1">
                    {[
                      { item: 'n8n（セルフホスト）', cost: '¥0', note: '無料 OSS' },
                      { item: 'Flowise（セルフホスト）', cost: '¥0', note: '無料 OSS' },
                      { item: 'AnythingLLM（セルフホスト）', cost: '¥0', note: '無料 OSS' },
                      { item: 'PocketBase', cost: '¥0', note: '無料 OSS' },
                      { item: 'Gemini 1.5 Flash API', cost: '¥0', note: '月100万トークン無料' },
                      { item: 'Google Drive（既存）', cost: '¥0', note: '既存利用' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{row.item}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{row.note}</span>
                          <span className="text-sm font-semibold text-emerald-600">{row.cost}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-3">
                      <span className="font-semibold">合計</span>
                      <span className="text-xl font-black text-emerald-600">¥0 / 月</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
