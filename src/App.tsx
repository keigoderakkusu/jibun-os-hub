import { useState } from 'react';
import { Sidebar, type PageId } from './components/layout/Sidebar';
import IntegratedDashboard from './IntegratedDashboard';
import JibunOS_Hub from './JibunOS_Hub';
import AIAgent from './AIAgent';
import AppLauncher from './AppLauncher';

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard');

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      <Sidebar current={page} onChange={setPage} />

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {page === 'dashboard' && <IntegratedDashboard />}
        {page === 'hub' && <JibunOS_Hub />}
        {page === 'agent' && <AIAgent />}
        {page === 'launcher' && <AppLauncher />}
      </main>
    </div>
  );
}
