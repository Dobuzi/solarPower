import { describe, it, expect } from 'vitest';
import { calculateTempDerating, calculateIAM, calculateIAMPhysical, calculateSystemLossFactor, calculateTotalSystemLoss, calculateInverterOutput, DEFAULT_SYSTEM_LOSSES } from './losses';


describe('losses', () => {
  it('should derate at high temperatures and stay within bounds', () => {
    const deratingHot = calculateTempDerating(60, -0.4);
    const deratingCold = calculateTempDerating(0, -0.4);

    expect(deratingHot).toBeLessThan(1);
    expect(deratingHot).toBeGreaterThanOrEqual(0.5);
    expect(deratingCold).toBeGreaterThanOrEqual(1);
    expect(deratingCold).toBeLessThanOrEqual(1.15);
  });

  it('should keep IAM factor within [0, 1] and drop to 0 at 90°', () => {
    expect(calculateIAM(90)).toBe(0);
    const mid = calculateIAM(45);
    expect(mid).toBeGreaterThanOrEqual(0);
    expect(mid).toBeLessThanOrEqual(1);
  });

  it('should compute a valid system loss factor', () => {
    const factor = calculateSystemLossFactor(DEFAULT_SYSTEM_LOSSES);
    expect(factor).toBeGreaterThan(0);
    expect(factor).toBeLessThanOrEqual(1);
  });

  it('should compute total system loss as percentage', () => {
    const totalLoss = calculateTotalSystemLoss(DEFAULT_SYSTEM_LOSSES);
    expect(totalLoss).toBeGreaterThan(0);
    expect(totalLoss).toBeLessThan(100);
  });

  it('should keep IAM physical within [0,1]', () => {
    expect(calculateIAMPhysical(0)).toBe(1);
    expect(calculateIAMPhysical(90)).toBe(0);
    const value = calculateIAMPhysical(60);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });

  it('should handle inverter output with clipping', () => {
    const result = calculateInverterOutput(1500, { efficiency: 0.96, acCapacity: 1000, dcAcRatio: 1.2 }, 1200);
    expect(result.acPower).toBeLessThanOrEqual(1000);
    expect(result.clippingLoss).toBeGreaterThanOrEqual(0);
  });

  it('should return zero output when dcPower is zero', () => {
    const result = calculateInverterOutput(0, { efficiency: 0.96, acCapacity: 1000, dcAcRatio: 1.2 }, 1200);
    expect(result.acPower).toBe(0);
    expect(result.efficiency).toBe(0);
  });
});
