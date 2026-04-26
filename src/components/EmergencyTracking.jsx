import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Card } from './ui/Card';
import { AlertCircle, Clock, ShieldCheck } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '1rem'
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
};

export function EmergencyTracking({ user }) {
  const [activeEmergency, setActiveEmergency] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyBw8DmV3BAThWLFBlR5TBMO6VGC7IuOnuY"
  });

  useEffect(() => {
    if (!user) return;

    // Listen to the most recent emergency for the user
    const q = query(
      collection(db, 'emergencies'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const emergencyData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        // If it's been arrived/resolved for a long time, we might hide this, but for now show if active
        if (emergencyData.status !== 'Resolved') {
          setActiveEmergency(emergencyData);
        } else {
          setActiveEmergency(null);
        }
      } else {
        setActiveEmergency(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Requested':
        return { text: 'Locating Responders...', icon: <Clock className="w-6 h-6 text-yellow-500 animate-spin" />, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' };
      case 'Dispatched':
        return { text: 'Responder Dispatched!', icon: <AlertCircle className="w-6 h-6 text-blue-500 animate-bounce" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' };
      case 'Arrived':
        return { text: 'Responders Arrived', icon: <ShieldCheck className="w-6 h-6 text-green-500" />, color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' };
      default:
        return { text: 'Emergency Active', icon: <AlertCircle className="w-6 h-6 text-red-500" />, color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' };
    }
  };

  if (!activeEmergency) return null;

  const statusInfo = getStatusDisplay(activeEmergency.status);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in" title="Live Emergency Tracking">
        <div className={`flex items-center gap-4 p-4 rounded-xl mb-6 ${statusInfo.color}`}>
          {statusInfo.icon}
          <div>
            <h3 className="font-bold text-lg">{statusInfo.text}</h3>
            <p className="text-sm opacity-80">Do not close this window. Help is on the way.</p>
          </div>
        </div>

        {isLoaded && activeEmergency.location ? (
          <div className="neu-inset rounded-xl p-2 mb-4">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={activeEmergency.location}
              zoom={15}
              options={mapOptions}
            >
              <Marker position={activeEmergency.location} />
              
              {/* Optional: Add a simulated responder marker if status is Dispatched */}
              {activeEmergency.status === 'Dispatched' && (
                <Marker 
                  position={{
                    lat: activeEmergency.location.lat + 0.005, // simulated offset
                    lng: activeEmergency.location.lng + 0.005
                  }}
                  icon={{
                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  }}
                />
              )}
            </GoogleMap>
          </div>
        ) : (
          <div className="w-full h-[300px] rounded-xl neu-inset flex items-center justify-center text-gray-500">
            Loading Map...
          </div>
        )}
      </Card>
    </div>
  );
}
