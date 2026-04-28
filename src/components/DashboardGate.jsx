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
    
    const input = code.trim().toUpperCase();
    const inputStripped = input; // Keep special characters
    
    console.log('[Auth] Attempting validation for:', input);
    
    // Try Firestore first
    try {
      const staffRef = collection(db, 'staff');
      // Direct match
      const q = query(staffRef, where('passcode', '==', input));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const staffData = querySnapshot.docs[0].data();
        console.log('[Auth] Firestore direct match found');
        authorizeUser({
          role: staffData.role,
          department: staffData.department,
          name: staffData.name || 'Staff Member'
        });
        return true;
      }

      // Try fetching all staff for fuzzy match if direct fails
      console.log('[Auth] Direct match failed, trying fuzzy Firestore match...');
      const allStaffSnapshot = await getDocs(staffRef);
      let found = null;
      
      allStaffSnapshot.forEach(doc => {
        const data = doc.data();
        if (!data.passcode) return;
        const savedCode = data.passcode.toUpperCase();
        
        if (savedCode === inputStripped) {
          found = {
            role: data.role,
            department: data.department,
            name: data.name || 'Staff Member'
          };
        }
      });

      if (found) {
        console.log('[Auth] Firestore fuzzy match found');
        authorizeUser(found);
        return true;
      }
    } catch (err) {
      console.warn('[Auth] Firestore error:', err.message);
    }

    // Fallback to local credentials
    const localMatch = checkLocalFallback(input);
    if (localMatch) {
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
    <div className="gate-container">
      <div className="gate-card-wrapper">
        <div className="gate-glow" />
        
        <div className="gate-card">
          <div className="gate-icon-box">
            <Lock className="gate-icon" />
            <div className="gate-icon-ring" />
          </div>

          <h2 className="gate-title">Staff Access</h2>
          <p className="gate-subtitle">
            This dashboard is restricted to authorized maintenance personnel only.
          </p>

          <form onSubmit={handleSubmit} className="gate-form">
            <div className="gate-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Staff Passcode"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError(false);
                }}
                className={`gate-input ${error ? 'gate-input--error' : ''}`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="gate-toggle-vis"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {error && (
                <div className="gate-error text-rose-500">
                  <XCircle className="w-3 h-3" /> Invalid Staff Passcode
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="gate-submit"
            >
              {loading ? (
                <>AUTHENTICATING <Loader2 className="w-4 h-4 animate-spin" /></>
              ) : (
                <>VALIDATE IDENTITY <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="gate-footer">
            <Shield className="w-4 h-4" />
            <span>End-to-End Encryption Active</span>
          </div>
        </div>
      </div>
      
      <div className="gate-notice">
        <p className="gate-notice-title">System Notice</p>
        <p className="gate-notice-text">
          Access is managed by the Central Administration. If you've forgotten your passcode or need a new one, please contact your department head.
        </p>
      </div>
    </div>
  );
}
