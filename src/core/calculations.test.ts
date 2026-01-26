/**
 * Sanity tests for solar power calculations
 *
 * These tests verify that the calculation pipeline produces
 * plausible output values for known scenarios.
 */

import { describe, it, expect } from 'vitest';
import { calculateIrradiance } from './irradiance';
import { calculateSolarPosition } from './solarPosition';
import { calculatePOAIrradiance, calculatePanelPower } from './panelOutput';
import { getDefaultPreset } from '../models/panelPresets';
import { DEFAULT_SYSTEM_LOSSES, DEFAULT_INVERTER_CONFIG } from './losses';

describe('Irradiance sanity checks', () => {
  it('should produce reasonable GHI at solar noon', () => {
    // San Francisco, January 26, solar noon (approximately 12:20 local = 20:20 UTC)
    const date = new Date('2024-01-26T20:20:00Z');
    const latitude = 37.7749;
    const longitude = -122.4194;

    const solarPos = calculateSolarPosition(date, latitude, longitude);
    const irradiance = calculateIrradiance(date, solarPos.zenith, 3, 0);

    // At solar noon in January, SF should have:
    // - Sun elevation around 30-35° (zenith ~55-60°)
    // - GHI around 400-700 W/m²
    // - DNI around 600-900 W/m²
    expect(solarPos.elevation).toBeGreaterThan(25);
    expect(solarPos.elevation).toBeLessThan(45);

    expect(irradiance.ghi).toBeGreaterThan(300);
    expect(irradiance.ghi).toBeLessThan(800);

    expect(irradiance.dni).toBeGreaterThan(400);
    expect(irradiance.dni).toBeLessThan(1000);
  });

  it('should produce higher GHI at summer solstice', () => {
    // San Francisco, June 21 (summer solstice), solar noon (~12:10 local = 19:10 UTC)
    // Solar noon varies slightly from clock noon due to equation of time
    const date = new Date('2024-06-21T19:10:00Z');
    const latitude = 37.7749;
    const longitude = -122.4194;

    const solarPos = calculateSolarPosition(date, latitude, longitude);
    const irradiance = calculateIrradiance(date, solarPos.zenith, 3, 0);

    // At summer solstice, SF (37.8°N) should have:
    // - Max sun elevation ≈ 90° - |37.8° - 23.5°| ≈ 75.7°
    // - At noon, sun elevation around 65-76° (accounting for equation of time)
    // - GHI around 800-1100 W/m²
    expect(solarPos.elevation).toBeGreaterThan(65);
    expect(solarPos.elevation).toBeLessThan(80);

    expect(irradiance.ghi).toBeGreaterThan(800);
    expect(irradiance.ghi).toBeLessThan(1200);
  });

  it('should produce zero irradiance at night', () => {
    // San Francisco, midnight UTC (4 PM local - still day, so use 6 AM UTC = 10 PM local)
    const date = new Date('2024-01-26T06:00:00Z'); // 10 PM local (night)
    const latitude = 37.7749;
    const longitude = -122.4194;

    const solarPos = calculateSolarPosition(date, latitude, longitude);
    const irradiance = calculateIrradiance(date, solarPos.zenith, 3, 0);

    expect(solarPos.elevation).toBeLessThan(0);
    expect(irradiance.ghi).toBe(0);
    expect(irradiance.dni).toBe(0);
  });
});

describe('Power output sanity checks', () => {
  const defaultPanel = getDefaultPreset().config;
  const panelCount = 10; // 4 kW system (10 × 400W)

  it('should produce reasonable power at solar noon', () => {
    // San Francisco, January 26, solar noon
    const date = new Date('2024-01-26T20:20:00Z');
    const latitude = 37.7749;
    const longitude = -122.4194;

    const solarPos = calculateSolarPosition(date, latitude, longitude);
    const irradiance = calculateIrradiance(date, solarPos.zenith, 3, 0);

    // Optimal orientation for SF
    const tilt = 35; // Roughly latitude
    const azimuth = 180; // South-facing

    const poaIrradiance = calculatePOAIrradiance(
      irradiance,
      solarPos.zenith,
      solarPos.azimuth,
      tilt,
      azimuth,
      0.2 // albedo
    );

    const { acPower, dcPower } = calculatePanelPower(
      poaIrradiance,
      defaultPanel,
      25, // ambient temp
      panelCount,
      DEFAULT_SYSTEM_LOSSES,
      DEFAULT_INVERTER_CONFIG
    );

    // System capacity: 4000W
    // At noon in January with clear sky, expect:
    // - POA irradiance: 500-900 W/m²
    // - DC power: 2000-3500W (50-87% of rated)
    // - AC power: 1800-3200W (after inverter)
    expect(poaIrradiance.total).toBeGreaterThan(400);
    expect(poaIrradiance.total).toBeLessThan(1000);

    expect(dcPower).toBeGreaterThan(1500);
    expect(dcPower).toBeLessThan(4000);

    expect(acPower).toBeGreaterThan(1200);
    expect(acPower).toBeLessThan(4000);
  });

  it('should produce higher power at summer solstice', () => {
    // San Francisco, June 21 (summer solstice), solar noon
    const date = new Date('2024-06-21T19:00:00Z');
    const latitude = 37.7749;
    const longitude = -122.4194;

    const solarPos = calculateSolarPosition(date, latitude, longitude);
    const irradiance = calculateIrradiance(date, solarPos.zenith, 3, 0);

    const tilt = 35;
    const azimuth = 180;

    const poaIrradiance = calculatePOAIrradiance(
      irradiance,
      solarPos.zenith,
      solarPos.azimuth,
      tilt,
      azimuth,
      0.2
    );

    const { acPower, dcPower } = calculatePanelPower(
      poaIrradiance,
      defaultPanel,
      30, // warmer ambient temp
      panelCount,
      DEFAULT_SYSTEM_LOSSES,
      DEFAULT_INVERTER_CONFIG
    );

    // At summer solstice, expect higher output:
    // - POA irradiance: 800-1100 W/m²
    // - DC power: 2800-3800W
    // - AC power: 2500-3500W
    expect(poaIrradiance.total).toBeGreaterThan(700);
    expect(poaIrradiance.total).toBeLessThan(1200);

    expect(dcPower).toBeGreaterThan(2200);
    expect(acPower).toBeGreaterThan(2000);
  });

  it('should produce zero power at night', () => {
    // San Francisco, 10 PM local (night)
    const date = new Date('2024-01-26T06:00:00Z');
    const latitude = 37.7749;
    const longitude = -122.4194;

    const solarPos = calculateSolarPosition(date, latitude, longitude);
    const irradiance = calculateIrradiance(date, solarPos.zenith, 3, 0);

    const poaIrradiance = calculatePOAIrradiance(
      irradiance,
      solarPos.zenith,
      solarPos.azimuth,
      35,
      180,
      0.2
    );

    const { acPower, dcPower } = calculatePanelPower(
      poaIrradiance,
      defaultPanel,
      15,
      panelCount,
      DEFAULT_SYSTEM_LOSSES,
      DEFAULT_INVERTER_CONFIG
    );

    expect(poaIrradiance.total).toBe(0);
    expect(dcPower).toBe(0);
    expect(acPower).toBe(0);
  });

  it('should scale linearly with panel count', () => {
    const date = new Date('2024-06-21T19:00:00Z');
    const latitude = 37.7749;
    const longitude = -122.4194;

    const solarPos = calculateSolarPosition(date, latitude, longitude);
    const irradiance = calculateIrradiance(date, solarPos.zenith, 3, 0);

    const poaIrradiance = calculatePOAIrradiance(
      irradiance,
      solarPos.zenith,
      solarPos.azimuth,
      35,
      180,
      0.2
    );

    const { acPower: power10 } = calculatePanelPower(
      poaIrradiance,
      defaultPanel,
      25,
      10,
      DEFAULT_SYSTEM_LOSSES,
      DEFAULT_INVERTER_CONFIG
    );

    const { acPower: power20 } = calculatePanelPower(
      poaIrradiance,
      defaultPanel,
      25,
      20,
      DEFAULT_SYSTEM_LOSSES,
      DEFAULT_INVERTER_CONFIG
    );

    // Power should roughly double with double the panels
    // (accounting for potential inverter clipping differences)
    expect(power20 / power10).toBeGreaterThan(1.8);
    expect(power20 / power10).toBeLessThan(2.2);
  });
});

describe('Different timezone verification', () => {
  it('should produce reasonable output for Seoul, Korea', () => {
    // Seoul (37.5°N, 127°E), January 26, noon local (KST = UTC+9)
    // Noon KST = 03:00 UTC
    const date = new Date('2024-01-26T03:00:00Z');
    const latitude = 37.5665;
    const longitude = 126.978;

    const solarPos = calculateSolarPosition(date, latitude, longitude);
    const irradiance = calculateIrradiance(date, solarPos.zenith, 3, 0);

    // Seoul is at similar latitude to SF, so similar expectations
    expect(solarPos.elevation).toBeGreaterThan(25);
    expect(solarPos.elevation).toBeLessThan(40);

    expect(irradiance.ghi).toBeGreaterThan(300);
    expect(irradiance.ghi).toBeLessThan(700);

    expect(irradiance.dni).toBeGreaterThan(400);
  });

  it('should produce reasonable output for Sydney, Australia', () => {
    // Sydney (-33.9°S, 151.2°E), January 26 (summer), noon local (AEDT = UTC+11)
    // Noon AEDT = 01:00 UTC
    const date = new Date('2024-01-26T01:00:00Z');
    const latitude = -33.8688;
    const longitude = 151.2093;

    const solarPos = calculateSolarPosition(date, latitude, longitude);
    const irradiance = calculateIrradiance(date, solarPos.zenith, 3, 0);

    // Sydney in summer should have high sun and strong irradiance
    expect(solarPos.elevation).toBeGreaterThan(65);
    expect(solarPos.elevation).toBeLessThan(85);

    expect(irradiance.ghi).toBeGreaterThan(800);
    expect(irradiance.ghi).toBeLessThan(1200);
  });
});
