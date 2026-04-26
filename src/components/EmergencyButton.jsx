import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { requestNotificationPermission } from '../lib/fcm';
import { AlertTriangle } from 'lucide-react';

export function EmergencyButton({ user }) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEmergency = async () => {
    if (isRequesting) return;
    
    if (user) {
      await requestNotificationPermission(user.uid);
    }

    setIsRequesting(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await addDoc(collection(db, 'emergencies'), {
              userId: user.uid,
              phone: user.phoneNumber,
              location: { lat: position.coords.latitude, lng: position.coords.longitude },
              status: 'Requested',
              createdAt: serverTimestamp()
            });
            alert('Emergency services have been requested and notified of your location!');
          } catch (error) {
            console.error('Failed to trigger emergency:', error);
            alert('Failed to send emergency request. Please call emergency services directly!');
          } finally {
            setIsRequesting(false);
          }
        },
        (error) => {
          console.error("Location error:", error);
          alert("We need your location for emergencies. Please allow location access.");
          setIsRequesting(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
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
    </div>
  );
}
