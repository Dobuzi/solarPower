import { describe, it, expect } from 'vitest';
import { calculateIrradiance, calculateDailyIrradiance, calculateClearness, calculateBrightness, calculatePerezBrightness, estimateLinkeTurbidity } from './irradiance';


describe('calculateIrradiance', () => {
  it('should produce higher GHI at low zenith than near horizon', () => {
    const date = new Date('2024-06-21T12:00:00Z');

    const noon = calculateIrradiance(date, 20, 3, 0);
    const sunrise = calculateIrradiance(date, 85, 3, 0);

    expect(noon.ghi).toBeGreaterThan(0);
    expect(noon.dni).toBeGreaterThan(0);
    expect(noon.dhi).toBeGreaterThan(0);
    expect(noon.ghi).toBeGreaterThan(sunrise.ghi);
    expect(noon.dni).toBeGreaterThan(sunrise.dni);
  });

  it('should return zero irradiance when sun is below horizon', () => {
    const date = new Date('2024-06-21T00:00:00Z');
    const result = calculateIrradiance(date, 95, 3, 0);
    expect(result.ghi).toBe(0);
    expect(result.dni).toBe(0);
    expect(result.dhi).toBe(0);
  });

  it('should compute daily irradiance array with 24 entries', () => {
    const date = new Date('2024-06-21T00:00:00Z');
    const results = calculateDailyIrradiance(date, () => 45, 3, 0);
    expect(results).toHaveLength(24);
    expect(results[0].ghi).toBeGreaterThan(0);
  });

  it('should compute Perez parameters with valid bounds', () => {
    const epsilon = calculateClearness(100, 500, 30);
    const delta = calculateBrightness(100, 1360, 1.2);
    const { f1, f2 } = calculatePerezBrightness(epsilon, delta, 30);
    expect(epsilon).toBeGreaterThan(1);
    expect(delta).toBeGreaterThan(0);
    expect(f1).toBeGreaterThanOrEqual(0);
    expect(f2).toBeGreaterThanOrEqual(-1);
  });

  it('should handle zero dhi in clearness calculation', () => {
    const epsilon = calculateClearness(0, 500, 30);
    expect(epsilon).toBe(1);
  });

  it('should estimate linke turbidity from conditions', () => {
    expect(estimateLinkeTurbidity('low', 'clean')).toBeLessThan(estimateLinkeTurbidity('high', 'polluted'));
  });
});
