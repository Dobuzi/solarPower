import { describe, it, expect } from 'vitest';
import {
  calculateAirMass,
  calculateBeamTransmittance,
  calculateDiffuseFraction,
  calculateExtraterrestrialIrradiance,
  getDayOfYear,
} from './atmosphere';


describe('atmosphere', () => {
  it('should compute air mass with bounds', () => {
    expect(calculateAirMass(0)).toBeGreaterThanOrEqual(1);
    expect(calculateAirMass(89)).toBeGreaterThan(1);
    expect(calculateAirMass(90)).toBe(Infinity);
  });

  it('should compute beam transmittance within [0,1]', () => {
    expect(calculateBeamTransmittance(1)).toBeGreaterThan(0);
    expect(calculateBeamTransmittance(1)).toBeLessThanOrEqual(1);
    expect(calculateBeamTransmittance(Infinity)).toBe(0);
  });

  it('should compute diffuse fraction by clearness index bands', () => {
    expect(calculateDiffuseFraction(0.1)).toBeGreaterThan(0.9);
    expect(calculateDiffuseFraction(0.5)).toBeGreaterThan(0);
    expect(calculateDiffuseFraction(0.9)).toBeCloseTo(0.165, 3);
  });

  it('should clamp diffuse fraction input bounds', () => {
    expect(calculateDiffuseFraction(-1)).toBeGreaterThanOrEqual(0);
    expect(calculateDiffuseFraction(2)).toBeCloseTo(0.165, 3);
  });

  it('should compute extraterrestrial irradiance within reasonable range', () => {
    const value = calculateExtraterrestrialIrradiance(1);
    expect(value).toBeGreaterThan(1300);
    expect(value).toBeLessThan(1420);
  });

  it('should compute day of year correctly', () => {
    expect(getDayOfYear(new Date('2024-01-01T00:00:00Z'))).toBe(1);
    expect(getDayOfYear(new Date('2024-12-31T00:00:00Z'))).toBe(366);
  });
});
