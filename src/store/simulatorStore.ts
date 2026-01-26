import { create } from 'zustand';
import {
  Location,
  PanelConfig,
  PanelOrientation,
  PowerOutput,
  SolarPosition,
  Irradiance,
  POAIrradiance,
  SystemLosses,
  InverterConfig,
  LossFactors,
  HourlyData,
} from '../core/types';
import { calculateSolarPosition, calculateOptimalTilt, calculateOptimalAzimuth } from '../core/solarPosition';
import { calculateIrradiance } from '../core/irradiance';
import {
  calculatePOAIrradiance,
  calculatePanelPower,
  calculateDailyPowerOutput,
  isOrientationOptimal,
} from '../core/panelOutput';
import { DEFAULT_SYSTEM_LOSSES, DEFAULT_INVERTER_CONFIG } from '../core/losses';
import { defaultLocation } from '../models/location';
import { getDefaultPreset, getPanelPreset } from '../models/panelPresets';
import { getTimezoneFromCoordinates, createLocalDateTime, formatLocalHour } from '../core/timezone';

// ============================================================
// Store Interface
// ============================================================

interface SimulatorStore {
  // Location
  location: Location;
  setLocation: (location: Location) => void;

  // Time
  date: Date;
  setDate: (date: Date) => void;
  animationHour: number; // Local hour (0-24)
  setAnimationHour: (hour: number) => void;
  isAnimating: boolean;
  setIsAnimating: (isAnimating: boolean) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;

  // Panel configuration
  panelPresetId: string;
  setPanelPreset: (id: string) => void;
  panelConfig: PanelConfig;
  setPanelConfig: (config: Partial<PanelConfig>) => void;
  orientation: PanelOrientation;
  setOrientation: (orientation: Partial<PanelOrientation>) => void;
  panelCount: number;
  setPanelCount: (count: number) => void;

  // Environment
  ambientTemp: number;
  setAmbientTemp: (temp: number) => void;
  albedo: number;
  setAlbedo: (albedo: number) => void;
  linkeTurbidity: number;
  setLinkeTurbidity: (turbidity: number) => void;

  // Loss models
  systemLosses: SystemLosses;
  setSystemLosses: (losses: Partial<SystemLosses>) => void;
  inverterConfig: InverterConfig;
  setInverterConfig: (config: Partial<InverterConfig>) => void;
  showAdvancedLosses: boolean;
  setShowAdvancedLosses: (show: boolean) => void;

  // Computed values
  solarPosition: SolarPosition | null;
  irradiance: Irradiance | null;
  poaIrradiance: POAIrradiance | null;
  instantPower: number;
  dailyOutput: PowerOutput | null;
  currentLosses: LossFactors | null;
  cellTemperature: number;

  // Derived state
  isNight: boolean;
  isTwilight: boolean;
  isOptimal: boolean;
  currentTimeUTC: Date | null;
  currentTimeLocal: string;

  // Actions
  recalculate: () => void;
  setOptimalOrientation: () => void;

  // Caching
  lastCalculationKey: string;
}

// ============================================================
// Initialization
// ============================================================

const defaultPreset = getDefaultPreset();
const defaultDate = new Date();
defaultDate.setHours(12, 0, 0, 0);

// ============================================================
// Store Implementation
// ============================================================

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  // ============ Location ============
  location: defaultLocation,
  setLocation: (location) => {
    // Auto-detect timezone if not set
    if (!location.timezone || location.timezone.startsWith('Etc/')) {
      location.timezone = getTimezoneFromCoordinates(location.latitude, location.longitude);
    }
    set({ location });
    get().recalculate();
  },

  // ============ Time ============
  date: defaultDate,
  setDate: (date) => {
    set({ date });
    get().recalculate();
  },
  animationHour: 12, // Local hour
  setAnimationHour: (hour) => {
    set({ animationHour: ((hour % 24) + 24) % 24 });
    get().recalculate();
  },
  isAnimating: false,
  setIsAnimating: (isAnimating) => set({ isAnimating }),
  animationSpeed: 1,
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),

  // ============ Panel Configuration ============
  panelPresetId: defaultPreset.id,
  setPanelPreset: (id) => {
    const preset = getPanelPreset(id);
    if (preset) {
      set({ panelPresetId: id, panelConfig: preset.config });
      get().recalculate();
    }
  },
  panelConfig: defaultPreset.config,
  setPanelConfig: (config) => {
    set((state) => ({
      panelConfig: { ...state.panelConfig, ...config },
      panelPresetId: 'custom',
    }));
    get().recalculate();
  },
  orientation: {
    tilt: calculateOptimalTilt(defaultLocation.latitude),
    azimuth: calculateOptimalAzimuth(defaultLocation.latitude),
  },
  setOrientation: (orientation) => {
    set((state) => ({
      orientation: { ...state.orientation, ...orientation },
    }));
    get().recalculate();
  },
  panelCount: 10,
  setPanelCount: (count) => {
    set({ panelCount: Math.max(1, Math.min(1000, count)) });
    get().recalculate();
  },

  // ============ Environment ============
  ambientTemp: 25,
  setAmbientTemp: (temp) => {
    set({ ambientTemp: temp });
    get().recalculate();
  },
  albedo: 0.2,
  setAlbedo: (albedo) => {
    set({ albedo: Math.max(0, Math.min(1, albedo)) });
    get().recalculate();
  },
  linkeTurbidity: 3,
  setLinkeTurbidity: (turbidity) => {
    set({ linkeTurbidity: Math.max(1, Math.min(7, turbidity)) });
    get().recalculate();
  },

  // ============ Loss Models ============
  systemLosses: DEFAULT_SYSTEM_LOSSES,
  setSystemLosses: (losses) => {
    set((state) => ({
      systemLosses: { ...state.systemLosses, ...losses },
    }));
    get().recalculate();
  },
  inverterConfig: DEFAULT_INVERTER_CONFIG,
  setInverterConfig: (config) => {
    set((state) => ({
      inverterConfig: { ...state.inverterConfig, ...config },
    }));
    get().recalculate();
  },
  showAdvancedLosses: false,
  setShowAdvancedLosses: (show) => set({ showAdvancedLosses: show }),

  // ============ Computed Values ============
  solarPosition: null,
  irradiance: null,
  poaIrradiance: null,
  instantPower: 0,
  dailyOutput: null,
  currentLosses: null,
  cellTemperature: 25,

  // ============ Derived State ============
  isNight: false,
  isTwilight: false,
  isOptimal: true,
  currentTimeUTC: null,
  currentTimeLocal: '',

  // ============ Cache ============
  lastCalculationKey: '',

  // ============ Actions ============
  recalculate: () => {
    const state = get();
    const {
      location,
      date,
      animationHour,
      panelConfig,
      orientation,
      panelCount,
      ambientTemp,
      albedo,
      linkeTurbidity,
      systemLosses,
      inverterConfig,
    } = state;

    // Create UTC date from local animation hour
    const currentTimeUTC = createLocalDateTime(date, animationHour, location.timezone);

    // Calculate solar position for current time
    const solarPosition = calculateSolarPosition(
      currentTimeUTC,
      location.latitude,
      location.longitude
    );

    // Calculate irradiance (with altitude if available)
    const irradiance = calculateIrradiance(
      currentTimeUTC,
      solarPosition.zenith,
      linkeTurbidity,
      location.elevation || 0
    );

    // Calculate POA irradiance
    const poaIrradiance = calculatePOAIrradiance(
      irradiance,
      solarPosition.zenith,
      solarPosition.azimuth,
      orientation.tilt,
      orientation.azimuth,
      albedo
    );

    // Calculate instant power with full loss model
    const powerResult = calculatePanelPower(
      poaIrradiance,
      panelConfig,
      ambientTemp,
      panelCount,
      systemLosses,
      inverterConfig
    );

    // Calculate daily output
    const hourlyIrradiance: Irradiance[] = [];
    const hourlyPositions: SolarPosition[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourTimeUTC = createLocalDateTime(date, hour + 0.5, location.timezone);
      const pos = calculateSolarPosition(hourTimeUTC, location.latitude, location.longitude);
      hourlyPositions.push(pos);
      hourlyIrradiance.push(
        calculateIrradiance(hourTimeUTC, pos.zenith, linkeTurbidity, location.elevation || 0)
      );
    }

    const dailyOutput = calculateDailyPowerOutput(
      hourlyIrradiance,
      hourlyPositions,
      panelConfig,
      orientation,
      panelCount,
      ambientTemp,
      albedo,
      systemLosses,
      inverterConfig,
      location.timezone
    );

    // Set instant power from current calculation
    dailyOutput.instantPower = powerResult.acPower;

    // Check if orientation is optimal
    const isOptimal = isOrientationOptimal(
      orientation.tilt,
      orientation.azimuth,
      location.latitude
    );

    // Determine night/twilight state
    const isNight = solarPosition.isNight;
    const isTwilight = !isNight &&
      currentTimeUTC.getTime() >= solarPosition.civilTwilight.start.getTime() &&
      (currentTimeUTC.getTime() < solarPosition.sunrise.getTime() ||
        currentTimeUTC.getTime() > solarPosition.sunset.getTime());

    // Format current time for display - use animationHour directly to ensure consistency
    // This is the SINGLE SOURCE OF TRUTH for displayed simulation time
    const currentTimeLocal = formatLocalHour(animationHour);

    set({
      solarPosition,
      irradiance,
      poaIrradiance,
      instantPower: powerResult.acPower,
      dailyOutput,
      currentLosses: powerResult.losses,
      cellTemperature: powerResult.cellTemp,
      isNight,
      isTwilight,
      isOptimal,
      currentTimeUTC,
      currentTimeLocal,
    });
  },

  setOptimalOrientation: () => {
    const { location } = get();
    set({
      orientation: {
        tilt: calculateOptimalTilt(location.latitude),
        azimuth: calculateOptimalAzimuth(location.latitude),
      },
    });
    get().recalculate();
  },
}));

// ============================================================
// Initialize calculations on load
// ============================================================

if (typeof window !== 'undefined') {
  setTimeout(() => {
    useSimulatorStore.getState().recalculate();
  }, 0);
}

// ============================================================
// Selectors for common derived values
// ============================================================

export const selectSystemSize = (state: SimulatorStore): number =>
  (state.panelConfig.ratedPower * state.panelCount) / 1000; // kW

export const selectDaylightHours = (state: SimulatorStore): number => {
  if (!state.solarPosition) return 0;
  return (
    (state.solarPosition.sunset.getTime() - state.solarPosition.sunrise.getTime()) /
    (1000 * 60 * 60)
  );
};

export const selectOptimalTilt = (state: SimulatorStore): number =>
  calculateOptimalTilt(state.location.latitude);

export const selectOptimalAzimuth = (state: SimulatorStore): number =>
  calculateOptimalAzimuth(state.location.latitude);

export const selectHourlyPower = (state: SimulatorStore): number[] => {
  if (!state.dailyOutput) return Array(24).fill(0);
  return state.dailyOutput.hourlyData.map((h) => h.acPower);
};

export const selectCurrentHourData = (state: SimulatorStore): HourlyData | null => {
  if (!state.dailyOutput) return null;
  const hourIndex = Math.floor(state.animationHour);
  return state.dailyOutput.hourlyData[hourIndex] || null;
};
