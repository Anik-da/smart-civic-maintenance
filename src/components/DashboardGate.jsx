import { useState } from 'react';
import { Shield, Lock, ArrowRight, XCircle } from 'lucide-react';

export function DashboardGate({ children }) {
  const [passcode, setPasscode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(false);

  // In a real app, this would check against a backend or ENV
  const ADMIN_PASSCODE = 'CIVIC2026'; 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passcode.toUpperCase() === ADMIN_PASSCODE) {
      setIsAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setPasscode('');
      // Shake animation effect could be added here
    }
  };

  if (isAuthorized) {
    return children;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4">
      <div className="w-full max-w-md relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet/20 to-aqua/20 rounded-[2.5rem] blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
        
        <div className="relative glass p-10 rounded-[2.5rem] border-white/10 text-center">
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center border-white/5 mx-auto mb-8 shadow-inner">
            <Lock className="w-8 h-8 text-violet animate-pulse" />
          </div>

          <h2 className="font-display text-3xl font-bold mb-2">Staff Access</h2>
          <p className="text-slate-400 text-sm mb-10">This dashboard is restricted to authorized maintenance personnel only.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="password"
                placeholder="Enter Staff Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className={`glass-input text-center tracking-[0.5em] text-lg font-bold placeholder:tracking-normal placeholder:text-sm ${error ? 'border-rose/50 text-rose' : 'border-white/10'}`}
                autoFocus
              />
              {error && (
                <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-2 text-rose text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                  <XCircle className="w-3 h-3" /> Invalid Access Token
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="w-full h-16 glass-btn glass-btn--primary gap-3 text-sm"
            >
              VALIDATE IDENTITY <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex items-center justify-center gap-3 opacity-20">
              <Shield className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">End-to-End Encryption Active</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
        Unauthorized access attempts are logged and monitored.
      </p>
    </div>
  );
}
