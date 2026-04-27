import { useState, useEffect, cloneElement } from 'react';
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ComplaintSubmission } from './components/ComplaintSubmission';
import { Dashboard } from './components/Dashboard';
import { EmergencyButton } from './components/EmergencyButton';
import { EmergencyTracking } from './components/EmergencyTracking';
import { PhoneAuth } from './components/PhoneAuth';
import { AIChatBot } from './components/AIChatBot';
import { Shield, FileText, LayoutDashboard, LogOut, Bot, AlertTriangle, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';


import { Landing } from './components/Landing';
import { DashboardGate } from './components/DashboardGate';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('civic_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Failed to parse user from local storage:', err);
      localStorage.removeItem('civic_user');
    }
  }, []);

  const handleLogin = (phoneNumber) => {
    const newUser = { uid: `user-${Date.now()}`, phoneNumber };
    localStorage.setItem('civic_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('civic_user');
    setUser(null);
  };

  return (
    <HashRouter>
      <ErrorBoundary>
        <div className="min-h-screen">
          <div className="scene" aria-hidden="true">
            <div className="scene__blob scene__blob--1"></div>
            <div className="scene__blob scene__blob--2"></div>
            <div className="scene__blob scene__blob--3"></div>
          </div>

          {/* Theme toggle */}
          <button className="glass glass-btn theme-toggle-btn fixed top-4 right-4 z-[200] w-12 h-12 p-0 flex items-center justify-center rounded-full" id="theme-toggle" aria-label="Toggle colour scheme" title="Toggle light / dark mode" onClick={() => document.documentElement.classList.toggle('dark')}>
            <span className="icon-dark dark:hidden" aria-hidden="true">☀️</span>
            <span className="icon-light hidden dark:block" aria-hidden="true">🌙</span>
          </button>

          {/* Toast region (ARIA live) */}
          <div className="glass-toast-region" id="toast-region" role="region" aria-label="Notifications" aria-live="polite"></div>

          <div className="min-h-screen flex flex-col relative z-10">
            {/* Navigation Header */}
            <header className="header-bar sticky top-0 z-[100] px-6 py-4">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 glass rounded-xl flex items-center justify-center border-white/10 group-hover:border-aqua/50 transition-all shadow-lg">
                    <Shield className="w-5 h-5 text-aqua" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-white tracking-tighter leading-none font-display uppercase">
                      Smart Civic
                    </h1>
                    <p className="text-[9px] font-black text-violet uppercase tracking-[0.3em] mt-1 opacity-60">Operations</p>
                  </div>
                </Link>

                <nav className="flex items-center gap-2">
                  {user && <NavLink to="/report" icon={<FileText />} label="Report" />}
                  <NavLink to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
                  {user && <NavLink to="/ai-assistant" icon={<Bot />} label="AI Bot" />}
                  
                  {user && (
                    <button 
                      onClick={handleLogout} 
                      className="glass glass-btn glass-btn--ghost text-[10px] font-bold px-4 h-10 flex items-center gap-2 text-rose border-rose/20 hover:bg-rose/5 ml-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> LOGOUT
                    </button>
                  )}
                </nav>
              </div>
            </header>

            {/* Main Application Routes */}
            <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full flex flex-col items-center">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/report" element={user ? <ComplaintSubmission user={user} /> : <Navigate to="/login" />} />
                <Route path="/login" element={!user ? <PhoneAuth onLogin={handleLogin} /> : <Navigate to="/report" />} />
                <Route path="/dashboard" element={<DashboardGate><Dashboard /></DashboardGate>} />
                <Route path="/ai-assistant" element={user ? <AIChatBot user={user} /> : <Navigate to="/login" />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>

            {/* Global Emergency Controls */}
            {user && (
              <div className="fixed bottom-8 right-8 z-[150] flex flex-col gap-4 items-end">
                <EmergencyTracking user={user} />
                <EmergencyButton user={user} />
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </HashRouter>
  );
}

function NavLink({ to, icon, label }) {
  return (
    <Link 
      to={to} 
      className="glass glass-btn glass-btn--ghost text-[10px] font-bold px-4 h-10 flex items-center gap-2 border-white/5 hover:border-aqua/30 transition-all uppercase tracking-widest"
    >
      {cloneElement(icon, { className: "w-3.5 h-3.5 text-aqua" })}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function StatMini({ num, desc }) {
  return (
    <div className="glass p-4 rounded-2xl border-white/5 flex flex-col items-center">
      <div className="text-xl font-black text-aqua tracking-tighter">{num}</div>
      <div className="text-[8px] font-bold opacity-30 tracking-widest uppercase mt-1">{desc}</div>
    </div>
  );
}

export default App;
