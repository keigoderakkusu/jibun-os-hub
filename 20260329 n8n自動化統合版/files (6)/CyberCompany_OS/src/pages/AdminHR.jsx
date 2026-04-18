import { useState } from 'react';
import { Users, UploadCloud, File, Plus, Search } from 'lucide-react';

const Column = ({ title, status, tasks }) => (
  <div className="flex-1 min-w-[250px] flex flex-col bg-dark-300/50 rounded-xl p-4 border border-slate-800">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-bold text-slate-300 capitalize">{title}</h3>
      <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full">
        {tasks.filter(t => t.status === status).length}
      </span>
    </div>
    <div className="flex-1 space-y-3">
      {tasks.filter(t => t.status === status).map(task => (
        <div key={task.id} className="p-3 bg-dark-200 border border-slate-700 rounded-lg text-sm text-slate-300 hover:border-slate-500 cursor-grab active:cursor-grabbing transition-colors shadow-lg">
          {task.title}
        </div>
      ))}
      <button className="w-full py-2 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all text-sm dashed border-2 border-transparent hover:border-slate-700">
        <Plus className="w-4 h-4" /> Add Task
      </button>
    </div>
  </div>
);

export default function AdminHR() {
  const [tasks] = useState([
    { id: 1, title: 'Upload new pricing PDFs to AnythingLLM', status: 'todo' },
    { id: 2, title: 'Review affiliate performance', status: 'in-progress' },
    { id: 3, title: 'Update system passwords', status: 'done' },
  ]);

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      alert('Mock: Document successfully vectorized into AnythingLLM.');
    }, 2000);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-pink-500" />
            Admin & HR Division
          </h1>
          <p className="text-slate-400 text-sm mt-1">Resource allocation, task management, and Agent Training.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Knowledge Upload (Training) */}
        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-pink-500" />
            Brain Training (AnythingLLM)
          </h2>
          
          <div 
            className="flex-1 border-2 border-dashed border-slate-700 hover:border-pink-500/50 rounded-xl bg-dark-300 flex flex-col items-center justify-center p-6 text-center transition-colors cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-pink-500/10 flex items-center justify-center mb-4 transition-colors">
              <Plus className="w-8 h-8 text-slate-400 group-hover:text-pink-400" />
            </div>
            <p className="text-sm font-bold text-slate-300 mb-1">Upload Knowledge</p>
            <p className="text-xs text-slate-500 mb-6">Drop PDF, TXT, or DOCX files here</p>
            <button 
              onClick={(e) => { e.stopPropagation(); handleUpload(); }}
              disabled={isUploading}
              className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? <UploadCloud className="w-4 h-4 animate-bounce" /> : <File className="w-4 h-4" />}
              {isUploading ? 'Vectorizing...' : 'Select Files'}
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="lg:col-span-3 glass-panel p-6 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-slate-300">Routine Task Automation</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="bg-dark-300 border border-slate-700 text-slate-200 text-xs rounded-full pl-8 pr-4 py-1.5 focus:outline-none focus:border-pink-500/50 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 flex gap-4 overflow-x-auto pb-2">
            <Column title="To Do" status="todo" tasks={tasks} />
            <Column title="In Progress" status="in-progress" tasks={tasks} />
            <Column title="Done" status="done" tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  );
}
