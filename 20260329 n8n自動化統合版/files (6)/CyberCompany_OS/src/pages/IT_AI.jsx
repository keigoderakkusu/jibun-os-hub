import { useState, useEffect } from 'react';
import { 
  TerminalSquare, Activity, AlertCircle, Power, Cpu, Server, 
  Settings, RefreshCcw, ShieldCheck, Database 
} from 'lucide-react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarList, 
  Card as TremorCard, 
  Title, 
  Text, 
  Flex, 
  Metric 
} from '@tremor/react';

export default function IT_AI() {
  const [agents, setAgents] = useState([
    { id: 'bonsai-8b', name: 'Bonsai8B (CEO Assistant)', status: 'Active', platform: 'Local LLM / GitHub Actions', workload: 65 },
    { id: 'trend-worker', name: 'Trend Extraction Node', status: 'Online', platform: 'Google News API', workload: 42 },
    { id: 'audio-worker', name: 'Audio Strategy Node', status: 'Online', platform: 'Gemini 1.5 Flash', workload: 12 },
    { id: 'agent-writer', name: 'Agent 03: Professional Writer', status: 'Standby', platform: 'n8n Workflow', workload: 0 },
  ]);

  const resourceData = [
    { name: 'n8n Workflow Engine', value: 456 },
    { name: 'Flowise LLM Cache', value: 351 },
    { name: 'PocketBase DB', value: 271 },
    { name: 'AnythingLLM RAG', value: 191 },
  ];

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${baseUrl}/api/status`);
        const data = await res.json();
        setAgents(prev => prev.map(a => 
          a.id === 'bonsai-8b' 
            ? { ...a, status: data.status === 'Active' ? 'Active' : 'Offline' } 
            : a
        ));
      } catch (err) {
        console.error('Backend connection failed:', err);
      }
    };


    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const logs = [
    { time: '23:14:02', level: 'INFO', agent: 'Bonsai8B', msg: 'Task "Grand Integration" initialized by CEO delegate.' },
    { time: '23:10:12', level: 'WARN', agent: 'TrendNode', msg: 'Spike in AI news detected. Re-allocating tokens.' },
    { time: '23:05:01', level: 'INFO', agent: 'PocketBase', msg: 'Database backup successfully uploaded to Drive.' },
    { time: '22:55:00', level: 'ERROR', agent: 'n8n', msg: 'Cloud auth token expired. Auto-refreshing...' },
  ];

  return (
    <div className="space-y-8 pb-10 h-full overflow-y-auto pr-2 custom-scroll">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
            <TerminalSquare className="w-8 h-8 text-[#00f2ff]" />
            IT & AI INFRASTRUCTURE
          </h1>
          <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest leading-none">
            System Governance & Autonomous Agent Monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="bg-dark-200 border-slate-800 text-slate-400">
            <Settings className="w-4 h-4 mr-2" />
            Infrastructure Settings
          </Button>
          <Button variant="cyber" size="sm">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Sync All Workers
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agent Performance & Resources */}
        <div className="space-y-8">
          <Card className="border-slate-800 bg-dark-200/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Resource Allocation
              </CardTitle>
              <CardDescription>Core OSS resource consumption (MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <BarList data={resourceData} color="cyan" className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-dark-200/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-violet-400" />
                Cluster Healthy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {['n8n Engine', 'PocketBase', 'AnythingLLM', 'Coolify Node'].map(node => (
                 <div key={node} className="flex items-center justify-between p-3 rounded-lg bg-dark-300 border border-slate-800">
                    <span className="text-xs font-bold text-slate-300">{node}</span>
                    <Badge variant="neon">READY</Badge>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>

        {/* Real-time Agent Grid */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-slate-800 bg-dark-200/50 overflow-hidden">
            <CardHeader className="bg-dark-300/30 border-b border-slate-800">
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyber-400" />
                Active Agent Cluster
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Platform / Stack</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-bold text-white italic">{agent.name}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">{agent.platform}</TableCell>
                    <TableCell>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyber-400 h-full" style={{ width: `${agent.id === 'agent-writer' ? 0 : agent.workload}%` }}></div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={agent.status === 'Active' ? 'neon' : 'outline'}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="glass-panel p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-dark-300/50">
                <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-widest">
                <Activity className="w-4 h-4 text-pink-500" />
                System Live Logs
                </h2>
                <span className="text-[10px] font-mono text-slate-500">Auto-refreshing (5s)</span>
            </div>
            <div className="p-4 bg-black/40 font-mono text-[11px] h-48 overflow-y-auto">
                {logs.map((log, i) => (
                <div key={i} className="mb-2 flex gap-3">
                    <span className="text-slate-600 w-16">{log.time}</span>
                    <span className={`w-14 font-bold ${
                        log.level === 'INFO' ? 'text-cyber-400' : 
                        log.level === 'WARN' ? 'text-amber-500' : 'text-pink-500'
                    }`}>[{log.level}]</span>
                    <span className="text-slate-500 mr-2">[{log.agent}]</span>
                    <span className="text-slate-400">{log.msg}</span>
                </div>
                ))}
                <div className="text-emerald-500/50 animate-pulse mt-2">&gt; Awaiting next event...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
