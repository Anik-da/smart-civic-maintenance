import { useState, useEffect, cloneElement, Children } from 'react';
import { Shield, Lock, ArrowRight, XCircle, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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
  const [isResetMode, setIsResetMode] = useState(false);
  const [customRole, setCustomRole] = useState('ADMIN');
  const [showPasscode, setShowPasscode] = useState(false);

  // Persistence check
  useEffect(() => {
    console.log('[DashboardGate] Checking for saved session...');
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
    console.log('[DashboardGate] Authorizing user:', userData.name, userData.role);
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
    
    const input = code.trim().toUpperCase();
    console.log('[DashboardGate] Validating passcode:', input ? '***' : 'EMPTY');
    
    try {
      const staffRef = collection(db, 'staff');
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
        authorizeUser(found);
        return true;
      }
    } catch (err) {
      console.warn('[Auth] Firestore error:', err.message);
    }

    const localMatch = checkLocalFallback(input);
    if (localMatch) {
      authorizeUser(localMatch);
      return true;
    }

    setError(true);
    setLoading(false);
    return false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading || !passcode.trim()) return;
    validatePasscode(passcode);
  };

  const handleCustomAccess = (e) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setLoading(true);
    
    const customUser = {
      name: `User (${customRole})`,
      role: customRole,
      department: customRole === 'ADMIN' ? 'ADMIN' : 'GENERAL',
      passcode: passcode.trim()
    };
    
    authorizeUser(customUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_authorized_user');
    setAuthorizedUser(null);
  };

  if (authorizedUser) {
    console.log('[DashboardGate] Rendering Dashboard for:', authorizedUser.name);
    const child = Array.isArray(children) ? children[0] : children;
    if (!child) {
      console.error('[DashboardGate] No child element provided!');
      return null;
    }
    return cloneElement(child, { user: authorizedUser, onLogout: handleLogout });
  }

  console.log('[DashboardGate] Rendering Login Gate...');

  return (
    <div className="gate-container bg-[#02040a] flex items-center justify-center min-h-screen">
      <div className="gate-card-wrapper w-full max-w-2xl p-4">
        <div className="professional-surface p-12 rounded-md border border-white/5 shadow-2xl relative overflow-hidden bg-slate-900/40 backdrop-blur-md">
          <button 
            onClick={() => isResetMode ? setIsResetMode(false) : window.history.back()} 
            className="absolute top-8 left-8 text-blue-500/40 hover:text-blue-500 transition-colors z-10"
            title="Go Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          {/* Top Edge Highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80"></div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-md bg-blue-600/10 flex items-center justify-center mb-6 border border-blue-500/20 shadow-inner">
              <Shield className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-blue-100 mb-2">
              {isResetMode ? 'Custom Access' : 'Staff Access'}
            </h2>
            <p className="text-sm text-blue-400/70 text-center px-4 leading-relaxed font-medium">
              {isResetMode 
                ? 'Create a new passcode and choose your role to bypass standard login.' 
                : 'Authorized personnel only. Please verify your identity using your assigned passcode.'}
            </p>
          </div>

          <form onSubmit={isResetMode ? handleCustomAccess : handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] ml-1">
                {isResetMode ? 'New Passcode' : 'Secure Passcode'}
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? "text" : "password"}
                  placeholder="ADMIN2026"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError(false);
                  }}
                  className={`w-full bg-black/40 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-md p-5 text-lg font-mono tracking-wider outline-none focus:border-blue-500/40 transition-all text-blue-100 placeholder:text-blue-900/30 pr-14`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500/50 hover:text-blue-400 transition-colors"
                  title={showPasscode ? "Hide Passcode" : "Show Passcode"}
                >
                  {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {isResetMode && (
                <div className="space-y-3 mt-4">
                  <label className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] ml-1">Access Role</label>
                  <select 
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-md p-5 text-blue-100 outline-none focus:border-blue-500/40 transition-all appearance-none cursor-pointer"
                  >
                    <option value="ADMIN" className="bg-slate-900 text-white">Login as Admin</option>
                    <option value="WORKER" className="bg-slate-900 text-white">Login as Worker</option>
                  </select>
                </div>
              )}

              {error && !isResetMode && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 mt-2 ml-1 uppercase tracking-wider animate-bounce">
                  <XCircle className="w-3.5 h-3.5" /> Access Denied: Invalid Passcode
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-black tracking-[0.2em] uppercase transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <>AUTHORIZING <Loader2 className="w-4 h-4 animate-spin" /></>
                ) : (
                  <>{isResetMode ? 'GRANT ACCESS' : 'VALIDATE IDENTITY'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {!isResetMode && (
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="w-full py-2 text-xs font-bold text-blue-500/60 hover:text-blue-400 transition-colors uppercase tracking-widest"
                >
                  Forgot Passcode?
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
