import { useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSimulatorStore } from '../../store/simulatorStore';
import { useGeocoding } from '../../hooks/useGeocoding';
import { SunVector } from './SunVector';
import { MapErrorBoundary } from './MapErrorBoundary';

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapClickHandler() {
  const setLocation = useSimulatorStore((state) => state.setLocation);
  const setOptimalOrientation = useSimulatorStore((state) => state.setOptimalOrientation);
  const { reverseGeocode } = useGeocoding();

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      const location = await reverseGeocode(lat, lng);
      if (location) {
        setLocation(location);
        setOptimalOrientation();
      }
    },
  });

  return null;
}

function MapUpdater({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  const location = useSimulatorStore((state) => state.location);
  const prevLocationRef = useRef({ lat: location.latitude, lng: location.longitude });

  // Notify parent when map is ready
  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);

  // Update map view when location changes
  useEffect(() => {
    const prevLoc = prevLocationRef.current;
    const newLat = location.latitude;
    const newLng = location.longitude;

    // Only update if location actually changed
    if (prevLoc.lat !== newLat || prevLoc.lng !== newLng) {
      // Use flyTo for smooth animation, but limit distance for large jumps
      const distance = Math.sqrt(
        Math.pow(newLat - prevLoc.lat, 2) + Math.pow(newLng - prevLoc.lng, 2)
      );

      if (distance > 50) {
        // Large jump - use setView for instant move
        map.setView([newLat, newLng], map.getZoom());
      } else {
        // Small move - animate smoothly
        map.flyTo([newLat, newLng], map.getZoom(), { duration: 1 });
      }

      prevLocationRef.current = { lat: newLat, lng: newLng };
    }
  }, [map, location.latitude, location.longitude]);

  // Handle resize/invalidate
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
}

// Inner map component with all Leaflet elements
function MapInner({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const location = useSimulatorStore((state) => state.location);
  const solarPosition = useSimulatorStore((state) => state.solarPosition);

  return (
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={10}
      className="w-full h-full"
      zoomControl={false}
      // Prevent issues with tile loading
      preferCanvas={true}
      // Bounds for world map
      maxBounds={[[-90, -180], [90, 180]]}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        minZoom={2}
        // Add error handling for tile loading
        eventHandlers={{
          tileerror: (e) => {
            console.warn('Tile loading error:', e);
          },
        }}
      />
      <Marker
        position={[location.latitude, location.longitude]}
        icon={markerIcon}
      />
      {solarPosition && solarPosition.elevation > 0 && (
        <SunVector
          latitude={location.latitude}
          longitude={location.longitude}
          azimuth={solarPosition.azimuth}
          elevation={solarPosition.elevation}
        />
      )}
      <MapClickHandler />
      <MapUpdater onMapReady={onMapReady} />
    </MapContainer>
  );
}

// Export map ref for external invalidation
export interface MapCanvasHandle {
  invalidateSize: () => void;
}

interface MapCanvasProps {
  onMapReady?: (map: L.Map) => void;
}

export function MapCanvas({ onMapReady }: MapCanvasProps) {
  const mapRef = useRef<L.Map | null>(null);
  const keyRef = useRef(0);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    onMapReady?.(map);
  }, [onMapReady]);

  const handleReset = useCallback(() => {
    // Increment key to force remount
    keyRef.current += 1;
  }, []);

  return (
    <MapErrorBoundary onReset={handleReset}>
      <MapInner key={keyRef.current} onMapReady={handleMapReady} />
    </MapErrorBoundary>
  );
}
