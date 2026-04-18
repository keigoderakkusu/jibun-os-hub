import { useState, useEffect, useRef } from 'react';
import {
  Layers, Terminal, Coins, LineChart, Heart, Server,
  Cpu, Megaphone, PieChart, ExternalLink, RefreshCw,
  TrendingUp, TrendingDown, Activity, Settings, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Separator } from './components/ui/separator';
import { PageHeader } from './components/layout/PageHeader';

function StatCard({
  title, value, unit, badge, badgeVariant, icon: Icon, iconColor, trend
}: {
  title: string;
  value: string;
  unit?: string;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'secondary' | 'default';
  icon: React.ElementType;
  iconColor: string;
  trend?: 'up' | 'down';
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          {badge && <Badge variant={badgeVariant ?? 'secondary'}>{badge}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-[hsl(var(--foreground))]">{value}</span>
            {unit && <span className="ml-1 text-sm text-[hsl(var(--muted-foreground))]">{unit}</span>}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon size={18} />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend === 'up' ? '好調' : '要確認'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function IntegratedDashboard() {
  const [instruction, setInstruction] = useState('');
  const [sending, setSending] = useState(false);
  const [inputs, setInputs] = useState<any[]>([]);
  const [messages, setMessages] = useState<{ role: 'user' | 'agent' | 'system'; text: string }[]>([]);
  const [agentStatus, setAgentStatus] = useState<string>('待機中...');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [backendUrl, setBackendUrl] = useState(
    () => localStorage.getItem('jibun_backend_url') || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '')
  );
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'feeds'>('terminal');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!backendUrl) return;
    const wsUrl = backendUrl.replace('http:', 'ws:').replace('https:', 'wss:') + '/api/agent/stream';
    const newWs = new WebSocket(wsUrl);
    newWs.onopen = () => setAgentStatus('接続完了');
    newWs.onclose = () => setAgentStatus('オフライン');
    newWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status') setAgentStatus(data.message);
      else if (data.type === 'tool_call') {
        setAgentStatus(`実行中: ${data.name}`);
        setMessages(prev => [...prev, { role: 'system', text: `> [Action] ${data.name}(${JSON.stringify(data.args)})` }]);
      } else if (data.type === 'tool_result') {
        setMessages(prev => [...prev, { role: 'system', text: `> [Result] ${data.result}` }]);
      } else if (data.type === 'text') {
        setMessages(prev => [...prev, { role: 'agent', text: data.text }]);
      } else if (data.type === 'done') {
        setAgentStatus('待機中...');
        setSending(false);
      } else if (data.type === 'error') {
        setMessages(prev => [...prev, { role: 'system', text: `> [Error] ${data.text}` }]);
        setSending(false);
      }
    };
    setWs(newWs);
    return () => newWs.close();
  }, []);

  const fetchInputs = async () => {
    if (!backendUrl) return;
    try {
      const res = await fetch(`${backendUrl}/api/inputs`);
      const data = await res.json();
      if (data.success) setInputs(data.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchInputs(); }, [backendUrl]);

  const sendCommand = () => {
    if (!instruction || !ws || ws.readyState !== WebSocket.OPEN) return;
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', text: instruction }]);
    ws.send(JSON.stringify({ text: instruction }));
    setInstruction('');
  };

  const isOnline = agentStatus !== 'オフライン';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="JIBUN-OS ダッシュボード"
        description="メインコントロールインターフェース"
        icon={<Layers size={16} />}
        actions={
          <div className="flex items-center gap-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M/edit"
              target="_blank" rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink size={13} /> 統合データ基盤
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={13} /> 接続設定
            </Button>
            <Badge variant={isOnline ? 'success' : 'destructive'}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isOnline ? '正常稼働' : 'オフライン'}
            </Badge>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="p-6 space-y-6">

          {/* 接続設定パネル */}
          {showSettings && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium whitespace-nowrap">リモート接続URL:</label>
                  <Input
                    value={backendUrl}
                    onChange={(e) => {
                      setBackendUrl(e.target.value);
                      localStorage.setItem('jibun_backend_url', e.target.value);
                    }}
                    placeholder="例: https://my-tunnel.loca.lt"
                    className="flex-1"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap hidden lg:block">
                    <code className="bg-[hsl(var(--muted))] px-1 rounded">start_mobile_access.command</code> を実行後にURLを貼り付け
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPIカード */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="総資産 (米ドル)"
              value="2億368万"
              unit="ドル"
              badge="+12.4%"
              badgeVariant="success"
              icon={Coins}
              iconColor="bg-violet-50 text-violet-600"
              trend="up"
            />
            <StatCard
              title="利益率 / 目標 60%"
              value="65.38"
              unit="%"
              icon={LineChart}
              iconColor="bg-blue-50 text-blue-600"
              trend="up"
            />
            <StatCard
              title="ライフスコア (進捗 82%)"
              value="クラスA"
              icon={Heart}
              iconColor="bg-orange-50 text-orange-500"
              trend="up"
            />
            <StatCard
              title="システム負荷"
              value="92.4"
              unit="%"
              badge="安定"
              badgeVariant="warning"
              icon={Server}
              iconColor="bg-red-50 text-red-500"
            />
          </div>

          {/* ターミナル + フィード 2カラム */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ターミナル (2/3 width) */}
            <div className="xl:col-span-2">
              <Card className="flex flex-col h-[420px]">
                <CardHeader className="pb-0 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal size={15} className="text-[hsl(var(--muted-foreground))]" />
                      <CardTitle className="text-sm">Auto-CEO Terminal</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{agentStatus}</span>
                    </div>
                  </div>
                  <Separator className="mt-3" />
                </CardHeader>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll bg-zinc-950 rounded-none"
                >
                  {messages.length === 0 && (
                    <div className="text-zinc-500 text-xs text-center mt-10">
                      「こんにちは」「最近のニュースを要約して」など入力してください
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white'
                          : msg.role === 'system'
                          ? 'bg-transparent text-emerald-400 text-xs font-mono border border-zinc-800'
                          : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                      }`}>
                        <pre className="whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</pre>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t bg-zinc-900 rounded-b-xl flex gap-2">
                  <Input
                    placeholder="指示を入力..."
                    disabled={sending || !isOnline}
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendCommand(); }}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-violet-500"
                  />
                  <Button
                    onClick={sendCommand}
                    disabled={sending || !instruction || !isOnline}
                    className="bg-violet-600 hover:bg-violet-500 text-white border-0 shrink-0"
                  >
                    {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  </Button>
                </div>
              </Card>
            </div>

            {/* AIエージェント一覧 (1/3 width) */}
            <div>
              <Card className="h-[420px] flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu size={15} className="text-violet-500" />
                    <CardTitle className="text-sm">AIエージェント</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto custom-scroll pt-0 space-y-3">
                  {[
                    {
                      name: 'トレンド収集',
                      desc: 'Google News → AI/DXトレンド抽出',
                      status: '稼働中',
                      statusVariant: 'success' as const,
                      icon: Megaphone,
                      time: '本日 23:30',
                    },
                    {
                      name: '人生戦略ワーカー',
                      desc: '音声メモ → Gemini解析・自動記帳',
                      status: '待機中',
                      statusVariant: 'secondary' as const,
                      icon: Heart,
                      time: '5分おき監視中',
                    },
                  ].map((agent, i) => {
                    const Icon = agent.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
                          <Icon size={15} className="text-[hsl(var(--foreground))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="text-sm font-medium truncate">{agent.name}</p>
                            <Badge variant={agent.statusVariant} className="shrink-0 text-[10px]">{agent.status}</Badge>
                          </div>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{agent.desc}</p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">{agent.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CEOコアモジュール */}
          <div>
            <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
              <Layers size={14} className="text-[hsl(var(--muted-foreground))]" />
              CEOコアモジュール
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'MOD_01: 販売', icon: Activity, metric: 'アクティブリード', value: '19,250', status: '待機中', variant: 'secondary' as const },
                { name: 'MOD_02: 広報', icon: Megaphone, metric: 'リーチIDX', value: '182万', status: '処理中', variant: 'success' as const },
                { name: 'MOD_03: マークTG', icon: PieChart, metric: 'トレンド同期', value: 'アクティブ', status: '待機中', variant: 'secondary' as const },
              ].map((mod, i) => {
                const Icon = mod.icon;
                return (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center">
                            <Icon size={14} />
                          </div>
                          <CardTitle className="text-sm">{mod.name}</CardTitle>
                        </div>
                        <Badge variant={mod.variant} className="text-[10px]">{mod.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{mod.metric}</p>
                      <p className="text-xl font-bold">{mod.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* インプットデータフィード */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-[hsl(var(--muted-foreground))]" />
                  <CardTitle className="text-sm">収集済みインプット — AI/DX 最新トレンド</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={fetchInputs}>
                  <RefreshCw size={12} /> 更新
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <div className="divide-y max-h-80 overflow-y-auto custom-scroll">
              {inputs.length === 0 ? (
                <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  データがありません
                </div>
              ) : (
                inputs.map((item, i) => (
                  <div key={i} className="px-6 py-3 hover:bg-[hsl(var(--accent))] transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">{item.taskName || 'News'}</Badge>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{item.date}</span>
                    </div>
                    <p className="text-sm font-medium mb-0.5 leading-tight">{item.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mb-1">{item.snippet}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                        記事を読む →
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
