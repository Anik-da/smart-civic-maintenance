import { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, HeatmapLayer, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '1rem'
};

const defaultCenter = {
  lat: 12.9716, // Default to Bangalore (context)
  lng: 77.5946
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  gestureHandling: 'greedy',
  scrollwheel: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
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

const libraries = ['visualization'];

export function DashboardMap({ complaints, onComplaintClick }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const center = useMemo(() => {
    if (complaints.length > 0 && complaints[0].location) {
      return complaints[0].location;
    }
    return defaultCenter;
  }, [complaints]);

  const heatmapData = useMemo(() => {
    if (!isLoaded || !window.google) return [];
    return complaints
      .filter(c => c.location && c.location.lat && c.location.lng)
      .map(c => ({
        location: new window.google.maps.LatLng(c.location.lat, c.location.lng),
        weight: c.priority === 'High' ? 3 : c.priority === 'Medium' ? 2 : 1
      }));
  }, [complaints, isLoaded]);

  if (!isLoaded) return <div className="h-[600px] flex items-center justify-center rounded-xl neu-inset">Loading Map...</div>;

  return (
    <div className="professional-surface p-1 rounded-2xl overflow-hidden h-[600px] border border-white/5 shadow-2xl relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        options={{
          ...mapOptions,
          gestureHandling: 'greedy', // Explicitly ensure greedy handling
          zoomControlOptions: {
            position: window.google?.maps?.ControlPosition?.RIGHT_CENTER
          }
        }}
      >
        {heatmapData.length > 0 && (
          <HeatmapLayer
            data={heatmapData}
            options={{
              radius: 40,
              opacity: 0.6,
              gradient: [
                'rgba(0, 255, 255, 0)',
                'rgba(0, 255, 255, 1)',
                'rgba(0, 191, 255, 1)',
                'rgba(0, 127, 255, 1)',
                'rgba(0, 63, 255, 1)',
                'rgba(0, 0, 255, 1)',
                'rgba(0, 0, 223, 1)',
                'rgba(0, 0, 191, 1)',
                'rgba(0, 0, 159, 1)',
                'rgba(0, 0, 127, 1)',
                'rgba(63, 0, 91, 1)',
                'rgba(127, 0, 63, 1)',
                'rgba(191, 0, 31, 1)',
                'rgba(255, 0, 0, 1)'
              ]
            }}
          />
        )}
        
        {complaints.map(complaint => (
          complaint.location && complaint.location.lat ? (
            <Marker
              key={complaint.id}
              position={complaint.location}
              onClick={() => onComplaintClick(complaint)}
              icon={{
                url: complaint.priority === 'High' 
                  ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                  : complaint.priority === 'Medium'
                  ? 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                  : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
              }}
            />
          ) : null
        ))}
      </GoogleMap>
    </div>
  );
}
