import React, { useState } from 'react';
import { Home, Send, Activity, User, CircleDashed, ListFilter, Bot } from 'lucide-react';

export default function MobileDashboard() {
    const [activeTab, setActiveTab] = useState('home');
    const [instruction, setInstruction] = useState('');
    const [dept, setDept] = useState('営業部');
    const [isSending, setIsSending] = useState(false);
    const [logs, setLogs] = useState([
        { id: 1, dept: '広報', text: '最新ニュースのSNSドラフト作成完了しました！', time: '12分前', isWorking: false },
        { id: 2, dept: 'マーケティング', text: '競合アカウントのトレンド指標をスプレッドシートに追記', time: '1時間前', isWorking: false }
    ]);

    const handleSend = async () => {
        if (!instruction) return;
        setIsSending(true);

        try {
            // HTTPSの場合は適宜書き換えが必要ですが、ローカルなのでHTTP。
            const response = await fetch(`/api/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spreadsheetId: '1AKQuY8swWLQjSjV-5A5o0cejtI7WBQ-j6K4GIoj9W7M',
                    dept,
                    command: instruction
                })
            });

            if (response.ok) {
                setLogs([{ id: Date.now(), dept: dept.replace('部', ''), text: instruction, time: 'たった今', isWorking: true }, ...logs]);
                setInstruction('');
            } else {
                alert('送信エラー: APIサーバーと通信できません');
            }
        } catch (err) {
            alert(`通信失敗: PC側でサーバー(npm run dev, server.ts)が同じネットワーク等で動いているか確認してください。`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-[#020617] text-slate-100 font-sans relative overflow-hidden">
            {/* Immersive Mobile Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-[#020617] z-0"></div>
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <header className="z-10 pt-14 pb-4 px-6 glass-panel rounded-b-[2.5rem] border-b border-white/5 shadow-2xl">
                <div className="flex justify-between items-center mb-1">
                    <div>
                        <h1 className="text-2xl font-orbitron font-black glow-text text-white tracking-widest uppercase">JIBUN CORP</h1>
                        <p className="text-[10px] text-cyan-400 font-bold tracking-[0.2em] mt-1">Mobile Command Center</p>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-30 rounded-full" />
                        <img src="/src/assets/sales_avatar.png" className="w-12 h-12 rounded-full border-2 border-slate-700 relative z-10 object-cover" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full self-start w-max border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase">Sheets Connected</span>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto z-10 p-5 space-y-6 pb-28 scrollbar-hide">

                {/* Command Form */}
                <div className="glass-panel rounded-3xl p-5 md:p-6 border border-white/5 relative shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-3xl"></div>

                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                        <Bot size={14} /> Execute Instruction
                    </h2>

                    <div className="space-y-4">
                        <div className="relative">
                            <select
                                value={dept}
                                onChange={(e) => setDept(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/50 text-sm font-bold rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:border-cyan-500 text-white shadow-inner"
                            >
                                <option value="営業部">営業部 (Sales / Leads)</option>
                                <option value="広報部">広報部 (PR / SNS)</option>
                                <option value="マーケティング部">マーケ部 (Marketing)</option>
                                <option value="経理部">経理部 (Accounting)</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ListFilter size={18} className="text-slate-500" />
                            </div>
                        </div>

                        <textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="AIへの指示内容を詳細に入力してください (例: TikTokでバズる施策を策定して)"
                            className="w-full bg-slate-950/50 border border-slate-700/50 text-sm rounded-2xl px-5 py-4 h-32 resize-none focus:outline-none focus:border-cyan-500 text-white placeholder-slate-600 shadow-inner"
                        />

                        <button
                            onClick={handleSend}
                            disabled={!instruction || isSending}
                            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all
                ${!instruction || isSending
                                    ? 'bg-slate-800/50 text-slate-600 border border-slate-700/50'
                                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95'}`}
                        >
                            {isSending ? <CircleDashed className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                            {isSending ? 'Sending...' : 'Transmit Command'}
                        </button>
                    </div>
                </div>

                {/* Logs */}
                <div className="px-1">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Live Execution Feed</h2>
                    <div className="space-y-3">
                        {logs.map((log) => (
                            <div key={log.id} className="glass-panel p-4 md:p-5 rounded-3xl border border-white/5 flex gap-4 items-start shadow-xl">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0
                      ${log.isWorking ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 glow-border' : 'bg-slate-900 border border-slate-700 text-slate-500 shadow-inner'}`}>
                                    {log.dept[0]}
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.dept} Dept</span>
                                        <span className="text-[9px] font-bold text-slate-600">{log.time}</span>
                                    </div>
                                    <p className="text-[13px] text-slate-200 leading-relaxed break-words font-medium">{log.text}</p>
                                    {log.isWorking && <p className="text-[9px] font-black tracking-widest text-cyan-400 uppercase mt-2 animate-pulse">Processing...</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Bottom Nav bar completely detached from scroll space */}
            <nav className="absolute z-20 bottom-0 left-0 w-full glass-panel border-t border-white/5 pt-2 pb-[env(safe-area-inset-bottom)] px-6">
                <div className="flex justify-around items-center h-16">
                    <NavBtn icon={<Home />} label="HOME" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                    <NavBtn icon={<Activity />} label="STATUS" active={activeTab === 'status'} onClick={() => setActiveTab('status')} />
                    <NavBtn icon={<User />} label="PROFILE" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                </div>
            </nav>
        </div>
    );
}

function NavBtn({ icon, label, active, onClick }: any) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-colors pb-1 ${active ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-slate-500'}`}>
            {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
            <span className="text-[8px] font-black tracking-[0.2em] uppercase">{label}</span>
        </button>
    )
}
