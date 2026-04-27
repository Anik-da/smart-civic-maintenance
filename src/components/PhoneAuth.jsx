import { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Phone, ShieldCheck } from 'lucide-react';

export function PhoneAuth({ onLogin }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaStatus, setCaptchaStatus] = useState('pending');

  const handleSimulateLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    
    let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
    if (formattedPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsLoading(true);
    setCaptchaStatus('checking');

    setTimeout(() => {
      setCaptchaStatus('verified');
      setTimeout(() => {
        setIsLoading(false);
        if (onLogin) {
          onLogin(phoneNumber);
        }
      }, 800);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 pb-20">
      <div className="w-full max-w-md relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-aqua/20 to-violet/20 rounded-[2.2rem] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        
        <Card className="relative w-full animate-in fade-in zoom-in-95 delay-500 duration-1000" title="CITIZEN LOGIN">
          <form onSubmit={handleSimulateLogin} className="space-y-8">
            <div className="text-center mb-4">
              <p className="text-sm opacity-60">Enter your phone number to access the Smart Civic Maintenance portal</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input
                  type="tel"
                  placeholder="+91 000 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="glass-input pl-12"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center rounded-xl border border-white/5 bg-white/5 min-h-[78px] px-6">
              <div className="flex items-center gap-3">
                {captchaStatus === 'pending' && <div className="w-6 h-6 rounded border-2 border-white/20" />}
                {captchaStatus === 'checking' && <div className="w-6 h-6 rounded border-2 border-aqua/50 border-t-aqua animate-spin" />}
                {captchaStatus === 'verified' && <ShieldCheck className="w-6 h-6 text-lime" />}
                <span className="text-xs font-semibold opacity-70">
                  {captchaStatus === 'pending' ? "I'm not a robot" : captchaStatus === 'checking' ? "Verifying..." : "Verified ✓"}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-8 h-8 opacity-20 mb-1" />
                <span className="text-[8px] opacity-30 uppercase tracking-wider font-black">reCAPTCHA</span>
                <span className="text-[7px] opacity-20 uppercase">Privacy · Terms</span>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed">
                 ⚠️ {error}
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full h-16 text-md" isLoading={isLoading}>
              {captchaStatus === 'verified' ? 'LOGGING IN...' : 'LOGIN TO PORTAL'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
