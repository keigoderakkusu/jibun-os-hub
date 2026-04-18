import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ReceiptText, Target, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const expData = [
  { name: 'Server (ConoHa)', value: 2200, color: '#f43f5e' },
  { name: 'Claude API', value: 8500, color: '#ec4899' },
  { name: 'Perplexity', value: 3000, color: '#d946ef' },
  { name: 'Various Subs', value: 4500, color: '#8b5cf6' },
];

const incData = [
  { name: 'Affiliate', value: 45000, color: '#4ade80' },
  { name: 'Note Sales', value: 12000, color: '#2dd4bf' },
  { name: 'Main Salary', value: 650000, color: '#0ea5e9' },
];

export default function Finance() {
  const annualTarget = 10000000;
  const currentTotal = 8450000;
  const percentage = (currentTotal / annualTarget) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-neon-green" />
            Finance & Accounting
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time sync with Firefly III and API cost tracking.</p>
        </div>
      </div>

      {/* Progress to Target */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyber-400" />
            <h2 className="text-sm font-bold text-slate-300">Target Annual Income (¥10M)</h2>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white">¥{currentTotal.toLocaleString()}</span>
            <span className="text-slate-500 text-sm ml-2">/ ¥10,000,000</span>
          </div>
        </div>
        <div className="h-4 bg-dark-300 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-cyber-400 to-neon-green rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-neon-green" />
            Income Streams
          </h2>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={incData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {incData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value) => `¥${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {incData.map(item => (
              <div key={item.name} className="flex justify-between items-center p-3 rounded-lg bg-dark-300 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-slate-300">{item.name}</span>
                </div>
                <span className="font-mono text-slate-200">¥{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4 text-pink-500" />
            Operational Code (API & Server)
          </h2>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {expData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value) => `¥${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {expData.map(item => (
              <div key={item.name} className="flex justify-between items-center p-3 rounded-lg bg-dark-300 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-slate-300">{item.name}</span>
                </div>
                <span className="font-mono text-slate-200">¥{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
