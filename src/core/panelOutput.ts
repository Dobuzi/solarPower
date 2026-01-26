/**
 * PV Panel Power Output Calculations
 *
 * Calculates power output from solar panels including:
 * - Plane-of-Array (POA) irradiance with Perez diffuse model
 * - Temperature derating
 * - Incidence angle modifier (IAM)
 * - System losses
 * - Inverter efficiency and clipping
 *
 * References:
 * - Perez et al. (1990): Modeling daylight availability and irradiance components
 * - PVLIB Python library algorithms
 */

import {
  PanelConfig,
  PanelOrientation,
  Irradiance,
  POAIrradiance,
  PowerOutput,
  HourlyData,
  LossFactors,
  SystemLosses,
  InverterConfig,
  SolarPosition,
} from './types';
import {
  calculateClearness,
  calculateBrightness,
  calculatePerezBrightness,
} from './irradiance';
import {
  calculateCellTemperature,
  calculateTempDerating,
  calculateIAM,
  calculateSystemLossFactor,
  calculateInverterOutput,
  DEFAULT_SYSTEM_LOSSES,
  DEFAULT_INVERTER_CONFIG,
} from './losses';

const DEG_TO_RAD = Math.PI / 180;

// ============================================================
// Angle Calculations
// ============================================================

/**
 * Calculate angle of incidence on a tilted surface
 *
 * @param sunZenith - Sun zenith angle (degrees)
 * @param sunAzimuth - Sun azimuth angle (degrees from north)
 * @param tilt - Panel tilt angle (degrees from horizontal)
 * @param azimuth - Panel azimuth angle (degrees from north)
 * @returns Angle of incidence (degrees)
 */
export function calculateAngleOfIncidence(
  sunZenith: number,
  sunAzimuth: number,
  tilt: number,
  azimuth: number
): number {
  const sunZenithRad = sunZenith * DEG_TO_RAD;
  const sunAzimuthRad = sunAzimuth * DEG_TO_RAD;
  const tiltRad = tilt * DEG_TO_RAD;
  const azimuthRad = azimuth * DEG_TO_RAD;

  const cosAOI =
    Math.cos(sunZenithRad) * Math.cos(tiltRad) +
    Math.sin(sunZenithRad) * Math.sin(tiltRad) * Math.cos(sunAzimuthRad - azimuthRad);

  return Math.acos(Math.max(-1, Math.min(1, cosAOI))) * (180 / Math.PI);
}

// ============================================================
// POA Irradiance Calculation
// ============================================================

/**
 * Calculate Plane of Array (POA) irradiance using Perez transposition model
 *
 * @param irradiance - Horizontal irradiance components
 * @param sunZenith - Sun zenith angle (degrees)
 * @param sunAzimuth - Sun azimuth (degrees from north)
 * @param tilt - Panel tilt (degrees from horizontal)
 * @param azimuth - Panel azimuth (degrees from north)
 * @param albedo - Ground reflectance (0-1, default 0.2)
 */
export function calculatePOAIrradiance(
  irradiance: Irradiance,
  sunZenith: number,
  sunAzimuth: number,
  tilt: number,
  azimuth: number,
  albedo: number = 0.2
): POAIrradiance {
  // No irradiance at night
  if (sunZenith >= 90 || irradiance.ghi <= 0) {
    return {
      total: 0,
      beam: 0,
      diffuse: 0,
      reflected: 0,
      angleOfIncidence: sunZenith >= 90 ? 90 : 0,
      effectiveIrradiance: 0,
    };
  }

  const aoi = calculateAngleOfIncidence(sunZenith, sunAzimuth, tilt, azimuth);
  const tiltRad = tilt * DEG_TO_RAD;
  const cosAOI = Math.cos(aoi * DEG_TO_RAD);
  const cosTilt = Math.cos(tiltRad);
  const sinTilt = Math.sin(tiltRad);
  const zenithRad = sunZenith * DEG_TO_RAD;
  const cosZenith = Math.cos(zenithRad);

  // ========== Beam Component ==========
  let beam = 0;
  if (aoi < 90 && irradiance.dni > 0) {
    beam = irradiance.dni * Math.max(0, cosAOI);
  }

  // ========== Diffuse Component (Perez Model) ==========
  let diffuse = 0;

  if (irradiance.dhi > 0) {
    // Calculate Perez parameters
    const epsilon = calculateClearness(irradiance.dhi, irradiance.dni, sunZenith);
    const delta = calculateBrightness(irradiance.dhi, irradiance.extraterrestrial, irradiance.airMass);
    const { f1, f2 } = calculatePerezBrightness(epsilon, delta, sunZenith);

    // Geometric factors
    const a = Math.max(0, cosAOI);
    const b = Math.max(Math.cos(85 * DEG_TO_RAD), cosZenith);

    // View factors
    const skyViewFactor = (1 + cosTilt) / 2;

    // Perez diffuse model components
    // Isotropic sky diffuse
    const diffuseIsotropic = irradiance.dhi * skyViewFactor * (1 - f1);

    // Circumsolar (around sun)
    const diffuseCircumsolar = irradiance.dhi * f1 * (a / b);

    // Horizon brightening
    const diffuseHorizon = irradiance.dhi * f2 * sinTilt;

    diffuse = Math.max(0, diffuseIsotropic + diffuseCircumsolar + diffuseHorizon);
  }

  // ========== Ground Reflected Component ==========
  const groundViewFactor = (1 - cosTilt) / 2;
  const reflected = irradiance.ghi * albedo * groundViewFactor;

  // ========== Total POA ==========
  const total = beam + diffuse + reflected;

  // ========== IAM Correction ==========
  const iam = calculateIAM(aoi);
  const effectiveBeam = beam * iam;
  // IAM for diffuse is typically ~0.97 (average over hemisphere)
  const iamDiffuse = 0.97;
  const effectiveDiffuse = diffuse * iamDiffuse;
  const effectiveIrradiance = effectiveBeam + effectiveDiffuse + reflected;

  return {
    total: Math.max(0, total),
    beam: Math.max(0, beam),
    diffuse: Math.max(0, diffuse),
    reflected: Math.max(0, reflected),
    angleOfIncidence: aoi,
    effectiveIrradiance: Math.max(0, effectiveIrradiance),
  };
}

// ============================================================
// DC Power Calculation
// ============================================================

/**
 * Calculate DC power output from panels
 *
 * @param poaIrradiance - POA irradiance data
 * @param panelConfig - Panel configuration
 * @param ambientTemp - Ambient temperature (°C)
 * @param systemLosses - System loss factors
 * @returns DC power in Watts and loss factors
 */
export function calculateDCPower(
  poaIrradiance: POAIrradiance,
  panelConfig: PanelConfig,
  ambientTemp: number,
  systemLosses: SystemLosses = DEFAULT_SYSTEM_LOSSES
): { dcPower: number; cellTemp: number; losses: LossFactors } {
  if (poaIrradiance.effectiveIrradiance <= 0) {
    return {
      dcPower: 0,
      cellTemp: ambientTemp,
      losses: {
        temperature: 1,
        incidenceAngle: 1,
        spectral: 1,
        systemTotal: calculateSystemLossFactor(systemLosses),
        inverterClipping: 0,
      },
    };
  }

  const stcIrradiance = 1000; // W/m² at STC

  // Calculate cell temperature
  const cellTemp = calculateCellTemperature(
    ambientTemp,
    poaIrradiance.total,
    panelConfig.noct
  );

  // Temperature derating
  const tempFactor = calculateTempDerating(cellTemp, panelConfig.tempCoefficient);

  // IAM is already applied in effectiveIrradiance
  const iamFactor = poaIrradiance.effectiveIrradiance / (poaIrradiance.total || 1);

  // System losses
  const systemFactor = calculateSystemLossFactor(systemLosses);

  // DC power calculation
  // Power is proportional to effective irradiance, adjusted for temperature and losses
  const irradianceFactor = poaIrradiance.effectiveIrradiance / stcIrradiance;
  const dcPower = panelConfig.ratedPower * irradianceFactor * tempFactor * systemFactor;

  return {
    dcPower: Math.max(0, dcPower),
    cellTemp,
    losses: {
      temperature: tempFactor,
      incidenceAngle: iamFactor,
      spectral: 1,
      systemTotal: systemFactor,
      inverterClipping: 0,
    },
  };
}

/**
 * Calculate AC power output after inverter
 */
export function calculatePanelPower(
  poaIrradiance: POAIrradiance,
  panelConfig: PanelConfig,
  ambientTemp: number,
  panelCount: number = 1,
  systemLosses: SystemLosses = DEFAULT_SYSTEM_LOSSES,
  inverterConfig: InverterConfig = DEFAULT_INVERTER_CONFIG
): { acPower: number; dcPower: number; cellTemp: number; losses: LossFactors } {
  const { dcPower, cellTemp, losses } = calculateDCPower(
    poaIrradiance,
    panelConfig,
    ambientTemp,
    systemLosses
  );

  const totalDCPower = dcPower * panelCount;
  const dcCapacity = panelConfig.ratedPower * panelCount;

  const inverterResult = calculateInverterOutput(
    totalDCPower,
    inverterConfig,
    dcCapacity
  );

  // Update losses with clipping
  const clippingPercentage = totalDCPower > 0
    ? (inverterResult.clippingLoss / totalDCPower) * 100
    : 0;

  return {
    acPower: inverterResult.acPower,
    dcPower: totalDCPower,
    cellTemp,
    losses: {
      ...losses,
      inverterClipping: clippingPercentage,
    },
  };
}

// ============================================================
// Daily Power Calculation
// ============================================================

/**
 * Calculate full day power output with hourly data
 */
export function calculateDailyPowerOutput(
  hourlyIrradiance: Irradiance[],
  hourlyPositions: SolarPosition[],
  panelConfig: PanelConfig,
  orientation: PanelOrientation,
  panelCount: number,
  ambientTemp: number,
  albedo: number = 0.2,
  systemLosses: SystemLosses = DEFAULT_SYSTEM_LOSSES,
  inverterConfig: InverterConfig = DEFAULT_INVERTER_CONFIG,
  _timezone: string = 'UTC'
): PowerOutput {
  const hourlyData: HourlyData[] = [];
  let peakPower = 0;
  let peakHour = 12;
  let totalEnergy = 0;

  for (let hour = 0; hour < 24; hour++) {
    const irradiance = hourlyIrradiance[hour];
    const position = hourlyPositions[hour];

    const poaIrradiance = calculatePOAIrradiance(
      irradiance,
      position.zenith,
      position.azimuth,
      orientation.tilt,
      orientation.azimuth,
      albedo
    );

    const { acPower, dcPower, cellTemp, losses } = calculatePanelPower(
      poaIrradiance,
      panelConfig,
      ambientTemp,
      panelCount,
      systemLosses,
      inverterConfig
    );

    // Create local time for this hour
    const localTime = new Date();
    localTime.setHours(hour, 0, 0, 0);

    hourlyData.push({
      hour,
      localTime,
      solarPosition: position,
      irradiance,
      poaIrradiance,
      cellTemperature: cellTemp,
      dcPower,
      acPower,
      losses,
    });

    if (acPower > peakPower) {
      peakPower = acPower;
      peakHour = hour;
    }

    // Energy is power × time (1 hour)
    totalEnergy += acPower;
  }

  // Calculate capacity factor and performance ratio
  const ratedCapacity = panelConfig.ratedPower * panelCount;
  const maxPossibleEnergy = ratedCapacity * 24;
  const capacityFactor = totalEnergy / maxPossibleEnergy;

  // Performance ratio: actual energy / (irradiance × capacity / STC irradiance)
  const totalPOAIrradiance = hourlyData.reduce(
    (sum, h) => sum + h.poaIrradiance.total,
    0
  );
  const theoreticalEnergy = (totalPOAIrradiance / 1000) * ratedCapacity;
  const performanceRatio = theoreticalEnergy > 0 ? totalEnergy / theoreticalEnergy : 0;

  return {
    instantPower: 0, // Set by caller for current time
    peakPower,
    peakHour,
    dailyEnergy: totalEnergy,
    hourlyData,
    capacityFactor,
    performanceRatio,
  };
}

// ============================================================
// Optimal Orientation
// ============================================================

/**
 * Calculate optimal panel tilt for annual energy
 *
 * Rule of thumb: optimal tilt ≈ latitude × 0.87 + 3.1°
 * This is a simplification; actual optimal depends on local climate
 */
export function calculateOptimalTilt(latitude: number): number {
  const optimalTilt = Math.abs(latitude) * 0.87 + 3.1;
  return Math.max(0, Math.min(90, optimalTilt));
}

/**
 * Calculate optimal panel azimuth
 *
 * Northern hemisphere: face south (180°)
 * Southern hemisphere: face north (0°)
 */
export function calculateOptimalAzimuth(latitude: number): number {
  return latitude >= 0 ? 180 : 0;
}

/**
 * Check if orientation is already optimal (within tolerance)
 */
export function isOrientationOptimal(
  currentTilt: number,
  currentAzimuth: number,
  latitude: number,
  tolerance: number = 1
): boolean {
  const optimalTilt = calculateOptimalTilt(latitude);
  const optimalAzimuth = calculateOptimalAzimuth(latitude);

  const tiltDiff = Math.abs(currentTilt - optimalTilt);
  const azimuthDiff = Math.min(
    Math.abs(currentAzimuth - optimalAzimuth),
    360 - Math.abs(currentAzimuth - optimalAzimuth)
  );

  return tiltDiff <= tolerance && azimuthDiff <= tolerance;
}

/**
 * Calculate seasonal optimal tilt
 *
 * @param latitude - Location latitude
 * @param season - 'summer' | 'winter' | 'spring' | 'fall'
 */
export function calculateSeasonalOptimalTilt(
  latitude: number,
  season: 'summer' | 'winter' | 'spring' | 'fall'
): number {
  const absLat = Math.abs(latitude);

  switch (season) {
    case 'summer':
      // Flatter for high sun
      return Math.max(0, absLat - 15);
    case 'winter':
      // Steeper for low sun
      return Math.min(90, absLat + 15);
    case 'spring':
    case 'fall':
    default:
      // Equinox - roughly equal to latitude
      return absLat;
  }
}
