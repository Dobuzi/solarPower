import { useState } from 'react';
import { useSimulatorStore, selectOptimalTilt, selectOptimalAzimuth, selectSystemSize } from '../../store/simulatorStore';
import { panelPresets } from '../../models/panelPresets';
import { useCompactMode } from '../../hooks/usePanelState';

export function Controls() {
  const isCompact = useCompactMode();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    panelPresetId,
    setPanelPreset,
    panelConfig,
    orientation,
    setOrientation,
    panelCount,
    setPanelCount,
    ambientTemp,
    setAmbientTemp,
    albedo,
    setAlbedo,
    isOptimal,
    setOptimalOrientation,
    location,
  } = useSimulatorStore();

  const optimalTilt = useSimulatorStore(selectOptimalTilt);
  const optimalAzimuth = useSimulatorStore(selectOptimalAzimuth);
  const systemSize = useSimulatorStore(selectSystemSize);

  const tiltDiff = Math.abs(orientation.tilt - optimalTilt);
  const azimuthDiff = Math.min(
    Math.abs(orientation.azimuth - optimalAzimuth),
    360 - Math.abs(orientation.azimuth - optimalAzimuth)
  );

  // Dynamic sizing based on compact mode
  const panelWidth = isCompact ? 'w-72' : 'w-80';
  const padding = isCompact ? 'p-3' : 'p-5';
  const marginBottom = isCompact ? 'mb-3' : 'mb-4';
  const headerSize = isCompact ? 'text-base' : 'text-lg';

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-xl ${padding} ${panelWidth}`}>
      <h2 className={`${headerSize} font-semibold text-gray-800 ${marginBottom}`}>Panel Configuration</h2>

      {/* Essential Controls - Always Visible */}
      <div className="space-y-3">
        {/* Panel Preset */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Panel Model</label>
          <select
            value={panelPresetId}
            onChange={(e) => setPanelPreset(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-solar-500 focus:border-solar-500"
          >
            {panelPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} ({preset.config.ratedPower}W)
              </option>
            ))}
          </select>
        </div>

        {/* Panel Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Panels: <span className="text-solar-600 font-semibold">{panelCount}</span>
            <span className="text-gray-400 ml-2">({systemSize.toFixed(1)} kW)</span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={panelCount}
            onChange={(e) => setPanelCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-solar-500"
          />
        </div>

        {/* Tilt Angle */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700">
              Tilt: <span className="text-solar-600 font-semibold">{orientation.tilt.toFixed(0)}°</span>
            </label>
            <button
              onClick={() => setOrientation({ tilt: optimalTilt })}
              className={`text-xs px-2 py-0.5 rounded ${
                tiltDiff <= 1
                  ? 'bg-green-100 text-green-700'
                  : 'text-solar-600 hover:bg-solar-50'
              }`}
            >
              {tiltDiff <= 1 ? '✓' : `→${optimalTilt.toFixed(0)}°`}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            value={orientation.tilt}
            onChange={(e) => setOrientation({ tilt: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-solar-500"
          />
        </div>

        {/* Azimuth Angle */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700">
              Azimuth: <span className="text-solar-600 font-semibold">{orientation.azimuth.toFixed(0)}°</span>
            </label>
            <button
              onClick={() => setOrientation({ azimuth: optimalAzimuth })}
              className={`text-xs px-2 py-0.5 rounded ${
                azimuthDiff <= 1
                  ? 'bg-green-100 text-green-700'
                  : 'text-solar-600 hover:bg-solar-50'
              }`}
            >
              {azimuthDiff <= 1 ? '✓' : `→${optimalAzimuth.toFixed(0)}°`}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={orientation.azimuth}
            onChange={(e) => setOrientation({ azimuth: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-solar-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>N</span><span>E</span><span>S</span><span>W</span><span>N</span>
          </div>
        </div>

        {/* Set Optimal Button */}
        <button
          onClick={setOptimalOrientation}
          disabled={isOptimal}
          className={`w-full py-2 font-medium rounded-lg transition-all text-sm ${
            isOptimal
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-solar-500 hover:bg-solar-600 text-white'
          }`}
        >
          {isOptimal ? '✓ Optimal' : 'Apply Optimal'}
        </button>
      </div>

      {/* Advanced Controls - Collapsible */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-800"
        >
          <span className="font-medium">Advanced</span>
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
          <div className="mt-3 space-y-3">
            {/* Ambient Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ambient Temp: <span className="text-solar-600 font-semibold">{ambientTemp}°C</span>
              </label>
              <input
                type="range"
                min="-10"
                max="45"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-solar-500"
              />
            </div>

            {/* Ground Albedo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ground Reflectance: <span className="text-solar-600 font-semibold">{(albedo * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={albedo}
                onChange={(e) => setAlbedo(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-solar-500"
              />
            </div>

            {/* Location Info */}
            <div className="text-xs text-gray-500">
              <p>Location: {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°</p>
              <p>{location.latitude >= 0 ? 'Northern' : 'Southern'} Hemisphere</p>
            </div>

            {/* Panel Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500">Power</span>
                <p className="font-semibold text-gray-800">{panelConfig.ratedPower}W</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-gray-500">Efficiency</span>
                <p className="font-semibold text-gray-800">{(panelConfig.efficiency * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
