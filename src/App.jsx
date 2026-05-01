import { useState, useEffect, cloneElement } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ComplaintSubmission } from './components/ComplaintSubmission';
import { Dashboard } from './components/Dashboard';
import { EmergencyButton } from './components/EmergencyButton';
import { EmergencyTracking } from './components/EmergencyTracking';
import { PhoneAuth } from './components/PhoneAuth';
import { Shield, FileText, LogOut, ArrowLeft, Bot, Search } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

import { Landing } from './components/Landing';
import { DashboardGate } from './components/DashboardGate';
import { AIChatBot } from './components/AIChatBot';
import { CitizenTracker } from './components/CitizenTracker';

function AppShell() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === '/dashboard';
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  
  const canGoBack = location.pathname !== '/';

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
    // Navigate to the page the user was trying to reach before login
    const destination = location.state?.from || '/report';
    navigate(destination, { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('civic_user');
    setUser(null);
  };

  const handleBack = () => {
    if (location.pathname === '/dashboard') {
      localStorage.removeItem('staff_authorized_user');
      handleLogout(); // Explicitly clear the user session as requested
      navigate('/');
      return;
    }

    if (window.history.length <= 1 || location.pathname === '/login') {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  // Determine if header should show (only on inner pages like /report)
  const showHeader = !isDashboard && !isLanding && !isLogin;

  // Full-screen pages get no padding
  const isFullScreen = isDashboard || isLanding || isLogin;

  return (
    <div className="min-h-screen">
      <div className="scene" aria-hidden="true"></div>

      {/* Toast region (ARIA live) */}
      <div className="glass-toast-region" id="toast-region" role="region" aria-label="Notifications" aria-live="polite"></div>

      <div className="min-h-screen flex flex-col relative z-10">
        {/* Global Back Button */}
        {canGoBack && (
          <button
            onClick={handleBack}
            className="fixed top-6 left-6 z-[300] glass glass-btn h-12 px-6 flex items-center gap-3 rounded-full border-white/20 hover:border-aqua/50 transition-all shadow-2xl bg-black/60 backdrop-blur-2xl group w-fit animate-in slide-in-from-left-4 duration-500"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-aqua group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black tracking-[0.2em] text-white/90">GO BACK</span>
          </button>
        )}

        {/* Navigation Header - Only on inner pages */}
        {showHeader && (
          <header className="header-bar sticky top-0 z-[100] px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center pl-14 sm:pl-16">
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
                {user && <NavLink to="/track" icon={<Search className="w-4 h-4 sm:w-5 sm:h-5" />} label="Track" />}
                {user && <NavLink to="/ai-bot" icon={<Bot className="w-4 h-4 sm:w-5 sm:h-5" />} label="AI Bot" />}


                
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
        <main className={`flex-1 w-full ${isDashboard ? 'dashboard-main p-0' : isLogin ? 'p-0 flex flex-col items-center justify-center min-h-screen' : isFullScreen ? 'p-0 flex flex-col items-center' : 'px-4 py-6 max-w-7xl mx-auto flex flex-col items-center'}`}>
          <Routes>
            <Route path="/" element={<Landing user={user} />} />
            <Route path="/report" element={user ? <ComplaintSubmission user={user} /> : <Navigate to="/login" state={{ from: '/report' }} />} />
            <Route path="/login" element={!user ? <PhoneAuth onLogin={handleLogin} /> : <Navigate to={location.state?.from || '/report'} replace />} />
            <Route path="/dashboard" element={<DashboardGate onLogout={handleLogout}><Dashboard user={user} onLogout={handleLogout} /></DashboardGate>} />
            <Route path="/ai-bot" element={<AIChatBot user={user} />} />
            <Route path="/track" element={user ? <CitizenTracker user={user} /> : <Navigate to="/login" state={{ from: '/track' }} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Global Emergency Controls - Only show on non-dashboard pages to prevent overlap with sidebar SOS */}
        {!isDashboard && (
          <div className="fixed bottom-8 right-8 z-[1000] flex flex-col gap-4 items-end pointer-events-none">
            <div className="pointer-events-auto">
              {user && <EmergencyTracking user={user} />}
              <EmergencyButton user={user} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <AppShell />
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

export default App;
