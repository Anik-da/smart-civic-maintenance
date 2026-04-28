import { useState, useEffect, cloneElement, Children } from 'react';
import { Shield, Lock, ArrowRight, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Local fallback credentials - used when Firestore is unreachable
const LOCAL_STAFF = [
  { name: 'Admin', role: 'ADMIN', department: 'ADMIN', passcode: 'ADMIN2026' },
  { name: 'Staff Member', role: 'WORKER', department: 'GENERAL', passcode: 'STAFF2026' },
  { name: 'Road Worker', role: 'WORKER', department: 'ROADS', passcode: 'ROAD_WORK' },
  { name: 'Power Staff', role: 'WORKER', department: 'ELECTRICITY', passcode: 'POWER_STAFF' },
  { name: 'Water Dept', role: 'WORKER', department: 'WATER', passcode: 'AQUA_DEPT' },
  { name: 'Sanitation', role: 'WORKER', department: 'SANITATION', passcode: 'CLEAN_CITY' },
];

export function DashboardGate({ children }) {
  const [passcode, setPasscode] = useState('');
  const [authorizedUser, setAuthorizedUser] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Persistence check
  useEffect(() => {
    const saved = localStorage.getItem('staff_authorized_user');
    if (saved) {
      try {
        setAuthorizedUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('staff_authorized_user');
      }
    }
  }, []);

  const authorizeUser = (userData) => {
    setAuthorizedUser(userData);
    localStorage.setItem('staff_authorized_user', JSON.stringify(userData));
    setLoading(false);
  };

  const checkLocalFallback = (input) => {
    const normalized = input.trim().toUpperCase();
    console.log('[Auth] Checking local fallback. Normalized input:', normalized);
    
    const match = LOCAL_STAFF.find(s => {
      const savedNorm = s.passcode.toUpperCase();
      return savedNorm === normalized;
    });
    
    if (match) {
      console.log('[Auth] Local match found:', match.name);
      return { role: match.role, department: match.department, name: match.name };
    }
    return null;
  };

  const validatePasscode = async (code) => {
    setLoading(true);
    setError(false);
    
    // Normalize: trim and ensure it's uppercase for consistent checking
    const input = code.trim().toUpperCase();
    
    console.log('[Auth] Attempting validation for:', input);
    
    // Try Firestore first
    try {
      const staffRef = collection(db, 'staff');
      // We'll fetch all staff and check locally for better robustness against mixed case in DB
      const querySnapshot = await getDocs(staffRef);
      
      let found = null;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.passcode && data.passcode.trim().toUpperCase() === input) {
          found = {
            role: data.role,
            department: data.department,
            name: data.name || 'Staff Member'
          };
        }
      });
      
      if (found) {
        console.log('[Auth] Firestore match found');
        authorizeUser(found);
        return true;
      }
    } catch (err) {
      console.warn('[Auth] Firestore error:', err.message);
    }

    // Fallback to local credentials
    const localMatch = checkLocalFallback(input);
    if (localMatch) {
      console.log('[Auth] Local fallback match found');
      authorizeUser(localMatch);
      return true;
    }

    console.error('[Auth] No match found for passcode');
    setError(true);
    setPasscode('');
    setLoading(false);
    return false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading || !passcode.trim()) return;
    validatePasscode(passcode);
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_authorized_user');
    setAuthorizedUser(null);
  };

  if (authorizedUser) {
    // Render children with user info
    const child = Array.isArray(children) ? children[0] : children;
    if (!child) return null;
    return cloneElement(child, { user: authorizedUser, onLogout: handleLogout });
  }

  return (
    <div className="gate-container bg-[#02040a] flex items-center justify-center min-h-screen">
      <div className="gate-card-wrapper w-full max-w-md p-4">
        <div className="professional-surface p-10 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden bg-slate-900/40 backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600"></div>
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-xl bg-blue-600/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-inner">
              <Shield className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-blue-100 mb-2">Staff Access</h2>
            <p className="text-sm text-blue-400/70 text-center px-4 leading-relaxed font-medium">
              Authorized personnel only. Please verify your identity using your assigned passcode.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] ml-1">Secure Passcode</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError(false);
                  }}
                  className={`w-full bg-black/40 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl p-5 text-lg font-mono tracking-widest outline-none focus:border-blue-500/40 transition-all text-blue-100 placeholder:text-blue-900/30`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-blue-500/50 hover:text-blue-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 mt-2 ml-1 uppercase tracking-wider animate-bounce">
                  <XCircle className="w-3.5 h-3.5" /> Access Denied: Invalid Passcode
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-black tracking-[0.2em] uppercase transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? (
                <>AUTHENTICATING <Loader2 className="w-4 h-4 animate-spin" /></>
              ) : (
                <>VALIDATE IDENTITY <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
