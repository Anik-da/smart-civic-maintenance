import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { requestNotificationPermission } from '../lib/fcm';
import { AlertTriangle } from 'lucide-react';

export function EmergencyButton({ user }) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEmergency = async () => {
    if (isRequesting) return;
    
    // 1. Request Notification Permissions so they can be alerted
    if (user) {
      await requestNotificationPermission(user.uid);
    }

    setIsRequesting(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            await addDoc(collection(db, 'emergencies'), {
              userId: user.uid,
              phone: user.phoneNumber,
              location,
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
      className="fixed bottom-8 right-8 w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-[0_10px_25px_rgba(239,68,68,0.5)] flex flex-col items-center justify-center text-white font-bold text-sm border-4 border-red-400 hover:scale-105 active:scale-95 transition-all z-50 animate-pulse disabled:opacity-50 disabled:animate-none"
    >
      <AlertTriangle className="w-8 h-8 mb-1" />
      HELP
    </button>
  );
}
