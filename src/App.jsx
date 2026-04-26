import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ComplaintSubmission } from './components/ComplaintSubmission';
import { Dashboard } from './components/Dashboard';
import { EmergencyButton } from './components/EmergencyButton';
import { EmergencyTracking } from './components/EmergencyTracking';
import { PhoneAuth } from './components/PhoneAuth';
import { AIChatBot } from './components/AIChatBot';
import { Shield, FileText, LayoutDashboard, LogOut, Bot } from 'lucide-react';

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
      <div className="min-h-screen">
        <div className="scene" aria-hidden="true">
          <div className="scene__blob scene__blob--1"></div>
          <div className="scene__blob scene__blob--2"></div>
          <div className="scene__blob scene__blob--3"></div>
        </div>

        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="header-bar sticky top-0 z-30 px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 glass rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                  <Shield className="w-5 h-5 text-aqua" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-white tracking-tight leading-none font-display">
                    Smart Civic
                  </h1>
                  <p className="text-[10px] font-semibold text-violet uppercase tracking-[0.2em]">Maintenance Portal</p>
                </div>
              </Link>

              {user && (
                <nav className="flex items-center gap-3 flex-wrap">
                  <Link to="/" className="glass glass-btn glass-btn--ghost text-sm px-4 py-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Report
                  </Link>
                  <Link to="/dashboard" className="glass glass-btn glass-btn--ghost text-sm px-4 py-2 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link to="/ai-assistant" className="glass glass-btn glass-btn--ghost text-sm px-4 py-2 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    AI Bot
                  </Link>
                  <button onClick={handleLogout} className="glass glass-btn glass-btn--ghost text-sm px-4 py-2 flex items-center gap-2 text-rose">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </nav>
              )}
            </div>
          </header>

          {!user && (
            <>
              <header className="hero mt-12 mb-8">
                <span className="hero__kicker">AI-Powered · Real-Time · Smart City</span>
                <h1 className="hero__title">
                  Smart Civic<br />
                  Maintenance
                </h1>
                <p className="hero__sub">
                  Report infrastructure issues, track repairs in real-time, and get AI-powered assistance — all from one intelligent civic platform.
                </p>
              </header>

              <div className="container stats mb-12">
                <div className="glass stats__item"><div className="stats__num">24/7</div><div className="stats__desc">Live Tracking</div></div>
                <div className="glass stats__item"><div className="stats__num">AI</div><div className="stats__desc">Smart Analysis</div></div>
                <div className="glass stats__item"><div className="stats__num">GPS</div><div className="stats__desc">Geo Located</div></div>
              </div>
            </>
          )}

          {/* Main Content */}
          <main className="flex-1 px-4 py-10 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={user ? <ComplaintSubmission user={user} /> : <Navigate to="/login" />} />
              <Route path="/login" element={!user ? <PhoneAuth onLogin={handleLogin} /> : <Navigate to="/" />} />
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/ai-assistant" element={user ? <AIChatBot user={user} /> : <Navigate to="/login" />} />
            </Routes>
          </main>

          {/* Emergency Features */}
          {user && <EmergencyButton user={user} />}
          {user && <EmergencyTracking user={user} />}
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
