import { describe, it, expect } from 'vitest';
import { defaultLocation, presetLocations, estimateTimezone } from './location';


describe('location models', () => {
  it('should define a default location', () => {
    expect(defaultLocation.address).toContain('San Francisco');
  });

  it('should include preset locations', () => {
    expect(presetLocations.length).toBeGreaterThan(3);
  });

  it('should estimate timezone from longitude', () => {
    expect(estimateTimezone(0)).toBe('UTC');
    expect(estimateTimezone(30)).toBe('Etc/GMT-2');
    expect(estimateTimezone(-30)).toBe('Etc/GMT+2');
  });
});
