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
    <button
      onClick={handleEmergency}
      disabled={isRequesting}
      className="fixed bottom-8 right-8 w-20 h-20 bg-gradient-to-br from-red-500 to-rose-700 rounded-full flex flex-col items-center justify-center text-white font-extrabold text-xs border-2 border-red-400/50 hover:scale-110 active:scale-95 transition-all z-50 pulse-glow disabled:opacity-50 disabled:animate-none cursor-pointer"
    >
      <AlertTriangle className="w-7 h-7 mb-0.5" />
      SOS
    </button>
  );
}
