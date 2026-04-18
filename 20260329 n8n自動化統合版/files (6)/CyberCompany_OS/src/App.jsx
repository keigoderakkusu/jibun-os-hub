import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import AppLauncher from './pages/AppLauncher';
import SalesMarketing from './pages/SalesMarketing';
import Finance from './pages/Finance';
import IT_AI from './pages/IT_AI';
import AdminHR from './pages/AdminHR';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-full bg-dark-300 overflow-hidden text-slate-200">
        <Sidebar />
        <div className="flex-1 flex flex-col relative w-full h-full z-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 relative z-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-dark-300 to-dark-300 -z-10"></div>
            <Routes>
              <Route path="/launcher" element={<AppLauncher />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/sales" element={<SalesMarketing />} />

              <Route path="/finance" element={<Finance />} />
              <Route path="/it" element={<IT_AI />} />
              <Route path="/hr" element={<AdminHR />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
