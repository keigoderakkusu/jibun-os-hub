import { 
  Rocket, ExternalLink, Workflow, Database, Brain, Cpu, ShieldCheck, 
  Wallet, Receipt, Users, Megaphone, Layout, Globe, Server 
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppLauncher() {
  const appGroups = [
    {
      group: "AI & Automation // 知能・自動化",
      apps: [
        { name: 'n8n', desc: '中枢神経 / ワークフロー自動化', url: 'http://localhost:5678', icon: Workflow, color: 'text-orange-500', status: 'Active' },
        { name: 'Flowise AI', desc: 'LLM オーケストレーター', url: 'http://localhost:3001', icon: Brain, color: 'text-blue-500', status: 'Active' },
        { name: 'AnythingLLM', desc: '第二の脳 / ナレッジベース', url: 'http://localhost:3001', icon: ShieldCheck, color: 'text-purple-500', status: 'Standby' },
      ]
    },
    {
      group: "Finance & Data // 経理・データ",
      apps: [
        { name: 'Firefly III', desc: '次世代金庫番 / 収支管理', url: 'http://localhost:8080', icon: Wallet, color: 'text-emerald-500', status: 'Online' },
        { name: 'PocketBase', desc: '軽量リアルタイム DB', url: 'http://localhost:8090/_/', icon: Database, color: 'text-cyan-500', status: 'Active' },
        { name: 'Invoice Ninja', desc: '請求・入金管理', url: '#', icon: Receipt, color: 'text-blue-400', status: 'Setup' },
      ]
    },
    {
      group: "Marketing & Ops // 営業・総務",
      apps: [
        { name: 'Mautic', desc: 'マーケティング自動化', url: '#', icon: Megaphone, color: 'text-amber-500', status: 'Online' },
        { name: 'Ghost', desc: '高収益 CMS / ニュースレター', url: '#', icon: Globe, color: 'text-pink-500', status: 'Online' },
        { name: 'Plane', desc: 'プロジェクト管理 (OpenSource)', url: '#', icon: Layout, color: 'text-indigo-400', status: 'Setup' },
      ]
    },
    {
      group: "Infrastructure // 基盤・デプロイ",
      apps: [
        { name: 'Coolify', desc: '自社 PaaS / OSS 管理艦', url: '#', icon: Server, color: 'text-slate-400', status: 'Active' },
        { name: 'GitHub Actions', desc: 'CI/CD & 自動デプロイ', url: 'https://github.com/keigoderakkusu/jibun-os-hub/actions', icon: Cpu, color: 'text-slate-300', status: 'Online' },
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter italic">
            <Rocket className="w-8 h-8 text-cyber-400" />
            OSS HUB / LAUNCHER
          </h1>
          <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">
            Entrepreneur Intelligent Operating System v4
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant="cyber" className="px-4 py-1">CEO Authorized</Badge>
            <Badge variant="outline" className="text-slate-500 border-slate-800">System Stable</Badge>
        </div>
      </div>

      <div className="space-y-12">
        {appGroups.map((group, idx) => (
          <div key={idx} className="space-y-6">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-4">
              <span>{group.group}</span>
              <div className="h-[1px] flex-1 bg-slate-800/50"></div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.apps.map((app, i) => (
                <Card key={i} className="group hover:border-cyber-400/50 transition-all duration-500 cursor-pointer overflow-hidden border-slate-800/50">
                  <CardHeader className="p-6">
                    <div className="flex justify-between items-start">
                      <div className={cn("p-3 rounded-xl bg-dark-300 border border-slate-800 group-hover:scale-110 transition-transform duration-500", app.color.replace('text-', 'border-').replace('500', '400/30'))}>
                        <app.icon className={cn("w-6 h-6", app.color)} />
                      </div>
                      <Badge 
                        variant={app.status === 'Active' ? 'neon' : app.status === 'Online' ? 'cyber' : 'outline'}
                      >
                        {app.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-4">
                    <CardTitle className="text-xl font-bold group-hover:text-cyber-400 transition-colors uppercase italic tracking-tight">
                        {app.name}
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-2 font-medium">
                        {app.desc}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="px-6 py-4 border-t border-slate-800/30 bg-dark-300/30">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-between text-slate-500 hover:text-white group/btn"
                        asChild
                    >
                      <a href={app.url} target="_blank" rel="noopener noreferrer">
                        <span>起動センターを開く</span>
                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
