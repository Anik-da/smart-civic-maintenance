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

  // Cooldown timer
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
    // Small delay to ensure DOM element exists
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
      console.log("Starting OTP process for:", phoneNumber);
      
      // Re-init recaptcha before each attempt
      initRecaptcha();
      await new Promise(r => setTimeout(r, 500)); // let it render properly
      
      console.log("Recaptcha initialized and rendered");

      let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
      if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }
      
      console.log("Formatted Phone:", formattedPhone);
      console.log("Calling signInWithPhoneNumber...");

      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      
      console.log("signInWithPhoneNumber success!", result);
      setConfirmationResult(result);
      alert("OTP sent successfully!");
      setCooldown(30);
    } catch (err) {
      console.error("FULL ERROR OBJECT:", err);
      setError(err.message || "Failed to send code");
      alert("Error: " + (err.message || "Unknown error"));
    } finally {
      console.log("OTP process finished (loading off)");
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      alert("Login successful!");
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
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-md w-full" title={!confirmationResult ? "Welcome Back" : "Verify OTP"}>
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center">
            {!confirmationResult ? (
              <Phone className="w-7 h-7 text-purple-400" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            )}
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mb-8">
          {!confirmationResult 
            ? "Enter your phone number to receive a verification code" 
            : "Enter the 6-digit code sent to your phone"}
        </p>

        {!confirmationResult ? (
          <form onSubmit={handleSendCode} className="space-y-5">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 9999999999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              error={error}
            />
            <div id="recaptcha-container" className="flex justify-center my-4"></div>
            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} disabled={cooldown > 0}>
              <Phone className="w-4 h-4" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <Input
              label="Verification Code"
              type="text"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              error={error}
              maxLength={6}
            />
            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              <Lock className="w-4 h-4" />
              Verify & Login
            </Button>
            <button
              type="button"
              onClick={() => { setConfirmationResult(null); setError(''); }}
              className="w-full text-center text-sm text-slate-400 hover:text-purple-400 transition-colors py-2"
            >
              ← Change phone number
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
