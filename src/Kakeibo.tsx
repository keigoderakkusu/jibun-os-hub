import { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle, Trash2, TrendingUp, TrendingDown,
  Wallet, CalendarDays, BarChart2, List
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { PageHeader } from './components/layout/PageHeader';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
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

// ───── Constants ─────────────────────────────────────────
const EXPENSE_CATEGORIES = ['食費', '外食', '家賃', '光熱費', '交通費', '日用品', '医療', '娯楽', '衣類', 'その他'];
const INCOME_CATEGORIES  = ['給与', '副業', '投資', 'ボーナス', 'その他'];

const COLORS = [
  '#6366f1','#8b5cf6','#a78bfa','#c4b5fd',
  '#818cf8','#93c5fd','#67e8f9','#6ee7b7',
  '#fde68a','#fca5a5',
];

const STORAGE_KEY = 'jibun_kakeibo_v2';

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
  const [tab, setTab] = useState<'overview' | 'input' | 'history'>('overview');
  const [viewMonth, setViewMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  // Form state
  const [form, setForm] = useState<Omit<Transaction, 'id'>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense',
    category: '食費',
    amount: 0,
    note: '',
  });

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

  // Add transaction
  const addTx = () => {
    if (!form.amount || form.amount <= 0) return;
    const tx: Transaction = { ...form, id: crypto.randomUUID() };
    setTransactions(prev => [tx, ...prev]);
    setForm(f => ({ ...f, amount: 0, note: '' }));
    setTab('history');
  };

  // Delete
  const deleteTx = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  // Month navigation
  const prevMonth = () => setViewMonth(m => format(subMonths(parseISO(m + '-01'), 1), 'yyyy-MM'));
  const nextMonth = () => {
    const next = format(subMonths(parseISO(viewMonth + '-01'), -1), 'yyyy-MM');
    if (next <= format(new Date(), 'yyyy-MM')) setViewMonth(next);
  };

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="家計簿" description="収支管理・予算トラッキング" />

      {/* Tab bar */}
      <div className="flex gap-1 px-6 pb-3 border-b border-[hsl(var(--border))]">
        {([
          ['overview', BarChart2, '概要'],
          ['input',    PlusCircle, '入力'],
          ['history',  List,       '履歴'],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

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
              <SummaryCard label="収入" value={totalIncome} icon={TrendingUp} color="text-emerald-500" />
              <SummaryCard label="支出" value={totalExpense} icon={TrendingDown} color="text-rose-500" />
              <SummaryCard
                label="収支"
                value={balance}
                icon={Wallet}
                color={balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}
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
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
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
                      <Bar dataKey="収入" fill="#6ee7b7" radius={[3,3,0,0]} />
                      <Bar dataKey="支出" fill="#fca5a5" radius={[3,3,0,0]} />
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
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.type === t
                          ? t === 'expense'
                            ? 'bg-rose-500/10 border-rose-500/50 text-rose-600'
                            : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600'
                          : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                      }`}
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
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-none text-sm
                  ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500'}`}>
                  {tx.type === 'income' ? '+' : '−'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{tx.category}</span>
                    {tx.note && <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">{tx.note}</span>}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{tx.date}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {tx.type === 'income' ? '+' : '−'}¥{fmt(tx.amount)}
                </span>
                <button onClick={() => deleteTx(tx.id)}
                  className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
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
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{label}</span>
          {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className={`text-xl font-bold ${color}`}>¥{(value).toLocaleString('ja-JP')}</span>
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(var(--muted))] ${color}`}>
            <Icon size={15} />
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
