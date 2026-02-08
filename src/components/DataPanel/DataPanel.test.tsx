import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DataPanel } from './DataPanel';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Irradiance, POAIrradiance, SolarPosition, LossFactors, HourlyData, PowerOutput } from '../../core/types';

vi.mock('./PowerChart', () => ({
  PowerChart: () => <div data-testid="power-chart" />,
}));

vi.mock('./EnergyChart', () => ({
  EnergyChart: () => <div data-testid="energy-chart" />,
}));

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
  dailyEnergy: 2000,
  hourlyData,
  capacityFactor: 0.5,
  performanceRatio: 0.8,
};

describe('DataPanel', () => {
  beforeEach(() => {
    useSimulatorStore.setState(initialState, true);
    if (typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
  });

  it('should respect stored display settings for units and currency', async () => {
    localStorage.setItem('solar-sim-output-power-unit-v1', 'W');
    localStorage.setItem('solar-sim-output-energy-unit-v1', 'Wh');
    localStorage.setItem('solar-sim-output-decimals-v1', '0');
    localStorage.setItem('solar-sim-output-currency-v1', 'EUR');

    useSimulatorStore.setState({
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: 'America/Los_Angeles',
        address: 'San Francisco, CA',
      },
      solarPosition: baseSolarPosition,
      dailyOutput,
      instantPower: 1000,
      currentTimeLocal: '12:00 PM',
    });

    render(<DataPanel />);

    await waitFor(() => {
      expect(screen.getByText(/1,?000 W/)).toBeInTheDocument();
      expect(screen.getByText(/2,?000 Wh/)).toBeInTheDocument();
    });

    expect(screen.getByText(/€|EUR/)).toBeInTheDocument();
  });
});
