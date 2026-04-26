import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { ComplaintSubmission } from './components/ComplaintSubmission';
import { Dashboard } from './components/Dashboard';
import { EmergencyButton } from './components/EmergencyButton';
import { EmergencyTracking } from './components/EmergencyTracking';
import { Shield, FileText, LayoutDashboard } from 'lucide-react';

function App() {
  // Mock public user to satisfy components that expect a user object
  const publicUser = { uid: 'public-user', phoneNumber: '+1234567890' };

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
                    Liquid Civic
                  </h1>
                  <p className="text-[10px] font-semibold text-violet uppercase tracking-[0.2em]">Public Access</p>
                </div>
              </Link>

              <nav className="flex items-center gap-4">
                <Link to="/" className="glass glass-btn glass-btn--ghost text-sm px-4 py-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Report
                </Link>
                <Link to="/dashboard" className="glass glass-btn glass-btn--ghost text-sm px-4 py-2 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              </nav>
            </div>
          </header>

          <header className="hero mt-12 mb-8">
            <span className="hero__kicker">Pure CSS · Glassmorphism · Liquid Glass</span>
            <h1 className="hero__title">
              Liquid Glass<br />
              UI Kit
            </h1>
            <p className="hero__sub">
              Complete design token system, 15+ accessible components, light/dark mode, 12 animations — zero dependencies.
            </p>
          </header>

          <div className="container stats mb-12">
            <div className="glass stats__item"><div className="stats__num">15+</div><div className="stats__desc">Components</div></div>
            <div className="glass stats__item"><div className="stats__num">12</div><div className="stats__desc">Animations</div></div>
            <div className="glass stats__item"><div className="stats__num">a11y</div><div class="stats__desc">WCAG Compliant</div></div>
          </div>

          {/* Main Content */}
          <main className="flex-1 px-4 py-10 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<ComplaintSubmission user={publicUser} />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>

          {/* Emergency Features */}
          <EmergencyButton user={publicUser} />
          <EmergencyTracking user={publicUser} />
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
