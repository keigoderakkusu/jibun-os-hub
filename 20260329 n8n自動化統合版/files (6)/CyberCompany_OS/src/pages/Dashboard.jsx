import { useState } from 'react';
import { 
  AreaChart, 
  Card as TremorCard, 
  Metric, 
  Text, 
  Flex, 
  ProgressBar,
  BadgeDelta,
  Grid
} from '@tremor/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, TrendingUp, DollarSign, PenTool, Users, 
  Zap, Brain, Calendar, ArrowUpRight, MessageSquare 
} from 'lucide-react';

const chartData = [
  { date: '2026-03-24', "Total Revenue": 248000, "Passive Income": 124000 },
  { date: '2026-03-25', "Total Revenue": 256000, "Passive Income": 132000 },
  { date: '2026-03-26', "Total Revenue": 298000, "Passive Income": 156000 },
  { date: '2026-03-27', "Total Revenue": 312000, "Passive Income": 178000 },
  { date: '2026-03-28', "Total Revenue": 345000, "Passive Income": 192000 },
  { date: '2026-03-29', "Total Revenue": 389000, "Passive Income": 224000 },
];

const mockApprovals = [
  { id: 1, type: 'Blog Post', title: 'The Future of AI Automation with o1', agent: 'Bonsai8B (Writer)', priority: 'High' },
  { id: 2, type: 'Marketing', title: 'SNS Growth Campaign - Week 14', agent: 'Marketing Worker', priority: 'Medium' },
  { id: 3, type: 'Finance', title: 'n8n Cloud Subscription Renewal', agent: 'Finance Worker', priority: 'Auto' },
];

export default function Dashboard() {
  const [approvals, setApprovals] = useState(mockApprovals);

  const handleApprove = (id) => {
    setApprovals(approvals.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
            CEO Command Center
          </h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <Badge variant="neon" className="animate-pulse">SYSTEM LIVE</Badge>
            Jibun-OS v4 Enterprise is operational.
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="bg-dark-200 border-slate-800 text-slate-400">
             <Calendar className="w-4 h-4 mr-2" />
             Check Schedule
           </Button>
           <Button variant="cyber" size="sm">
             <Brain className="w-4 h-4 mr-2" />
             Talk to Assistant
           </Button>
        </div>
      </div>

      {/* KPI Stats using Tremor */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <TremorCard className="bg-dark-200/50 border-slate-800 backdrop-blur-md" decoration="top" decorationColor="blue">
            <Flex alignItems="start">
                <Text className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Revenue (YTD)</Text>
                <BadgeDelta deltaType="moderateIncrease">+14.5%</BadgeDelta>
            </Flex>
            <Metric className="text-white font-black">¥8,450,000</Metric>
            <ProgressBar value={75} color="blue" className="mt-3" />
        </TremorCard>

        <TremorCard className="bg-dark-200/50 border-slate-800 backdrop-blur-md" decoration="top" decorationColor="emerald">
            <Flex alignItems="start">
                <Text className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Passive Income (MRR)</Text>
                <BadgeDelta deltaType="increase">+32.2%</BadgeDelta>
            </Flex>
            <Metric className="text-white font-black">¥320,000</Metric>
            <ProgressBar value={45} color="emerald" className="mt-3" />
        </TremorCard>

        <TremorCard className="bg-dark-200/50 border-slate-800 backdrop-blur-md" decoration="top" decorationColor="violet">
            <Flex alignItems="start">
                <Text className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Generated Content</Text>
                <BadgeDelta deltaType="moderateDecrease">-2.4%</BadgeDelta>
            </Flex>
            <Metric className="text-white font-black">1,284</Metric>
            <ProgressBar value={88} color="violet" className="mt-3" />
        </TremorCard>

        <TremorCard className="bg-dark-200/50 border-slate-800 backdrop-blur-md" decoration="top" decorationColor="amber">
            <Flex alignItems="start">
                <Text className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Audience</Text>
                <BadgeDelta deltaType="increase">+8.1%</BadgeDelta>
            </Flex>
            <Metric className="text-white font-black">45.2K</Metric>
            <ProgressBar value={62} color="amber" className="mt-3" />
        </TremorCard>
      </Grid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Growth Chart */}
        <Card className="lg:col-span-2 border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 italic">
              <TrendingUp className="w-5 h-5 text-cyber-400" />
              FINANCIAL PERFORMANCE
            </CardTitle>
            <CardDescription>Revenue vs Passive Income growth trajectory</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart
              className="h-80 mt-4"
              data={chartData}
              index="date"
              categories={["Total Revenue", "Passive Income"]}
              colors={["cyan", "emerald"]}
              valueFormatter={(number) => `¥${Intl.NumberFormat("us").format(number).toString()}`}
              yAxisWidth={80}
              showAnimation={true}
            />
          </CardContent>
        </Card>

        {/* Approval Center and Agents */}
        <div className="space-y-6">
          <Card className="border-slate-800/50 bg-dark-200/30">
            <CardHeader className="pb-4">
              <Flex>
                <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-amber-500" />
                    APPROVE NEEDED
                </CardTitle>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                    {approvals.length} Tasks
                </Badge>
              </Flex>
            </CardHeader>
            <CardContent className="space-y-4">
               {approvals.map(task => (
                 <div key={task.id} className="p-4 rounded-xl bg-dark-300 border border-slate-800 hover:border-slate-700 transition-all group">
                    <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter border-slate-700 text-slate-500">
                            {task.type}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono">{task.agent}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{task.title}</h4>
                    <div className="mt-4 flex gap-2">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-1 h-8 text-[11px]" 
                            onClick={() => handleApprove(task.id)}
                        >
                            Review
                        </Button>
                        <Button 
                            variant="cyber" 
                            size="sm" 
                            className="flex-1 h-8 text-[11px]"
                            onClick={() => handleApprove(task.id)}
                        >
                            Quick Admit
                        </Button>
                    </div>
                 </div>
               ))}
            </CardContent>
          </Card>

          <Card className="border-slate-800/50 bg-dark-200/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-400">
                    <Zap className="w-4 h-4 text-violet-400" />
                    SYSTEM PULSE
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 italic">Bonsai8B Engine</span>
                    <Badge variant="neon" className="px-2 py-0">ACTIVE</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 italic">n8n Gateway</span>
                    <span className="text-cyber-400 font-mono">CONNECTED</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 italic">PocketBase DB</span>
                    <span className="text-emerald-400 font-mono">SYNCED</span>
                </div>
                <div className="pt-4 border-t border-slate-800 flex items-center gap-2 text-[10px] text-slate-600 font-mono">
                    <MessageSquare className="w-3 h-3" />
                    <span>Last log: Worker-03 processed ghost_post_04.</span>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
