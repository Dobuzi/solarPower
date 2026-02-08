import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSolarPosition = {
  elevation: 10,
  azimuth: 180,
  zenith: 80,
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

const mockIrradiance = {
  ghi: 500,
  dni: 400,
  dhi: 100,
  extraterrestrial: 1360,
  airMass: 2,
  clearnessIndex: 0.5,
};

const mockPoa = {
  total: 600,
  beam: 400,
  diffuse: 150,
  reflected: 50,
  angleOfIncidence: 30,
  effectiveIrradiance: 550,
};

const mockLosses = {
  temperature: 0.98,
  incidenceAngle: 0.97,
  spectral: 1,
  systemTotal: 0.9,
  inverterClipping: 0,
};

const mockDailyOutput = {
  instantPower: 0,
  peakPower: 500,
  peakHour: 12,
  dailyEnergy: 24000,
  hourlyData: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    localTime: new Date('2024-01-15T00:00:00Z'),
    solarPosition: mockSolarPosition,
    irradiance: mockIrradiance,
    poaIrradiance: mockPoa,
    cellTemperature: 30,
    dcPower: 1200,
    acPower: 1000,
    losses: mockLosses,
  })),
  capacityFactor: 0.5,
  performanceRatio: 0.8,
};

vi.mock('../core/solarPosition', () => ({
  calculateSolarPosition: vi.fn(() => mockSolarPosition),
  calculateOptimalTilt: vi.fn(() => 30),
  calculateOptimalAzimuth: vi.fn(() => 180),
}));

vi.mock('../core/irradiance', () => ({
  calculateIrradiance: vi.fn(() => mockIrradiance),
}));

vi.mock('../core/panelOutput', () => ({
  calculatePOAIrradiance: vi.fn(() => mockPoa),
  calculatePanelPower: vi.fn(() => ({ acPower: 900, dcPower: 1000, cellTemp: 30, losses: mockLosses })),
  calculateDailyPowerOutput: vi.fn(() => ({ ...mockDailyOutput })),
  isOrientationOptimal: vi.fn(() => true),
}));

vi.mock('../core/losses', () => ({
  DEFAULT_SYSTEM_LOSSES: {
    soiling: 0.02,
    shading: 0,
    mismatch: 0.02,
    wiring: 0.02,
    connections: 0.005,
    lidDegradation: 0.015,
    nameplateDerate: 0.01,
    availability: 0.003,
  },
  DEFAULT_INVERTER_CONFIG: { efficiency: 0.96, acCapacity: 0, dcAcRatio: 1.2 },
}));

vi.mock('../core/timezone', () => ({
  getTimezoneFromCoordinates: vi.fn(() => 'America/Los_Angeles'),
  createLocalDateTime: vi.fn(() => new Date('2024-01-15T20:00:00Z')),
  formatLocalHour: vi.fn(() => '12:00 PM'),
}));

vi.mock('../models/panelPresets', () => ({
  getDefaultPreset: () => ({
    id: 'generic-400',
    name: 'Generic 400W',
    manufacturer: 'Generic',
    model: 'Mono-400',
    config: {
      width: 1,
      height: 2,
      ratedPower: 400,
      efficiency: 0.2,
      tempCoefficient: -0.35,
      noct: 45,
    },
  }),
  getPanelPreset: () => undefined,
}));

vi.mock('../models/location', () => ({
  defaultLocation: {
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    address: 'San Francisco, CA',
  },
}));


describe('simulatorStore', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should recalculate and populate outputs', async () => {
    const { useSimulatorStore } = await import('./simulatorStore');
    const state = useSimulatorStore.getState();

    state.recalculate();

    const updated = useSimulatorStore.getState();
    expect(updated.solarPosition).toBeTruthy();
    expect(updated.irradiance).toBeTruthy();
    expect(updated.poaIrradiance).toBeTruthy();
    expect(updated.dailyOutput?.dailyEnergy).toBe(24000);
    expect(updated.instantPower).toBe(900);
    expect(updated.currentTimeLocal).toBe('12:00 PM');
  });

  it('should clamp panel count and compute selectors', async () => {
    const { useSimulatorStore, selectSystemSize, selectDaylightHours, selectHourlyPower } = await import('./simulatorStore');
    useSimulatorStore.setState({
      panelConfig: { width: 1, height: 2, ratedPower: 400, efficiency: 0.2, tempCoefficient: -0.35, noct: 45 },
      panelCount: 10,
      solarPosition: mockSolarPosition,
      dailyOutput: mockDailyOutput,
    });

    useSimulatorStore.getState().setPanelCount(5000);
    expect(useSimulatorStore.getState().panelCount).toBe(1000);

    const size = selectSystemSize(useSimulatorStore.getState());
    expect(size).toBeCloseTo(400 * 1000 / 1000, 3);

    const daylight = selectDaylightHours(useSimulatorStore.getState());
    expect(daylight).toBeGreaterThan(0);

    const hourly = selectHourlyPower(useSimulatorStore.getState());
    expect(hourly).toHaveLength(24);
  });
});
