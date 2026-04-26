import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from '../lib/firebase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Phone, Lock } from 'lucide-react';

export function PhoneAuth({ onLoginSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
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
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'normal'
    });
  };

  useEffect(() => {
    initRecaptcha();
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
      }
    };
  }, []);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (cooldown > 0 || isLoading) return;
    
    setError('');
    setIsLoading(true);

    try {
      // reset old verifier (prevents silent failures)
      initRecaptcha();

      let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
      if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      alert("OTP sent");
      
      // cooldown (avoid spam → avoids block)
      setCooldown(30);
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert(err.message);
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
      alert("Login success");
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    } catch (err) {
      console.error(err);
      setError("Invalid OTP");
      alert("Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full mx-auto" title={!confirmationResult ? "Login" : "Verify Phone"}>
      {!confirmationResult ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 9999999999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            error={error}
          />
          {/* Visible recaptcha container */}
          <div id="recaptcha-container" className="flex justify-center my-4"></div>
          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} disabled={cooldown > 0}>
            <Phone className="w-4 h-4" />
            {cooldown > 0 ? `Wait ${cooldown}s` : 'Send Code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <Input
            label="Verification Code"
            type="text"
            placeholder="123456"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
            error={error}
          />
          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            <Lock className="w-4 h-4" />
            Verify Code
          </Button>
        </form>
      )}
    </Card>
  );
}
