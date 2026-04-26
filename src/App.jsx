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
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <HashRouter>
      <div className="min-h-screen p-6 flex flex-col max-w-7xl mx-auto">
        <header className="mb-12 flex justify-between items-center py-6 px-10 rounded-[2.5rem] glass-card">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
              CivicMaintenance
            </h1>
            <p className="text-sm font-medium text-purple-300/80 uppercase tracking-widest">Smart Emergency Response</p>
          </div>
          <nav className="flex gap-8 items-center">
            {user ? (
              <>
                <Link to="/" className="text-purple-100 hover:text-white font-bold transition-all hover:scale-110">Report</Link>
                <Link to="/dashboard" className="text-purple-100 hover:text-white font-bold transition-all hover:scale-110">Dashboard</Link>
                <Button onClick={() => signOut(auth)} variant="default" className="py-2 px-6 ml-4">
                  Sign Out
                </Button>
              </>
            ) : null}
          </nav>
        </header>

        <main className="flex-1 relative">
          <Routes>
            <Route 
              path="/" 
              element={user ? <ComplaintSubmission user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={!user ? <PhoneAuth /> : <Navigate to="/" />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
        
        {/* Global Emergency Features */}
        {user && <EmergencyButton user={user} />}
        {user && <EmergencyTracking user={user} />}
      </div>
    </HashRouter>
  );
}

export default App;
