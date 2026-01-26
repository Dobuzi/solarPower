import { Location } from '../core/types';

export const defaultLocation: Location = {
  latitude: 37.7749,
  longitude: -122.4194,
  timezone: 'America/Los_Angeles',
  address: 'San Francisco, CA',
};

export const presetLocations: Location[] = [
  {
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    address: 'San Francisco, CA',
  },
  {
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
    address: 'Tokyo, Japan',
  },
  {
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    address: 'London, UK',
  },
  {
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney',
    address: 'Sydney, Australia',
  },
  {
    latitude: 25.7617,
    longitude: -80.1918,
    timezone: 'America/New_York',
    address: 'Miami, FL',
  },
  {
    latitude: 55.7558,
    longitude: 37.6173,
    timezone: 'Europe/Moscow',
    address: 'Moscow, Russia',
  },
  {
    latitude: -22.9068,
    longitude: -43.1729,
    timezone: 'America/Sao_Paulo',
    address: 'Rio de Janeiro, Brazil',
  },
  {
    latitude: 1.3521,
    longitude: 103.8198,
    timezone: 'Asia/Singapore',
    address: 'Singapore',
  },
];

/**
 * Get timezone from coordinates using a simple approximation
 * For production, use a proper timezone API
 */
export function estimateTimezone(longitude: number): string {
  const offset = Math.round(longitude / 15);
  if (offset === 0) return 'UTC';
  const sign = offset > 0 ? '+' : '-';
  return `Etc/GMT${sign === '+' ? '-' : '+'}${Math.abs(offset)}`;
}
