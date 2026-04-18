import React from 'react';
import '../styles/global.css';
import { LayoutDashboard, Users, TrendingUp, History, Settings } from 'lucide-react';

const Dashboard = () => {
    return (
        <div className="min-h-screen flex bg-[#0f172a] text-slate-50">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 p-6 flex flex-col gap-8">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Jibun Corp.
                </h1>
                <nav className="flex flex-col gap-2">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active />
                    <NavItem icon={<Users size={20} />} label="Departments" />
                    <NavItem icon={<TrendingUp size={20} />} label="Finance" />
                    <NavItem icon={<History size={20} />} label="Logs" />
                </nav>
                <div className="mt-auto">
                    <NavItem icon={<Settings size={20} />} label="Settings" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold">Welcome back, CEO</h2>
                        <p className="text-slate-400">Everything is running smoothly.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="glass-card px-4 py-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-medium">Worker Online</span>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard label="Monthly Profit" value="¥128,500" change="+12.5%" />
                    <StatCard label="Tasks Completed" value="24" change="+4" />
                    <StatCard label="Active Agents" value="4" />
                    <StatCard label="Efficiency" value="98%" change="+2%" />
                </div>

                {/* Departments Status */}
                <section className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Department Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DeptCard name="Sales" status="Working" task="X Campaign Strategy" />
                        <DeptCard name="Marketing" status="Idle" />
                        <DeptCard name="Finance" status="Idle" />
                        <DeptCard name="PR" status="Working" task="Threads Outreach" />
                    </div>
                </section>

                {/* Recent Activity */}
                <section>
                    <h3 className="text-xl font-semibold mb-4">Recent Results</h3>
                    <div className="glass-card space-y-4">
                        <LogItem dept="PR" time="2m ago" content="Threads post draft generated for 'New Side-hustle launch'." />
                        <LogItem dept="Sales" time="15m ago" content="Competitive analysis for niche keywords completed." />
                        <LogItem dept="Marketing" time="1h ago" content="TikTok trend report: #SideHustle2026 is trending." />
                    </div>
                </section>
            </main>
        </div>
    );
};

const NavItem = ({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>
        {icon}
        <span className="font-medium text-sm">{label}</span>
    </div>
);

const StatCard = ({ label, value, change }: { label: string, value: string, change?: string }) => (
    <div className="glass-card">
        <p className="text-slate-400 text-sm mb-1">{label}</p>
        <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {change && <span className="text-emerald-500 text-xs font-semibold mb-1">{change}</span>}
        </div>
    </div>
);

const DeptCard = ({ name, status, task }: { name: string, status: 'Working' | 'Idle', task?: string }) => (
    <div className="glass-card flex items-center justify-between">
        <div>
            <h4 className="font-semibold text-lg">{name}</h4>
            {task && <p className="text-slate-400 text-sm">{task}</p>}
        </div>
        <span className={`status-badge ${status === 'Working' ? 'status-working' : 'status-idle'}`}>
            {status}
        </span>
    </div>
);

const LogItem = ({ dept, time, content }: { dept: string, time: string, content: string }) => (
    <div className="flex gap-4 pb-4 border-b border-slate-800 last:border-0 last:pb-0">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400">
            {dept[0]}
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm">{dept}</span>
                <span className="text-xs text-slate-500">{time}</span>
            </div>
            <p className="text-sm text-slate-400">{content}</p>
        </div>
    </div>
);

export default Dashboard;
