import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

interface Stop {
  id: number;
  name: string;
  description: string;
  stop_type: string;
  latitude: string;
  longitude: string;
  order: number;
}

interface Day {
  day_number: number;
  title: string;
  description: string;
  stops: Stop[];
}

interface ItineraryMapProps {
  days: Day[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060 // New York City as default center
};

const defaultZoom = 10;

// Define a color map for different stop types
const stopTypeColors: Record<string, string> = {
  food: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  activity: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  lodging: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  transport: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  default: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'
};

export default function ItineraryMap({ days, center, zoom }: ItineraryMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'maps'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [mapCenter, setMapCenter] = useState(center || defaultCenter);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);

  // Collect all stops from all days
  const allStops = days?.flatMap(day => day.stops) || [];

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Create bounds to contain all markers
    if (allStops.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      allStops.forEach(stop => {
        if (stop.latitude && stop.longitude) {
          bounds.extend({
            lat: parseFloat(stop.latitude),
            lng: parseFloat(stop.longitude)
          });
        }
      });
      
      map.fitBounds(bounds);
      setBounds(bounds);
      
      // If there's only one marker, zoom out a bit
      if (allStops.length === 1) {
        map.setZoom(13);
      }
    }
  }, [allStops]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (map && bounds) {
        google.maps.event.trigger(map, 'resize');
        map.fitBounds(bounds);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map, bounds]);

  // Set map center if passed as prop
  useEffect(() => {
    if (center && map) {
      map.setCenter(center);
    }
  }, [center, map]);

  // Get color based on stop type
  const getMarkerIcon = (stopType: string) => {
    return stopTypeColors[stopType.toLowerCase()] || stopTypeColors.default;
  };

  return isLoaded ? (
    <div className="w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom || defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative'
        }}
      >
        {/* Render markers for all stops */}
        {allStops.map((stop) => {
          if (!stop.latitude || !stop.longitude) return null;
          
          const position = {
            lat: parseFloat(stop.latitude),
            lng: parseFloat(stop.longitude)
          };
          
          return (
            <Marker
              key={stop.id}
              position={position}
              onClick={() => setSelectedStop(stop)}
              icon={getMarkerIcon(stop.stop_type)}
              label={{
                text: `${stop.order}`,
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          );
        })}

        {/* Info window for selected stop */}
        {selectedStop && (
          <InfoWindow
            position={{
              lat: parseFloat(selectedStop.latitude),
              lng: parseFloat(selectedStop.longitude)
            }}
            onCloseClick={() => setSelectedStop(null)}
          >
            <div className="p-2">
              <h3 className="font-semibold">{selectedStop.name}</h3>
              <p className="text-sm text-gray-600">{selectedStop.stop_type}</p>
              {selectedStop.description && (
                <p className="text-sm mt-1">{selectedStop.description}</p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="text-xs flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Food</span>
        </div>
        <div className="text-xs flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Activity</span>
        </div>
        <div className="text-xs flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Lodging</span>
        </div>
        <div className="text-xs flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Transport</span>
        </div>
        <div className="text-xs flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span>Other</span>
        </div>
      </div>
    </div>
  ) : (
    <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  );
} 
