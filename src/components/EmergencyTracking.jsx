import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Card } from './ui/Card';
import { AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '450px',
  borderRadius: '1.5rem'
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#2d3844" }]
    }
  ]
};

export function EmergencyTracking({ user }) {
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyBw8DmV3BAThWLFBlR5TBMO6VGC7IuOnuY",
    libraries: ['visualization']
  });

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'emergencies'),
      where('userId', '==', user.uid),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const emergencyData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
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
        return { 
          text: 'Establishing Signal...', 
          icon: <Loader2 className="w-6 h-6 text-amber animate-spin" />, 
          badge: 'glass-badge--amber'
        };
      case 'Dispatched':
        return { 
          text: 'Responder En Route', 
          icon: <AlertCircle className="w-6 h-6 text-aqua animate-pulse" />, 
          badge: 'glass-badge--aqua'
        };
      case 'Arrived':
        return { 
          text: 'Unit On Scene', 
          icon: <ShieldCheck className="w-6 h-6 text-lime" />, 
          badge: 'glass-badge--lime'
        };
      default:
        return { 
          text: 'Emergency Active', 
          icon: <AlertCircle className="w-6 h-6 text-rose" />, 
          badge: 'glass-badge--rose'
        };
    }
  };

  if (!activeEmergency) return null;

  const statusInfo = getStatusDisplay(activeEmergency.status);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#0b0e1a]/95 backdrop-blur-2xl animate-in fade-in duration-500 overflow-y-auto emergency-modal">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="scene__blob scene__blob--1 opacity-10"></div>
         <div className="scene__blob scene__blob--2 opacity-10"></div>
      </div>

      <Card className="w-full max-w-2xl glass border-rose/30 shadow-[0_0_100px_rgba(247,168,196,0.3)] animate-in zoom-in-95 duration-700 relative z-[1001]" title="SOS TRACKING">
        <div className="flex flex-col items-center gap-6 mb-8 text-center">
          <div className="w-20 h-20 rounded-full glass flex items-center justify-center border-rose/30 relative">
             <div className="absolute inset-0 bg-rose/10 animate-ping rounded-full"></div>
             {statusInfo.icon}
          </div>
          <div>
            <span className={`glass-badge ${statusInfo.badge} mb-3 text-sm px-4 py-1.5`}>{activeEmergency.status}</span>
            <h3 className="hero__title" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{statusInfo.text}</h3>
            <p className="text-base opacity-70 font-medium">Keep this interface open. Your GPS coordinates are being broadcast to emergency services.</p>
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden border-white/5 shadow-inner">
          {isLoaded && activeEmergency.location ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={activeEmergency.location}
              zoom={16}
              options={mapOptions}
            >
              <Marker 
                position={activeEmergency.location}
                icon={{
                  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                  fillColor: "#f7a8c4",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "#fff",
                  scale: 2
                }}
              />
            </GoogleMap>
          ) : (
            <div className="w-full h-[450px] flex flex-col items-center justify-center gap-4 opacity-40 font-bold tracking-widest text-[12px]">
              <Loader2 className="w-10 h-10 animate-spin" />
              SYNCHRONIZING ORBITAL DATA...
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center px-2">
           <div>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-1">Target Location</p>
              <p className="text-sm font-mono text-aqua">{activeEmergency.location?.lat.toFixed(6)}, {activeEmergency.location?.lng.toFixed(6)}</p>
           </div>
           <button 
             disabled={isCancelling}
             onClick={async (e) => {
               e.stopPropagation(); // Prevent modal background clicks
               if (!activeEmergency?.id) {
                 console.error("No active emergency ID found");
                 return;
               }
               setIsCancelling(true);
               console.log("Cancelling emergency:", activeEmergency.id);
               try {
                 const emergencyRef = doc(db, 'emergencies', activeEmergency.id);
                 await updateDoc(emergencyRef, {
                   status: 'Resolved',
                   resolvedAt: new Date()
                 });
                 console.log("Emergency resolved successfully");
                 // The onSnapshot in useEffect will pick up this change
                 // and set activeEmergency to null, which closes the modal.
                 // Force local clear if needed
                 setTimeout(() => setActiveEmergency(null), 500);
               } catch (err) {
                 console.error("Failed to cancel alert:", err);
                 alert("Could not cancel alert: " + err.message);
               } finally {
                 setIsCancelling(false);
               }
             }}
             className="glass glass-btn glass-btn--sm border-rose/20 text-rose min-w-[160px] h-14 text-sm font-bold tracking-widest flex items-center justify-center gap-2 relative z-[1010] hover:bg-rose/10" 
             style={{ color: '#f7a8c4' }}
           >
              {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isCancelling ? 'PROCESSING...' : 'CANCEL ALERT'}
           </button>
        </div>
      </Card>
    </div>
  );
}
