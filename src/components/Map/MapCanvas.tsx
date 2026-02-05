/**
 * MapCanvas Component
 *
 * Interactive Leaflet map with location selection and sun vector visualization.
 *
 * Key features:
 * - Click-to-select location with reverse geocoding
 * - Sun azimuth vector overlay (daytime only)
 * - Error boundary with state recovery
 * - Debounced invalidateSize for performance
 * - Global navigation support (world bounds)
 */

import { useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSimulatorStore } from '../../store/simulatorStore';
import { useGeocoding } from '../../hooks/useGeocoding';
import { SunVector } from './SunVector';
import { MapErrorBoundary } from './MapErrorBoundary';
import { GeolocationButton } from './GeolocationButton';

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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

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
      // Calculate distance to decide animation strategy
      // Large jumps (> 50 degrees) = instant, small moves = animated
      const distance = Math.sqrt(
        Math.pow(newLat - prevLoc.lat, 2) + Math.pow(newLng - prevLoc.lng, 2)
      );

      if (import.meta.env.DEV) {
        console.log(`[Map] Location changed: (${newLat.toFixed(4)}, ${newLng.toFixed(4)}), distance: ${distance.toFixed(2)}`);
      }

      if (distance > 50) {
        // Large jump - use setView for instant move (avoids tile loading delays)
        if (import.meta.env.DEV) {
          console.log('[Map] Large jump detected, using setView');
        }
        map.setView([newLat, newLng], map.getZoom());
      } else {
        // Small move - animate smoothly
        if (import.meta.env.DEV) {
          console.log('[Map] Small move detected, using flyTo');
        }
        map.flyTo([newLat, newLng], map.getZoom(), { duration: 1 });
      }

      prevLocationRef.current = { lat: newLat, lng: newLng };
    }
  }, [map, location.latitude, location.longitude]);

  // Debounced invalidateSize handler
  // Prevents excessive calls during rapid resizing or panel animations
  const debouncedInvalidateSize = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        // Check if map container has valid dimensions before invalidating
        const container = map.getContainer();
        const { offsetWidth, offsetHeight } = container;

        if (offsetWidth > 0 && offsetHeight > 0) {
          map.invalidateSize();
        } else if (import.meta.env.DEV) {
          console.warn('[Map] Skipped invalidateSize: container has zero dimensions');
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[Map] invalidateSize error:', error);
        }
      }
    }, 150); // 150ms debounce for smooth UX
  }, [map]);

  // Handle resize with debounce
  useEffect(() => {
    window.addEventListener('resize', debouncedInvalidateSize);
    return () => {
      window.removeEventListener('resize', debouncedInvalidateSize);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedInvalidateSize]);

  return null;
}

// Inner map component with all Leaflet elements
function MapInner({
  onMapReady,
  initialCenter,
  initialZoom,
}: {
  onMapReady?: (map: L.Map) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}) {
  const location = useSimulatorStore((state) => state.location);
  const solarPosition = useSimulatorStore((state) => state.solarPosition);

  // Use provided initial values or fall back to current location
  const center = initialCenter || [location.latitude, location.longitude];
  const zoom = initialZoom || 10;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      zoomControl={false}
      // Use Canvas renderer for better performance and stability
      preferCanvas={true}
      // Allow global navigation - world bounds with wrap
      maxBounds={[[-90, -180], [90, 180]]}
      maxBoundsViscosity={1.0}
      worldCopyJump={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        minZoom={2}
        // Error handling for tile loading
        eventHandlers={{
          tileerror: (e) => {
            // Log tile errors in DEV mode for debugging
            if (import.meta.env.DEV) {
              console.warn('[Map] Tile loading error:', e);
            }
          },
          tileloadstart: () => {
            // Track tile loading in DEV mode
            if (import.meta.env.DEV) {
              // Could add loading state here if needed
            }
          },
        }}
      />
      <Marker
        position={[location.latitude, location.longitude]}
        icon={markerIcon}
      />
      {/* Sun vector only shown during daytime (elevation > 0) */}
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

  // Store last known good state for recovery
  const lastStateRef = useRef<{
    center: [number, number];
    zoom: number;
  }>({
    center: [37.7749, -122.4194], // Default: San Francisco
    zoom: 10,
  });

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    onMapReady?.(map);

    // Update last known state whenever map moves or zooms
    const updateLastState = () => {
      const center = map.getCenter();
      lastStateRef.current = {
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
      };
    };

    map.on('moveend', updateLastState);
    map.on('zoomend', updateLastState);

    // Initialize last state
    updateLastState();
  }, [onMapReady]);

  const handleReset = useCallback(() => {
    // Increment key to force remount, but preserve last state
    keyRef.current += 1;

    if (import.meta.env.DEV) {
      console.log('[Map] Resetting with last state:', lastStateRef.current);
    }
  }, []);

  return (
    <>
      <MapErrorBoundary onReset={handleReset}>
        <MapInner
          key={keyRef.current}
          onMapReady={handleMapReady}
          initialCenter={lastStateRef.current.center}
          initialZoom={lastStateRef.current.zoom}
        />
      </MapErrorBoundary>
      <GeolocationButton />
    </>
  );
}
