/**
 * Atmospheric calculations for solar irradiance modeling
 */

/**
 * Calculate air mass using Kasten-Young formula
 * @param zenith - Solar zenith angle in degrees
 * @returns Air mass (dimensionless)
 */
export function calculateAirMass(zenith: number): number {
  if (zenith >= 90) return Infinity;

  const zenithRad = zenith * Math.PI / 180;
  const cosZenith = Math.cos(zenithRad);

  // Kasten-Young formula (1989) - accurate for zenith angles up to 90°
  const airMass = 1 / (cosZenith + 0.50572 * Math.pow(96.07995 - zenith, -1.6364));

  return Math.max(1, airMass);
}

/**
 * Calculate atmospheric transmittance for beam radiation
 * Using simplified Ineichen-Perez clear-sky model
 * @param airMass - Air mass
 * @param linkeTurbidity - Linke turbidity factor (typically 2-5, default 3)
 * @returns Beam transmittance (0-1)
 */
export function calculateBeamTransmittance(airMass: number, linkeTurbidity: number = 3): number {
  if (!isFinite(airMass)) return 0;

  // Simplified Beer-Lambert based transmittance
  const b = 0.664 + 0.163 / linkeTurbidity;
  const transmittance = Math.exp(-b * airMass * (linkeTurbidity / 10));

  return Math.max(0, Math.min(1, transmittance));
}

/**
 * Calculate diffuse fraction based on clearness index
 * Using Erbs correlation
 * @param clearnessIndex - Ratio of GHI to extraterrestrial irradiance (0-1)
 * @returns Diffuse fraction (0-1)
 */
export function calculateDiffuseFraction(clearnessIndex: number): number {
  const kt = Math.max(0, Math.min(1, clearnessIndex));

  if (kt <= 0.22) {
    return 1.0 - 0.09 * kt;
  } else if (kt <= 0.80) {
    return 0.9511 - 0.1604 * kt + 4.388 * kt ** 2 -
           16.638 * kt ** 3 + 12.336 * kt ** 4;
  } else {
    return 0.165;
  }
}

/**
 * Calculate extraterrestrial irradiance on a surface normal to sun rays
 * Accounts for Earth-Sun distance variation
 * @param dayOfYear - Day of year (1-365)
 * @returns Extraterrestrial irradiance (W/m²)
 */
export function calculateExtraterrestrialIrradiance(dayOfYear: number): number {
  const solarConstant = 1361; // W/m² (updated value)

  // Earth-Sun distance correction factor
  const B = (2 * Math.PI * (dayOfYear - 1)) / 365;
  const eccentricityFactor = 1.00011 + 0.034221 * Math.cos(B) +
                             0.00128 * Math.sin(B) +
                             0.000719 * Math.cos(2 * B) +
                             0.000077 * Math.sin(2 * B);

  return solarConstant * eccentricityFactor;
}

/**
 * Get day of year from a Date object
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
