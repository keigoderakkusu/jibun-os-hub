import { useState } from 'react';
import { Sparkles, RefreshCw, Send, FileText, UserCircle } from 'lucide-react';

export default function SalesMarketing() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [trend, setTrend] = useState('');

  const personas = [
    { id: 'business', name: 'AI Business Advisor' },
    { id: 'tech', name: 'Tech Deep-Dive Engineer' },
    { id: 'finance', name: 'Financial Freedom Coach' },
  ];
  const [selectedPersona, setSelectedPersona] = useState(personas[0].id);

  const fetchTrends = () => {
    setTrend('Loading...');
    setTimeout(() => {
      setTrend('Top Trend: "Agentic AI workflows reducing operational cost by 40%"');
    }, 1500);
  };

  const generateContent = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setContent(
        `# The Evolution of Autonomous Workflows\n\n` +
        `Recent trends indicate a massive shift towards fully automated AI agent networks. ` +
        `By leveraging simple tools like n8n and customized language models, individuals are scaling their output 10x.\n\n` +
        `## Why Now?\n` +
        `APIs have never been cheaper. We are entering an era where one person equals one entire corporation.`
      );
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Sales & Marketing Division
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-driven lead generation and content scaling.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Controls */}
        <div className="glass-panel p-6 flex flex-col gap-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">1. Select AI Persona</label>
            <div className="space-y-2">
              {personas.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersona(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left
                    ${selectedPersona === p.id 
                      ? 'bg-amber-500/20 border border-amber-400/50 text-amber-400' 
                      : 'bg-dark-300 border border-slate-700 text-slate-400 hover:border-slate-500'}`}
                >
                  <UserCircle className="w-4 h-4" />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">2. Market Intelligence</label>
            <div className="p-4 bg-dark-300 border border-slate-800 rounded-xl space-y-4">
              <div className="text-sm text-slate-300 min-h-[2.5rem]">
                {trend || <span className="text-slate-600">Click to fetch current trend via n8n webhook...</span>}
              </div>
              <button 
                onClick={fetchTrends}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Fetch Web Trends
              </button>
            </div>
          </div>

          <button 
            onClick={generateContent}
            disabled={isGenerating}
            className="w-full py-3 bg-amber-500 text-dark-300 text-sm font-black rounded-xl hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isGenerating ? 'Drafting Content...' : 'Auto-Generate Draft'}
          </button>
        </div>

        {/* Content Preview */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Markdown Preview
            </h2>
            <button className="px-4 py-2 bg-cyber-500 text-dark-300 text-sm font-bold rounded-lg hover:bg-cyber-400 transition-colors flex items-center gap-2">
              <Send className="w-4 h-4" />
              Push to WordPress
            </button>
          </div>
          
          <div className="flex-1 bg-dark-300 border border-slate-800 rounded-xl p-6 overflow-y-auto min-h-[400px]">
            {content ? (
              <div className="prose prose-invert prose-amber max-w-none">
                {content.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-black text-white mb-4">{line.replace('# ', '')}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-amber-400 mt-6 mb-3">{line.replace('## ', '')}</h2>;
                  if (line === '') return <br key={i} />;
                  return <p key={i} className="text-slate-300 leading-relaxed">{line}</p>;
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 italic">
                Awaiting content generation...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
