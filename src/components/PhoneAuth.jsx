import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from '../lib/firebase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Phone, Lock, ShieldCheck } from 'lucide-react';

export function PhoneAuth({ onLoginSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const initRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch (e) {}
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal',
      callback: () => {},
      'expired-callback': () => {}
    });
    window.recaptchaVerifier.render().catch(console.error);
  };

  useEffect(() => {
    const t = setTimeout(() => initRecaptcha(), 500);
    return () => {
      clearTimeout(t);
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (cooldown > 0 || isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      initRecaptcha();
      await new Promise(r => setTimeout(r, 500));
      let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
      if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }
      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setCooldown(30);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requests-to-this-api-identitytoolkit-method-google.cloud.identitytoolkit.v1.AuthenticationService.getRecaptchaParam-are-blocked') {
        setError("Firebase Configuration Error: Please enable 'Identity Toolkit API' in Google Cloud Console.");
      } else {
        setError(err.message || "Failed to send code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    } catch (err) {
      console.error(err);
      setError("Invalid OTP. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 pb-20">
      <header className="hero mb-12">
        <span className="hero__kicker">Pure CSS · Glassmorphism · Liquid Glass</span>
        <h1 className="hero__title">
          Liquid Glass<br />
          UI Kit
        </h1>
        <p className="hero__sub">
          Complete design token system, 15+ accessible components, light/dark mode, 12 animations — zero dependencies.
        </p>
      </header>

      <div className="w-full max-w-md relative group">
        {/* Decorative elements */}
        <div className="absolute -inset-1 bg-gradient-to-r from-aqua/20 to-violet/20 rounded-[2.2rem] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        
        <Card className="relative w-full animate-in fade-in zoom-in-95 delay-500 duration-1000" title={!confirmationResult ? "OPERATOR AUTH" : "VERIFY IDENTITY"}>
          {!confirmationResult ? (
            <form onSubmit={handleSendCode} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-2">Phone Identifier</label>
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
              
              <div id="recaptcha-container" className="flex justify-center overflow-hidden rounded-xl border border-white/5 bg-white/5 min-h-[78px] items-center">
                <span className="text-[10px] opacity-20 italic">Security Check Loading...</span>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed animate-in slide-in-from-top-4">
                   ⚠️ {error}
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full h-16 text-md" isLoading={isLoading} disabled={cooldown > 0}>
                {cooldown > 0 ? `RESEND CODE (${cooldown}s)` : 'REQUEST ACCESS TOKEN'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] ml-2">6-Digit Token</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input
                    type="text"
                    placeholder="0 0 0 0 0 0"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    maxLength={6}
                    className="glass-input pl-12 tracking-[0.8em] font-black text-xl text-center"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold animate-in slide-in-from-top-4">
                   {error}
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full h-16 text-md" isLoading={isLoading}>
                INITIALIZE SESSION
              </Button>
              
              <button
                type="button"
                onClick={() => { setConfirmationResult(null); setError(''); }}
                className="w-full text-center text-[10px] font-black opacity-30 hover:opacity-100 hover:text-aqua transition-all uppercase tracking-widest"
              >
                ← Switch Number
              </button>
            </form>
          )}
        </Card>
      </div>
      
      {/* Stats block from Liquid Glass UI */}
      <div className="container stats mt-12">
        <div className="glass stats__item">
          <div className="stats__num">15+</div>
          <div className="stats__desc">Components</div>
        </div>
        <div className="glass stats__item">
          <div className="stats__num">12</div>
          <div className="stats__desc">Animations</div>
        </div>
        <div className="glass stats__item">
          <div className="stats__num">a11y</div>
          <div className="stats__desc">WCAG Compliant</div>
        </div>
      </div>
    </div>
  );
}

function AuthStat({ value, label, color }) {
  return (
    <div className="text-center group">
      <div className={`text-xl font-black tracking-tighter text-${color} group-hover:scale-110 transition-transform`}>{value}</div>
      <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 mt-1">{label}</div>
    </div>
  );
}
