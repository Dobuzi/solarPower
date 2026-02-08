import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSolarCalculation } from './useSolarCalculation';
import { useSimulatorStore } from '../store/simulatorStore';
import { Irradiance, POAIrradiance, SolarPosition, LossFactors, HourlyData, PowerOutput } from '../core/types';

const initialState = useSimulatorStore.getState();

const baseSolarPosition: SolarPosition = {
  elevation: 45,
  azimuth: 180,
  zenith: 45,
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

const baseIrradiance: Irradiance = {
  ghi: 800,
  dni: 600,
  dhi: 200,
  extraterrestrial: 1360,
  airMass: 1,
  clearnessIndex: 0.6,
};

const basePoa: POAIrradiance = {
  total: 900,
  beam: 600,
  diffuse: 200,
  reflected: 100,
  angleOfIncidence: 30,
  effectiveIrradiance: 850,
};

const baseLosses: LossFactors = {
  temperature: 0.98,
  incidenceAngle: 0.97,
  spectral: 1,
  systemTotal: 0.9,
  inverterClipping: 0,
};

const hourlyData: HourlyData[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  localTime: new Date('2024-01-15T00:00:00Z'),
  solarPosition: baseSolarPosition,
  irradiance: baseIrradiance,
  poaIrradiance: basePoa,
  cellTemperature: 35,
  dcPower: 1200,
  acPower: 1000,
  losses: baseLosses,
}));

const dailyOutput: PowerOutput = {
  instantPower: 0,
  peakPower: 1100,
  peakHour: 12,
  dailyEnergy: 24000,
  hourlyData,
  capacityFactor: 0.5,
  performanceRatio: 0.8,
};

describe('useSolarCalculation', () => {
  beforeEach(() => {
    useSimulatorStore.setState(initialState, true);
  });

  it('should compute summary metrics correctly', () => {
    useSimulatorStore.setState({
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: 'America/Los_Angeles',
        address: 'San Francisco, CA',
      },
      solarPosition: baseSolarPosition,
      dailyOutput,
      instantPower: 5000,
      currentTimeLocal: '12:00 PM',
    });

    const { result } = renderHook(() => useSolarCalculation());

    expect(result.current.summary?.dailyEnergy).toBe(24000);
    expect(result.current.summary?.weeklyEnergy).toBe(24000 * 7);
    expect(result.current.summary?.monthlyEnergy).toBe(24000 * 30);
    expect(result.current.summary?.yearlyEnergy).toBe(24000 * 365);
    expect(result.current.summary?.yearlySavings).toBeCloseTo((24000 * 365 / 1000) * 0.15, 2);
    expect(result.current.summary?.yearlyCO2Offset).toBeCloseTo((24000 * 365 / 1000) * 0.42, 2);
    expect(result.current.summary?.peakPower).toBe(1100);
  });

  it('should return null summary when dailyOutput missing', () => {
    useSimulatorStore.setState({ dailyOutput: null, solarPosition: baseSolarPosition });
    const { result } = renderHook(() => useSolarCalculation());
    expect(result.current.summary).toBeNull();
  });

  it('should build hourly and cumulative series', () => {
    useSimulatorStore.setState({ dailyOutput, solarPosition: baseSolarPosition });
    const { result } = renderHook(() => useSolarCalculation());
    expect(result.current.hourlyPowerData).toHaveLength(24);
    expect(result.current.cumulativeEnergyData).toHaveLength(24);
  });
});
