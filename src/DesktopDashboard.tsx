import React, { useState } from 'react';
import {
    Users, DollarSign, BrainCircuit,
    Settings, LayoutDashboard, CheckCircle2, CircleDashed, Activity
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function DesktopDashboard() {
    const salesData = [{ name: 'M', val: 40 }, { name: 'T', val: 30 }, { name: 'W', val: 60 }, { name: 'T', val: 45 }, { name: 'F', val: 70 }];
    const prData = [{ name: 'W1', val: 100 }, { name: 'W2', val: 150 }, { name: 'W3', val: 200 }, { name: 'W4', val: 350 }];
    const marketingPie = [{ name: 'Org', value: 400 }, { name: 'Ads', value: 300 }, { name: 'Social', value: 300 }];

    return (
        <div className="h-screen w-screen overflow-hidden flex bg-slate-950 text-slate-200 relative">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen"
                style={{ backgroundImage: `url('/src/assets/dashboard_bg.png')` }}
            />
            <div className="absolute inset-0 z-0 bg-slate-950/80 pointer-events-none backdrop-blur-[2px]" />

            <aside className="w-20 xl:w-64 glass-panel border-r border-white/5 z-10 flex flex-col transition-all">
                <div className="h-24 flex items-center justify-center xl:justify-start xl:px-8 border-b border-white/5 bg-white/5">
                    <BrainCircuit className="text-cyan-400 w-8 h-8" />
                    <div className="hidden xl:block ml-4">
                        <h1 className="font-orbitron font-bold text-lg text-white glow-text leading-none tracking-wider uppercase">JIBUN CORP.</h1>
                        <p className="text-[9px] text-cyan-500 font-bold uppercase tracking-[0.2em] mt-1">Neural Network</p>
                    </div>
                </div>
                <nav className="flex-1 py-8 flex flex-col gap-3 px-4 xl:px-6">
                    <NavItem icon={<LayoutDashboard />} label="Dashboard" active />
                    <NavItem icon={<DollarSign />} label="Finance" />
                    <NavItem icon={<Users />} label="Departments" />
                    <NavItem icon={<Activity />} label="Analytics" />
                    <NavItem icon={<Settings />} label="Settings" />
                </nav>
                <div className="p-6 border-t border-white/5 flex items-center justify-center xl:justify-start bg-slate-900/40">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 shadow-inner">
                        <span className="text-[10px] font-bold text-white">CEO</span>
                    </div>
                    <div className="hidden xl:block ml-4">
                        <p className="text-sm font-bold text-white">President</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Admin Access</p>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto z-10 p-8 xl:p-12 flex flex-col gap-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h2 className="text-4xl xl:text-5xl font-orbitron font-black text-white mb-2 tracking-tight uppercase drop-shadow-lg">CEO Dashboard</h2>
                        <p className="text-sm text-slate-400 font-medium tracking-wide">自分株式会社 プレミアム・経営ダッシュボード</p>
                    </div>
                    <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-2xl bg-slate-900/60 border-emerald-500/20">
                        <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Google Sheets Synced</span>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <KpiCard label="Foundation Date" value="2026.03.07" subtext="Active since launch" border="border-b-cyan-500" />
                    <KpiCard label="Total Assets (EST)" value="$203,686,000" subtext="Real-time Kakeibo Data" border="border-b-emerald-500" />
                    <KpiCard label="Monthly Margin" value="65.38%" subtext="+12% from last cycle" border="border-b-blue-500" />
                    <KpiCard label="AI Worker Activity" value="92.4%" subtext="High efficiency state" border="border-b-purple-500" />
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1">
                    <DeptCard
                        title="営業部" name="Sales Team" status="待機中 (WAITING)" avatar="/src/assets/sales_avatar.png"
                        color="border-cyan-500"
                        chart={<BarChart data={salesData}><Bar dataKey="val" fill="#06b6d4" radius={[4, 4, 0, 0]} /></BarChart>}
                        metrics={[{ label: 'Active Leads', val: '19' }, { label: 'Conversion', val: '24%' }]}
                    />
                    <DeptCard
                        title="広報部" name="Public Relations" status="稼働中 (PROCESSING)" avatar="/src/assets/pr_avatar.png"
                        color="border-emerald-500" isProc={true}
                        chart={<AreaChart data={prData}><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><Area type="monotone" dataKey="val" stroke="#10b981" fillOpacity={1} fill="url(#c)" /></AreaChart>}
                        metrics={[{ label: 'Media Reach', val: '1.2M' }, { label: 'Sentiment', val: '88/100' }]}
                    />
                    <DeptCard
                        title="マーケ部" name="Marketing Dept" status="待機中 (WAITING)" avatar="/src/assets/marketing_avatar.png"
                        color="border-blue-500"
                        chart={<PieChart><Pie data={marketingPie} dataKey="value" innerRadius={28} outerRadius={45} paddingAngle={4} stroke="none"><Cell fill="#06b6d4" /><Cell fill="#3b82f6" /><Cell fill="#1e293b" /></Pie></PieChart>}
                        metrics={[{ label: 'Campaigns', val: '5 Active' }, { label: 'Top Trend', val: '#Tech' }]}
                    />
                    <DeptCard
                        title="経理部" name="Accounting" status="待機中 (WAITING)" avatar="/src/assets/accounting_avatar.png"
                        color="border-purple-500"
                        chart={<BarChart data={salesData}><Bar dataKey="val" fill="#a855f7" radius={[4, 4, 0, 0]} /></BarChart>}
                        metrics={[{ label: 'Burn Rate', val: '¥4.2M/mo' }, { label: 'Runway', val: '18 mo' }]}
                    />
                </section>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active }: any) {
    return (
        <button className={`flex items-center w-full px-4 py-4 rounded-xl transition-all duration-300 ${active ? 'bg-cyan-500/10 text-cyan-400 glow-border' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
            <span className="w-6 h-6 flex justify-center items-center">{icon}</span>
            <span className="hidden xl:block ml-4 text-sm font-bold tracking-wider">{label}</span>
        </button>
    );
}

function KpiCard({ label, value, subtext, border }: any) {
    return (
        <div className={`glass-panel p-6 xl:p-8 rounded-3xl flex flex-col justify-between border-b-2 hover:bg-white/5 transition-all ${border}`}>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</h3>
            <div className="mt-6 mb-3 font-orbitron text-3xl xl:text-4xl font-black text-white tracking-widest text-shadow-sm">{value}</div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{subtext}</p>
        </div>
    );
}

function DeptCard({ title, name, avatar, status, chart, metrics, color, isProc = false }: any) {
    return (
        <div className="glass-panel rounded-3xl p-6 xl:p-8 flex flex-col h-full relative overflow-hidden group hover:bg-slate-800/40 transition-all border border-white/5 min-h-[280px]">
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className={`absolute -inset-1.5 rounded-full blur-md opacity-60 transition-all ${isProc ? `bg-emerald-400 animate-pulse` : 'bg-transparent'}`}></div>
                        <img src={avatar} className={`w-16 h-16 rounded-full border-2 ${isProc ? color : 'border-slate-700'} relative z-10 object-cover shadow-2xl saturate-150`} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white leading-tight tracking-wide">{title}</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{name}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border backdrop-blur-sm ${isProc ? `bg-emerald-500/10 border-emerald-500/50 text-emerald-400` : 'bg-slate-900/50 border-slate-700 text-slate-500 shadow-inner'}`}>
                    {isProc ? <CircleDashed className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {status}
                </div>
            </div>

            <div className="flex items-center gap-8 mt-auto h-24">
                <div className="flex-1 grid grid-cols-2 gap-6 pl-2">
                    {metrics.map((m: any, i: number) => (
                        <div key={i} className="flex flex-col justify-end">
                            <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1.5">{m.label}</p>
                            <p className="text-2xl font-orbitron font-bold text-slate-100">{m.val}</p>
                        </div>
                    ))}
                </div>
                <div className="w-32 xl:w-40 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {chart}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
