/**
 * PV System Loss Models
 *
 * Implements various loss mechanisms for accurate energy prediction:
 * - Temperature derating (NOCT-based cell temperature)
 * - Incidence Angle Modifier (IAM) - ASHRAE model
 * - Soiling losses
 * - System losses (wiring, mismatch, etc.)
 * - Inverter efficiency and clipping
 *
 * References:
 * - King et al. (2004): Photovoltaic Array Performance Model
 * - De Soto et al. (2006): Improvement and validation of a model for photovoltaic array performance
 */

import { SystemLosses, LossFactors, InverterConfig, PanelConfig } from './types';

// ============================================================
// Default Loss Values
// ============================================================

export const DEFAULT_SYSTEM_LOSSES: SystemLosses = {
  soiling: 0.02, // 2% - typical for moderate cleaning schedule
  shading: 0.0, // 0% - no shading (user can adjust)
  mismatch: 0.02, // 2% - module mismatch
  wiring: 0.02, // 2% - DC wiring losses
  connections: 0.005, // 0.5% - connection losses
  lidDegradation: 0.015, // 1.5% - light-induced degradation (first year)
  nameplateDerate: 0.01, // 1% - manufacturer tolerance
  availability: 0.003, // 0.3% - system downtime
};

export const DEFAULT_INVERTER_CONFIG: InverterConfig = {
  efficiency: 0.96, // 96% typical modern inverter
  acCapacity: 0, // Will be calculated from panel config
  dcAcRatio: 1.2, // Typical DC/AC ratio
};

// ============================================================
// Temperature Derating
// ============================================================

/**
 * Calculate cell temperature using the NOCT method
 *
 * @param ambientTemp - Ambient temperature (°C)
 * @param irradiance - Plane-of-array irradiance (W/m²)
 * @param noct - Nominal Operating Cell Temperature (°C)
 * @param windSpeed - Wind speed (m/s) - optional, affects cooling
 * @returns Cell temperature (°C)
 */
export function calculateCellTemperature(
  ambientTemp: number,
  irradiance: number,
  noct: number = 45,
  windSpeed: number = 1
): number {
  if (irradiance <= 0) return ambientTemp;

  // NOCT conditions: 800 W/m², 20°C ambient, 1 m/s wind
  const noctIrradiance = 800;
  const noctAmbient = 20;

  // Wind correction factor (empirical)
  // Higher wind = better cooling
  const windFactor = 1 - 0.1 * Math.min(windSpeed - 1, 5);

  // Cell temperature rise above ambient
  const tempRise = (noct - noctAmbient) * (irradiance / noctIrradiance) * windFactor;

  return ambientTemp + tempRise;
}

/**
 * Calculate temperature derating factor
 *
 * @param cellTemp - Cell temperature (°C)
 * @param tempCoefficient - Temperature coefficient (%/°C, typically -0.35 to -0.45)
 * @param stcTemp - Standard Test Conditions temperature (°C), default 25
 * @returns Derating factor (0-1, where 1 = no derating)
 */
export function calculateTempDerating(
  cellTemp: number,
  tempCoefficient: number,
  stcTemp: number = 25
): number {
  const tempDiff = cellTemp - stcTemp;

  // Temperature coefficient is typically negative (power decreases with temp)
  // Convert from %/°C to factor/°C
  const derating = 1 + (tempCoefficient / 100) * tempDiff;

  // Clamp to reasonable range (can exceed 1 in cold conditions)
  return Math.max(0.5, Math.min(1.15, derating));
}

// ============================================================
// Incidence Angle Modifier (IAM)
// ============================================================

/**
 * Calculate Incidence Angle Modifier using ASHRAE model
 *
 * IAM accounts for reflection losses at the module surface
 * that increase with angle of incidence.
 *
 * @param angleOfIncidence - Angle of incidence (degrees)
 * @param bo - ASHRAE empirical coefficient (typical 0.05 for glass modules)
 * @returns IAM factor (0-1)
 */
export function calculateIAM(
  angleOfIncidence: number,
  bo: number = 0.05
): number {
  // No direct irradiance when AOI >= 90°
  if (angleOfIncidence >= 90) return 0;

  const aoiRad = angleOfIncidence * Math.PI / 180;

  // ASHRAE IAM model
  const iam = 1 - bo * (1 / Math.cos(aoiRad) - 1);

  return Math.max(0, Math.min(1, iam));
}

/**
 * Calculate physical IAM using Martin & Ruiz model
 * More accurate for high angles
 *
 * @param angleOfIncidence - Angle of incidence (degrees)
 * @param ar - Angular losses coefficient (typical 0.16-0.17)
 * @returns IAM factor (0-1)
 */
export function calculateIAMPhysical(
  angleOfIncidence: number,
  ar: number = 0.16
): number {
  if (angleOfIncidence >= 90) return 0;
  if (angleOfIncidence <= 0) return 1;

  const aoiRad = angleOfIncidence * Math.PI / 180;

  // Martin & Ruiz model
  const iam = 1 - Math.exp(-Math.cos(aoiRad) / ar) / (1 - Math.exp(-1 / ar));

  return Math.max(0, Math.min(1, iam));
}

// ============================================================
// System Losses
// ============================================================

/**
 * Calculate combined system loss factor
 *
 * @param losses - System loss configuration
 * @returns Combined loss factor (0-1, multiply by power)
 */
export function calculateSystemLossFactor(losses: SystemLosses): number {
  // Each loss is multiplicative
  return (
    (1 - losses.soiling) *
    (1 - losses.shading) *
    (1 - losses.mismatch) *
    (1 - losses.wiring) *
    (1 - losses.connections) *
    (1 - losses.lidDegradation) *
    (1 - losses.nameplateDerate) *
    (1 - losses.availability)
  );
}

/**
 * Calculate total system losses as a percentage
 */
export function calculateTotalSystemLoss(losses: SystemLosses): number {
  return (1 - calculateSystemLossFactor(losses)) * 100;
}

// ============================================================
// Inverter Model
// ============================================================

/**
 * Calculate inverter output power including efficiency curve and clipping
 *
 * @param dcPower - DC input power (W)
 * @param inverterConfig - Inverter configuration
 * @param dcCapacity - Total DC array capacity (W)
 * @returns Object with AC power and clipping losses
 */
export function calculateInverterOutput(
  dcPower: number,
  inverterConfig: InverterConfig,
  dcCapacity: number
): { acPower: number; clippingLoss: number; efficiency: number } {
  if (dcPower <= 0) {
    return { acPower: 0, clippingLoss: 0, efficiency: 0 };
  }

  // Calculate AC capacity from DC capacity and DC/AC ratio
  const acCapacity = inverterConfig.acCapacity || dcCapacity / inverterConfig.dcAcRatio;

  // Part-load efficiency curve (simplified)
  // Inverters are less efficient at very low loads
  const loadRatio = dcPower / dcCapacity;
  let efficiencyMultiplier = 1;

  if (loadRatio < 0.1) {
    // Low load: reduced efficiency
    efficiencyMultiplier = 0.85 + loadRatio * 1.5;
  } else if (loadRatio < 0.2) {
    efficiencyMultiplier = 0.95 + loadRatio * 0.25;
  }

  const effectiveEfficiency = inverterConfig.efficiency * efficiencyMultiplier;

  // Calculate AC power before clipping
  let acPower = dcPower * effectiveEfficiency;

  // Apply inverter clipping
  let clippingLoss = 0;
  if (acPower > acCapacity) {
    clippingLoss = acPower - acCapacity;
    acPower = acCapacity;
  }

  return {
    acPower,
    clippingLoss,
    efficiency: effectiveEfficiency,
  };
}

// ============================================================
// Combined Loss Calculation
// ============================================================

/**
 * Calculate all loss factors for a given operating point
 */
export function calculateAllLosses(
  ambientTemp: number,
  poaIrradiance: number,
  angleOfIncidence: number,
  panelConfig: PanelConfig,
  systemLosses: SystemLosses,
  windSpeed: number = 1
): LossFactors {
  // Cell temperature
  const cellTemp = calculateCellTemperature(
    ambientTemp,
    poaIrradiance,
    panelConfig.noct,
    windSpeed
  );

  // Temperature derating
  const temperature = calculateTempDerating(
    cellTemp,
    panelConfig.tempCoefficient
  );

  // IAM
  const incidenceAngle = calculateIAM(angleOfIncidence);

  // System losses
  const systemTotal = calculateSystemLossFactor(systemLosses);

  // Spectral correction (simplified - assume 1.0 for clear-sky)
  const spectral = 1.0;

  return {
    temperature,
    incidenceAngle,
    spectral,
    systemTotal,
    inverterClipping: 0, // Calculated separately in power output
  };
}

// ============================================================
// Loss Breakdown for Display
// ============================================================

export interface LossBreakdown {
  name: string;
  percentage: number;
  description: string;
}

/**
 * Get detailed loss breakdown for display
 */
export function getLossBreakdown(
  losses: LossFactors,
  systemLosses: SystemLosses
): LossBreakdown[] {
  const breakdown: LossBreakdown[] = [];

  // Temperature
  if (losses.temperature < 1) {
    breakdown.push({
      name: 'Temperature',
      percentage: (1 - losses.temperature) * 100,
      description: 'Power reduction due to cell heating',
    });
  } else if (losses.temperature > 1) {
    breakdown.push({
      name: 'Temperature (Gain)',
      percentage: -(losses.temperature - 1) * 100,
      description: 'Power gain from cold conditions',
    });
  }

  // IAM
  if (losses.incidenceAngle < 1) {
    breakdown.push({
      name: 'Reflection (IAM)',
      percentage: (1 - losses.incidenceAngle) * 100,
      description: 'Surface reflection at angle of incidence',
    });
  }

  // System losses
  if (systemLosses.soiling > 0) {
    breakdown.push({
      name: 'Soiling',
      percentage: systemLosses.soiling * 100,
      description: 'Dust and debris on panel surface',
    });
  }

  if (systemLosses.shading > 0) {
    breakdown.push({
      name: 'Shading',
      percentage: systemLosses.shading * 100,
      description: 'Partial shading from obstructions',
    });
  }

  if (systemLosses.mismatch > 0) {
    breakdown.push({
      name: 'Mismatch',
      percentage: systemLosses.mismatch * 100,
      description: 'Module-to-module power variation',
    });
  }

  if (systemLosses.wiring > 0) {
    breakdown.push({
      name: 'DC Wiring',
      percentage: systemLosses.wiring * 100,
      description: 'Resistive losses in DC cabling',
    });
  }

  if (losses.inverterClipping > 0) {
    breakdown.push({
      name: 'Inverter Clipping',
      percentage: losses.inverterClipping,
      description: 'Power limited by inverter AC capacity',
    });
  }

  return breakdown;
}
