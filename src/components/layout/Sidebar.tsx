import { useState } from 'react';
import {
  Cpu, Bot, Grid, ChevronLeft, ChevronRight,
  LayoutDashboard, Zap, BookOpen, TrendingUp
} from 'lucide-react';

export type PageId = 'hub' | 'agent' | 'dashboard' | 'launcher' | 'blog';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  badge?: string;
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'JIBUN-OS', icon: LayoutDashboard, section: 'メイン' },
  { id: 'blog', label: 'ブログ', icon: BookOpen, badge: 'NEW', section: 'メイン' },
  { id: 'hub', label: 'OSS統合ハブ', icon: Cpu, section: 'ツール' },
  { id: 'agent', label: 'AIエージェント', icon: Bot, badge: 'AI', section: 'ツール' },
  { id: 'launcher', label: 'マイシステム', icon: Grid, section: 'ツール' },
];

interface SidebarProps {
  current: PageId;
  onChange: (page: PageId) => void;
}

export function Sidebar({ current, onChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const sections = [...new Set(NAV_ITEMS.map(i => i.section))];

  return (
    <aside
      className={`relative flex flex-col h-screen shrink-0 transition-all duration-300 ${
        collapsed ? 'w-[56px]' : 'w-[220px]'
      }`}
      style={{ background: 'hsl(var(--sidebar-background))', borderRight: '1px solid hsl(var(--sidebar-border))' }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate" style={{ color: 'hsl(var(--sidebar-foreground))' }}>自分株式会社</p>
            <p className="text-[10px] truncate" style={{ color: 'hsl(var(--sidebar-foreground))', opacity: 0.5 }}>JIBUN-OS Hub</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-3">
        {sections.map(section => (
          <div key={section}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--sidebar-foreground))', opacity: 0.4 }}>
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {NAV_ITEMS.filter(i => i.section === section).map((item) => {
                const Icon = item.icon;
                const active = current === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      collapsed ? 'justify-center' : ''
                    }`}
                    style={{
                      background: active ? 'hsl(var(--sidebar-accent))' : 'transparent',
                      color: active ? 'hsl(var(--sidebar-accent-foreground))' : 'hsl(var(--sidebar-foreground))',
                      opacity: active ? 1 : 0.7,
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.opacity = '1';
                      if (!active) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--sidebar-accent))';
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.opacity = '0.7';
                      if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <Icon size={16} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            item.badge === 'NEW'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-violet-500/20 text-violet-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 副業収益バッジ */}
      {!collapsed && (
        <div className="mx-2 mb-2 px-3 py-2 rounded-lg" style={{ background: 'hsl(var(--sidebar-accent))', opacity: 0.8 }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={12} className="text-emerald-400 shrink-0" />
            <span className="text-[10px] font-semibold" style={{ color: 'hsl(var(--sidebar-foreground))' }}>副業収益: 目標設定中</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-2 py-3 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">CEO</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--sidebar-foreground))' }}>自分株式会社</p>
              <p className="text-[10px] truncate" style={{ color: 'hsl(var(--sidebar-foreground))', opacity: 0.5 }}>AI駆動型 副業OS</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg transition-colors"
          style={{ color: 'hsl(var(--sidebar-foreground))', opacity: 0.5 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.5'}
          title={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="ml-2 text-xs">折りたたむ</span>}
        </button>
      </div>
    </aside>
  );
}
