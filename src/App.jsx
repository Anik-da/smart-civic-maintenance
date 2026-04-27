import React, { useState, useEffect, Component } from 'react';
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ComplaintSubmission } from './components/ComplaintSubmission';
import { Dashboard } from './components/Dashboard';
import { EmergencyButton } from './components/EmergencyButton';
import { EmergencyTracking } from './components/EmergencyTracking';
import { PhoneAuth } from './components/PhoneAuth';
import { AIChatBot } from './components/AIChatBot';
import { Shield, FileText, LayoutDashboard, LogOut, Bot, AlertTriangle, RefreshCw } from 'lucide-react';

// Robust Error Boundary to prevent white screen crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("App Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="glass p-12 rounded-[2rem] border-rose/20 max-w-lg">
            <AlertTriangle className="w-16 h-16 text-rose mx-auto mb-6 animate-pulse" />
            <h1 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">System Interface Error</h1>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              We encountered a critical visualization error. This usually happens due to temporary network issues or secure cloud synchronization failures.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="glass glass-btn glass-btn--primary w-full h-14 flex items-center justify-center gap-3"
            >
              <RefreshCw className="w-4 h-4" /> REBOOT INTERFACE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('civic_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
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
                    <p className="text-[9px] font-black text-violet uppercase tracking-[0.3em] mt-1 opacity-60">Maintenance 2.0</p>
                  </div>
                </Link>

                {user && (
                  <nav className="flex items-center gap-2">
                    <NavLink to="/" icon={<FileText />} label="Report" />
                    <NavLink to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
                    <NavLink to="/ai-assistant" icon={<Bot />} label="AI Bot" />
                    <button 
                      onClick={handleLogout} 
                      className="glass glass-btn glass-btn--ghost text-[10px] font-bold px-4 h-10 flex items-center gap-2 text-rose border-rose/20 hover:bg-rose/5"
                    >
                      <LogOut className="w-3.5 h-3.5" /> LOGOUT
                    </button>
                  </nav>
                )}
              </div>
            </header>

            {!user && (
              <header className="hero mt-20 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                <span className="hero__kicker">AI-Integrated · Civic Infrastructure</span>
                <h1 className="hero__title">
                  Intelligent City<br />
                  Maintenance
                </h1>
                <p className="hero__sub max-w-xl mx-auto">
                  The next generation of civic responsibility. Report infrastructure failures, track repair progress in real-time, and interact with our AI maintenance assistant.
                </p>

                <div className="container stats mt-12 grid grid-cols-3 gap-4 max-w-2xl">
                  <StatMini num="24/7" desc="LIVE COMMAND" />
                  <StatMini num="AI" desc="SMART ANALYSIS" />
                  <StatMini num="REAL" desc="TIME TRACKING" />
                </div>
              </header>
            )}

            {/* Main Application Routes */}
            <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full flex flex-col items-center justify-center">
              <Routes>
                <Route path="/" element={user ? <ComplaintSubmission user={user} /> : <Navigate to="/login" />} />
                <Route path="/login" element={!user ? <PhoneAuth onLogin={handleLogin} /> : <Navigate to="/" />} />
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
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
      {React.cloneElement(icon, { className: "w-3.5 h-3.5 text-aqua" })}
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
