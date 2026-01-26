import { useMemo } from 'react';
import { useSimulatorStore, selectSystemSize, selectDaylightHours } from '../store/simulatorStore';
import { formatTimeInTimezone, getLocalHourFromUtc } from '../core/timezone';

export interface SolarSummary {
  // Current output
  instantPower: number;
  dailyEnergy: number;
  weeklyEnergy: number;
  monthlyEnergy: number;
  yearlyEnergy: number;

  // Peak values
  peakPower: number;
  peakHour: number;

  // Performance
  capacityFactor: number;
  performanceRatio: number;

  // Sun times (formatted for display)
  sunriseLocal: string;
  sunsetLocal: string;
  solarNoonLocal: string;
  daylightHours: number;

  // Sun times as local hours (0-23.99) for chart markers
  sunriseHour: number;
  sunsetHour: number;
  solarNoonHour: number;

  // Financial estimates
  dailySavings: number;
  yearlySavings: number;
  dailyCO2Offset: number;
  yearlyCO2Offset: number;

  // System info
  systemSizeKW: number;
  currentTimeLocal: string;
}

export function useSolarCalculation() {
  const {
    location,
    date,
    animationHour,
    panelConfig,
    orientation,
    panelCount,
    solarPosition,
    irradiance,
    poaIrradiance,
    instantPower,
    dailyOutput,
    currentLosses,
    cellTemperature,
    isNight,
    isTwilight,
    isOptimal,
    currentTimeLocal,
  } = useSimulatorStore();

  const systemSize = useSimulatorStore(selectSystemSize);
  const daylightHours = useSimulatorStore(selectDaylightHours);

  const summary = useMemo((): SolarSummary | null => {
    if (!dailyOutput || !solarPosition) {
      return null;
    }

    const weeklyEnergy = dailyOutput.dailyEnergy * 7;
    const monthlyEnergy = dailyOutput.dailyEnergy * 30;
    const yearlyEnergy = dailyOutput.dailyEnergy * 365;

    // Electricity cost savings (assuming $0.15/kWh)
    const electricityRate = 0.15;
    const dailySavings = (dailyOutput.dailyEnergy / 1000) * electricityRate;
    const yearlySavings = (yearlyEnergy / 1000) * electricityRate;

    // CO2 offset (assuming 0.42 kg CO2/kWh for US average)
    const co2PerKwh = 0.42;
    const dailyCO2Offset = (dailyOutput.dailyEnergy / 1000) * co2PerKwh;
    const yearlyCO2Offset = (yearlyEnergy / 1000) * co2PerKwh;

    // Format times for display
    const sunriseLocal = formatTimeInTimezone(solarPosition.sunrise, location.timezone, 'time');
    const sunsetLocal = formatTimeInTimezone(solarPosition.sunset, location.timezone, 'time');
    const solarNoonLocal = formatTimeInTimezone(solarPosition.solarNoon, location.timezone, 'time');

    // Compute local hours for chart markers (more reliable than string parsing)
    const sunriseHour = getLocalHourFromUtc(solarPosition.sunrise, location.timezone);
    const sunsetHour = getLocalHourFromUtc(solarPosition.sunset, location.timezone);
    const solarNoonHour = getLocalHourFromUtc(solarPosition.solarNoon, location.timezone);

    return {
      instantPower,
      dailyEnergy: dailyOutput.dailyEnergy,
      weeklyEnergy,
      monthlyEnergy,
      yearlyEnergy,
      peakPower: dailyOutput.peakPower,
      peakHour: dailyOutput.peakHour,
      capacityFactor: dailyOutput.capacityFactor,
      performanceRatio: dailyOutput.performanceRatio,
      sunriseLocal,
      sunsetLocal,
      solarNoonLocal,
      daylightHours,
      sunriseHour,
      sunsetHour,
      solarNoonHour,
      dailySavings,
      yearlySavings,
      dailyCO2Offset,
      yearlyCO2Offset,
      systemSizeKW: systemSize,
      currentTimeLocal,
    };
  }, [dailyOutput, solarPosition, instantPower, location.timezone, daylightHours, systemSize, currentTimeLocal]);

  // Hourly power data for charts
  const hourlyPowerData = useMemo(() => {
    if (!dailyOutput) return [];
    return dailyOutput.hourlyData.map((h, index) => ({
      hour: index,
      power: h.acPower,
      dcPower: h.dcPower,
      irradiance: h.poaIrradiance.total,
      temperature: h.cellTemperature,
      isNight: h.solarPosition.isNight,
    }));
  }, [dailyOutput]);

  // Cumulative energy data
  const cumulativeEnergyData = useMemo(() => {
    if (!dailyOutput) return [];
    let cumulative = 0;
    return dailyOutput.hourlyData.map((h, index) => {
      cumulative += h.acPower;
      return {
        hour: index,
        energy: cumulative,
      };
    });
  }, [dailyOutput]);

  return {
    // State
    location,
    date,
    animationHour,
    panelConfig,
    orientation,
    panelCount,

    // Calculated values
    solarPosition,
    irradiance,
    poaIrradiance,
    instantPower,
    dailyOutput,
    currentLosses,
    cellTemperature,

    // Derived state
    isNight,
    isTwilight,
    isOptimal,
    currentTimeLocal,
    systemSize,
    daylightHours,

    // Summaries
    summary,
    hourlyPowerData,
    cumulativeEnergyData,
  };
}
