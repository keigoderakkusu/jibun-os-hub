import { useState } from 'react';
import {
  Grid, ExternalLink, Terminal, Play,
  Camera, Share2, Briefcase, Plane, AlertCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { PageHeader } from './components/layout/PageHeader';

export default function AppLauncher() {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading'; msg: string } | null>(null);

  const backendUrl = localStorage.getItem('jibun_backend_url') || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

  const runScript = async (scriptPath: string, name: string) => {
    if (!backendUrl) {
      setStatus({ type: 'error', msg: 'エラー: サーバーの接続設定（URL）が見つかりません。JIBUN-OSの「接続設定」からトンネルURLを設定してください。' });
      return;
    }
    setStatus({ type: 'loading', msg: `起動中: ${name}...` });
    try {
      const res = await fetch(`${backendUrl}/api/run-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptPath }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', msg: `✅ 成功: ${name} のターミナルがMac上で開かれました！` });
        setTimeout(() => setStatus(null), 5000);
      } else {
        setStatus({ type: 'error', msg: `❌ エラー: ${data.error}` });
      }
    } catch {
      setStatus({ type: 'error', msg: `❌ 接続エラー: バックエンドサーバー(${backendUrl})に繋がりません。Macが起動しているか確認してください。` });
    }
  };

  const apps = [
    {
      title: '自動スクショ・PDF化',
      description: 'ブラウザを自動操作しWebページやKindle書籍を自動で画像・PDFとして保存するシステム。',
      icon: Camera,
      iconColor: 'text-pink-500',
      iconBg: 'bg-pink-50',
      accentColor: '#db2777',
      actionName: '実行シェル起動',
      type: 'script' as const,
      path: '自動スクショ/batch-screenshot.sh',
    },
    {
      title: 'SNSアフィリエイト (n8n)',
      description: 'n8n経由でGeminiと連携し、バズるSNS投稿とWordPress向けアフィリエイト記事を全自動生成。',
      icon: Share2,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50',
      accentColor: '#2563eb',
      actionName: 'n8n起動',
      type: 'script' as const,
      path: 'n8n_sns_affiliate/start_sns_system.command',
    },
    {
      title: '自分株式会社 (ECCシステム)',
      description: '経営状況モニタリング・各部門AI管理用の独立したダッシュボード(HTML版)。',
      icon: Briefcase,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50',
      accentColor: '#d97706',
      actionName: '画面を開く',
      type: 'html' as const,
      path: './legacy_apps/jibun-kaisha-ecc-system.html',
    },
    {
      title: '自分株式会社 (アフィリエイト特化)',
      description: 'アフィリエイト記事エンジンに特化した旧バージョンのダッシュボード。',
      icon: Terminal,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
      accentColor: '#059669',
      actionName: '画面を開く',
      type: 'html' as const,
      path: './legacy_apps/affiliate-content-engine.html',
    },
    {
      title: '旅行宿泊先・健保AI検索',
      description: '旅行先のリストアップから最適な健保プランを探すAIシステムインターフェース。',
      icon: Plane,
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-50',
      accentColor: '#0284c7',
      actionName: '画面を開く',
      type: 'html' as const,
      path: './legacy_apps/kempo-travel.html',
    },
    {
      title: '旧 リモートパネル',
      description: 'スマートフォン操作向けに作られていた過去のインターフェース。',
      icon: Grid,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-50',
      accentColor: '#7c3aed',
      actionName: '画面を開く',
      type: 'html' as const,
      path: './legacy_apps/remote-panel.html',
    },
  ];

  const statusBg = status?.type === 'success'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : status?.type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-blue-50 border-blue-200 text-blue-700';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="マイシステム一覧"
        description="過去に作成したプロンプトやシステムをすべて一元管理するアプリランチャー"
        icon={<Grid size={16} />}
      />

      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="p-6 space-y-6">

          {status && (
            <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${statusBg}`}>
              {status.type === 'loading'
                ? <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" />
                : <AlertCircle size={16} className="shrink-0 mt-0.5" />
              }
              <span>{status.msg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {apps.map((app, idx) => {
              const Icon = app.icon;
              return (
                <Card key={idx} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                  {/* アクセントライン */}
                  <div className="h-0.5 w-full" style={{ background: app.accentColor }} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`w-9 h-9 rounded-lg ${app.iconBg} flex items-center justify-center`}>
                        <Icon size={18} className={app.iconColor} />
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase">{app.type}</Badge>
                    </div>
                    <CardTitle className="text-sm mt-3">{app.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">{app.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 mt-auto">
                    {app.type === 'script' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => runScript(app.path, app.title)}
                        disabled={status?.type === 'loading'}
                      >
                        {status?.type === 'loading'
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Play size={13} />
                        }
                        {app.actionName}
                      </Button>
                    ) : (
                      <a href={app.path} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink size={13} /> {app.actionName}
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
