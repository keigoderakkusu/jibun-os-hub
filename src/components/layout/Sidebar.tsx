import { useState } from 'react';
import {
  Cpu, Bot, Grid, ChevronLeft, ChevronRight,
  LayoutDashboard, BookOpen, Leaf
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
  { id: 'dashboard', label: 'JIBUN-OS',      icon: LayoutDashboard, section: 'メイン' },
  { id: 'blog',      label: 'ブログ',         icon: BookOpen, badge: 'NEW', section: 'メイン' },
  { id: 'hub',       label: 'OSS統合ハブ',    icon: Cpu,    section: 'ツール' },
  { id: 'agent',     label: 'AIエージェント', icon: Bot, badge: 'AI', section: 'ツール' },
  { id: 'launcher',  label: 'マイシステム',   icon: Grid,   section: 'ツール' },
];

// ウォームカラー定数
const C = {
  bg:         '#FDFBF0',
  border:     '#E8E4CC',
  text:       '#2C2A1E',
  muted:      '#7A7560',
  green:      '#4A7A38',
  greenBg:    '#EEF5E8',
  greenBd:    '#B8D4A8',
  gold:       '#9A7418',
  goldBg:     '#FBF6E0',
  blue:       '#1A5FA8',
  blueBg:     '#E5EEF8',
  red:        '#C0392B',
  redBg:      '#FBEAEA',
} as const;

interface SidebarProps {
  current: PageId;
  onChange: (page: PageId) => void;
}

export function Sidebar({ current, onChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const sections = [...new Set(NAV_ITEMS.map(i => i.section))];

  const getBadgeStyle = (badge: string) => {
    if (badge === 'NEW') return { background: C.greenBg, color: C.green, border: `1px solid ${C.greenBd}` };
    if (badge === 'AI')  return { background: C.blueBg,  color: C.blue };
    return { background: C.greenBg, color: C.green };
  };

  return (
    <aside
      className={`relative flex flex-col h-screen shrink-0 transition-all duration-300 ${
        collapsed ? 'w-[56px]' : 'w-[220px]'
      }`}
      style={{
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
      }}
    >
      {/* ロゴ */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: C.border }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: C.greenBg, border: `1px solid ${C.greenBd}` }}
        >
          <Leaf size={15} style={{ color: C.green }} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate" style={{ color: C.text }}>自分株式会社</p>
            <p className="text-[10px] truncate" style={{ color: C.muted }}>JIBUN-OS Hub</p>
          </div>
        )}
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {sections.map(section => (
          <div key={section}>
            {!collapsed && (
              <p
                className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: C.muted }}
              >
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
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      collapsed ? 'justify-center' : ''
                    }`}
                    style={{
                      background:   active ? C.greenBg   : 'transparent',
                      color:        active ? C.green      : C.muted,
                      borderLeft:   active && !collapsed ? `2px solid ${C.green}` : '2px solid transparent',
                      fontWeight:   active ? 500 : 400,
                      paddingLeft:  active && !collapsed ? '10px' : collapsed ? '' : '12px',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = C.greenBg;
                        (e.currentTarget as HTMLElement).style.color = C.green;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = C.muted;
                      }
                    }}
                  >
                    <Icon size={15} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={getBadgeStyle(item.badge)}
                          >
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
        <div
          className="mx-2 mb-2 px-3 py-2 rounded-lg"
          style={{ background: C.goldBg, border: `1px solid #D4C47A` }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12 }}>📈</span>
            <span className="text-[10px] font-medium" style={{ color: C.gold }}>副業収益: 目標設定中</span>
          </div>
        </div>
      )}

      {/* フッター */}
      <div className="px-2 py-3 border-t" style={{ borderColor: C.border }}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: C.greenBg, border: `1px solid ${C.greenBd}` }}
            >
              <span className="text-[10px] font-bold" style={{ color: C.green }}>CEO</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-medium truncate" style={{ color: C.text }}>自分株式会社</p>
              <p className="text-[10px] truncate" style={{ color: C.muted }}>AI駆動型 副業OS</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg transition-colors"
          style={{ color: C.muted }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = C.greenBg;
            (e.currentTarget as HTMLElement).style.color = C.green;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = C.muted;
          }}
          title={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {!collapsed && <span className="ml-2 text-xs">折りたたむ</span>}
        </button>
      </div>
    </aside>
  );
}
