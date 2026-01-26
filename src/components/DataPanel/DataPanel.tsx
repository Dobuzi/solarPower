import { useState } from 'react';
import { useSolarCalculation } from '../../hooks/useSolarCalculation';
import { PowerChart } from './PowerChart';
import { EnergyChart } from './EnergyChart';

// Tooltip component
function Tooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-1">
      <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}

export function DataPanel() {
  const { summary, solarPosition, poaIrradiance, irradiance, currentLosses, cellTemperature, isNight, currentTimeLocal, location } = useSolarCalculation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!summary || !solarPosition) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-5 w-96 max-h-[calc(100vh-100px)] overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Output Data</h2>

      {/* Night Mode Indicator */}
      {isNight && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-indigo-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-indigo-700">Sun Below Horizon</p>
            <p className="text-xs text-indigo-600">No solar generation at this time</p>
          </div>
        </div>
      )}

      {/* Current Time & Power - Primary Metrics */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm text-gray-500">Simulation Time</span>
            <span className="text-xs text-gray-400 ml-1">({location.timezone})</span>
          </div>
          <span className="text-lg font-bold text-gray-800">{currentTimeLocal}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg p-3 ${isNight ? 'bg-gray-100' : 'bg-gradient-to-br from-solar-400 to-solar-600'} ${isNight ? 'text-gray-500' : 'text-white'}`}>
            <div className="flex items-center">
              <span className="text-xs opacity-80">Instant Power</span>
              <Tooltip text="Current AC power output from all panels" />
            </div>
            <p className="text-2xl font-bold">{(summary.instantPower / 1000).toFixed(2)} kW</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg p-3 text-white">
            <div className="flex items-center">
              <span className="text-xs opacity-80">Daily Energy</span>
              <Tooltip text="Total energy generated today (24 hours)" />
            </div>
            <p className="text-2xl font-bold">{(summary.dailyEnergy / 1000).toFixed(1)} kWh</p>
          </div>
        </div>
      </div>

      {/* Power Chart */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Power Output</h3>
          <Tooltip text="Hourly AC power output throughout the day" />
        </div>
        <PowerChart />
      </div>

      {/* Energy Chart */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Cumulative Energy</h3>
          <Tooltip text="Running total of energy generated" />
        </div>
        <EnergyChart />
      </div>

      {/* Sun Times */}
      <div className="grid grid-cols-3 gap-2 mb-4">
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
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-xs text-gray-500">Daylight Hours</span>
          <p className="text-sm font-semibold text-gray-800">{summary.daylightHours.toFixed(1)}h</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <span className="text-xs text-gray-500">Peak Power</span>
          <p className="text-sm font-semibold text-gray-800">{(summary.peakPower / 1000).toFixed(2)} kW</p>
        </div>
      </div>

      {/* Energy Projections */}
      <div className="border-t border-gray-200 pt-4 mb-4">
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
            <p className="text-sm font-semibold text-emerald-600">{(summary.weeklyEnergy / 1000).toFixed(0)} kWh</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Monthly</span>
            <p className="text-sm font-semibold text-emerald-600">{(summary.monthlyEnergy / 1000).toFixed(0)} kWh</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Yearly</span>
            <p className="text-sm font-semibold text-emerald-600">{(summary.yearlyEnergy / 1000).toFixed(0)} kWh</p>
          </div>
        </div>
      </div>

      {/* Savings */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <span className="text-xs text-blue-600">Yearly Savings</span>
          <p className="text-lg font-bold text-blue-700">${summary.yearlySavings.toFixed(0)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center">
            <span className="text-xs text-green-600">CO₂ Offset/Year</span>
            <Tooltip text="Based on US average grid emissions (0.42 kg/kWh)" />
          </div>
          <p className="text-lg font-bold text-green-700">{(summary.yearlyCO2Offset / 1000).toFixed(1)}t</p>
        </div>
      </div>

      {/* Advanced Section Toggle */}
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

      {/* Advanced Metrics (Collapsible) */}
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
