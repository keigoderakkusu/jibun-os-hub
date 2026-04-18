import React, { useState } from 'react';
import {
    LayoutDashboard,
    CircleDollarSign,
    TrendingUp,
    Megaphone,
    BarChart3,
    ClipboardCheck,
    Settings,
    Plus,
    ArrowUpRight,
    Activity,
    UserCheck,
    Search,
    MessageSquare
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';

// Mock data for charts
const salesData = [
    { month: 'Jan', rate: 15 },
    { month: 'Feb', rate: 22 },
    { month: 'Mar', rate: 18 },
    { month: 'Apr', rate: 28 },
    { month: 'May', rate: 32 },
    { month: 'Jun', rate: 30 },
];

const prData = [
    { day: '01', growth: 100 },
    { day: '05', growth: 180 },
    { day: '10', growth: 220 },
    { day: '15', growth: 190 },
    { day: '20', growth: 280 },
    { day: '25', growth: 310 },
    { day: '30', growth: 390 },
];

const marketingData = [
    { name: 'Strategy', value: 53 },
    { name: 'Trend', value: 23 },
    { name: 'Ads', value: 11 },
];

const accountingData = [
    { month: 'Jan', inc: 4000, exp: 2400 },
    { month: 'Feb', inc: 3000, exp: 1398 },
    { month: 'Mar', inc: 2000, exp: 9800 },
    { month: 'Apr', inc: 2780, exp: 3908 },
    { month: 'May', inc: 1890, exp: 4800 },
    { month: 'Jun', inc: 2390, exp: 3800 },
];

const COLORS = ['#00ffff', '#0070f3', '#1e293b'];

const PremiumDashboard = () => {
    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
            {/* Background with Blur */}
            <div
                className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat grayscale-[20%]"
                style={{ backgroundImage: "url('/src/assets/dashboard_bg.png')" }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-indigo-950/30" />

            {/* Sidebar */}
            <aside className="w-64 glass-card h-screen sticky top-0 z-20 flex flex-col p-6 m-4 ml-6 rounded-3xl border-white/5">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                        <TrendingUp className="text-white" size={24} />
                    </div>
                    <h2 className="font-black text-lg tracking-tight">自分株式会社</h2>
                </div>

                <div className="flex-1 space-y-1">
                    <NavItem icon={<LayoutDashboard size={20} />} label="DASHBOARD" active />
                    <NavItem icon={<CircleDollarSign size={20} />} label="FINANCE" />
                    <NavItem icon={<TrendingUp size={20} />} label="SALES" />
                    <NavItem icon={<Megaphone size={20} />} label="PR" />
                    <NavItem icon={<BarChart3 size={20} />} label="MARKETING" />
                    <NavItem icon={<ClipboardCheck size={20} />} label="TASK MASTER" />
                    <NavItem icon={<Settings size={20} />} label="SETTINGS" />
                </div>

                <button className="mt-auto group bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between transition-all duration-300">
                    <span className="font-bold text-xs tracking-widest text-indigo-400 group-hover:text-indigo-300">CREATE NEW INSTRUCTION</span>
                    <Plus size={18} className="text-indigo-400" />
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 z-10 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <header className="mb-10">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">JIBUN Co. PREMIUM CEO DASHBOARD</h1>
                            <h2 className="text-2xl font-bold text-white/60 tracking-tight">自分株式会社 プレミアム・経営ダッシュボード</h2>
                        </div>
                        <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-3 border-emerald-500/20 bg-emerald-500/5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Syncing with Google Sheets</span>
                        </div>
                    </div>

                    {/* Overview Row */}
                    <div className="glass-card rounded-[2rem] p-6 grid grid-cols-4 gap-8 border-white/5">
                        <StatItem label="FOUNDATION DATE" value="2026.03.07" sub="Active since" />
                        <StatItem label="TOTAL ASSETS (from JIBUN KAKEIBO)" value="$203,686,000" sub="Updated real-time" color="text-cyan-400" />
                        <StatItem label="MONTHLY PROFIT MARGIN" value="65.38%" sub="High efficiency" color="text-emerald-400" />
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black tracking-widest text-slate-500">
                                <span>AI WORKER ACTIVITY</span>
                                <span className="text-cyan-400">92%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '92%' }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Grid */}
                <div className="grid grid-cols-2 gap-8">
                    {/* Sales Department */}
                    <DeptCard
                        title="営業部"
                        enTitle="Sales Department"
                        status="WAITING"
                        avatar="/src/assets/sales_avatar.png"
                        agent="AI Sales Agent"
                        sub="Business look"
                    >
                        <div className="grid grid-cols-2 h-full gap-4">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">Active Leads</span>
                                    <span className="text-3xl font-black text-cyan-400">19</span>
                                </div>
                                <div className="h-32 w-full">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase mb-2">Monthly Conversion Rate</span>
                                    <ResponsiveContainer width="100%" height="80%">
                                        <BarChart data={salesData}>
                                            <Bar dataKey="rate" fill="#00ffff" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="space-y-4 border-l border-white/5 pl-4">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">Key Clients</span>
                                    <ul className="text-[10px] font-bold space-y-1 text-white/80 list-decimal list-inside">
                                        <li>Tokyo Corporation</li>
                                        <li>Tomy Clients</li>
                                        <li>Tokyo Clients</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">AI-Generated Proposals</span>
                                    <ul className="text-[10px] font-bold space-y-1 text-white/60">
                                        <li>1. High-Efficiency Ad Strategy</li>
                                        <li>2. B2B Expansion Roadmap</li>
                                        <li>3. Next-Gen Product Pitch</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </DeptCard>

                    {/* PR Department */}
                    <DeptCard
                        title="広報部"
                        enTitle="Public Relations"
                        status="PROCESSING"
                        avatar="/src/assets/pr_avatar.png"
                        agent="AI PR Agent"
                        sub="Creative look"
                    >
                        <div className="grid grid-cols-2 h-auto gap-4">
                            <div className="space-y-4">
                                <div className="h-40 w-full">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase mb-2">SNS Follower Growth</span>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <AreaChart data={prData}>
                                            <defs>
                                                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00ffff" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#00ffff" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="growth" stroke="#00ffff" fillOpacity={1} fill="url(#colorGrowth)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">Brand Sentiment Score</span>
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[8px] font-black text-slate-500">LOW</span>
                                        <div className="flex-1 mx-4 h-1 bg-slate-800 rounded-full relative">
                                            <div className="absolute left-[70%] top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#00ffff]" />
                                        </div>
                                        <span className="text-[8px] font-black text-white">HIGH</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 border-l border-white/5 pl-4 overflow-hidden">
                                <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">Latest Posts</span>
                                <div className="space-y-3">
                                    <PostItem content="AI drafts: News masterplanned to brand in our brainpower..." />
                                    <PostItem content="AI drafts: News masterplanned to promote value-proposing ideas..." />
                                    <PostItem content="AI drafts: Trend-aware posting strategy to maximize engagement..." />
                                </div>
                            </div>
                        </div>
                    </DeptCard>

                    {/* Marketing Department */}
                    <DeptCard
                        title="マーケティング部"
                        enTitle="Marketing Department"
                        status="WAITING"
                        avatar="/src/assets/marketing_avatar.png"
                        agent="AI Marketing Agent"
                        sub="Focused researcher"
                    >
                        <div className="grid grid-cols-2 h-auto gap-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">Top Trend Keywords</span>
                                    <ul className="text-[10px] font-bold space-y-1 text-white/80 list-decimal list-inside italic">
                                        <li>Analyzing trend keywords</li>
                                        <li>Marketing highkey keywords</li>
                                        <li>Market analysis data</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">Competitor Analysis Data</span>
                                    <ul className="text-[10px] font-bold space-y-1 text-white/60">
                                        <li>1. Market share of competitors...</li>
                                        <li>2. Competitor growth rate...</li>
                                        <li>3. Competitive landscape report...</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="space-y-4 border-l border-white/5 pl-4">
                                <div className="space-y-3">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">Competitor Analysis</span>
                                    <div className="space-y-2">
                                        <ProgressBar label="Strategy" percent={53} color="#00ffff" />
                                        <ProgressBar label="PR-Trend" percent={23} color="#0070f3" />
                                        <ProgressBar label="Attacks" percent={11} color="#1e293b" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">Info Gathered Volume</span>
                                        <span className="text-xl font-black text-cyan-400">260 <span className="text-[10px] text-slate-500">info</span></span>
                                    </div>
                                    <div className="h-12 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={prData.slice(3)}>
                                                <Area type="step" dataKey="growth" stroke="#00ffff" fill="#00ffff" fillOpacity={0.1} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DeptCard>

                    {/* Accounting Department */}
                    <DeptCard
                        title="経理部"
                        enTitle="Accounting Department"
                        status="PROCESSING"
                        avatar="/src/assets/accounting_avatar.png"
                        agent="AI Accounting Agent"
                        sub="Precise number-cruncher"
                    >
                        <div className="grid grid-cols-2 h-auto gap-4">
                            <div className="space-y-4">
                                <div className="h-32 w-full">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase mb-2">Monthly Income & Expenses</span>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={accountingData}>
                                            <Bar dataKey="inc" fill="#00ffff" radius={[1, 1, 0, 0]} barSize={4} />
                                            <Bar dataKey="exp" fill="#0070f3" radius={[1, 1, 0, 0]} barSize={4} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">Budget Fulfillment</span>
                                    <p className="text-[9px] text-white/50 leading-relaxed uppercase">
                                        Analysis of current volume and budget fulfillment for next employee reports for monthly alignment.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4 border-l border-white/5 pl-4">
                                <div className="flex gap-4">
                                    <div className="w-24 h-24">
                                        <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase mb-1">Asset Allocation</span>
                                        <ResponsiveContainer width="100%" height="80%">
                                            <PieChart>
                                                <Pie data={marketingData} innerRadius={18} outerRadius={30} paddingAngle={5} dataKey="value">
                                                    {marketingData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 pt-4 text-[8px] font-black space-y-1">
                                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> ASSET</div>
                                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> PLAN</div>
                                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-700" /> BUDGET</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-widest text-slate-500 block uppercase">AI Financial Advice</span>
                                    <p className="text-[9px] text-cyan-400 leading-relaxed italic">
                                        AI financial advice can continue your clear and efficient budget planning credit.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DeptCard>
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <div className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all duration-300 ${active ? 'bg-white/10 text-white font-black' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
        {icon}
        <span className="text-xs font-black tracking-widest">{label}</span>
        {active && <motion.div layoutId="activeNav" className="ml-auto w-1 h-1 bg-white rounded-full" />}
    </div>
);

const StatItem = ({ label, value, sub, color = "text-white" }: { label: string, value: string, sub: string, color?: string }) => (
    <div className="space-y-1">
        <span className="text-[8px] font-black tracking-[0.2em] text-slate-500 uppercase">{label}</span>
        <div className={`text-xl font-black ${color} tracking-tight`}>{value}</div>
        <div className="text-[9px] font-bold text-slate-600">{sub}</div>
    </div>
);

const DeptCard = ({ title, enTitle, status, avatar, agent, sub, children }: any) => (
    <motion.div
        whileHover={{ scale: 1.01 }}
        className="glass-card rounded-[2.5rem] p-6 border-white/5 flex flex-col group transition-all"
    >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                {title} <span className="text-lg text-white/30 font-bold">{enTitle}</span>
            </h3>
            <div className={`px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] border ${status === 'PROCESSING' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-400/30 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                STATUS <span className="ml-1">{status}</span>
            </div>
        </div>

        <div className="flex-1 flex gap-6">
            <div className="w-28 flex flex-col items-center">
                <div className="relative mb-3">
                    <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img src={avatar} className="w-24 h-24 rounded-full border-2 border-white/10 relative z-10 grayscale hover:grayscale-0 transition-all duration-500" />
                </div>
                <div className="text-center">
                    <div className="text-[10px] font-black text-white">{agent}</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase mb-4">{sub}</div>
                    <button className={`w-full py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border ${status === 'PROCESSING' ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                        {status}
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    </motion.div>
);

const PostItem = ({ content }: { content: string }) => (
    <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-[9px] text-white/40 leading-tight">
        {content}
    </div>
);

const ProgressBar = ({ label, percent, color }: { label: string, percent: number, color: string }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 tracking-tighter">
            <span>{label}</span>
            <span>{percent}%</span>
        </div>
        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: color }} />
        </div>
    </div>
);

export default PremiumDashboard;
