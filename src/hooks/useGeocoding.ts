import { useState, useCallback } from 'react';
import { Location } from '../core/types';
import { estimateTimezone } from '../models/location';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface GeocodingState {
  isLoading: boolean;
  error: string | null;
  results: Location[];
}

export function useGeocoding() {
  const [state, setState] = useState<GeocodingState>({
    isLoading: false,
    error: null,
    results: [],
  });

  const search = useCallback(async (query: string): Promise<Location[]> => {
    if (!query.trim()) {
      setState({ isLoading: false, error: null, results: [] });
      return [];
    }

    setState({ isLoading: true, error: null, results: [] });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'User-Agent': 'SolarPowerSimulator/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data: NominatimResult[] = await response.json();

      const locations: Location[] = data.map((result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        return {
          latitude: lat,
          longitude: lon,
          address: result.display_name,
          timezone: estimateTimezone(lon),
        };
      });

      setState({ isLoading: false, error: null, results: locations });
      return locations;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({ isLoading: false, error: message, results: [] });
      return [];
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<Location | null> => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'User-Agent': 'SolarPowerSimulator/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding request failed');
      }

      const data = await response.json();

      const location: Location = {
        latitude: lat,
        longitude: lon,
        address: data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        timezone: estimateTimezone(lon),
      };

      setState((s) => ({ ...s, isLoading: false }));
      return location;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({ isLoading: false, error: message, results: [] });
      return null;
    }
  }, []);

  return {
    ...state,
    search,
    reverseGeocode,
  };
}
