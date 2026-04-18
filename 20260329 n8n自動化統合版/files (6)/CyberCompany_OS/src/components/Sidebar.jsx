import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Megaphone, ReceiptText, TerminalSquare, Users, Rocket, Workflow, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'App Launcher', path: '/launcher', icon: Rocket, color: 'text-violet-400', bg: 'hover:bg-violet-500/10' },
  { name: 'CEO Dashboard', path: '/', icon: LayoutDashboard, color: 'text-cyber-400', bg: 'hover:bg-cyber-500/10' },
  { name: 'Sales & Mktg', path: '/sales', icon: Megaphone, color: 'text-amber-400', bg: 'hover:bg-amber-500/10' },
  { name: 'Finance', path: '/finance', icon: ReceiptText, color: 'text-neon-green', bg: 'hover:bg-neon-green/10' },
  { name: 'IT & AI R&D', path: '/it', icon: TerminalSquare, color: 'text-[#00f2ff]', bg: 'hover:bg-[#00f2ff]/10' },
  { name: 'Admin & HR', path: '/hr', icon: Users, color: 'text-pink-400', bg: 'hover:bg-pink-500/10' },
];

const SidebarContent = ({ onNavItemClick }) => (
  <div className="flex flex-col h-full overflow-y-auto">
    <div className="p-6 mb-8 mt-12 md:mt-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyber-500/20">
          <Workflow className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">CyberOS</h1>
          <p className="text-[10px] font-bold text-cyber-400 uppercase tracking-widest leading-none">v4 Enterprise</p>
        </div>
      </div>
    </div>

    <nav className="flex-1 px-4 space-y-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavItemClick}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
            item.bg,
            isActive ? 'bg-dark-200 shadow-xl border border-slate-800' : 'text-slate-400 hover:text-slate-100'
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn('w-5 h-5 transition-transform group-hover:scale-110', isActive ? item.color : 'text-slate-500')} />
              <span className="font-bold text-sm tracking-wide">{item.name}</span>
              {isActive && (
                <div className={cn('absolute left-0 w-1 h-6 bg-current rounded-r-full', item.color.replace('text-', 'bg-'))} />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>

    <div className="p-6 border-t border-slate-800/50 mt-auto">
      <div className="p-4 rounded-2xl bg-dark-200 border border-slate-800">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">CEO Authorized</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
          <span className="text-xs font-bold text-slate-200">System Secure</span>
        </div>
      </div>
    </div>
  </div>
);

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-[60] p-3 rounded-2xl bg-dark-200 border border-slate-800 text-white shadow-2xl backdrop-blur-md bg-opacity-80"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-full bg-dark-300 border-r border-slate-800/50 relative z-30">
        <SidebarContent onNavItemClick={() => {}} />
      </aside>

      {/* Mobile Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-80 bg-dark-300 border-r border-slate-800/50 z-[55] transform transition-transform duration-300 md:hidden flex flex-col shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent onNavItemClick={() => setIsOpen(false)} />
      </aside>
    </>
  );
}
