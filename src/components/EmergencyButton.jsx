import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { requestNotificationPermission } from '../lib/fcm';
import { AlertTriangle } from 'lucide-react';

export function EmergencyButton({ user, variant = 'floating' }) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEmergency = async () => {
    if (isRequesting) return;
    
    // Attempt to request notification permission if user is logged in
    if (user) {
      try {
        await requestNotificationPermission(user.uid);
      } catch (e) {
        console.warn("FCM permission denied or failed:", e);
      }
    }

    setIsRequesting(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const emergencyDoc = {
              userId: user?.uid || 'anonymous',
              phone: user?.phoneNumber || 'not provided',
              location: { 
                lat: position.coords.latitude, 
                lng: position.coords.longitude 
              },
              status: 'Requested',
              createdAt: serverTimestamp(),
              priority: 'Critical',
              type: 'SOS'
            };

            await addDoc(collection(db, 'emergencies'), emergencyDoc);
            
            // Create a local notification/alert
            alert('🚨 EMERGENCY ALERT BROADCAST! Emergency services have been notified of your precise location. Please stay where you are.');
          } catch (error) {
            console.error('Failed to trigger emergency via Firebase:', error);
            alert('⚠️ Connection Error: Emergency signal could not be broadcast. Please call local emergency services immediately.');
          } finally {
            setIsRequesting(false);
          }
        },
        (error) => {
          console.error("Location error:", error);
          let msg = "We need your location for emergencies. Please enable GPS.";
          if (error.code === 1) msg = "Location access denied. Please enable it in browser settings for emergencies.";
          alert(msg);
          setIsRequesting(false);
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert("Geolocation is not supported by your browser. Please call emergency services directly.");
      setIsRequesting(false);
    }
  };

  if (variant === 'sidebar') {
    return (
      <button 
        onClick={handleEmergency}
        disabled={isRequesting}
        className="tab-btn group bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 mt-6 mb-4 ring-1 ring-rose-500/20"
      >
        <div className="tab-icon bg-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
          <AlertTriangle className={`w-5 h-5 ${isRequesting ? 'animate-ping' : 'animate-pulse'}`} />
        </div>
        <div className="tab-text text-left">
          <div className="tab-title text-rose-100">EMERGENCY SOS</div>
          <div className="tab-subtitle text-rose-400/80 font-black">CRITICAL ACTIONS</div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleEmergency}
      disabled={isRequesting}
      className="glass glass-btn animate-liquid flex flex-col items-center justify-center w-24 h-24 shadow-2xl border-rose/30 group"
      style={{ 
        background: 'rgba(247, 168, 196, 0.15)', 
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(247, 168, 196, 0.3)'
      }}
    >
      <div className="absolute inset-0 bg-rose/10 animate-pulse rounded-full" style={{ background: 'rgba(247, 168, 196, 0.05)' }}></div>
      <AlertTriangle className="w-8 h-8 text-rose mb-1 group-hover:scale-125 transition-transform" style={{ color: '#f7a8c4' }} />
      <span className="text-[10px] font-black tracking-[0.2em] text-rose" style={{ color: '#f7a8c4' }}>SOS</span>
    </button>
  );
}
