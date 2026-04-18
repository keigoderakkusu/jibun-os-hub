import { Bell, Bot, Search, Settings } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-dark-200/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-10 relative">
      <div className="flex-1 flex items-center gap-4">
        {/* Desktop Search */}
        <div className="hidden md:relative md:block w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search OS Hub (e.g., 'Latest KPIs')"
            className="w-full bg-dark-300 border border-slate-700/50 text-slate-200 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-cyber-400/50 transition-all placeholder:text-slate-500"
          />
        </div>
        {/* Mobile Spacer (for Hamburger menu space) */}
        <div className="md:hidden w-10"></div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full animate-pulse border border-dark-200"></span>
        </button>
        <button className="hidden sm:block p-2 text-slate-400 hover:text-slate-200 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full cyber-glass hover:bg-cyber-500/20 transition-all group overflow-hidden">
          <Bot className="w-4 h-4 text-cyber-400 group-hover:scale-110 transition-transform" />
          <span className="hidden xs:inline text-xs font-bold text-cyber-400">Ask AI</span>
        </button>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyber-500 border-2 border-dark-200 cursor-pointer shadow-lg"></div>
      </div>
    </header>
  );
}

