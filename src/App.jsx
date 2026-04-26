import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { PhoneAuth } from './components/PhoneAuth';
import { ComplaintSubmission } from './components/ComplaintSubmission';
import { Dashboard } from './components/Dashboard';
import { Button } from './components/ui/Button';
import { EmergencyButton } from './components/EmergencyButton';
import { EmergencyTracking } from './components/EmergencyTracking';
import { Shield, FileText, LayoutDashboard, LogOut } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="app-bg"><div className="orb orb-1"></div><div className="orb orb-2"></div></div>
        <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium">Loading CivicMaintenance...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      {/* Animated Background */}
      <div className="app-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="header-bar sticky top-0 z-30 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white tracking-tight leading-none">
                  CivicMaintenance
                </h1>
                <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-[0.2em]">Smart Emergency Response</p>
              </div>
            </Link>

            {user && (
              <nav className="flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all">
                  <FileText className="w-4 h-4" />
                  Report
                </Link>
                <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button 
                  onClick={() => signOut(auth)} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all ml-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </nav>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-10 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={user ? <ComplaintSubmission user={user} /> : <Navigate to="/login" />} />
            <Route path="/login" element={!user ? <PhoneAuth /> : <Navigate to="/" />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          </Routes>
        </main>

        {/* Emergency Features */}
        {user && <EmergencyButton user={user} />}
        {user && <EmergencyTracking user={user} />}
      </div>
    </HashRouter>
  );
}

export default App;
