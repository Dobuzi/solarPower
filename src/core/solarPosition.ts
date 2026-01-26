/**
 * Solar Position Calculator
 *
 * Implements the NOAA Solar Position Algorithm for calculating:
 * - Sun elevation and azimuth
 * - Sunrise, sunset, and solar noon times
 * - Civil, nautical, and astronomical twilight
 *
 * All calculations are performed in UTC. Times are returned as UTC Date objects.
 *
 * References:
 * - NOAA Solar Calculator: https://gml.noaa.gov/grad/solcalc/calcdetails.html
 * - Astronomical Algorithms, Jean Meeus (1991)
 */

import { SolarPosition } from './types';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

// ============================================================
// Julian Day Calculations
// ============================================================

/**
 * Calculate Julian Day from a JavaScript Date (UTC)
 */
export function dateToJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  return jdn + (hour - 12) / 24;
}

/**
 * Calculate Julian Century from Julian Day
 */
function julianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

// ============================================================
// NOAA Solar Position Algorithm
// ============================================================

/**
 * Calculate solar position for a given date, latitude, and longitude
 *
 * @param date - Date/time in UTC
 * @param latitude - Latitude in degrees (positive = north)
 * @param longitude - Longitude in degrees (positive = east)
 * @returns SolarPosition with all calculated values
 */
export function calculateSolarPosition(
  date: Date,
  latitude: number,
  longitude: number
): SolarPosition {
  const jd = dateToJulianDay(date);
  const t = julianCentury(jd);

  // Geometric Mean Longitude of the Sun (degrees)
  let L0 = 280.46646 + t * (36000.76983 + 0.0003032 * t);
  L0 = ((L0 % 360) + 360) % 360;

  // Geometric Mean Anomaly of the Sun (degrees)
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const Mrad = M * DEG_TO_RAD;

  // Eccentricity of Earth's Orbit
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  // Sun's Equation of the Center (degrees)
  const C = Math.sin(Mrad) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * Mrad) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * Mrad) * 0.000289;

  // Sun's True Longitude (degrees)
  const sunTrueLong = L0 + C;

  // Sun's Apparent Longitude (degrees)
  const omega = 125.04 - 1934.136 * t;
  const sunApparentLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG_TO_RAD);

  // Mean Obliquity of the Ecliptic (degrees)
  const meanObliq = 23 + (26 + ((21.448 - t * (46.8150 + t * (0.00059 - t * 0.001813)))) / 60) / 60;

  // Obliquity Correction (degrees)
  const obliqCorr = meanObliq + 0.00256 * Math.cos(omega * DEG_TO_RAD);
  const obliqCorrRad = obliqCorr * DEG_TO_RAD;

  // Sun's Declination (degrees)
  const declination = Math.asin(Math.sin(obliqCorrRad) * Math.sin(sunApparentLong * DEG_TO_RAD)) * RAD_TO_DEG;
  const declinationRad = declination * DEG_TO_RAD;

  // Equation of Time (minutes)
  const y = Math.tan(obliqCorrRad / 2) ** 2;
  const L0rad = L0 * DEG_TO_RAD;
  const eqTime = 4 * RAD_TO_DEG * (
    y * Math.sin(2 * L0rad) -
    2 * e * Math.sin(Mrad) +
    4 * e * y * Math.sin(Mrad) * Math.cos(2 * L0rad) -
    0.5 * y * y * Math.sin(4 * L0rad) -
    1.25 * e * e * Math.sin(2 * Mrad)
  );

  // True Solar Time (minutes)
  const timeOffset = eqTime + 4 * longitude;
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  let trueSolarTime = utcMinutes + timeOffset;
  trueSolarTime = ((trueSolarTime % 1440) + 1440) % 1440;

  // Hour Angle (degrees)
  let hourAngle = trueSolarTime / 4 - 180;
  if (hourAngle < -180) hourAngle += 360;
  const hourAngleRad = hourAngle * DEG_TO_RAD;

  const latRad = latitude * DEG_TO_RAD;

  // Solar Zenith Angle (degrees)
  const cosZenith = Math.sin(latRad) * Math.sin(declinationRad) +
    Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
  const zenith = Math.acos(Math.max(-1, Math.min(1, cosZenith))) * RAD_TO_DEG;
  const elevation = 90 - zenith;

  // Solar Azimuth Angle (degrees clockwise from north)
  let azimuth: number;
  const sinZenith = Math.sin(zenith * DEG_TO_RAD);

  if (Math.abs(sinZenith) < 0.0001) {
    azimuth = latitude >= 0 ? 180 : 0;
  } else {
    const cosAzimuth = (Math.sin(latRad) * cosZenith - Math.sin(declinationRad)) /
      (Math.cos(latRad) * sinZenith);
    const azimuthAngle = Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * RAD_TO_DEG;

    if (hourAngle > 0) {
      azimuth = (azimuthAngle + 180) % 360;
    } else {
      azimuth = (540 - azimuthAngle) % 360;
    }
  }

  // Calculate sunrise, sunset, solar noon
  const haRise = calculateHourAngle(latitude, declination, 90.833);
  const { sunrise, sunset, solarNoon } = calculateSunTimes(date, longitude, eqTime, haRise);

  // Calculate civil twilight (sun between -6° and 0°)
  const haCivilTwilight = calculateHourAngle(latitude, declination, 96); // 90 + 6
  const civilTwilight = calculateTwilightTimes(date, longitude, eqTime, haCivilTwilight);

  // Is it night? (sun below horizon)
  const isNight = elevation < 0;

  return {
    elevation,
    azimuth,
    zenith,
    declination,
    hourAngle,
    sunrise,
    sunset,
    solarNoon,
    isNight,
    civilTwilight,
  };
}

// ============================================================
// Hour Angle Calculations
// ============================================================

/**
 * Calculate hour angle for a given zenith angle
 *
 * @param latitude - Latitude in degrees
 * @param declination - Solar declination in degrees
 * @param zenithAngle - Target zenith angle in degrees
 *   - 90.833° = sunrise/sunset (accounts for refraction)
 *   - 96° = civil twilight (sun 6° below horizon)
 *   - 102° = nautical twilight (sun 12° below horizon)
 *   - 108° = astronomical twilight (sun 18° below horizon)
 * @returns Hour angle in degrees (0 = never rises, 180 = never sets)
 */
function calculateHourAngle(latitude: number, declination: number, zenithAngle: number): number {
  const latRad = latitude * DEG_TO_RAD;
  const decRad = declination * DEG_TO_RAD;
  const zenithRad = zenithAngle * DEG_TO_RAD;

  const cosHA = (Math.cos(zenithRad) / (Math.cos(latRad) * Math.cos(decRad))) -
    (Math.tan(latRad) * Math.tan(decRad));

  if (cosHA > 1) return 0; // Sun never reaches this angle (polar night)
  if (cosHA < -1) return 180; // Sun never goes below this angle (midnight sun)

  return Math.acos(cosHA) * RAD_TO_DEG;
}

/**
 * Calculate sunrise, sunset, and solar noon times (UTC)
 */
function calculateSunTimes(
  date: Date,
  longitude: number,
  eqTime: number,
  haRise: number
): { sunrise: Date; sunset: Date; solarNoon: Date } {
  // Solar noon in minutes from midnight UTC
  const noonMinutes = 720 - 4 * longitude - eqTime;

  const sunriseMinutes = noonMinutes - 4 * haRise;
  const sunsetMinutes = noonMinutes + 4 * haRise;

  const baseDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));

  const sunrise = new Date(baseDate.getTime() + sunriseMinutes * 60000);
  const sunset = new Date(baseDate.getTime() + sunsetMinutes * 60000);
  const solarNoon = new Date(baseDate.getTime() + noonMinutes * 60000);

  return { sunrise, sunset, solarNoon };
}

/**
 * Calculate twilight start and end times (UTC)
 */
function calculateTwilightTimes(
  date: Date,
  longitude: number,
  eqTime: number,
  haTwilight: number
): { start: Date; end: Date } {
  const noonMinutes = 720 - 4 * longitude - eqTime;

  // Morning twilight starts before sunrise
  const startMinutes = noonMinutes - 4 * haTwilight;
  // Evening twilight ends after sunset
  const endMinutes = noonMinutes + 4 * haTwilight;

  const baseDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));

  return {
    start: new Date(baseDate.getTime() + startMinutes * 60000),
    end: new Date(baseDate.getTime() + endMinutes * 60000),
  };
}

// ============================================================
// Optimal Orientation Calculations
// ============================================================

/**
 * Calculate optimal panel tilt for annual energy production
 *
 * Rule of thumb: optimal tilt ≈ |latitude| × 0.87 + 3.1°
 * This is a simplification; actual optimal depends on local climate and goals.
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

// ============================================================
// Utility Functions
// ============================================================

/**
 * Get the current season based on date and hemisphere
 */
export function getSeason(date: Date, latitude: number): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = date.getMonth();
  const isNorthern = latitude >= 0;

  if (month >= 2 && month <= 4) {
    return isNorthern ? 'spring' : 'fall';
  } else if (month >= 5 && month <= 7) {
    return isNorthern ? 'summer' : 'winter';
  } else if (month >= 8 && month <= 10) {
    return isNorthern ? 'fall' : 'spring';
  } else {
    return isNorthern ? 'winter' : 'summer';
  }
}

/**
 * Calculate daylight duration in hours
 */
export function getDaylightHours(sunrise: Date, sunset: Date): number {
  return (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);
}

/**
 * Check if a time is during civil twilight
 */
export function isDuringTwilight(
  date: Date,
  civilTwilight: { start: Date; end: Date },
  sunrise: Date,
  sunset: Date
): boolean {
  const time = date.getTime();

  // Morning twilight: between civil twilight start and sunrise
  if (time >= civilTwilight.start.getTime() && time < sunrise.getTime()) {
    return true;
  }

  // Evening twilight: between sunset and civil twilight end
  if (time > sunset.getTime() && time <= civilTwilight.end.getTime()) {
    return true;
  }

  return false;
}
