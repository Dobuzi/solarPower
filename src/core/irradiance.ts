/**
 * Clear-Sky Irradiance Models
 *
 * Implements the Ineichen-Perez clear-sky model for calculating:
 * - GHI (Global Horizontal Irradiance)
 * - DNI (Direct Normal Irradiance)
 * - DHI (Diffuse Horizontal Irradiance)
 *
 * References:
 * - Ineichen & Perez (2002): A new airmass independent formulation for the Linke turbidity coefficient
 * - Perez et al. (1990): Modeling daylight availability and irradiance components from direct and global irradiance
 */

import { Irradiance } from './types';
import {
  calculateAirMass,
  calculateExtraterrestrialIrradiance,
  getDayOfYear,
} from './atmosphere';

const DEG_TO_RAD = Math.PI / 180;

// ============================================================
// Ineichen-Perez Clear-Sky Model
// ============================================================

/**
 * Calculate clear-sky irradiance using the Ineichen-Perez model
 *
 * Based on PVLIB's validated implementation.
 * Reference: Ineichen & Perez (2002) "A new airmass independent formulation"
 *
 * @param date - Date/time (UTC)
 * @param zenith - Solar zenith angle (degrees)
 * @param altitude - Site elevation above sea level (meters)
 * @param linkeTurbidity - Linke turbidity factor (typical 2-5, default 3)
 */
export function calculateIrradiance(
  date: Date,
  zenith: number,
  linkeTurbidity: number = 3,
  altitude: number = 0
): Irradiance {
  const dayOfYear = getDayOfYear(date);
  const extraterrestrial = calculateExtraterrestrialIrradiance(dayOfYear);

  // No irradiance when sun is below horizon
  if (zenith >= 90) {
    return {
      ghi: 0,
      dni: 0,
      dhi: 0,
      extraterrestrial,
      airMass: Infinity,
      clearnessIndex: 0,
    };
  }

  const zenithRad = zenith * DEG_TO_RAD;
  const cosZenith = Math.cos(zenithRad);

  // Air mass calculation (Kasten-Young formula)
  const airMass = calculateAirMass(zenith);

  // Altitude correction factors (altitude in meters)
  // fh1: beam transmittance factor
  const fh1 = Math.exp(-altitude / 8000);
  // fh2: diffuse factor
  const fh2 = Math.exp(-altitude / 1250);

  // Ineichen-Perez model coefficients
  // b: beam enhancement factor (accounts for circumsolar at low zenith)
  const b = 0.664 + 0.163 / fh1;

  // Turbidity coefficients for GHI and DHI calculation
  // cg1 and cg2 are empirical coefficients from Ineichen (2002)
  const cg1 = 5.09e-5 * altitude + 0.868;
  const cg2 = 3.92e-5 * altitude + 0.0387;

  // Direct Normal Irradiance (DNI) using Ineichen-Perez model
  // The key coefficient for beam attenuation is 0.09 (not cg1!)
  // DNI = b × I0 × exp(-c × AM × TL × fh1)
  // where c ≈ 0.09 for the standard Linke turbidity scale
  const dniClearSky = b * extraterrestrial * Math.exp(
    -0.09 * airMass * linkeTurbidity * fh1
  );

  // Global Horizontal Irradiance (GHI) using empirical model
  // GHI from Ineichen (2002) Eq. 3
  const ghiClearSky = cg1 * extraterrestrial * cosZenith * Math.exp(
    -cg2 * airMass * (fh1 + fh2 * (linkeTurbidity - 1))
  );

  // Diffuse Horizontal Irradiance (DHI)
  // DHI = GHI - DNI × cos(zenith)
  // Ensure it doesn't go negative
  let dhi = ghiClearSky - dniClearSky * cosZenith;

  // Ensure minimum diffuse when sun is up (Rayleigh scattering minimum)
  const minDhi = 0.065 * extraterrestrial * cosZenith;
  dhi = Math.max(dhi, minDhi);

  // Recalculate GHI to be consistent
  const ghi = dniClearSky * cosZenith + dhi;

  // Clearness index (Kt)
  const extraterrestrialHorizontal = extraterrestrial * cosZenith;
  const clearnessIndex = extraterrestrialHorizontal > 0 ? ghi / extraterrestrialHorizontal : 0;

  return {
    ghi: Math.max(0, ghi),
    dni: Math.max(0, dniClearSky),
    dhi: Math.max(0, dhi),
    extraterrestrial,
    airMass,
    clearnessIndex: Math.min(1, Math.max(0, clearnessIndex)),
  };
}

// ============================================================
// Perez Diffuse Sky Model (for POA calculations)
// ============================================================

/**
 * Coefficients for Perez diffuse irradiance model
 * Based on clearness bins (epsilon)
 */
const PEREZ_COEFFICIENTS = [
  // [f11, f12, f13, f21, f22, f23] for each clearness bin
  [-0.0083, 0.5877, -0.0621, -0.0596, 0.0721, -0.0220], // 1.000-1.065
  [0.1299, 0.6826, -0.1514, -0.0189, 0.0660, -0.0289],  // 1.065-1.230
  [0.3297, 0.4869, -0.2211, 0.0554, -0.0640, -0.0261], // 1.230-1.500
  [0.5682, 0.1875, -0.2951, 0.1089, -0.1519, -0.0140], // 1.500-1.950
  [0.8730, -0.3920, -0.3616, 0.2256, -0.4620, 0.0012], // 1.950-2.800
  [1.1326, -1.2367, -0.4118, 0.2878, -0.8230, 0.0559], // 2.800-4.500
  [1.0602, -1.5999, -0.3589, 0.2642, -1.1272, 0.1311], // 4.500-6.200
  [0.6777, -0.3273, -0.2504, 0.1561, -1.3765, 0.2506], // 6.200+
];

/**
 * Calculate Perez sky clearness (epsilon)
 */
export function calculateClearness(dhi: number, dni: number, zenith: number): number {
  if (dhi === 0) return 1;
  const zenithRad = zenith * DEG_TO_RAD;
  const kappa = 1.041;
  const zenith3 = Math.pow(zenithRad, 3);
  return ((dhi + dni) / dhi + kappa * zenith3) / (1 + kappa * zenith3);
}

/**
 * Calculate Perez sky brightness (delta)
 */
export function calculateBrightness(dhi: number, extraterrestrial: number, airMass: number): number {
  if (extraterrestrial === 0) return 0;
  return dhi * airMass / extraterrestrial;
}

/**
 * Get Perez model coefficients for a given clearness value
 */
export function getPerezCoefficients(epsilon: number): number[] {
  const bins = [1.065, 1.23, 1.5, 1.95, 2.8, 4.5, 6.2];
  let bin = 0;
  for (let i = 0; i < bins.length; i++) {
    if (epsilon < bins[i]) break;
    bin = i + 1;
  }
  return PEREZ_COEFFICIENTS[Math.min(bin, PEREZ_COEFFICIENTS.length - 1)];
}

/**
 * Calculate Perez model F1 (circumsolar) and F2 (horizon) coefficients
 */
export function calculatePerezBrightness(
  epsilon: number,
  delta: number,
  zenith: number
): { f1: number; f2: number } {
  const coeffs = getPerezCoefficients(epsilon);
  const zenithRad = Math.min(zenith, 87) * DEG_TO_RAD;

  const f1 = Math.max(0, coeffs[0] + coeffs[1] * delta + coeffs[2] * zenithRad);
  const f2 = coeffs[3] + coeffs[4] * delta + coeffs[5] * zenithRad;

  return { f1, f2 };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Calculate irradiance for each hour of a day
 */
export function calculateDailyIrradiance(
  date: Date,
  getZenith: (date: Date) => number,
  linkeTurbidity: number = 3,
  altitude: number = 0
): Irradiance[] {
  const results: Irradiance[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const hourDate = new Date(date);
    hourDate.setUTCHours(hour, 30, 0, 0); // Use mid-hour for better accuracy

    const zenith = getZenith(hourDate);
    results.push(calculateIrradiance(hourDate, zenith, linkeTurbidity, altitude));
  }

  return results;
}

/**
 * Estimate Linke turbidity from typical atmospheric conditions
 */
export function estimateLinkeTurbidity(
  humidity: 'low' | 'medium' | 'high',
  aerosols: 'clean' | 'average' | 'polluted'
): number {
  const baseValues = {
    'low': { 'clean': 2.0, 'average': 2.5, 'polluted': 3.5 },
    'medium': { 'clean': 2.5, 'average': 3.0, 'polluted': 4.0 },
    'high': { 'clean': 3.0, 'average': 4.0, 'polluted': 5.0 },
  };
  return baseValues[humidity][aerosols];
}
