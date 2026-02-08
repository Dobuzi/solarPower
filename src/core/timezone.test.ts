/**
 * Unit tests for timezone utilities
 *
 * These tests verify:
 * 1. Local hour -> UTC conversion for known timezones
 * 2. Round-trip consistency (local -> UTC -> local)
 * 3. Chart data indexing matches local hours
 */

import { describe, it, expect } from 'vitest';
import {
  createLocalDateTime,
  getLocalHourFromUtc,
  formatLocalHour,
  getTimezoneOffset,
  getTimezoneFromCoordinates,
  isValidTimezone,
} from './timezone';

describe('createLocalDateTime', () => {
  it('should convert noon in Los Angeles to correct UTC', () => {
    const baseDate = new Date('2024-01-15T00:00:00Z');
    const localHour = 12; // noon
    const timezone = 'America/Los_Angeles';

    const result = createLocalDateTime(baseDate, localHour, timezone);

    // LA is UTC-8 in January (PST), so noon LA = 20:00 UTC
    expect(result.getUTCHours()).toBe(20);
    expect(result.getUTCMinutes()).toBe(0);
  });

  it('should convert noon in New York to correct UTC', () => {
    const baseDate = new Date('2024-01-15T00:00:00Z');
    const localHour = 12; // noon
    const timezone = 'America/New_York';

    const result = createLocalDateTime(baseDate, localHour, timezone);

    // NYC is UTC-5 in January (EST), so noon NYC = 17:00 UTC
    expect(result.getUTCHours()).toBe(17);
    expect(result.getUTCMinutes()).toBe(0);
  });

  it('should convert noon in Tokyo to correct UTC', () => {
    const baseDate = new Date('2024-01-15T00:00:00Z');
    const localHour = 12; // noon
    const timezone = 'Asia/Tokyo';

    const result = createLocalDateTime(baseDate, localHour, timezone);

    // Tokyo is UTC+9, so noon Tokyo = 03:00 UTC
    expect(result.getUTCHours()).toBe(3);
    expect(result.getUTCMinutes()).toBe(0);
  });

  it('should handle fractional hours correctly', () => {
    const baseDate = new Date('2024-01-15T00:00:00Z');
    const localHour = 12.5; // 12:30
    const timezone = 'America/Los_Angeles';

    const result = createLocalDateTime(baseDate, localHour, timezone);

    // LA is UTC-8 in January, so 12:30 LA = 20:30 UTC
    expect(result.getUTCHours()).toBe(20);
    expect(result.getUTCMinutes()).toBe(30);
  });

  it('should handle midnight correctly', () => {
    const baseDate = new Date('2024-01-15T12:00:00Z');
    const localHour = 0; // midnight
    const timezone = 'America/Los_Angeles';

    const result = createLocalDateTime(baseDate, localHour, timezone);

    // LA midnight = 08:00 UTC
    expect(result.getUTCHours()).toBe(8);
  });
});

describe('getLocalHourFromUtc', () => {
  it('should extract correct local hour from UTC timestamp', () => {
    // 20:00 UTC = 12:00 PST (noon in LA)
    const utcDate = new Date('2024-01-15T20:00:00Z');
    const timezone = 'America/Los_Angeles';

    const localHour = getLocalHourFromUtc(utcDate, timezone);

    expect(localHour).toBe(12);
  });

  it('should handle half hours', () => {
    // 20:30 UTC = 12:30 PST
    const utcDate = new Date('2024-01-15T20:30:00Z');
    const timezone = 'America/Los_Angeles';

    const localHour = getLocalHourFromUtc(utcDate, timezone);

    expect(localHour).toBe(12.5);
  });
});

describe('round-trip consistency', () => {
  it('should maintain consistency: local -> UTC -> local', () => {
    const baseDate = new Date('2024-01-15T00:00:00Z');
    const originalLocalHour = 14.25; // 2:15 PM
    const timezone = 'America/Los_Angeles';

    // Convert local to UTC
    const utc = createLocalDateTime(baseDate, originalLocalHour, timezone);

    // Convert back to local hour
    const recoveredLocalHour = getLocalHourFromUtc(utc, timezone);

    expect(recoveredLocalHour).toBeCloseTo(originalLocalHour, 1);
  });

  it('should work for multiple timezones', () => {
    const baseDate = new Date('2024-01-15T00:00:00Z');
    const testCases = [
      { timezone: 'America/Los_Angeles', localHour: 12 },
      { timezone: 'America/New_York', localHour: 9 },
      { timezone: 'Europe/London', localHour: 15 },
      { timezone: 'Asia/Tokyo', localHour: 6 },
      { timezone: 'Australia/Sydney', localHour: 22 },
    ];

    for (const { timezone, localHour } of testCases) {
      const utc = createLocalDateTime(baseDate, localHour, timezone);
      const recovered = getLocalHourFromUtc(utc, timezone);

      expect(recovered).toBeCloseTo(localHour, 1);
    }
  });
});

describe('formatLocalHour', () => {
  it('should format noon correctly', () => {
    expect(formatLocalHour(12)).toBe('12:00 PM');
  });

  it('should format midnight correctly', () => {
    expect(formatLocalHour(0)).toBe('12:00 AM');
  });

  it('should format morning correctly', () => {
    expect(formatLocalHour(9.5)).toBe('9:30 AM');
  });

  it('should format evening correctly', () => {
    expect(formatLocalHour(18.75)).toBe('6:45 PM');
  });
});

describe('chart data indexing', () => {
  it('should generate hourly UTC timestamps that map to sequential local hours', () => {
    const baseDate = new Date('2024-01-15T00:00:00Z');
    const timezone = 'America/Los_Angeles';

    // Simulate what the store does: generate UTC times for local hours 0-23
    const hourlyTimestamps: Date[] = [];
    for (let localHour = 0; localHour < 24; localHour++) {
      hourlyTimestamps.push(createLocalDateTime(baseDate, localHour + 0.5, timezone));
    }

    // Verify each timestamp corresponds to the expected local hour
    for (let i = 0; i < 24; i++) {
      const expectedLocalHour = i + 0.5;
      const actualLocalHour = getLocalHourFromUtc(hourlyTimestamps[i], timezone);

      expect(actualLocalHour).toBeCloseTo(expectedLocalHour, 1);
    }
  });

  it('should have solar noon around local hour 12', () => {
    // For a mid-latitude location like SF (37.8°N), solar noon should be near 12:00-12:30
    // This test verifies the chart x-axis will show peak power around noon

    const baseDate = new Date('2024-01-15T00:00:00Z');
    const timezone = 'America/Los_Angeles';

    // Solar noon in SF in January is around 12:15 local time
    // The corresponding UTC time would be around 20:15 UTC
    const localSolarNoon = 12.25;
    const utcSolarNoon = createLocalDateTime(baseDate, localSolarNoon, timezone);

    // Verify this UTC time, when converted back, gives us ~12:15 local
    const recoveredHour = getLocalHourFromUtc(utcSolarNoon, timezone);
    expect(recoveredHour).toBeCloseTo(localSolarNoon, 1);

    // And verify UTC hour is in the afternoon (around 20:00)
    expect(utcSolarNoon.getUTCHours()).toBeGreaterThanOrEqual(19);
    expect(utcSolarNoon.getUTCHours()).toBeLessThanOrEqual(21);
  });
});

describe('getTimezoneOffset', () => {
  it('should return negative offset for US West Coast', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const offset = getTimezoneOffset('America/Los_Angeles', date);

    // PST is UTC-8, so offset should be -480 minutes
    expect(offset).toBe(-480);
  });

  it('should return positive offset for Tokyo', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const offset = getTimezoneOffset('Asia/Tokyo', date);

    // JST is UTC+9, so offset should be +540 minutes
    expect(offset).toBe(540);
  });
});

describe('getTimezoneFromCoordinates', () => {
  it('should map coordinates in California to America/Los_Angeles', () => {
    const tz = getTimezoneFromCoordinates(37.7749, -122.4194);
    expect(tz).toBe('America/Los_Angeles');
  });

  it('should map coordinates in Tokyo to Asia/Tokyo', () => {
    const tz = getTimezoneFromCoordinates(35.6895, 139.6917);
    expect(tz).toBe('Asia/Tokyo');
  });

  it('should fall back to Etc/GMT offset when no region matches', () => {
    const tz = getTimezoneFromCoordinates(0, -30);
    // -30 / 15 = -2 => Etc/GMT+2 (sign inverted in Etc/GMT)
    expect(tz).toBe('Etc/GMT+2');
  });

  it('should include boundary coordinates in region match', () => {
    const minBoundary = getTimezoneFromCoordinates(32, -125);
    const maxBoundary = getTimezoneFromCoordinates(49, -114);
    expect(minBoundary).toBe('America/Los_Angeles');
    expect(maxBoundary).toBe('America/Los_Angeles');
  });
});

describe('isValidTimezone', () => {
  it('should return true for a valid IANA timezone', () => {
    expect(isValidTimezone('America/Los_Angeles')).toBe(true);
  });

  it('should return false for an invalid timezone', () => {
    expect(isValidTimezone('Invalid/Timezone')).toBe(false);
  });
});

describe('createLocalDateTime rounding', () => {
  it('should normalize rounded minutes to the next hour', () => {
    const baseDate = new Date('2024-01-15T00:00:00Z');
    const timezone = 'America/Los_Angeles';
    const result = createLocalDateTime(baseDate, 10.999, timezone);
    const recoveredHour = getLocalHourFromUtc(result, timezone);
    expect(recoveredHour).toBeCloseTo(11, 2);
  });
});

describe('getTimezoneOffset invalid timezone', () => {
  it('should return 0 when timezone is invalid', () => {
    const offset = getTimezoneOffset('Invalid/Timezone');
    expect(offset).toBe(0);
  });
});

describe('DST boundary handling', () => {
  // 2024 DST transitions for America/Los_Angeles:
  // Spring forward: March 10, 2024 at 2:00 AM -> 3:00 AM (PDT begins)
  // Fall back: November 3, 2024 at 2:00 AM -> 1:00 AM (PST begins)

  describe('Spring forward (missing hour)', () => {
    it('should handle time during the "missing" hour', () => {
      // March 10, 2024 - 2:30 AM PST doesn't exist (clocks jump from 2:00 to 3:00)
      const baseDate = new Date('2024-03-10T12:00:00Z');
      const timezone = 'America/Los_Angeles';

      // Requesting 2:30 AM which doesn't exist
      const result = createLocalDateTime(baseDate, 2.5, timezone);

      // Should return a valid time (either mapped to 3:30 AM or 1:30 AM depending on implementation)
      // The key is that it should be stable and not crash
      const recoveredHour = getLocalHourFromUtc(result, timezone);

      // The recovered hour should be valid (either 1.5 or 3.5 for this edge case)
      expect(recoveredHour).toBeGreaterThanOrEqual(0);
      expect(recoveredHour).toBeLessThanOrEqual(24);
    });

    it('should correctly handle time before DST transition', () => {
      const baseDate = new Date('2024-03-10T08:00:00Z'); // Early morning UTC
      const timezone = 'America/Los_Angeles';

      // 1:00 AM PST (before transition) should work normally
      const result = createLocalDateTime(baseDate, 1, timezone);
      const recoveredHour = getLocalHourFromUtc(result, timezone);

      expect(recoveredHour).toBeCloseTo(1, 0);
    });

    it('should correctly handle time after DST transition', () => {
      const baseDate = new Date('2024-03-10T12:00:00Z');
      const timezone = 'America/Los_Angeles';

      // 3:00 AM PDT (after transition) should work normally
      const result = createLocalDateTime(baseDate, 3, timezone);
      const recoveredHour = getLocalHourFromUtc(result, timezone);

      expect(recoveredHour).toBeCloseTo(3, 0);
    });
  });

  describe('Fall back (repeated hour)', () => {
    it('should handle time during the "repeated" hour', () => {
      // November 3, 2024 - 1:30 AM occurs twice (once PDT, once PST)
      const baseDate = new Date('2024-11-03T12:00:00Z');
      const timezone = 'America/Los_Angeles';

      // Requesting 1:30 AM which occurs twice
      const result = createLocalDateTime(baseDate, 1.5, timezone);

      // Should return a valid time (first occurrence)
      const recoveredHour = getLocalHourFromUtc(result, timezone);

      // The recovered hour should be 1.5
      expect(recoveredHour).toBeCloseTo(1.5, 1);
    });

    it('should correctly handle time before DST ends', () => {
      const baseDate = new Date('2024-11-03T07:00:00Z'); // Before transition
      const timezone = 'America/Los_Angeles';

      // 12:00 AM PDT (before transition)
      const result = createLocalDateTime(baseDate, 0, timezone);
      const recoveredHour = getLocalHourFromUtc(result, timezone);

      expect(recoveredHour).toBeCloseTo(0, 0);
    });

    it('should correctly handle time after DST ends', () => {
      const baseDate = new Date('2024-11-03T15:00:00Z'); // Well after transition
      const timezone = 'America/Los_Angeles';

      // 3:00 AM PST (well after transition)
      const result = createLocalDateTime(baseDate, 3, timezone);
      const recoveredHour = getLocalHourFromUtc(result, timezone);

      expect(recoveredHour).toBeCloseTo(3, 0);
    });
  });

  describe('Timezone with no DST', () => {
    it('should work correctly for Arizona (no DST)', () => {
      // Arizona (America/Phoenix) doesn't observe DST
      const marchDate = new Date('2024-03-15T12:00:00Z');
      const novemberDate = new Date('2024-11-15T12:00:00Z');
      const timezone = 'America/Phoenix';

      const marchResult = createLocalDateTime(marchDate, 12, timezone);
      const novemberResult = createLocalDateTime(novemberDate, 12, timezone);

      const marchRecovered = getLocalHourFromUtc(marchResult, timezone);
      const novemberRecovered = getLocalHourFromUtc(novemberResult, timezone);

      // Both should recover to 12:00 regardless of time of year
      expect(marchRecovered).toBeCloseTo(12, 1);
      expect(novemberRecovered).toBeCloseTo(12, 1);
    });

    it('should work correctly for Tokyo (no DST)', () => {
      // Japan doesn't observe DST
      const marchDate = new Date('2024-03-15T12:00:00Z');
      const novemberDate = new Date('2024-11-15T12:00:00Z');
      const timezone = 'Asia/Tokyo';

      const marchResult = createLocalDateTime(marchDate, 12, timezone);
      const novemberResult = createLocalDateTime(novemberDate, 12, timezone);

      const marchRecovered = getLocalHourFromUtc(marchResult, timezone);
      const novemberRecovered = getLocalHourFromUtc(novemberResult, timezone);

      expect(marchRecovered).toBeCloseTo(12, 1);
      expect(novemberRecovered).toBeCloseTo(12, 1);
    });
  });
});
