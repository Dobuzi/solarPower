// ============================================================
// Location & Timezone
// ============================================================

export interface Location {
  latitude: number;
  longitude: number;
  timezone: string; // IANA timezone (e.g., "America/Los_Angeles")
  address: string;
  elevation?: number; // meters above sea level
}

// ============================================================
// Solar Position
// ============================================================

export interface SolarPosition {
  elevation: number; // degrees above horizon (negative = below)
  azimuth: number; // degrees from north, clockwise
  zenith: number; // degrees from vertical (90 - elevation)
  declination: number; // degrees
  hourAngle: number; // degrees
  sunrise: Date; // UTC
  sunset: Date; // UTC
  solarNoon: Date; // UTC
  isNight: boolean; // true when sun is below horizon
  civilTwilight: { start: Date; end: Date }; // sun between -6° and 0°
}

// ============================================================
// Irradiance Components
// ============================================================

export interface Irradiance {
  ghi: number; // Global Horizontal Irradiance (W/m²)
  dni: number; // Direct Normal Irradiance (W/m²)
  dhi: number; // Diffuse Horizontal Irradiance (W/m²)
  extraterrestrial: number; // Extraterrestrial irradiance (W/m²)
  airMass: number;
  clearnessIndex: number; // kt = GHI / (ETR * cos(zenith))
}

export interface POAIrradiance {
  total: number; // Total POA irradiance (W/m²)
  beam: number; // Direct beam component
  diffuse: number; // Sky diffuse component
  reflected: number; // Ground-reflected component
  angleOfIncidence: number; // degrees
  effectiveIrradiance: number; // After IAM correction
}

// ============================================================
// Loss Models
// ============================================================

export interface SystemLosses {
  soiling: number; // 0-1 (e.g., 0.02 = 2% loss)
  shading: number; // 0-1
  mismatch: number; // 0-1 (typically 0.02)
  wiring: number; // 0-1 (DC wiring loss, typically 0.02)
  connections: number; // 0-1 (typically 0.005)
  lidDegradation: number; // 0-1 (Light Induced Degradation)
  nameplateDerate: number; // 0-1 (typically 0.01)
  availability: number; // 0-1 (system uptime)
}

export interface InverterConfig {
  efficiency: number; // 0-1 (typically 0.96-0.98)
  acCapacity: number; // Watts (for clipping calculation)
  dcAcRatio: number; // Typical 1.1-1.3
}

export interface LossFactors {
  temperature: number; // Derating factor (0-1)
  incidenceAngle: number; // IAM factor (0-1)
  spectral: number; // Spectral correction (typically ~1.0)
  systemTotal: number; // Combined system losses factor
  inverterClipping: number; // Power lost to inverter clipping
}

// ============================================================
// Panel Configuration
// ============================================================

export interface PanelConfig {
  width: number; // meters
  height: number; // meters
  ratedPower: number; // Watts at STC (1000 W/m², 25°C, AM1.5)
  efficiency: number; // 0-1
  tempCoefficient: number; // %/°C (typically -0.35 to -0.45)
  noct: number; // Nominal Operating Cell Temperature (°C)
  bifacial?: boolean;
  bifacialityFactor?: number; // 0-1 (typically 0.65-0.85)
}

export interface PanelOrientation {
  tilt: number; // degrees from horizontal (0 = flat, 90 = vertical)
  azimuth: number; // degrees from north, clockwise (180 = south-facing)
}

export type MountingType = 'roof' | 'ground' | 'tracking';

export interface ArrayConfig {
  panelCount: number;
  orientation: PanelOrientation;
  mountingType: MountingType;
  rowSpacing?: number; // meters between rows (for ground mount)
  groundClearance?: number; // meters
}

// ============================================================
// Power Output
// ============================================================

export interface HourlyData {
  hour: number; // 0-23
  localTime: Date;
  solarPosition: SolarPosition;
  irradiance: Irradiance;
  poaIrradiance: POAIrradiance;
  cellTemperature: number;
  dcPower: number; // Watts
  acPower: number; // Watts (after inverter)
  losses: LossFactors;
}

export interface PowerOutput {
  instantPower: number; // Watts (current time)
  peakPower: number; // Watts (max for day)
  peakHour: number; // Hour of peak
  dailyEnergy: number; // Wh
  hourlyData: HourlyData[];
  capacityFactor: number; // actual / rated
  performanceRatio: number; // actual / theoretical
}

export interface WeeklyData {
  days: {
    date: Date;
    dailyEnergy: number;
    peakPower: number;
    sunriseLocal: Date;
    sunsetLocal: Date;
  }[];
  totalEnergy: number; // Wh
  averageDailyEnergy: number;
}

// ============================================================
// Panel Presets
// ============================================================

export interface PanelPreset {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  config: PanelConfig;
}

// ============================================================
// Simulation State
// ============================================================

export interface SimulatorState {
  location: Location;
  date: Date;
  animationHour: number;
  isAnimating: boolean;
  panelPresetId: string;
  panelConfig: PanelConfig;
  orientation: PanelOrientation;
  panelCount: number;
  ambientTemp: number;
  albedo: number;
  systemLosses: SystemLosses;
  inverterConfig: InverterConfig;
}

export interface CalculationResult {
  solarPosition: SolarPosition;
  irradiance: Irradiance;
  poaIrradiance: POAIrradiance;
  powerOutput: PowerOutput;
  losses: LossFactors;
}

// ============================================================
// Display Helpers
// ============================================================

export interface DisplayTime {
  utc: Date;
  local: Date;
  localString: string; // Formatted for display
  timezone: string;
}

export function formatLocalTime(utc: Date, timezone: string): DisplayTime {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return {
    utc,
    local: new Date(utc.toLocaleString('en-US', { timeZone: timezone })),
    localString: formatter.format(utc),
    timezone,
  };
}
