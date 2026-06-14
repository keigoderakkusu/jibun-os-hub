import { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, Cpu, Zap, Brain, Star, ChevronDown,
  RefreshCw, Copy, CheckCircle, AlertTriangle, Info,
  Sparkles, Globe, Terminal, BookOpen, TrendingUp,
  Settings, ExternalLink, Play, Download, Wifi
} from 'lucide-react';

// ============================================================
// Bonsai 8B + Gemini ハイブリッド AIエージェント設定
// ============================================================

const C = {
  bg:        '#FDFBF0',
  card:      '#FFFFFF',
  border:    '#E8E4CC',
  text:      '#2C2A1E',
  muted:     '#7A7560',
  green:     '#4A7A38',
  greenBg:   '#EEF5E8',
  greenBd:   '#B8D4A8',
  gold:      '#9A7418',
  goldBg:    '#FBF6E0',
  goldBd:    '#D4C47A',
  blue:      '#1A5FA8',
  blueBg:    '#E5EEF8',
  red:       '#C0392B',
  redBg:     '#FBEAEA',
  inputBg:   '#F5F4EF',
} as const;

const MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google (クラウド)',
    badge: '推奨',
    badgeColor: 'bg-blue-500',
    description: '最高性能。思考機能付き。ツール呼び出し可能。',
    free: true,
    available: true,
    icon: '⚡',
    endpoint: 'gemini',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google (クラウド)',
    badge: '安定',
    badgeColor: 'bg-emerald-500',
    description: '月100万トークン無料。SNS生成・要約向き。',
    free: true,
    available: true,
    icon: '🚀',
    endpoint: 'gemini',
  },
  {
    id: 'bonsai-8b',
    name: 'Bonsai 8B',
    provider: 'PrismML (ローカル・MLX)',
    badge: '最新',
    badgeColor: 'bg-violet-500',
    description: '世界初の真の1-bit 8Bモデル。1.15GBのみ使用。Apple Siliconに最適化。',
    free: true,
    available: false, // Ollama未対応 → MLXセットアップ必要
    icon: '🌿',
    endpoint: 'ollama',
    setupRequired: true,
    setupUrl: 'https://huggingface.co/prism-ml/Bonsai-8B-gguf',
  },
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 (3B)',
    provider: 'Meta (ローカル・Ollama)',
    badge: '軽量',
    badgeColor: 'bg-orange-500',
    description: 'Ollamaで即起動。オフライン完全動作。2GB RAM。',
    free: true,
    available: false, // Ollama必要
    icon: '🦙',
    endpoint: 'ollama',
    setupRequired: true,
    ollamaCmd: 'ollama run llama3.2:3b',
  },
  {
    id: 'qwen2.5:7b',
    name: 'Qwen 2.5 (7B)',
    provider: 'Alibaba (ローカル・Ollama)',
    badge: '日本語強',
    badgeColor: 'bg-red-500',
    description: '日本語特化。アフィリ記事生成に最適。4GB RAM。',
    free: true,
    available: false,
    icon: '🈶',
    endpoint: 'ollama',
    setupRequired: true,
    ollamaCmd: 'ollama run qwen2.5:7b',
  },
];

const AGENT_PERSONAS = [
  {
    id: 'ceo',
    name: '自分株式会社 CEO',
    emoji: '👔',
    description: '経営判断・戦略立案・業務指示',
    systemPrompt: `あなたは「自分株式会社」の最高AIアシスタントです。ユーザーの経営判断をサポートし、戦略的な視点でアドバイスを行います。SNSマーケティング、アフィリエイト、投資、コンテンツ制作について深い知識を持ちます。常に具体的で実行可能な提案を日本語で行ってください。`,
    color: 'from-violet-600 to-purple-700',
  },
  {
    id: 'content',
    name: 'コンテンツ生成AI',
    emoji: '✍️',
    description: 'ブログ・SNS記事の自動生成',
    systemPrompt: `あなたは日本語コンテンツのプロライターです。SEOに強いブログ記事、バズるSNS投稿、魅力的なアフィリエイト記事を生成します。読者を惹きつける文章と、具体的な数字や事例を使った説得力のある内容を提供します。`,
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'analyst',
    name: '市場分析AI',
    emoji: '📊',
    description: '株・仮想通貨・トレンド分析',
    systemPrompt: `あなたはプロの金融アナリストです。マーケットトレンド、株式分析、仮想通貨の動向を分析し、データに基づいた投資判断のヒントを提供します。必ずリスク免責事項を含め、あくまで参考情報として提供します。`,
    color: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'bonsai',
    name: 'Bonsai 自律エージェント 🌿',
    emoji: '🌿',
    description: 'Bonsai 8B搭載 (MLXセットアップ後)',
    systemPrompt: `あなたはBonsai 8Bモデルを搭載した自律型AIエージェントです。1-bitの超効率アーキテクチャで動作します。タスク分解、計画立案、自律的な実行が得意です。`,
    color: 'from-lime-600 to-emerald-700',
    requiresBonsai: true,
  },
];

const QUICK_PROMPTS = [
  { label: '今日のSNS投稿を作成', prompt: 'AIと自動化をテーマに、今日のX(Twitter)投稿を3パターン作って', emoji: '📱' },
  { label: 'アフィリ記事のアイデア', prompt: '月5万円稼げるアフィリエイト記事のアイデアを5つ提案して', emoji: '💰' },
  { label: '週次レポートを作成', prompt: '今週の自分株式会社の振り返りレポートのテンプレートを作って', emoji: '📊' },
  { label: 'n8nフロー設計', prompt: 'GeminiとWordPressを繋ぐn8nの自動化フローを設計して', emoji: '⚙️' },
  { label: 'Bonsai 8Bを体験', prompt: 'Bonsai 8Bモデルについて教えて、どうやってセットアップするの？', emoji: '🌿' },
];

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp: Date;
  thinking?: string;
};

type ModelType = typeof MODELS[0];
type PersonaType = typeof AGENT_PERSONAS[0];

// ============================================================
// Ollama接続テスト
// ============================================================
async function checkOllamaStatus(): Promise<{ running: boolean; models: string[] }> {
  try {
    const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      return { running: true, models: (data.models || []).map((m: any) => m.name) };
    }
  } catch {}
  return { running: false, models: [] };
}

// ============================================================
// AIチャット実行（Gemini or Ollama）
// ============================================================
async function callAI(
  messages: Message[],
  model: ModelType,
  persona: PersonaType,
  apiKey: string,
  onChunk: (text: string) => void,
  onThinking: (text: string) => void,
): Promise<void> {
  const history = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  if (model.endpoint === 'gemini') {
    if (!apiKey) throw new Error('Gemini APIキーが設定されていません。右上の設定から入力してください。');

    const body = {
      system_instruction: { parts: [{ text: persona.systemPrompt }] },
      contents: history,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
        thinkingConfig: model.id === 'gemini-2.5-flash' ? { thinkingBudget: 1024 } : undefined,
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `API Error ${res.status}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (!json || json === '[DONE]') continue;
        try {
          const data = JSON.parse(json);
          const part = data.candidates?.[0]?.content?.parts?.[0];
          if (part?.thought) {
            onThinking(part.text || '');
          } else if (part?.text) {
            onChunk(part.text);
          }
        } catch {}
      }
    }
    return;
  }

  // Ollama
  const ollamaMessages = [
    { role: 'system', content: persona.systemPrompt },
    ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
  ];

  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model.id, messages: ollamaMessages, stream: true }),
  });

  if (!res.ok) throw new Error('Ollamaへの接続に失敗しました。Ollamaが起動しているか確認してください。');

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line);
        if (data.message?.content) onChunk(data.message.content);
      } catch {}
    }
  }
}

// ============================================================
// コンポーネント: モデル選択ドロップダウン
// ============================================================
function ModelSelector({ selected, onSelect, ollamaModels }: {
  selected: ModelType;
  onSelect: (m: ModelType) => void;
  ollamaModels: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition border"
        style={{ background: C.greenBg, borderColor: C.greenBd, color: C.green }}
      >
        <span>{selected.icon}</span>
        <span>{selected.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selected.badgeColor} text-white`}>{selected.badge}</span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-2 right-0 w-80 rounded-2xl shadow-2xl overflow-hidden z-50 border"
          style={{ background: C.card, borderColor: C.border }}>
          <div className="p-2">
            {MODELS.map(model => {
              const installed = model.endpoint === 'ollama' && ollamaModels.some(m => m.startsWith(model.id.split(':')[0]));
              const isAvailable = model.available || installed;
              return (
                <button
                  key={model.id}
                  onClick={() => { onSelect(model); setOpen(false); }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition ${!isAvailable ? 'opacity-60' : ''}`}
                  style={{
                    background: selected.id === model.id ? C.greenBg : 'transparent',
                    borderLeft: selected.id === model.id ? `2px solid ${C.green}` : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (selected.id !== model.id) (e.currentTarget as HTMLElement).style.background = C.inputBg; }}
                  onMouseLeave={e => { if (selected.id !== model.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span className="text-xl">{model.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: C.text }}>{model.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${model.badgeColor} text-white`}>{model.badge}</span>
                      {!isAvailable && <span className="text-[10px]" style={{ color: C.gold }}>要セットアップ</span>}
                      {installed && <span className="text-[10px]" style={{ color: C.green }}>✓ 導入済み</span>}
                    </div>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: C.muted }}>{model.description}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{model.provider}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Bonsai 8B セットアップバナー */}
          <div className="border-t p-3" style={{ borderColor: C.border, background: C.goldBg }}>
            <p className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color: C.gold }}>
              <Info size={12} /> Bonsai 8B について
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
              PrismML製の1-bit LLM（2026年4月公開）。まだOllamaに非対応のため、MLXまたは専用フォーク経由での実行が必要です。
              <a href="https://huggingface.co/prism-ml/Bonsai-8B-gguf" target="_blank" rel="noopener noreferrer"
                className="underline ml-1" style={{ color: C.blue }}>HuggingFaceで確認↗</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// メインコンポーネント: AIエージェント
// ============================================================
export default function AIAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [selectedPersona, setSelectedPersona] = useState(AGENT_PERSONAS[0]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState({ running: false, models: [] as string[] });
  const [showThinking, setShowThinking] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkOllamaStatus().then(setOllamaStatus);
    const intv = setInterval(() => checkOllamaStatus().then(setOllamaStatus), 10000);
    return () => clearInterval(intv);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (apiKey) localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const sendMessage = async (text?: string) => {
    const userInput = text || input.trim();
    if (!userInput || loading) return;

    const userMsg: Message = { role: 'user', content: userInput, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      model: selectedModel.name,
      timestamp: new Date(),
      thinking: '',
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      let thinkingText = '';
      let contentText = '';

      await callAI(
        newMessages,
        selectedModel,
        selectedPersona,
        apiKey,
        (chunk) => {
          contentText += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...assistantMsg, content: contentText, thinking: thinkingText };
            return updated;
          });
        },
        (thinking) => {
          thinkingText += thinking;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...assistantMsg, content: contentText, thinking: thinkingText };
            return updated;
          });
        }
      );
    } catch (e: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...assistantMsg,
          content: `⚠️ エラー: ${e.message}`,
          thinking: '',
        };
        return updated;
      });
    }
    setLoading(false);
  };

  const copyMessage = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: C.bg, fontFamily: "'Inter', 'Noto Sans JP', sans-serif" }}>

      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${selectedPersona.color} flex items-center justify-center text-lg shadow-md`}>
            {selectedPersona.emoji}
          </div>
          <div>
            <h2 className="font-bold text-sm leading-tight" style={{ color: C.text }}>{selectedPersona.name}</h2>
            <p className="text-[11px]" style={{ color: C.muted }}>{selectedPersona.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ペルソナ選択 */}
          <div className="hidden md:flex items-center gap-1 rounded-xl p-1 border"
            style={{ background: C.inputBg, borderColor: C.border }}>
            {AGENT_PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPersona(p)}
                title={p.name}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition"
                style={{
                  background: selectedPersona.id === p.id ? C.greenBg : 'transparent',
                  outline: selectedPersona.id === p.id ? `1px solid ${C.greenBd}` : 'none',
                }}
              >
                {p.emoji}
              </button>
            ))}
          </div>

          {/* モデル選択 */}
          <ModelSelector selected={selectedModel} onSelect={setSelectedModel} ollamaModels={ollamaStatus.models} />

          {/* Ollama ステータス */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold"
            style={ollamaStatus.running
              ? { background: C.greenBg, borderColor: C.greenBd, color: C.green }
              : { background: C.inputBg, borderColor: C.border, color: C.muted }
            }>
            <Wifi size={11} />
            {ollamaStatus.running ? `Ollama: ${ollamaStatus.models.length}モデル` : 'Ollama: オフライン'}
          </div>

          {/* 設定 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition border"
            style={{
              background: showSettings ? C.greenBg : C.inputBg,
              borderColor: showSettings ? C.greenBd : C.border,
              color: showSettings ? C.green : C.muted,
            }}
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* 設定パネル */}
      {showSettings && (
        <div className="px-4 py-3 border-b shrink-0" style={{ background: C.goldBg, borderColor: C.border }}>
          <div className="max-w-2xl flex items-center gap-3">
            <label className="text-xs font-bold whitespace-nowrap" style={{ color: C.gold }}>Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-3 py-1.5 rounded-xl text-sm focus:outline-none"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                color: C.text,
              }}
            />
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline whitespace-nowrap flex items-center gap-1"
              style={{ color: C.blue }}
            >
              無料取得 <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scroll">
        {messages.length === 0 && (
          <div className="max-w-3xl mx-auto">
            {/* ウェルカム */}
            <div className="text-center mb-10">
              <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${selectedPersona.color} flex items-center justify-center text-4xl mb-4 shadow-xl`}>
                {selectedPersona.emoji}
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: C.text }}>{selectedPersona.name}</h1>
              <p className="text-sm" style={{ color: C.muted }}>{selectedPersona.description}</p>
              {selectedPersona.requiresBonsai && (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full border"
                  style={{ background: C.goldBg, borderColor: C.goldBd }}>
                  <span className="text-xs" style={{ color: C.gold }}>🌿 Bonsai 8B MLXセットアップ後に利用可能</span>
                </div>
              )}
            </div>

            {/* クイックプロンプト */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(qp.prompt)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left transition group border"
                  style={{ background: C.card, borderColor: C.border }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenBg; (e.currentTarget as HTMLElement).style.borderColor = C.greenBd; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.card; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                >
                  <span className="text-2xl">{qp.emoji}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: C.text }}>{qp.label}</p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: C.muted }}>{qp.prompt}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Bonsai 8B インフォバナー */}
            <div className="mt-6 p-5 rounded-2xl border" style={{ background: C.goldBg, borderColor: C.goldBd }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌿</span>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: C.gold }}>Bonsai 8B — 世界最先端の1-bit LLM</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.text }}>
                    PrismML社が2026年4月に公開した真の1-bitモデル。<strong style={{ color: C.text }}>わずか1.15GBのRAM</strong>で8Bパラメータの推論が可能。
                    現在Ollamaには未対応のため、<strong style={{ color: C.gold }}>MLXフレームワーク</strong>（Apple Silicon必須）経由でのセットアップが必要です。
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <a
                      href="https://huggingface.co/prism-ml/Bonsai-8B-gguf"
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs underline"
                      style={{ color: C.blue }}
                    >
                      <ExternalLink size={11} /> HuggingFaceでダウンロード
                    </a>
                    <span style={{ color: C.border }}>|</span>
                    <button
                      onClick={() => sendMessage('Bonsai 8Bのセットアップ方法をMacで教えて')}
                      className="text-xs underline"
                      style={{ color: C.green }}
                    >
                      → AIにセットアップを聞く
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* メッセージ一覧 */}
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && (
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${selectedPersona.color} flex items-center justify-center text-sm shrink-0 mr-3 mt-1`}>
                  {selectedPersona.emoji}
                </div>
              )}
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {/* 思考プロセス（Gemini 2.5のみ） */}
                {msg.thinking && msg.thinking.length > 0 && (
                  <div className="w-full">
                    <button
                      onClick={() => setShowThinking(showThinking === idx ? null : idx)}
                      className="text-[11px] flex items-center gap-1 mb-1 transition"
                      style={{ color: C.muted }}
                    >
                      <Brain size={10} />
                      思考プロセス {showThinking === idx ? '▲' : '▼'}
                    </button>
                    {showThinking === idx && (
                      <div className="rounded-xl p-3 mb-2 text-xs leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto border"
                        style={{ background: C.inputBg, borderColor: C.border, color: C.muted }}>
                        {msg.thinking}
                      </div>
                    )}
                  </div>
                )}

                <div className={`rounded-2xl px-4 py-3`} style={
                  msg.role === 'user'
                    ? { background: C.green, color: '#FFFFFF' }
                    : { background: C.card, border: `1px solid ${C.border}`, color: C.text }
                }>
                  {msg.content ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="flex items-center gap-2" style={{ color: C.muted }}>
                      <RefreshCw size={14} className="animate-spin" />
                      <span className="text-xs">生成中...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px]" style={{ color: C.muted }}>
                    {msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.model && (
                    <span className="text-[10px]" style={{ color: C.muted }}>{msg.model}</span>
                  )}
                  {msg.role === 'assistant' && msg.content && (
                    <button
                      onClick={() => copyMessage(idx, msg.content)}
                      className="transition"
                      style={{ color: C.muted }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.green}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}
                    >
                      {copied === idx
                        ? <CheckCircle size={11} style={{ color: C.green }} />
                        : <Copy size={11} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="px-4 pb-4 pt-2 border-t shrink-0" style={{ background: C.card, borderColor: C.border }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 rounded-2xl p-3 border"
            style={{ background: C.inputBg, borderColor: C.border }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`${selectedPersona.name}に質問する... (Enter で送信, Shift+Enter で改行)`}
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none leading-relaxed max-h-40 disabled:opacity-50"
              style={{ minHeight: '24px', color: C.text }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0"
              style={loading || !input.trim()
                ? { background: C.border, color: C.muted, cursor: 'not-allowed' }
                : { background: C.green, color: '#FFFFFF' }
              }
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: C.muted }}>
            {selectedModel.name} でチャット中 · {messages.length > 0 ? `${messages.length}ターン` : '新規会話'}
          </p>
        </div>
      </div>
    </div>
  );
}
