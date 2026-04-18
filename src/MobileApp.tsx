import React, { useState } from 'react';
import { Send, Smartphone, TrendingUp, History, Coffee, AlertCircle } from 'lucide-react';
import './global.css';

const MobileApp = () => {
    const [instruction, setInstruction] = useState('');
    const [dept, setDept] = useState('営業部');
    const [isSending, setIsSending] = useState(false);

    const [logs, setLogs] = useState([
        { dept: '広報', text: 'Threadsの原稿が完成しました', time: '12分前', isWorking: false },
        { dept: '営業', text: '競合調査：ターゲット20代のアカウント分析', time: '45分前', isWorking: false },
        { dept: 'マーケ', text: 'TikTokトレンドレポート #SideHustle2026', time: '1時間前', isWorking: false },
    ]);

    const handleSend = async () => {
        if (!instruction) return;
        setIsSending(true);

        try {
            const response = await fetch(`/api/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spreadsheetId: 'AUTO',
                    dept,
                    command: instruction
                })
            });

            if (response.ok) {
                setIsSending(false);
                const newLog = {
                    dept: dept.replace('部', ''),
                    text: instruction,
                    time: 'たった今',
                    isWorking: true
                };
                setLogs([newLog, ...logs]);
                setInstruction('');
                alert(`${dept}に指令を送信しました！ワーカーが処理を開始します。`);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || '送信に失敗しました');
            }
        } catch (err: any) {
            setIsSending(false);
            alert(`エラー: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-50 flex flex-col font-sans max-w-md mx-auto border-x border-slate-800 shadow-2xl overflow-hidden relative">
            {/* Header */}
            <header className="p-6 pt-12 bg-gradient-to-b from-indigo-900/40 to-transparent">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                        JIBUN CORP.
                    </h1>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Online</span>
                    </div>
                </div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Executive Command Center</p>
            </header>

            {/* Main Command Center */}
            <main className="flex-1 p-6 space-y-6 overflow-y-auto pb-32">

                {/* Status Pills */}
                <section className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    <StatusPill name="営業" status="Working" />
                    <StatusPill name="広報" status="Idle" />
                    <StatusPill name="マーケ" status="Working" />
                    <StatusPill name="経理" status="Idle" />
                </section>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="glass-card !p-4 border-l-4 border-emerald-500 bg-white/5 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">今月の予測利益</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black">¥128k</span>
                            <span className="text-[10px] text-emerald-500 font-bold">+12%</span>
                        </div>
                    </div>
                    <div className="glass-card !p-4 border-l-4 border-indigo-500 bg-white/5 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">アクティブタスク</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black">12</span>
                            <span className="text-[10px] text-indigo-500 font-bold">RUNNING</span>
                        </div>
                    </div>
                </div>

                {/* Command Input Area */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">新規実行指令</h3>
                    <div className="glass-card !p-0 overflow-hidden border border-white/5 bg-white/5 rounded-2xl focus-within:border-indigo-500/50 transition-all">
                        <div className="bg-white/5 p-3 flex justify-between items-center border-b border-white/5">
                            <select
                                value={dept}
                                onChange={(e) => setDept(e.target.value)}
                                className="bg-transparent text-indigo-400 text-xs font-bold outline-none"
                            >
                                <option value="営業部">営業部</option>
                                <option value="広報部">広報部</option>
                                <option value="マーケティング部">マーケティング部</option>
                                <option value="経理部">経理部</option>
                            </select>
                            <Smartphone size={14} className="text-slate-600" />
                        </div>
                        <textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="指示を入力してください..."
                            className="w-full h-24 p-4 bg-transparent text-sm outline-none resize-none placeholder:text-slate-600 leading-relaxed"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!instruction || isSending}
                            className={`w-full p-4 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isSending || !instruction ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]'}`}
                        >
                            {isSending ? '送信中...' : '指令を送信する'}
                            {!isSending && <Send size={14} />}
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">最近のアウトプット</h3>
                    <div className="space-y-3">
                        {logs.map((log, i) => (
                            <MobileLogItem key={i} dept={log.dept} text={log.text} time={log.time} isWorking={log.isWorking} />
                        ))}
                    </div>
                </div>
            </main>

            {/* Bottom Floating Navigation */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] z-50">
                <nav className="glass-card !p-2 flex justify-around items-center bg-slate-900/90 border border-white/10 shadow-2xl rounded-2xl backdrop-blur-xl">
                    <NavIcon icon={<Smartphone size={20} />} label="コマンド" active />
                    <NavIcon icon={<TrendingUp size={20} />} label="経理" />
                    <NavIcon icon={<Coffee size={20} />} label="休憩" />
                    <NavIcon icon={<History size={20} />} label="履歴" />
                </nav>
            </div>
        </div>
    );
};

const StatusPill = ({ name, status }: { name: string, status: 'Working' | 'Idle' }) => (
    <div className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border ${status === 'Working' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/50 border-white/5 text-slate-500'}`}>
        {name}: {status === 'Working' ? '稼働中' : '待機中'}
    </div>
);

const MobileLogItem = ({ dept, text, time, isWorking = false }: { dept: string, text: string, time?: string, isWorking?: boolean }) => (
    <div className="glass-card !p-3 flex gap-4 items-center border border-white/5 bg-white/5 rounded-xl hover:border-white/10 transition-all">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${isWorking ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-800 text-indigo-400'}`}>
            {dept[0]}
        </div>
        <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold truncate text-slate-200">{text}</p>
            <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isWorking ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {dept}部 {isWorking ? '• 実行中...' : `• ${time}`}
                </span>
            </div>
        </div>
    </div>
);

const NavIcon = ({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'} cursor-pointer`}>
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
);

export default MobileApp;
