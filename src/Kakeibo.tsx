import { useState, useEffect, useMemo, useRef } from 'react';
import {
  PlusCircle, Trash2, TrendingUp, TrendingDown,
  Wallet, CalendarDays, BarChart2, List,
  Camera, Loader2, AlertCircle, CheckCircle2, X, Settings, ScanLine
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { PageHeader } from './components/layout/PageHeader';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, subMonths, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

// ───── Types ─────────────────────────────────────────────
type TxType = 'income' | 'expense';
interface Transaction {
  id: string;
  date: string;        // YYYY-MM-DD
  type: TxType;
  category: string;
  amount: number;
  note: string;
}

interface OcrExtracted {
  date: string;
  amount: number;
  category: string;
  store: string;
  note: string;
  items: string[];
  confidence: number;
}

type OcrStatus = 'idle' | 'loading' | 'preview' | 'error';

// ───── Constants ─────────────────────────────────────────
const EXPENSE_CATEGORIES = ['食費', '外食', '家賃', '光熱費', '交通費', '日用品', '医療', '娯楽', '衣類', 'その他'];
const INCOME_CATEGORIES  = ['給与', '副業', '投資', 'ボーナス', 'その他'];

const COLORS = [
  '#4A7A38',
  '#9A7418',
  '#1A5FA8',
  '#7A3898',
  '#B8701A',
  '#1A7A8A',
  '#C0392B',
  '#48A860',
  '#8A6A28',
  '#7A7560',
];

const STORAGE_KEY = 'jibun_kakeibo_v2';
const OCR_KEY_STORE = 'kakeibo_gemini_key';

const RECEIPT_PROMPT = `このレシート・領収書の画像から支出情報を抽出してください。
以下のJSON形式のみで回答してください（コードブロック不要）:
{
  "date": "YYYY-MM-DD（レシートの日付。不明な場合は今日の日付）",
  "amount": 合計金額の数値（税込み合計、数値のみ）,
  "category": "食費|外食|家賃|光熱費|交通費|日用品|医療|娯楽|衣類|その他 のいずれか",
  "store": "店舗名（不明な場合は空文字）",
  "note": "短いメモ（店舗名や主な品目）",
  "items": ["主な品目1", "主な品目2"],
  "confidence": 0.0〜1.0（抽出精度の自己評価）
}`;

// ───── OCR Function ──────────────────────────────────────
async function runReceiptOcr(file: File, apiKey: string): Promise<OcrExtracted> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: RECEIPT_PROMPT },
            { inline_data: { mime_type: file.type || 'image/jpeg', data: base64 } },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API エラー (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini からの応答が空です');

  const clean = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  const parsed: OcrExtracted = JSON.parse(clean);

  // 日付が未設定なら今日
  if (!parsed.date || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
    parsed.date = format(new Date(), 'yyyy-MM-dd');
  }
  parsed.items = parsed.items || [];

  return parsed;
}

// ───── Helpers ───────────────────────────────────────────
function loadTx(): Transaction[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveTx(txs: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
}
function fmt(n: number) { return n.toLocaleString('ja-JP'); }

// ───── Component ─────────────────────────────────────────
export default function Kakeibo() {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTx);
  const [tab, setTab] = useState<'overview' | 'input' | 'history' | 'scan'>('overview');
  const [viewMonth, setViewMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  // Form state
  const [form, setForm] = useState<Omit<Transaction, 'id'>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense',
    category: '食費',
    amount: 0,
    note: '',
  });

  // OCR state
  const [geminiKey,  setGeminiKey]  = useState(() => localStorage.getItem(OCR_KEY_STORE) || '');
  const [ocrStatus,  setOcrStatus]  = useState<OcrStatus>('idle');
  const [ocrResult,  setOcrResult]  = useState<OcrExtracted | null>(null);
  const [ocrError,   setOcrError]   = useState('');
  const [ocrImgUrl,  setOcrImgUrl]  = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [editOcr,    setEditOcr]    = useState<OcrExtracted | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveTx(transactions); }, [transactions]);

  // ── Filtered data for viewMonth ──
  const monthTx = useMemo(() =>
    transactions.filter(t => t.date.startsWith(viewMonth)),
    [transactions, viewMonth]
  );

  const totalIncome  = monthTx.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  // Category pie data (expenses)
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthTx]);

  // 6-month trend
  const trendData = useMemo(() =>
    Array.from({ length: 6 }, (_: unknown, i: number) => {
      const d   = subMonths(new Date(), 5 - i);
      const key = format(d, 'yyyy-MM');
      const txs = transactions.filter(t => t.date.startsWith(key));
      return {
        month: format(d, 'M月', { locale: ja }),
        収入: txs.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0),
        支出: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    }),
    [transactions]
  );

  // ── Handlers ──
  const addTx = () => {
    if (!form.amount || form.amount <= 0) return;
    const tx: Transaction = { ...form, id: crypto.randomUUID() };
    setTransactions(prev => [tx, ...prev]);
    setForm(f => ({ ...f, amount: 0, note: '' }));
    setTab('history');
  };

  const deleteTx = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const prevMonth = () => setViewMonth(m => format(subMonths(parseISO(m + '-01'), 1), 'yyyy-MM'));
  const nextMonth = () => {
    const next = format(subMonths(parseISO(viewMonth + '-01'), -1), 'yyyy-MM');
    if (next <= format(new Date(), 'yyyy-MM')) setViewMonth(next);
  };

  // OCR handlers
  const saveGeminiKey = (key: string) => {
    setGeminiKey(key);
    localStorage.setItem(OCR_KEY_STORE, key);
  };

  const resetOcr = () => {
    setOcrStatus('idle');
    setOcrResult(null);
    setOcrError('');
    setEditOcr(null);
    if (ocrImgUrl) URL.revokeObjectURL(ocrImgUrl);
    setOcrImgUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!geminiKey) {
      setShowApiKey(true);
      return;
    }

    setOcrImgUrl(URL.createObjectURL(file));
    setOcrStatus('loading');
    setOcrError('');

    try {
      const result = await runReceiptOcr(file, geminiKey);
      setOcrResult(result);
      setEditOcr({ ...result });
      setOcrStatus('preview');
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : '不明なエラー');
      setOcrStatus('error');
    }
  };

  const applyOcrResult = () => {
    if (!editOcr) return;
    setForm({
      date:     editOcr.date,
      type:     'expense',
      category: editOcr.category,
      amount:   editOcr.amount,
      note:     editOcr.note || editOcr.store,
    });
    resetOcr();
    setTab('input');
  };

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="家計簿" description="収支管理・予算トラッキング" />

      {/* Tab bar */}
      <div className="flex gap-1 px-6 pb-3 border-b border-[hsl(var(--border))]">
        {([
          ['overview', BarChart2,   '概要'],
          ['scan',     ScanLine,    'OCR読取'],
          ['input',    PlusCircle,  '入力'],
          ['history',  List,        '履歴'],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? id === 'scan'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      <div className="flex-1 overflow-y-auto custom-scroll px-6 py-5">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {/* Month selector */}
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">‹</button>
              <span className="text-sm font-semibold">
                {format(parseISO(viewMonth + '-01'), 'yyyy年 M月', { locale: ja })}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">›</button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <SummaryCard label="収入" value={totalIncome} icon={TrendingUp} color="#4A7A38" />
              <SummaryCard label="支出" value={totalExpense} icon={TrendingDown} color="#C0392B" />
              <SummaryCard
                label="収支"
                value={balance}
                icon={Wallet}
                color={balance >= 0 ? '#4A7A38' : '#C0392B'}
                badge={balance >= 0 ? '黒字' : '赤字'}
                badgeVariant={balance >= 0 ? 'success' : 'warning'}
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Expense pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">支出カテゴリ</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length === 0 ? (
                    <p className="text-center text-xs text-[hsl(var(--muted-foreground))] py-8">データなし</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          labelLine={false} fontSize={11}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `¥${fmt(Number(v))}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* 6-month trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">6ヶ月推移</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendData} barSize={12}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v/10000).toFixed(0)}万`} />
                      <Tooltip formatter={(v) => `¥${fmt(Number(v))}`} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="収入" fill="#4A7A38" radius={[3,3,0,0]} />
                      <Bar dataKey="支出" fill="#C0392B" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Category breakdown table */}
            {pieData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">カテゴリ別支出</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pieData.sort((a,b) => b.value - a.value).map((d, i) => (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full flex-none" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="flex-1 text-sm">{d.name}</span>
                        <span className="text-sm font-medium">¥{fmt(d.value)}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))] w-12 text-right">
                          {totalExpense > 0 ? `${((d.value / totalExpense) * 100).toFixed(1)}%` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── OCR SCAN ── */}
        {tab === 'scan' && (
          <div className="max-w-md space-y-4">

            {/* APIキー未設定の警告 */}
            {!geminiKey && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                <AlertCircle size={15} className="flex-none" />
                <span>Gemini APIキーが未設定です。OCR機能を使うには設定が必要です。</span>
              </div>
            )}

            {/* IDLE / LOADING: カメラ撮影エリア */}
            {(ocrStatus === 'idle' || ocrStatus === 'loading') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ScanLine size={16} className="text-emerald-600" />
                    レシートをスキャン
                  </CardTitle>
                  <CardDescription>写真を撮影またはファイルを選択すると、Gemini AIが自動で読み取ります</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ocrStatus === 'loading' && ocrImgUrl ? (
                    /* ローディング中: サムネイル + スピナー */
                    <div className="relative rounded-xl overflow-hidden border border-[hsl(var(--border))]">
                      <img src={ocrImgUrl} alt="読み取り中" className="w-full h-48 object-cover opacity-60" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
                        <Loader2 size={32} className="text-emerald-600 animate-spin mb-2" />
                        <span className="text-sm font-medium text-emerald-700">Gemini AIで解析中...</span>
                      </div>
                    </div>
                  ) : (
                    /* 待機中: 撮影ボタン */
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!geminiKey}
                      className="w-full h-44 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg">
                        <Camera size={24} className="text-white" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-emerald-700">レシートを撮影</p>
                        <p className="text-xs text-emerald-500 mt-0.5">タップして撮影またはファイル選択</p>
                      </div>
                    </button>
                  )}

                  {/* Tips */}
                  <div className="space-y-1.5">
                    {['レシート全体が写るように撮影してください', '明るい場所で撮ると読み取り精度が上がります', '読み取り後に内容を確認・修正できます'].map(tip => (
                      <div key={tip} className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                        <CheckCircle2 size={12} className="text-emerald-500 flex-none" />
                        {tip}
                      </div>
                    ))}
                  </div>

                  {/* APIキー設定パネル */}
                  <div>
                    <button
                      onClick={() => setShowApiKey(v => !v)}
                      className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      <Settings size={12} />
                      APIキー設定
                    </button>

                    {showApiKey && (
                      <div className="mt-2 p-3 rounded-lg bg-[hsl(var(--accent))] space-y-2">
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:underline">Google AI Studio</a> で取得したGemini APIキーを入力
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={geminiKey}
                            onChange={e => saveGeminiKey(e.target.value)}
                            placeholder="AIza..."
                            className="flex-1 text-xs px-2 py-1.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] outline-none focus:border-emerald-500"
                          />
                          {geminiKey && (
                            <button onClick={() => saveGeminiKey('')}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                              <X size={13} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          キーはブラウザのみに保存されます（サーバー送信なし）
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ERROR */}
            {ocrStatus === 'error' && (
              <Card className="border-red-200">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">読み取りに失敗しました</span>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] bg-red-50 p-2 rounded border border-red-100 break-all">
                    {ocrError}
                  </p>
                  <button onClick={resetOcr}
                    className="w-full py-2 rounded-lg border border-[hsl(var(--border))] text-sm hover:bg-[hsl(var(--accent))] transition-colors">
                    もう一度試す
                  </button>
                </CardContent>
              </Card>
            )}

            {/* PREVIEW: 抽出結果の確認・修正 */}
            {ocrStatus === 'preview' && editOcr && (
              <div className="space-y-4">
                {/* サムネイル */}
                {ocrImgUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-[hsl(var(--border))]">
                    <img src={ocrImgUrl} alt="レシート" className="w-full h-36 object-cover" />
                    <button onClick={resetOcr}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                      <X size={13} />
                    </button>
                  </div>
                )}

                {/* 信頼度バー */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] w-16 flex-none">読取精度</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--border))]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(ocrResult?.confidence ?? 0) * 100}%`,
                        background: (ocrResult?.confidence ?? 0) >= 0.8 ? '#4A7A38' : (ocrResult?.confidence ?? 0) >= 0.5 ? '#9A7418' : '#C0392B',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">
                    {Math.round((ocrResult?.confidence ?? 0) * 100)}%
                  </span>
                </div>

                {/* 抽出フィールド編集 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      読み取り結果（修正可能）
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="日付">
                      <input type="date" value={editOcr.date}
                        onChange={e => setEditOcr(v => v ? { ...v, date: e.target.value } : v)}
                        className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none focus:border-emerald-500" />
                    </Field>

                    <Field label="金額（円）">
                      <input type="number" min={0} value={editOcr.amount || ''}
                        onChange={e => setEditOcr(v => v ? { ...v, amount: Number(e.target.value) } : v)}
                        className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none focus:border-emerald-500" />
                    </Field>

                    <Field label="カテゴリ">
                      <div className="flex flex-wrap gap-1.5">
                        {EXPENSE_CATEGORIES.map(c => (
                          <button key={c} onClick={() => setEditOcr(v => v ? { ...v, category: c } : v)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              editOcr.category === c
                                ? 'bg-emerald-600 text-white border-transparent'
                                : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                            }`}>{c}</button>
                        ))}
                      </div>
                    </Field>

                    <Field label="メモ">
                      <input type="text" value={editOcr.note}
                        onChange={e => setEditOcr(v => v ? { ...v, note: e.target.value } : v)}
                        placeholder="例: スーパーで買い物"
                        className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none focus:border-emerald-500" />
                    </Field>

                    {editOcr.items.length > 0 && (
                      <div className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--accent))] rounded-lg p-2.5">
                        <p className="font-medium mb-1">読み取った品目:</p>
                        <p>{editOcr.items.join('、')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button onClick={resetOcr}
                    className="flex-1 py-2.5 rounded-lg border border-[hsl(var(--border))] text-sm hover:bg-[hsl(var(--accent))] transition-colors">
                    キャンセル
                  </button>
                  <button onClick={applyOcrResult}
                    disabled={!editOcr.amount}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                    <PlusCircle size={14} />
                    入力フォームに反映
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INPUT ── */}
        {tab === 'input' && (
          <div className="max-w-md space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">収支を追加</CardTitle>
                <CardDescription>日付・種別・金額を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type toggle */}
                <div className="flex gap-2">
                  {(['expense', 'income'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t, category: t === 'income' ? '給与' : '食費' }))}
                      className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
                      style={form.type === t
                        ? t === 'expense'
                          ? { background: '#FBEAEA', borderColor: 'rgba(192,57,43,0.4)', color: '#C0392B' }
                          : { background: '#EEF5E8', borderColor: '#B8D4A8', color: '#4A7A38' }
                        : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))', background: 'transparent' }
                      }
                    >
                      {t === 'income' ? '＋ 収入' : '－ 支出'}
                    </button>
                  ))}
                </div>

                <Field label="日付">
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none focus:border-[hsl(var(--ring))]" />
                </Field>

                <Field label="カテゴリ">
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          form.category === c
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent'
                            : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                        }`}
                      >{c}</button>
                    ))}
                  </div>
                </Field>

                <Field label="金額（円）">
                  <input type="number" min={0} value={form.amount || ''}
                    onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                    placeholder="例: 3000"
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none focus:border-[hsl(var(--ring))]" />
                </Field>

                <Field label="メモ（任意）">
                  <input type="text" value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addTx()}
                    placeholder="例: スーパーで買い物"
                    className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none focus:border-[hsl(var(--ring))]" />
                </Field>

                <button onClick={addTx} disabled={!form.amount}
                  className="w-full py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity">
                  <PlusCircle size={15} /> 追加する
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div className="space-y-3">
            {/* Month selector */}
            <div className="flex items-center gap-3 mb-2">
              <CalendarDays size={15} className="text-[hsl(var(--muted-foreground))]" />
              <button onClick={prevMonth} className="p-1 rounded hover:bg-[hsl(var(--accent))]">‹</button>
              <span className="text-sm font-semibold">
                {format(parseISO(viewMonth + '-01'), 'yyyy年 M月', { locale: ja })}
              </span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-[hsl(var(--accent))]">›</button>
              <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">{monthTx.length}件</span>
            </div>

            {monthTx.length === 0 && (
              <p className="text-center text-[hsl(var(--muted-foreground))] text-sm py-12">この月の記録はありません</p>
            )}

            {[...monthTx].sort((a,b) => b.date.localeCompare(a.date)).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-[hsl(var(--card))]"
                style={{ borderColor: 'hsl(var(--border))' }}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-none text-sm font-semibold"
                  style={tx.type === 'income'
                    ? { background: '#EEF5E8', color: '#4A7A38' }
                    : { background: '#FBEAEA', color: '#C0392B' }
                  }>
                  {tx.type === 'income' ? '+' : '−'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{tx.category}</span>
                    {tx.note && <span className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{tx.note}</span>}
                  </div>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{tx.date}</p>
                </div>
                <span className="text-sm font-semibold" style={{ color: tx.type === 'income' ? '#4A7A38' : '#C0392B' }}>
                  {tx.type === 'income' ? '+' : '−'}¥{fmt(tx.amount)}
                </span>
                <button onClick={() => deleteTx(tx.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C0392B'; (e.currentTarget as HTMLElement).style.background = '#FBEAEA'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, badge, badgeVariant }: {
  label: string; value: number; icon: React.ElementType;
  color: string; badge?: string; badgeVariant?: 'success' | 'warning';
}) {
  const bgColor = color === '#4A7A38' ? '#EEF5E8' : color === '#C0392B' ? '#FBEAEA' : '#FBF6E0';
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xl font-bold font-mono" style={{ color }}>
            ¥{value.toLocaleString('ja-JP')}
          </span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bgColor }}>
            <Icon size={15} style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</label>
      {children}
    </div>
  );
}
