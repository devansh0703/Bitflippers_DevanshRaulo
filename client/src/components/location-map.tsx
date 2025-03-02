import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMapProps {
  location?: { lat: number; lng: number };
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  isInteractive?: boolean;
}

export default function LocationMap({ location, onLocationUpdate, isInteractive = true }: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([0, 0], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      if (isInteractive) {
        mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          if (onLocationUpdate) {
            onLocationUpdate({ lat, lng });
          }
          updateMarker({ lat, lng });
        });
      }
    }

    // Update map with location if provided
    if (location) {
      mapRef.current.setView([location.lat, location.lng], 13);
      updateMarker(location);
    } else if (isInteractive) {
      // Get user's current location if no location provided
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          mapRef.current?.setView([currentLocation.lat, currentLocation.lng], 13);
          updateMarker(currentLocation);
          if (onLocationUpdate) {
            onLocationUpdate(currentLocation);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const updateMarker = (position: { lat: number; lng: number }) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([position.lat, position.lng]);
    } else {
      markerRef.current = L.marker([position.lat, position.lng]).addTo(mapRef.current!);
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div id="map" className="h-[400px] w-full" />
    </Card>
  );
}
