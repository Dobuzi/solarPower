/**
 * Data Panel Component
 *
 * Displays solar simulation outputs with progressive disclosure.
 * Essential metrics always visible, advanced metrics collapsible.
 *
 * Priority structure:
 * 1. Current Time + Instant Power + Daily Energy (always visible)
 * 2. Power/Energy Charts (collapsible on small screens)
 * 3. Sun Times + Basic Stats (always visible)
 * 4. Advanced Metrics (collapsible)
 */

import { useEffect, useId, useMemo, useRef, useState, lazy, Suspense, memo } from 'react';
import { useSolarCalculation } from '../../hooks/useSolarCalculation';
import { useCompactMode } from '../../hooks/usePanelState';

const LazyPowerChart = lazy(() => import('./PowerChart').then((mod) => ({ default: mod.PowerChart })));
const LazyEnergyChart = lazy(() => import('./EnergyChart').then((mod) => ({ default: mod.EnergyChart })));

// Tooltip component
function Tooltip({ text }: { text: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-solar-500 rounded"
        aria-describedby={id}
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap transition-opacity pointer-events-none z-50 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </span>
    </span>
  );
}

function DataPanelInner() {
  const { summary, solarPosition, poaIrradiance, irradiance, currentLosses, cellTemperature, isNight, currentTimeLocal, location } = useSolarCalculation();
  const isCompact = useCompactMode();
  const [showCharts, setShowCharts] = useState(!isCompact);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [powerUnit, setPowerUnit] = useState<'kW' | 'W'>('kW');
  const [energyUnit, setEnergyUnit] = useState<'kWh' | 'Wh'>('kWh');
  const [decimals, setDecimals] = useState<0 | 1 | 2>(1);
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const hasStoredPrefsRef = useRef(false);

  useEffect(() => {
    try {
      const storedCharts = localStorage.getItem('solar-sim-output-show-charts-v1');
      const storedAdvanced = localStorage.getItem('solar-sim-output-show-advanced-v1');
      const storedPowerUnit = localStorage.getItem('solar-sim-output-power-unit-v1');
      const storedEnergyUnit = localStorage.getItem('solar-sim-output-energy-unit-v1');
      const storedDecimals = localStorage.getItem('solar-sim-output-decimals-v1');
      const storedCurrency = localStorage.getItem('solar-sim-output-currency-v1');
      if (storedCharts !== null) {
        setShowCharts(storedCharts === 'true');
        hasStoredPrefsRef.current = true;
      }
      if (storedAdvanced !== null) {
        setShowAdvanced(storedAdvanced === 'true');
        hasStoredPrefsRef.current = true;
      }
      if (storedPowerUnit === 'kW' || storedPowerUnit === 'W') {
        setPowerUnit(storedPowerUnit);
      }
      if (storedEnergyUnit === 'kWh' || storedEnergyUnit === 'Wh') {
        setEnergyUnit(storedEnergyUnit);
      }
      if (storedDecimals === '0' || storedDecimals === '1' || storedDecimals === '2') {
        setDecimals(Number(storedDecimals) as 0 | 1 | 2);
      }
      if (storedCurrency === 'USD' || storedCurrency === 'EUR' || storedCurrency === 'GBP') {
        setCurrency(storedCurrency);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (hasStoredPrefsRef.current) return;
    setShowCharts(!isCompact);
  }, [isCompact]);

  useEffect(() => {
    try {
      localStorage.setItem('solar-sim-output-show-charts-v1', String(showCharts));
    } catch {
      // no-op
    }
  }, [showCharts]);

  useEffect(() => {
    try {
      localStorage.setItem('solar-sim-output-show-advanced-v1', String(showAdvanced));
    } catch {
      // no-op
    }
  }, [showAdvanced]);

  useEffect(() => {
    try {
      localStorage.setItem('solar-sim-output-power-unit-v1', powerUnit);
    } catch {
      // no-op
    }
  }, [powerUnit]);

  useEffect(() => {
    try {
      localStorage.setItem('solar-sim-output-energy-unit-v1', energyUnit);
    } catch {
      // no-op
    }
  }, [energyUnit]);

  useEffect(() => {
    try {
      localStorage.setItem('solar-sim-output-decimals-v1', String(decimals));
    } catch {
      // no-op
    }
  }, [decimals]);

  useEffect(() => {
    try {
      localStorage.setItem('solar-sim-output-currency-v1', currency);
    } catch {
      // no-op
    }
  }, [currency]);

  if (!summary || !solarPosition) return null;

  const numberFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(navigator.language || 'en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } catch {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
  }, [decimals]);

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(navigator.language || 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });
    } catch {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      });
    }
  }, [currency]);

  const formatPower = (watts: number) => {
    if (powerUnit === 'W') {
      return `${numberFormatter.format(watts)} W`;
    }
    return `${numberFormatter.format(watts / 1000)} kW`;
  };

  const formatEnergy = (wh: number) => {
    if (energyUnit === 'Wh') {
      return `${numberFormatter.format(wh)} Wh`;
    }
    return `${numberFormatter.format(wh / 1000)} kWh`;
  };

  const formatCurrency = (value: number) => currencyFormatter.format(value);

  // Dynamic sizing based on compact mode
  const panelWidth = isCompact ? 'w-80' : 'w-96';
  const padding = isCompact ? 'p-3' : 'p-5';
  const marginBottom = isCompact ? 'mb-3' : 'mb-4';

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-xl ${padding} ${panelWidth} max-h-[calc(100vh-180px)] overflow-y-auto`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Output Data</h2>
        <button
          type="button"
          onClick={() => setShowDisplaySettings((prev) => !prev)}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-solar-500"
          aria-label="Toggle display settings"
          title="Display settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c0 .65.39 1.24 1 1.51.31.14.65.21 1 .21H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      {showDisplaySettings && (
        <div className={`bg-gray-50 rounded-lg p-3 ${marginBottom}`}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Display</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex flex-col gap-1 text-gray-600">
              Power Unit
              <select
                value={powerUnit}
                onChange={(e) => setPowerUnit(e.target.value as 'kW' | 'W')}
                className="px-2 py-2 bg-white border border-gray-300 rounded-md text-sm"
              >
                <option value="kW">kW</option>
                <option value="W">W</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-gray-600">
              Energy Unit
              <select
                value={energyUnit}
                onChange={(e) => setEnergyUnit(e.target.value as 'kWh' | 'Wh')}
                className="px-2 py-2 bg-white border border-gray-300 rounded-md text-sm"
              >
                <option value="kWh">kWh</option>
                <option value="Wh">Wh</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-gray-600">
              Decimals
              <select
                value={decimals}
                onChange={(e) => setDecimals(Number(e.target.value) as 0 | 1 | 2)}
                className="px-2 py-2 bg-white border border-gray-300 rounded-md text-sm"
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-gray-600">
              Currency
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'USD' | 'EUR' | 'GBP')}
                className="px-2 py-2 bg-white border border-gray-300 rounded-md text-sm"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* PRIORITY 1: Essential Metrics - Always Visible */}
      {/* Night Mode Indicator */}
      {isNight && (
        <div className={`p-3 bg-indigo-100 border border-indigo-200 rounded-lg flex items-center ${marginBottom}`}>
          <svg className="w-5 h-5 text-indigo-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-indigo-800">Sun Below Horizon</p>
            <p className="text-xs text-indigo-700">No solar generation at this time</p>
          </div>
        </div>
      )}

      {/* Current Time & Key Metrics */}
      <div className={marginBottom}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm text-gray-500">Simulation Time</span>
            <span className="text-xs text-gray-400 ml-1">({location.timezone})</span>
          </div>
          <span className="text-lg font-bold text-gray-800">{currentTimeLocal}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg p-3 ${isNight ? 'bg-indigo-100' : 'bg-gradient-to-br from-solar-400 to-solar-600'} ${isNight ? 'text-indigo-800' : 'text-white'}`}>
            <div className="flex items-center">
              <span className="text-xs opacity-80">Instant Power</span>
              <Tooltip text="Current AC power output from all panels" />
            </div>
            <p className="text-2xl font-bold">{formatPower(summary.instantPower)}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg p-3 text-white">
            <div className="flex items-center">
              <span className="text-xs opacity-80">Daily Energy</span>
              <Tooltip text="Total energy generated today (24 hours)" />
            </div>
            <p className="text-2xl font-bold">{formatEnergy(summary.dailyEnergy)}</p>
          </div>
        </div>
      </div>

      {/* PRIORITY 2: Charts - Collapsible on compact mode */}
      <div className={marginBottom}>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="w-full flex items-center justify-between py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <span className="font-medium">Power & Energy Charts</span>
          <svg
            className={`w-4 h-4 transition-transform ${showCharts ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showCharts && (
          <div className="space-y-4 mt-2">
            {/* Power Chart */}
            <div>
              <div className="flex items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Power Output</h3>
                <Tooltip text="Hourly AC power output throughout the day" />
              </div>
              <Suspense fallback={<div className="h-48 rounded-lg bg-gray-100 animate-pulse" />}>
                <LazyPowerChart />
              </Suspense>
            </div>

            {/* Energy Chart */}
            <div>
              <div className="flex items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Cumulative Energy</h3>
                <Tooltip text="Running total of energy generated" />
              </div>
              <Suspense fallback={<div className="h-48 rounded-lg bg-gray-100 animate-pulse" />}>
                <LazyEnergyChart />
              </Suspense>
            </div>
          </div>
        )}
      </div>

      {/* PRIORITY 3: Sun Times & Basic Stats - Always Visible */}
      {/* Sun Times */}
      <div className={`grid grid-cols-3 gap-2 ${marginBottom}`}>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <span className="text-xs text-gray-500">Sunrise</span>
          <p className="text-sm font-semibold text-gray-800">{summary.sunriseLocal}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <span className="text-xs text-gray-500">Solar Noon</span>
          <p className="text-sm font-semibold text-gray-800">{summary.solarNoonLocal}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <span className="text-xs text-gray-500">Sunset</span>
          <p className="text-sm font-semibold text-gray-800">{summary.sunsetLocal}</p>
        </div>
      </div>

      {/* Basic Statistics */}
      <div className={`grid grid-cols-2 gap-2 ${marginBottom}`}>
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-xs text-gray-500">Daylight Hours</span>
          <p className="text-sm font-semibold text-gray-800">{summary.daylightHours.toFixed(1)}h</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-xs text-gray-500">Peak Power</span>
          <p className="text-sm font-semibold text-gray-800">{formatPower(summary.peakPower)}</p>
        </div>
      </div>

      {/* Energy Projections */}
      <div className={`border-t border-gray-200 pt-3 ${marginBottom}`}>
        <div className="flex items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Energy Projections</h3>
          <Tooltip text="Estimates based on today's conditions. Actual values vary with weather." />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="flex items-center justify-center">
              <span className="text-xs text-gray-500">Weekly</span>
              <Tooltip text="7 days × 24 hours = 168 hour projection" />
            </div>
            <p className="text-sm font-semibold text-emerald-600">{formatEnergy(summary.weeklyEnergy)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Monthly</span>
            <p className="text-sm font-semibold text-emerald-600">{formatEnergy(summary.monthlyEnergy)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Yearly</span>
            <p className="text-sm font-semibold text-emerald-600">{formatEnergy(summary.yearlyEnergy)}</p>
          </div>
        </div>
      </div>

      {/* Savings */}
      <div className={`grid grid-cols-2 gap-2 ${marginBottom}`}>
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <span className="text-xs text-blue-600">Yearly Savings</span>
          <p className="text-lg font-bold text-blue-700">{formatCurrency(summary.yearlySavings)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center">
            <span className="text-xs text-green-600">CO₂ Offset/Year</span>
            <Tooltip text="Based on US average grid emissions (0.42 kg/kWh)" />
          </div>
          <p className="text-lg font-bold text-green-700">{(summary.yearlyCO2Offset / 1000).toFixed(1)}t</p>
        </div>
      </div>

      {/* PRIORITY 4: Advanced Metrics - Collapsible */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between py-2 text-sm text-gray-600 hover:text-gray-800 border-t border-gray-200"
      >
        <span className="font-medium">Advanced Metrics</span>
        <svg
          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showAdvanced && (
        <div className="pt-3 space-y-4">
          {/* Solar Position */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Solar Position</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">Sun Elevation</span>
                  <Tooltip text="Angle above horizon (negative = below)" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{solarPosition.elevation.toFixed(1)}°</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">Sun Azimuth</span>
                  <Tooltip text="Degrees clockwise from North" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{solarPosition.azimuth.toFixed(1)}°</p>
              </div>
            </div>
          </div>

          {/* Irradiance Breakdown */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Irradiance Components</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">GHI</span>
                  <Tooltip text="Global Horizontal Irradiance - total on flat surface" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{irradiance?.ghi.toFixed(0) || 0} W/m²</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">DNI</span>
                  <Tooltip text="Direct Normal Irradiance - direct beam from sun" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{irradiance?.dni.toFixed(0) || 0} W/m²</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">DHI</span>
                  <Tooltip text="Diffuse Horizontal Irradiance - scattered sky light" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{irradiance?.dhi.toFixed(0) || 0} W/m²</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">POA Total</span>
                  <Tooltip text="Plane of Array - total irradiance on panel surface" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{poaIrradiance?.total.toFixed(0) || 0} W/m²</p>
              </div>
            </div>
          </div>

          {/* POA Breakdown */}
          {poaIrradiance && poaIrradiance.total > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">POA Breakdown</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <span className="text-xs text-gray-500">Beam</span>
                  <p className="text-sm font-semibold text-gray-800">{poaIrradiance.beam.toFixed(0)} W/m²</p>
                  <p className="text-xs text-gray-400">{((poaIrradiance.beam / poaIrradiance.total) * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <span className="text-xs text-gray-500">Diffuse</span>
                  <p className="text-sm font-semibold text-gray-800">{poaIrradiance.diffuse.toFixed(0)} W/m²</p>
                  <p className="text-xs text-gray-400">{((poaIrradiance.diffuse / poaIrradiance.total) * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <span className="text-xs text-gray-500">Reflected</span>
                  <p className="text-sm font-semibold text-gray-800">{poaIrradiance.reflected.toFixed(0)} W/m²</p>
                  <p className="text-xs text-gray-400">{((poaIrradiance.reflected / poaIrradiance.total) * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Temperature & Losses */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Temperature & Losses</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">Cell Temp</span>
                  <Tooltip text="Estimated cell temperature (affects efficiency)" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{cellTemperature.toFixed(1)}°C</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">Temp Derating</span>
                  <Tooltip text="Power factor due to temperature (1.0 = no loss)" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{(currentLosses?.temperature || 1).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">AOI</span>
                  <Tooltip text="Angle of Incidence on panel surface" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{poaIrradiance?.angleOfIncidence.toFixed(1) || 0}°</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">IAM Factor</span>
                  <Tooltip text="Incidence Angle Modifier (reflection losses)" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{(currentLosses?.incidenceAngle || 1).toFixed(3)}</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">Capacity Factor</span>
                  <Tooltip text="Actual output / theoretical maximum" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{(summary.capacityFactor * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">Performance Ratio</span>
                  <Tooltip text="System efficiency accounting for all losses" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{(summary.performanceRatio * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const DataPanel = memo(DataPanelInner);
