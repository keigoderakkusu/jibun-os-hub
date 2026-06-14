import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, UtensilsCrossed, MapPin, Heart,
  Plus, X, Loader2, ChevronLeft, ChevronRight,
  Search, Navigation, Sparkles, Trash2, ExternalLink,
  ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { PageHeader } from './components/layout/PageHeader';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay,
  parseISO, differenceInDays
} from 'date-fns';
import { ja } from 'date-fns/locale';

// ───── Types ─────────────────────────────────────────────
interface CalEvent { id: string; title: string; start: string; end: string; allDay?: boolean; source: 'google'|'timetree'|'local'; location?: string; }
interface Restaurant { id: string; name: string; genre?: string; address?: string; access?: string; budget?: string; urls?: string; photo?: string; }
interface Plan { id: number; type: 'date'|'travel'; title: string; content: string; createdAt: string; }
interface LifeEvent { id: number; title: string; date: string; category: string; note?: string; emoji?: string; done: boolean; }

type CoupleTab = 'calendar' | 'restaurant' | 'planner' | 'events';

const API = async <T,>(path: string, opts?: RequestInit): Promise<T> => {
  const r = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const DOW = ['日','月','火','水','木','金','土'];
const GENRES = [
  {code:'',label:'すべて'},{code:'G001',label:'居酒屋'},{code:'G004',label:'和食'},
  {code:'G005',label:'洋食'},{code:'G006',label:'イタリアン'},{code:'G007',label:'中華'},
  {code:'G013',label:'ラーメン'},{code:'G016',label:'カフェ'},
];
const EVENT_CATS = [
  {id:'anniversary',label:'記念日',emoji:'💑'},
  {id:'milestone',label:'マイルストーン',emoji:'🏆'},
  {id:'goal',label:'目標',emoji:'🎯'},
  {id:'memory',label:'思い出',emoji:'📸'},
];
const EMOJIS = ['💑','💍','🏠','🌸','🎉','✈️','🎂','💌','🌟','🎯','🏆','📸','❤️','🌹','🥂'];

// ───── Main ──────────────────────────────────────────────
export default function CoupleOS() {
  const [tab, setTab] = useState<CoupleTab>('calendar');

  const TABS: {id: CoupleTab; icon: React.ElementType; label: string}[] = [
    {id:'calendar',   icon: CalendarDays,    label:'カレンダー'},
    {id:'restaurant', icon: UtensilsCrossed, label:'グルメ'},
    {id:'planner',    icon: MapPin,          label:'プラン'},
    {id:'events',     icon: Heart,           label:'イベント'},
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="カップルOS" description="Google / TimeTree カレンダー・グルメ・プラン・ライフイベント" />

      {/* Tab bar */}
      <div className="flex gap-1 px-6 pb-3 border-b border-[hsl(var(--border))]">
        {TABS.map(({id, icon: Icon, label}) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll px-6 py-5">
        {tab === 'calendar'   && <CalendarTab />}
        {tab === 'restaurant' && <RestaurantTab />}
        {tab === 'planner'    && <PlannerTab />}
        {tab === 'events'     && <EventsTab />}
      </div>
    </div>
  );
}

// ───── Calendar Tab ───────────────────────────────────────
function CalendarTab() {
  const [current,  setCurrent]  = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [events,   setEvents]   = useState<CalEvent[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [showAdd,  setShowAdd]  = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime,  setNewTime]  = useState('12:00');
  const [saving,   setSaving]   = useState(false);

  const fetch_ = useCallback(async (m: Date) => {
    setLoading(true);
    try {
      const from = startOfMonth(m).toISOString();
      const to   = endOfMonth(m).toISOString();
      const [g, t] = await Promise.allSettled([
        API<CalEvent[]>(`/calendar/events?from=${from}&to=${to}`),
        API<CalEvent[]>(`/timetree/events?from=${from}&to=${to}`),
      ]);
      const all: CalEvent[] = [];
      if (g.status === 'fulfilled') all.push(...g.value);
      if (t.status === 'fulfilled') all.push(...t.value);
      setEvents(all);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(current); }, [current, fetch_]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(current), {weekStartsOn:0}),
    end:   endOfWeek(endOfMonth(current),     {weekStartsOn:0}),
  });
  const dayEvs = (d: Date) => events.filter(e => isSameDay(parseISO(e.start), d));
  const selEvs = dayEvs(selected);

  const addEvent = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const s = new Date(selected);
      const [h,m] = newTime.split(':').map(Number);
      s.setHours(h,m,0,0);
      await API('/calendar/events', { method:'POST', body: JSON.stringify({ title: newTitle, start: s.toISOString(), end: new Date(s.getTime()+3600_000).toISOString(), source:'google' })});
      await fetch_(current);
      setShowAdd(false); setNewTitle('');
    } finally { setSaving(false); }
  };

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5 h-full">
      {/* Calendar grid */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {format(current, 'yyyy年 M月', {locale:ja})}
              {loading && <Loader2 size={12} className="animate-spin text-[hsl(var(--muted-foreground))]" />}
            </CardTitle>
            <div className="flex gap-1">
              <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth()-1))} className="p-1.5 rounded hover:bg-[hsl(var(--accent))] transition-colors"><ChevronLeft size={14}/></button>
              <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth()+1))} className="p-1.5 rounded hover:bg-[hsl(var(--accent))] transition-colors"><ChevronRight size={14}/></button>
            </div>
          </div>
          <div className="flex gap-3 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{background:'#1A5FA8'}}/>Google</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{background:'#4A7A38'}}/>TimeTree</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-7 mb-1">
            {DOW.map(d => <p key={d} className="text-center text-[11px] text-[hsl(var(--muted-foreground))] py-1">{d}</p>)}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((day: Date) => {
              const de  = dayEvs(day);
              const inM = isSameMonth(day, current);
              const sel = isSameDay(day, selected);
              const tod = isToday(day);
              return (
                <button key={day.toISOString()} onClick={() => setSelected(day)}
                  className={`flex flex-col items-center py-1 rounded-lg transition-colors ${sel ? 'bg-[hsl(var(--accent))]' : 'hover:bg-[hsl(var(--accent))]/50'} ${!inM ? 'opacity-25' : ''}`}>
                  <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium ${tod ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''}`}>
                    {format(day,'d')}
                  </span>
                  <div className="flex gap-0.5 h-1.5 mt-0.5">
                    {de.slice(0,3).map(e => (
                      <span key={e.id} className="w-1 h-1 rounded-full" style={{background: e.source==='timetree' ? '#4A7A38' : '#1A5FA8'}}/>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day panel */}
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{format(selected,'M月d日(E)',{locale:ja})}</CardTitle>
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors">
                <Plus size={11}/>追加
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {selEvs.length === 0 ? (
              <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-4">予定なし</p>
            ) : (
              <div className="space-y-2">
                {selEvs.map(ev => (
                  <div key={ev.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-[hsl(var(--border))]">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full flex-none" style={{background: ev.source==='timetree' ? '#4A7A38' : '#1A5FA8'}}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ev.title}</p>
                      {ev.location && <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">📍 {ev.location}</p>}
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {format(parseISO(ev.start),'HH:mm')} – {format(parseISO(ev.end),'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add modal */}
        {showAdd && (
          <Card className="border-[hsl(var(--ring))]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">予定を追加</CardTitle>
                <button onClick={() => setShowAdd(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><X size={14}/></button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key==='Enter'&&addEvent()}
                placeholder="タイトル" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none focus:border-[hsl(var(--ring))]"/>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">時刻</span>
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none"/>
              </div>
              <button onClick={addEvent} disabled={saving||!newTitle.trim()}
                className="w-full py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-1.5">
                {saving && <Loader2 size={12} className="animate-spin"/>}
                Googleカレンダーに保存
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ───── Restaurant Tab ─────────────────────────────────────
function RestaurantTab() {
  const [keyword,   setKeyword]   = useState('');
  const [genre,     setGenre]     = useState('');
  const [results,   setResults]   = useState<Restaurant[]>([]);
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [view,      setView]      = useState<'search'|'favorites'>('search');
  const [locating,  setLocating]  = useState(false);
  const [coords,    setCoords]    = useState<{lat:number;lng:number}|null>(null);

  useEffect(() => { API<Restaurant[]>('/restaurants/favorites').then(setFavorites).catch(()=>{}); }, []);

  const locate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => { setCoords({lat:p.coords.latitude, lng:p.coords.longitude}); setLocating(false); },
      () => setLocating(false)
    );
  };

  const search = async () => {
    setLoading(true);
    try {
      const p: Record<string,string> = { count:'20' };
      if (keyword) p.keyword = keyword;
      if (genre)   p.genre   = genre;
      if (coords)  { p.lat = String(coords.lat); p.lng = String(coords.lng); p.range = '3'; }
      setResults(await API<Restaurant[]>(`/restaurants/search?${new URLSearchParams(p)}`));
    } finally { setLoading(false); }
  };

  const isFav = (id: string) => favorites.some(f => f.id === id);
  const toggleFav = async (r: Restaurant) => {
    if (isFav(r.id)) {
      await API(`/restaurants/favorites/${r.id}`, {method:'DELETE'});
      setFavorites(p => p.filter(f => f.id !== r.id));
    } else {
      await API<Restaurant>('/restaurants/favorites', {method:'POST', body:JSON.stringify(r)});
      setFavorites(p => [...p, r]);
    }
  };

  const list = view === 'favorites' ? favorites : results;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-3 items-start flex-wrap">
        <div className="flex gap-2">
          {(['search','favorites'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                view===v ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
              }`}>
              {v==='search' ? '🔍 検索' : `❤️ お気に入り (${favorites.length})`}
            </button>
          ))}
        </div>

        {view === 'search' && (
          <>
            <div className="flex gap-2 flex-1 min-w-[260px]">
              <div className="flex-1 flex items-center border border-[hsl(var(--border))] rounded-lg px-3 gap-2">
                <Search size={14} className="text-[hsl(var(--muted-foreground))] flex-none"/>
                <input value={keyword} onChange={e=>setKeyword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}
                  placeholder="キーワード（例: 焼肉 渋谷）"
                  className="flex-1 bg-transparent text-sm outline-none py-2 placeholder:text-[hsl(var(--muted-foreground))]"/>
              </div>
              <button onClick={locate} disabled={locating}
                className="p-2.5 rounded-lg border transition-colors"
                style={coords
                  ? { borderColor: '#B8D4A8', color: '#4A7A38', background: '#EEF5E8' }
                  : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))', background: 'transparent' }
                }>
                {locating ? <Loader2 size={15} className="animate-spin"/> : <Navigation size={15}/>}
              </button>
              <button onClick={search} disabled={loading}
                className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium flex items-center gap-1.5">
                {loading ? <Loader2 size={13} className="animate-spin"/> : null}
                検索
              </button>
            </div>
            {/* Genre chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide w-full">
              {GENRES.map(g => (
                <button key={g.code} onClick={() => setGenre(g.code)}
                  className={`flex-none text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    genre===g.code ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                  }`}>
                  {g.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Results grid */}
      {list.length === 0 ? (
        <p className="text-center text-[hsl(var(--muted-foreground))] text-sm py-12">
          {view==='favorites' ? 'お気に入りはありません' : 'キーワードを入力して検索してください'}
        </p>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map(r => (
            <div key={r.id} className="border border-[hsl(var(--border))] rounded-xl overflow-hidden bg-[hsl(var(--card))]">
              {r.photo && <img src={r.photo} alt={r.name} className="w-full h-32 object-cover"/>}
              <div className="p-3.5 space-y-1.5">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{r.name}</p>
                    {r.genre && <Badge variant="secondary" className="text-[10px] mt-0.5">{r.genre}</Badge>}
                  </div>
                  <button onClick={() => toggleFav(r)} className="p-1 flex-none">
                    <Heart size={16} className={isFav(r.id) ? 'fill-rose-500 text-rose-500' : 'text-[hsl(var(--muted-foreground))]'}/>
                  </button>
                </div>
                {r.access && <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">📍 {r.access}</p>}
                {r.budget && <p className="text-xs text-[hsl(var(--muted-foreground))]">¥ {r.budget}</p>}
                {r.urls && (
                  <a href={r.urls} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs hover:underline mt-1"
                    style={{ color: '#1A5FA8' }}>
                    <ExternalLink size={10}/> 詳細を見る
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───── Planner Tab ────────────────────────────────────────
function PlannerTab() {
  const [tab,        setTab]        = useState<'date'|'travel'>('date');
  const [plans,      setPlans]      = useState<Plan[]>([]);
  const [generating, setGenerating] = useState(false);
  const [expanded,   setExpanded]   = useState<number|null>(null);
  const [dateForm,   setDateForm]   = useState({area:'', budget:'5000', mood:'のんびり', duration:'半日'});
  const [travelForm, setTravelForm] = useState({destination:'', nights:2, budget:'50000', theme:'観光'});

  useEffect(() => { API<Plan[]>('/plans').then(setPlans).catch(()=>{}); }, []);

  const gen = async () => {
    const body = tab === 'date' ? dateForm : travelForm;
    if (tab==='date' && !dateForm.area) return;
    if (tab==='travel' && !travelForm.destination) return;
    setGenerating(true);
    try {
      const plan = await API<Plan>(`/ai/${tab}-plan`, {method:'POST', body:JSON.stringify(body)});
      setPlans(p => [plan, ...p]);
      setExpanded(plan.id);
    } finally { setGenerating(false); }
  };

  const del = async (id: number) => {
    await API(`/plans/${id}`, {method:'DELETE'});
    setPlans(p => p.filter(x => x.id !== id));
  };

  const filtered = plans.filter(p => p.type === tab);

  return (
    <div className="grid grid-cols-[380px_1fr] gap-5">
      {/* Form */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 mb-1">
            {(['date','travel'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  tab===t ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                }`}>
                {t==='date' ? '💑 デート' : '✈️ 旅行'}
              </button>
            ))}
          </div>
          <CardDescription className="flex items-center gap-1 text-xs">
            <Sparkles size={11}/> AIがプランを自動生成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tab === 'date' ? (
            <>
              <PField label="エリア *"><input value={dateForm.area} onChange={e=>setDateForm(f=>({...f,area:e.target.value}))} placeholder="例: 渋谷、横浜みなとみらい" className="cinput"/></PField>
              <PField label="予算">
                <select value={dateForm.budget} onChange={e=>setDateForm(f=>({...f,budget:e.target.value}))} className="cinput">
                  {['3000','5000','10000','20000'].map(v=><option key={v} value={v}>{Number(v).toLocaleString()}円</option>)}
                </select>
              </PField>
              <PField label="気分">
                <select value={dateForm.mood} onChange={e=>setDateForm(f=>({...f,mood:e.target.value}))} className="cinput">
                  {['のんびり','アクティブ','ロマンチック','グルメ','アウトドア'].map(m=><option key={m}>{m}</option>)}
                </select>
              </PField>
              <PField label="時間">
                <select value={dateForm.duration} onChange={e=>setDateForm(f=>({...f,duration:e.target.value}))} className="cinput">
                  {['2〜3時間','半日','1日'].map(d=><option key={d}>{d}</option>)}
                </select>
              </PField>
            </>
          ) : (
            <>
              <PField label="目的地 *"><input value={travelForm.destination} onChange={e=>setTravelForm(f=>({...f,destination:e.target.value}))} placeholder="例: 京都、沖縄、北海道" className="cinput"/></PField>
              <PField label="泊数">
                <select value={travelForm.nights} onChange={e=>setTravelForm(f=>({...f,nights:Number(e.target.value)}))} className="cinput">
                  {[1,2,3,4,5,7].map(n=><option key={n} value={n}>{n}泊{n+1}日</option>)}
                </select>
              </PField>
              <PField label="予算">
                <select value={travelForm.budget} onChange={e=>setTravelForm(f=>({...f,budget:e.target.value}))} className="cinput">
                  {['30000','50000','100000','150000'].map(v=><option key={v} value={v}>{Number(v).toLocaleString()}円</option>)}
                </select>
              </PField>
              <PField label="テーマ">
                <select value={travelForm.theme} onChange={e=>setTravelForm(f=>({...f,theme:e.target.value}))} className="cinput">
                  {['観光','グルメ','アウトドア','リゾート','温泉','歴史・文化'].map(t=><option key={t}>{t}</option>)}
                </select>
              </PField>
            </>
          )}
          <button onClick={gen} disabled={generating}
            className="w-full py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
            {generating ? <><Loader2 size={13} className="animate-spin"/>生成中…</> : <><Sparkles size={13}/>プランを生成</>}
          </button>
        </CardContent>
      </Card>

      {/* Plans list */}
      <div className="space-y-3 overflow-y-auto custom-scroll">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))] text-sm">
            プランを生成すると、ここに表示されます
          </div>
        )}
        {filtered.map(plan => (
          <Card key={plan.id}>
            <button className="w-full flex items-center justify-between px-5 py-3.5 gap-3 text-left"
              onClick={() => setExpanded(expanded===plan.id ? null : plan.id)}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{plan.title}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(plan.createdAt).toLocaleDateString('ja-JP')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e=>{e.stopPropagation();del(plan.id);}} className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-rose-500 transition-colors"><Trash2 size={13}/></button>
                {expanded===plan.id ? <ChevronUp size={14} className="text-[hsl(var(--muted-foreground))]"/> : <ChevronDown size={14} className="text-[hsl(var(--muted-foreground))]"/>}
              </div>
            </button>
            {expanded === plan.id && (
              <div className="px-5 pb-4 text-xs text-[hsl(var(--muted-foreground))] whitespace-pre-wrap leading-relaxed border-t border-[hsl(var(--border))] pt-3">
                {plan.content}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ───── Events Tab ─────────────────────────────────────────
function EventsTab() {
  const [events,  setEvents]  = useState<LifeEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter,  setFilter]  = useState<string>('all');
  const [form,    setForm]    = useState<Partial<LifeEvent>>({title:'',date:'',category:'anniversary',note:'',emoji:'💑',done:false});

  useEffect(() => {
    API<LifeEvent[]>('/events').then(d => setEvents(d.sort((a,b)=>a.date.localeCompare(b.date)))).catch(()=>{});
  }, []);

  const save = async () => {
    if (!form.title || !form.date) return;
    const ev = await API<LifeEvent>('/events', {method:'POST', body:JSON.stringify(form)});
    setEvents(p => [...p, ev].sort((a,b)=>a.date.localeCompare(b.date)));
    setShowAdd(false);
    setForm({title:'',date:'',category:'anniversary',note:'',emoji:'💑',done:false});
  };

  const toggle = async (ev: LifeEvent) => {
    const u = await API<LifeEvent>(`/events/${ev.id}`, {method:'PUT', body:JSON.stringify({done:!ev.done})});
    setEvents(p => p.map(e => e.id===ev.id ? u : e));
  };

  const remove = async (id: number) => {
    await API(`/events/${id}`, {method:'DELETE'});
    setEvents(p => p.filter(e => e.id!==id));
  };

  const filtered  = filter==='all' ? events : events.filter(e=>e.category===filter);
  const upcoming  = filtered.filter(e => new Date(e.date) >= new Date());
  const past      = filtered.filter(e => new Date(e.date) <  new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {['all', ...EVENT_CATS.map(c=>c.id)].map(f => {
            const cat = EVENT_CATS.find(c=>c.id===f);
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-none text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  filter===f ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                }`}>
                {cat ? `${cat.emoji} ${cat.label}` : 'すべて'}
              </button>
            );
          })}
        </div>
        <button onClick={()=>setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors">
          <Plus size={13}/> 追加
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        {upcoming.map(ev => <EventCard key={ev.id} ev={ev} onToggle={toggle} onDelete={remove}/>)}
        {past.map(ev => <EventCard key={ev.id} ev={ev} onToggle={toggle} onDelete={remove} dimmed/>)}
      </div>
      {events.length===0 && <p className="text-center text-[hsl(var(--muted-foreground))] text-sm py-12">イベントをまだ登録していません</p>}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">イベントを追加</CardTitle>
                <button onClick={()=>setShowAdd(false)} className="text-[hsl(var(--muted-foreground))]"><X size={16}/></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map(em => (
                  <button key={em} onClick={()=>setForm(f=>({...f,emoji:em}))}
                    className={`text-lg p-1.5 rounded-lg transition-colors ${form.emoji===em ? 'bg-[hsl(var(--accent))] ring-1 ring-[hsl(var(--ring))]' : 'hover:bg-[hsl(var(--accent))]'}`}>
                    {em}
                  </button>
                ))}
              </div>
              <input autoFocus value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="タイトル（例: 付き合って1周年）" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none focus:border-[hsl(var(--ring))]"/>
              <div className="space-y-1">
                <label className="text-xs text-[hsl(var(--muted-foreground))]">日付</label>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none"/>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_CATS.map(c => (
                  <button key={c.id} onClick={()=>setForm(f=>({...f,category:c.id}))}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.category===c.id ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-transparent' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
              <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="メモ（任意）" rows={2} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-transparent text-sm outline-none resize-none"/>
              <button onClick={save} disabled={!form.title||!form.date}
                className="w-full py-2.5 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold disabled:opacity-40">
                保存する
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function EventCard({ ev, onToggle, onDelete, dimmed }: { ev: LifeEvent; onToggle:(e:LifeEvent)=>void; onDelete:(id:number)=>void; dimmed?:boolean }) {
  const d    = parseISO(ev.date);
  const diff = differenceInDays(d, new Date());
  const cat  = EVENT_CATS.find(c => c.id === ev.category);
  return (
    <div className={`border border-[hsl(var(--border))] rounded-xl p-4 bg-[hsl(var(--card))] space-y-2 ${dimmed ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl">{ev.emoji || cat?.emoji}</span>
        <div className="flex gap-1">
          <button onClick={()=>onToggle(ev)}
            className="p-1 rounded border transition-colors"
            style={ev.done ? {borderColor:'#B8D4A8',color:'#4A7A38',background:'#EEF5E8'} : {borderColor:'hsl(var(--border))',color:'hsl(var(--muted-foreground))'}}>
            <Check size={12}/>
          </button>
          <button onClick={()=>onDelete(ev.id)}
            className="p-1 rounded border transition-colors"
            style={{borderColor:'hsl(var(--border))',color:'hsl(var(--muted-foreground))'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='#C0392B';(e.currentTarget as HTMLElement).style.background='#FBEAEA';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='hsl(var(--muted-foreground))';(e.currentTarget as HTMLElement).style.background='transparent';}}>
            <Trash2 size={12}/>
          </button>
        </div>
      </div>
      <p className={`text-sm font-semibold ${ev.done ? 'line-through text-[hsl(var(--muted-foreground))]' : ''}`}>{ev.title}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{format(d,'yyyy年M月d日(E)',{locale:ja})}</p>
      {diff >= 0 && diff <= 365 && (
        <Badge variant={diff <= 7 ? 'warning' : 'secondary'}>{diff===0 ? '🎉 今日！' : `あと${diff}日`}</Badge>
      )}
      {ev.note && <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{ev.note}</p>}
    </div>
  );
}

function PField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-[hsl(var(--muted-foreground))]">{label}</label>
      {children}
    </div>
  );
}
