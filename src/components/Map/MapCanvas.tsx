import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSimulatorStore } from '../../store/simulatorStore';
import { useGeocoding } from '../../hooks/useGeocoding';
import { SunVector } from './SunVector';

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

function MapUpdater() {
  const map = useMap();
  const location = useSimulatorStore((state) => state.location);

  useEffect(() => {
    map.setView([location.latitude, location.longitude], map.getZoom());
  }, [map, location.latitude, location.longitude]);

  return null;
}

export function MapCanvas() {
  const location = useSimulatorStore((state) => state.location);
  const solarPosition = useSimulatorStore((state) => state.solarPosition);

  return (
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={10}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
      <MapUpdater />
    </MapContainer>
  );
}
