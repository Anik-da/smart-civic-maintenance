import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Phone, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export function PhoneAuth({ onLogin }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaStatus, setCaptchaStatus] = useState('pending'); // pending, verified, error
  const recaptchaRef = useRef(null);
  const confirmationResultRef = useRef(null);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'normal',
          'callback': (response) => {
            setCaptchaStatus('verified');
            console.log("reCAPTCHA verified");
          },
          'expired-callback': () => {
            setCaptchaStatus('pending');
            setError('reCAPTCHA expired. Please try again.');
          }
        });

        window.recaptchaVerifier.render();
      } catch (err) {
        console.error("Recaptcha setup error:", err);
      }
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    
    if (captchaStatus !== 'verified') {
      setError("Please complete the reCAPTCHA verification first.");
      return;
    }

    let formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    setIsLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      confirmationResultRef.current = confirmationResult;
      setShowOtp(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Phone Auth Error:", err);
      setError(err.message || "Failed to send OTP. Check phone number format.");
      setIsLoading(false);
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => {
          grecaptcha.reset(widgetId);
        });
        setCaptchaStatus('pending');
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const result = await confirmationResultRef.current.confirm(otp);
      const user = result.user;
      if (onLogin) {
        onLogin(user.phoneNumber);
      }
    } catch (err) {
      console.error("OTP Error:", err);
      setError("Invalid OTP. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-10 w-full">
      <div className="w-full max-w-lg relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-[2.2rem] blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
        
        <Card className="relative w-full animate-in fade-in zoom-in-95 duration-700 p-2" title="CITIZEN LOGIN">
          {!showOtp ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-base opacity-60">Enter your phone number to access the Smart Civic Maintenance portal</p>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-black opacity-30 uppercase tracking-[0.2em] ml-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
                  <input
                    type="tel"
                    placeholder="99999 99999"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="glass-input pl-12 text-base h-14"
                  />
                </div>
              </div>
              
              <div className="flex justify-center py-4">
                <div id="recaptcha-container" className="rounded-xl overflow-hidden border border-white/10 shadow-lg"></div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose/10 border border-rose/20 text-rose text-[11px] font-bold leading-relaxed flex items-center gap-2">
                   <XCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full h-16 text-base bg-blue-600 hover:bg-blue-500 border-blue-400/30" 
                isLoading={isLoading} 
                disabled={captchaStatus !== 'verified'}
              >
                SEND VERIFICATION CODE
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="text-center mb-4">
                <p className="text-sm opacity-60">We've sent a 6-digit code to <b>{phoneNumber}</b></p>
                <button type="button" onClick={() => setShowOtp(false)} className="text-[10px] text-aqua uppercase font-black tracking-widest mt-2 hover:underline">Change Number</button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-2">Verification Code</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="glass-input pl-12 text-center tracking-[1em] text-lg font-bold"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose/10 border border-rose/20 text-rose text-[11px] font-bold leading-relaxed flex items-center gap-2">
                   <XCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full h-16 text-sm" isLoading={isLoading}>
                VERIFY & CONTINUE
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
