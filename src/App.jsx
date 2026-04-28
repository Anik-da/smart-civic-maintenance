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
  const isFirebaseDomain = window.location.hostname.endsWith('web.app') || 
                           window.location.hostname.endsWith('firebaseapp.com');

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

  const isDashboard = window.location.hash.includes('/dashboard');
  const isLanding = window.location.hash === '' || window.location.hash === '#' || window.location.hash === '#/';

  return (
    <HashRouter>
      <ErrorBoundary>
        <div className={`min-h-screen ${isFirebaseDomain ? 'hide-recaptcha' : ''}`}>
          <div className="scene" aria-hidden="true"></div>

          {/* Theme toggle */}
          <button className="glass glass-btn theme-toggle-btn fixed top-4 right-4 z-[200] w-12 h-12 p-0 flex items-center justify-center rounded-full" id="theme-toggle" aria-label="Toggle colour scheme" title="Toggle light / dark mode" onClick={() => document.documentElement.classList.toggle('dark')}>
            <span className="icon-dark dark:hidden" aria-hidden="true">☀️</span>
            <span className="icon-light hidden dark:block" aria-hidden="true">🌙</span>
          </button>

          {/* Toast region (ARIA live) */}
          <div className="glass-toast-region" id="toast-region" role="region" aria-label="Notifications" aria-live="polite"></div>

          <div className="min-h-screen flex flex-col relative z-10">
            {/* Navigation Header - Hidden on Dashboard & Landing */}
            {!isDashboard && !isLanding && (
              <header className="header-bar sticky top-0 z-[100] px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                  <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative flex items-center justify-center">
                      <div className="w-11 h-11 glass rounded-2xl flex items-center justify-center border-white/10 group-hover:border-aqua/50 transition-all shadow-xl bg-white/5 relative z-10">
                        <Shield className="w-5 h-5 text-aqua" />
                      </div>
                    </div>
                    <div className="flex flex-col -gap-0.5">
                      <h1 className="text-[22px] text-white tracking-tight leading-none italic font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Smart Civic
                      </h1>
                      <p className="text-[9px] font-black text-violet uppercase tracking-[0.5em] mt-1 opacity-90">Operations</p>
                    </div>
                  </Link>

                  <nav className="flex items-center gap-1 sm:gap-2">
                    {user && <NavLink to="/report" icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5" />} label="Report" />}
                    {user && <NavLink to="/ai-assistant" icon={<Bot className="w-4 h-4 sm:w-5 sm:h-5" />} label="AI" />}
                    
                    {user && (
                      <button 
                        onClick={handleLogout} 
                        className="glass glass-btn glass-btn--primary h-9 sm:h-10 px-3 sm:px-5 text-[9px] sm:text-[10px] font-black tracking-widest flex items-center gap-1 sm:gap-2 text-white bg-rose/40 border-rose/40 hover:bg-rose/60 ml-2 sm:ml-4 shadow-[0_0_20px_rgba(247,168,196,0.3)] transition-all active:scale-95"
                      >
                        <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden xs:inline">LOGOUT</span>
                      </button>
                    )}
                  </nav>
                </div>
              </header>
            )}

            {/* Main Application Routes */}
            <main className={`flex-1 w-full ${isDashboard ? 'dashboard-main p-0' : isLanding ? 'p-0 flex flex-col items-center' : 'px-4 py-6 max-w-7xl mx-auto flex flex-col items-center'}`}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/report" element={user ? <ComplaintSubmission user={user} /> : <Navigate to="/login" />} />
                <Route path="/login" element={!user ? <PhoneAuth onLogin={handleLogin} /> : <Navigate to="/report" />} />
                <Route path="/dashboard" element={<DashboardGate onLogout={handleLogout}><Dashboard user={user} onLogout={handleLogout} /></DashboardGate>} />
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
      className="glass glass-btn glass-btn--ghost text-[9px] sm:text-[10px] font-bold px-2 sm:px-4 h-9 sm:h-10 flex items-center gap-1 sm:gap-2 border-white/5 hover:border-aqua/30 transition-all uppercase tracking-widest whitespace-nowrap"
    >
      {cloneElement(icon, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4" })}
      <span className="hidden xs:inline">{label}</span>
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
