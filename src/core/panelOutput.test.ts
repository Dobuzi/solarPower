import { describe, it, expect } from 'vitest';
import { calculateDailyPowerOutput, calculatePanelPower, calculatePOAIrradiance, calculateAngleOfIncidence, calculateDCPower } from './panelOutput';
import { Irradiance, PanelConfig, PanelOrientation, SolarPosition } from './types';

const panelConfig: PanelConfig = {
  width: 1,
  height: 1,
  ratedPower: 1000,
  efficiency: 0.2,
  tempCoefficient: -0.4,
  noct: 45,
};

const orientation: PanelOrientation = {
  tilt: 20,
  azimuth: 180,
};

const baseIrradiance: Irradiance = {
  ghi: 1000,
  dni: 800,
  dhi: 200,
  extraterrestrial: 1360,
  airMass: 1,
  clearnessIndex: 0.7,
};

const baseSolarPosition: SolarPosition = {
  elevation: 60,
  azimuth: 180,
  zenith: 30,
  declination: 0,
  hourAngle: 0,
  sunrise: new Date('2024-01-15T15:00:00Z'),
  sunset: new Date('2024-01-15T23:00:00Z'),
  solarNoon: new Date('2024-01-15T19:00:00Z'),
  isNight: false,
  civilTwilight: {
    start: new Date('2024-01-15T14:30:00Z'),
    end: new Date('2024-01-15T23:30:00Z'),
  },
};

describe('calculateDailyPowerOutput', () => {
  it('should compute peak power and total energy for constant conditions', () => {
    const hourlyIrradiance = Array.from({ length: 24 }, () => baseIrradiance);
    const hourlyPositions = Array.from({ length: 24 }, () => baseSolarPosition);

    const output = calculateDailyPowerOutput(
      hourlyIrradiance,
      hourlyPositions,
      panelConfig,
      orientation,
      1,
      25,
      0.2
    );

    const poa = calculatePOAIrradiance(
      baseIrradiance,
      baseSolarPosition.zenith,
      baseSolarPosition.azimuth,
      orientation.tilt,
      orientation.azimuth,
      0.2
    );

    const { acPower } = calculatePanelPower(poa, panelConfig, 25, 1);

    expect(output.peakPower).toBeCloseTo(acPower, 2);
    expect(output.peakHour).toBe(0);
    expect(output.dailyEnergy).toBeCloseTo(acPower * 24, 2);
  });
});

describe('panel output helpers', () => {
  it('should compute angle of incidence within 0-180', () => {
    const aoi = calculateAngleOfIncidence(30, 180, 20, 180);
    expect(aoi).toBeGreaterThanOrEqual(0);
    expect(aoi).toBeLessThanOrEqual(180);
  });

  it('should compute DC power for nonzero irradiance', () => {
    const poa = calculatePOAIrradiance(baseIrradiance, baseSolarPosition.zenith, baseSolarPosition.azimuth, orientation.tilt, orientation.azimuth, 0.2);
    const result = calculateDCPower(poa, panelConfig, 25);
    expect(result.dcPower).toBeGreaterThan(0);
    expect(result.losses.systemTotal).toBeGreaterThan(0);
  });
});
