import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SunVectorProps {
  latitude: number;
  longitude: number;
  azimuth: number;
  elevation: number;
}

export function SunVector({ latitude, longitude, azimuth, elevation }: SunVectorProps) {
  const map = useMap();

  useEffect(() => {
    // Calculate end point based on azimuth
    const distance = 0.05; // degrees (roughly 5km)
    const azimuthRad = (azimuth - 180) * Math.PI / 180; // Convert to radians, adjust for map orientation

    const endLat = latitude + distance * Math.cos(azimuthRad);
    const endLng = longitude + distance * Math.sin(azimuthRad);

    // Sun intensity based on elevation (brighter when higher)
    const intensity = Math.min(1, elevation / 60);
    const color = `rgba(251, 191, 36, ${0.4 + intensity * 0.6})`;

    // Create polyline for sun direction
    const line = L.polyline(
      [[latitude, longitude], [endLat, endLng]],
      {
        color: color,
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5',
      }
    ).addTo(map);

    // Create sun circle at the end
    const sunCircle = L.circleMarker([endLat, endLng], {
      radius: 12 + intensity * 8,
      fillColor: '#fbbf24',
      fillOpacity: 0.8 + intensity * 0.2,
      color: '#f59e0b',
      weight: 2,
    }).addTo(map);

    // Add sun rays
    const rays: L.Polyline[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45) * Math.PI / 180;
      const rayLength = 0.01 * (1 + intensity * 0.5);
      const rayEnd = [
        endLat + rayLength * Math.cos(angle),
        endLng + rayLength * Math.sin(angle),
      ] as [number, number];

      const ray = L.polyline(
        [[endLat, endLng], rayEnd],
        {
          color: '#fbbf24',
          weight: 2,
          opacity: 0.6 + intensity * 0.4,
        }
      ).addTo(map);
      rays.push(ray);
    }

    return () => {
      map.removeLayer(line);
      map.removeLayer(sunCircle);
      rays.forEach(ray => map.removeLayer(ray));
    };
  }, [map, latitude, longitude, azimuth, elevation]);

  return null;
}
