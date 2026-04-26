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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Clear old verifier to avoid "reCAPTCHA client element has been removed" error in React (especially during development/HMR)
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch(e) {}
      window.recaptchaVerifier = null;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'normal',
      'callback': (response) => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
      }
    });
    
    // Explicitly render it
    window.recaptchaVerifier.render()
      .then(() => {
        console.log("recaptcha ready");
      })
      .catch(console.error);

    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch(e) {}
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Auto-format to ensure +91 is present for Indian numbers
      let formattedPhone = phoneNumber.replace(/[^\d+]/g, '');
      if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      // Using exactly what you requested but with the formatted phone:
      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
    } catch (err) {
      console.error(err);
      setError('Failed to send verification code. ' + err.message);
      // Reset reCAPTCHA on error so they can try again
      if (window.recaptchaVerifier) {
         window.recaptchaVerifier.render().then(widgetId => {
           window.grecaptcha.reset(widgetId);
         });
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
      const user = result.user;
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error(err);
      setError('Invalid verification code. ' + err.message);
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
          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            <Phone className="w-4 h-4" />
            Send Code
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
