/**
 * Timezone Utilities
 *
 * Provides accurate timezone handling for solar calculations.
 * Uses the Intl API for timezone operations and includes a coordinate-based
 * timezone lookup for when timezone is not explicitly known.
 */

// ============================================================
// Timezone Database (Major cities/regions for coordinate lookup)
// ============================================================

interface TimezoneRegion {
  name: string;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

// Simplified timezone regions - covers major populated areas
// For production, consider using a library like tzlookup or geo-tz
const TIMEZONE_REGIONS: TimezoneRegion[] = [
  // Americas
  { name: 'America/Los_Angeles', bounds: { minLat: 32, maxLat: 49, minLng: -125, maxLng: -114 } },
  { name: 'America/Denver', bounds: { minLat: 31, maxLat: 49, minLng: -114, maxLng: -102 } },
  { name: 'America/Chicago', bounds: { minLat: 26, maxLat: 49, minLng: -102, maxLng: -87 } },
  { name: 'America/New_York', bounds: { minLat: 25, maxLat: 47, minLng: -87, maxLng: -67 } },
  { name: 'America/Anchorage', bounds: { minLat: 51, maxLat: 72, minLng: -180, maxLng: -130 } },
  { name: 'Pacific/Honolulu', bounds: { minLat: 18, maxLat: 23, minLng: -161, maxLng: -154 } },
  { name: 'America/Phoenix', bounds: { minLat: 31, maxLat: 37, minLng: -115, maxLng: -109 } },
  { name: 'America/Sao_Paulo', bounds: { minLat: -34, maxLat: -15, minLng: -58, maxLng: -35 } },
  { name: 'America/Mexico_City', bounds: { minLat: 14, maxLat: 33, minLng: -118, maxLng: -86 } },
  { name: 'America/Buenos_Aires', bounds: { minLat: -55, maxLat: -22, minLng: -73, maxLng: -53 } },

  // Europe
  { name: 'Europe/London', bounds: { minLat: 49, maxLat: 61, minLng: -11, maxLng: 2 } },
  { name: 'Europe/Paris', bounds: { minLat: 42, maxLat: 51, minLng: -5, maxLng: 8 } },
  { name: 'Europe/Berlin', bounds: { minLat: 47, maxLat: 55, minLng: 5, maxLng: 15 } },
  { name: 'Europe/Rome', bounds: { minLat: 36, maxLat: 47, minLng: 6, maxLng: 19 } },
  { name: 'Europe/Madrid', bounds: { minLat: 36, maxLat: 44, minLng: -10, maxLng: 5 } },
  { name: 'Europe/Moscow', bounds: { minLat: 45, maxLat: 70, minLng: 27, maxLng: 60 } },
  { name: 'Europe/Istanbul', bounds: { minLat: 36, maxLat: 42, minLng: 26, maxLng: 45 } },

  // Asia
  { name: 'Asia/Tokyo', bounds: { minLat: 24, maxLat: 46, minLng: 123, maxLng: 154 } },
  { name: 'Asia/Shanghai', bounds: { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 } },
  { name: 'Asia/Kolkata', bounds: { minLat: 8, maxLat: 36, minLng: 68, maxLng: 97 } },
  { name: 'Asia/Dubai', bounds: { minLat: 22, maxLat: 27, minLng: 51, maxLng: 57 } },
  { name: 'Asia/Singapore', bounds: { minLat: 1, maxLat: 2, minLng: 103, maxLng: 104 } },
  { name: 'Asia/Seoul', bounds: { minLat: 33, maxLat: 43, minLng: 124, maxLng: 132 } },
  { name: 'Asia/Bangkok', bounds: { minLat: 5, maxLat: 21, minLng: 97, maxLng: 106 } },
  { name: 'Asia/Jakarta', bounds: { minLat: -11, maxLat: 6, minLng: 95, maxLng: 141 } },

  // Oceania
  { name: 'Australia/Sydney', bounds: { minLat: -44, maxLat: -28, minLng: 140, maxLng: 154 } },
  { name: 'Australia/Perth', bounds: { minLat: -35, maxLat: -14, minLng: 113, maxLng: 129 } },
  { name: 'Pacific/Auckland', bounds: { minLat: -48, maxLat: -34, minLng: 166, maxLng: 179 } },

  // Africa
  { name: 'Africa/Cairo', bounds: { minLat: 22, maxLat: 32, minLng: 24, maxLng: 37 } },
  { name: 'Africa/Johannesburg', bounds: { minLat: -35, maxLat: -22, minLng: 16, maxLng: 33 } },
  { name: 'Africa/Lagos', bounds: { minLat: 4, maxLat: 14, minLng: 2, maxLng: 15 } },
];

/**
 * Get timezone from coordinates using a regional lookup
 * Falls back to longitude-based UTC offset if no match found
 */
export function getTimezoneFromCoordinates(latitude: number, longitude: number): string {
  // First, try to match a known region
  for (const region of TIMEZONE_REGIONS) {
    if (
      latitude >= region.bounds.minLat &&
      latitude <= region.bounds.maxLat &&
      longitude >= region.bounds.minLng &&
      longitude <= region.bounds.maxLng
    ) {
      return region.name;
    }
  }

  // Fallback: Calculate UTC offset based on longitude
  // This is approximate but works for oceans and unmapped areas
  const offset = Math.round(longitude / 15);
  if (offset === 0) return 'UTC';

  // Use Etc/GMT format (note: signs are inverted in Etc/GMT)
  return `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`;
}

/**
 * Get current UTC offset for a timezone (accounts for DST)
 * Returns offset in MINUTES (positive = east of UTC, negative = west)
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });

    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');

    if (tzPart) {
      // Parse offset like "GMT-08:00" or "GMT+05:30"
      const match = tzPart.value.match(/GMT([+-])(\d{2}):(\d{2})/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3], 10);
        return sign * (hours * 60 + minutes);
      }
    }

    // Fallback: use Date's built-in offset calculation
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / 60000;
  } catch {
    return 0;
  }
}

/**
 * Check if timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a UTC Date for a specific local hour in a timezone.
 * This is the SINGLE SOURCE OF TRUTH for simulation time.
 *
 * DST-safe: Uses iterative offset correction to handle DST transitions.
 * - Spring forward (missing hour): Maps to the next valid time
 * - Fall back (repeated hour): Maps to the first occurrence
 *
 * @param baseDate - Reference date (used to determine Y/M/D in target timezone)
 * @param localHour - Local hour (0-23.99) in the target timezone
 * @param timezone - IANA timezone string
 * @returns UTC Date representing the specified local time
 */
export function createLocalDateTime(
  baseDate: Date,
  localHour: number,
  timezone: string
): Date {
  // Get the date components in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(baseDate);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '2024');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');

  const hours = Math.floor(localHour);
  const minutes = Math.round((localHour % 1) * 60);

  // Create a "naive UTC" timestamp using Date.UTC
  // This treats our local time values AS IF they were UTC
  // Date.UTC is timezone-independent (always returns UTC milliseconds)
  const naiveUtcMs = Date.UTC(year, month, day, hours, minutes, 0, 0);

  // Iterative offset correction for DST safety
  // The offset at naiveUtcMs might not match the offset at the actual target time
  // We iterate until the offset stabilizes (usually 1-2 iterations)
  let utcMs = naiveUtcMs;
  let prevOffset = NaN;

  for (let i = 0; i < 3; i++) {
    // Get offset at current UTC estimate
    const offset = getTimezoneOffset(timezone, new Date(utcMs));

    // If offset hasn't changed, we've converged
    if (offset === prevOffset) break;

    // Calculate new UTC: UTC = Local - Offset
    utcMs = naiveUtcMs - offset * 60000;
    prevOffset = offset;
  }

  return new Date(utcMs);
}

/**
 * Extract local hour (0-23.99) from a UTC timestamp in a specific timezone
 */
export function getLocalHourFromUtc(utcDate: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false, // 24-hour format
    });

    const parts = formatter.formatToParts(utcDate);
    const hourPart = parts.find(p => p.type === 'hour')?.value || '0';
    const minutePart = parts.find(p => p.type === 'minute')?.value || '0';

    // Handle midnight edge case (hour12:false can return "24" for midnight in some locales)
    let hour = parseInt(hourPart);
    if (hour === 24) hour = 0;

    const minute = parseInt(minutePart);
    return hour + minute / 60;
  } catch {
    return 12; // Fallback to noon
  }
}

/**
 * Format a UTC date for display in local timezone
 */
export function formatTimeInTimezone(
  utcDate: Date,
  timezone: string,
  format: 'time' | 'datetime' | 'full' = 'time'
): string {
  const options: Intl.DateTimeFormatOptions = { timeZone: timezone };

  switch (format) {
    case 'time':
      options.hour = 'numeric';
      options.minute = '2-digit';
      options.hour12 = true;
      break;
    case 'datetime':
      options.month = 'short';
      options.day = 'numeric';
      options.hour = 'numeric';
      options.minute = '2-digit';
      options.hour12 = true;
      break;
    case 'full':
      options.weekday = 'short';
      options.month = 'short';
      options.day = 'numeric';
      options.year = 'numeric';
      options.hour = 'numeric';
      options.minute = '2-digit';
      options.hour12 = true;
      options.timeZoneName = 'short';
      break;
  }

  return new Intl.DateTimeFormat('en-US', options).format(utcDate);
}

/**
 * Format local hour (0-23.99) as a time string
 * This directly formats the local hour without timezone conversion
 */
export function formatLocalHour(localHour: number): string {
  const h = Math.floor(localHour);
  const m = Math.round((localHour % 1) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Get timezone abbreviation (e.g., PST, EST, CEST)
 */
export function getTimezoneAbbreviation(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    return parts.find(p => p.type === 'timeZoneName')?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Check if date is during daylight saving time in timezone
 */
export function isDST(timezone: string, date: Date = new Date()): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);

  const janOffset = getTimezoneOffset(timezone, jan);
  const julOffset = getTimezoneOffset(timezone, jul);
  const currentOffset = getTimezoneOffset(timezone, date);

  // DST is active when current offset equals the larger offset
  const maxOffset = Math.max(janOffset, julOffset);
  return currentOffset === maxOffset && janOffset !== julOffset;
}

// ============================================================
// Debug utilities (for development)
// ============================================================

/**
 * Debug helper: Log timezone conversion details
 */
export function debugTimezoneConversion(
  baseDate: Date,
  localHour: number,
  timezone: string
): void {
  const utcResult = createLocalDateTime(baseDate, localHour, timezone);
  const offset = getTimezoneOffset(timezone, utcResult);
  const offsetHours = offset / 60;
  const abbreviation = getTimezoneAbbreviation(timezone, utcResult);

  console.log('=== Timezone Debug ===');
  console.log(`Input: localHour=${localHour}, timezone=${timezone}`);
  console.log(`Offset: ${offset} min (${offsetHours >= 0 ? '+' : ''}${offsetHours}h) [${abbreviation}]`);
  console.log(`Result UTC: ${utcResult.toISOString()}`);
  console.log(`Formatted local: ${formatTimeInTimezone(utcResult, timezone, 'time')}`);
  console.log(`Extracted local hour: ${getLocalHourFromUtc(utcResult, timezone).toFixed(2)}`);
}
