import { describe, it, expect } from 'vitest';
import { calculateSolarPosition } from './solarPosition';


describe('calculateSolarPosition', () => {
  it('should be near zenith at equator on equinox noon', () => {
    const date = new Date('2024-03-20T12:00:00Z');
    const position = calculateSolarPosition(date, 0, 0);

    expect(position.isNight).toBe(false);
    expect(position.elevation).toBeGreaterThan(88);
    expect(position.zenith).toBeLessThan(2);
  });

  it('should compute sunrise before sunset', () => {
    const date = new Date('2024-06-21T12:00:00Z');
    const position = calculateSolarPosition(date, 37.7749, -122.4194);
    expect(position.sunrise.getTime()).toBeLessThan(position.sunset.getTime());
    expect(position.solarNoon.getTime()).toBeGreaterThan(position.sunrise.getTime());
    expect(position.solarNoon.getTime()).toBeLessThan(position.sunset.getTime());
  });
});
