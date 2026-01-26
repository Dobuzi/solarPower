import { useSimulatorStore, selectOptimalTilt, selectOptimalAzimuth, selectSystemSize } from '../../store/simulatorStore';
import { panelPresets } from '../../models/panelPresets';

export function Controls() {
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

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-5 w-80">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Panel Configuration</h2>

      {/* Panel Preset */}
      <div className="mb-4">
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
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Panels: <span className="text-solar-600 font-semibold">{panelCount}</span>
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={panelCount}
          onChange={(e) => setPanelCount(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-solar-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1</span>
          <span>System: {systemSize.toFixed(1)} kW</span>
          <span>100</span>
        </div>
      </div>

      {/* Tilt Angle */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Tilt Angle: <span className="text-solar-600 font-semibold">{orientation.tilt.toFixed(0)}°</span>
          </label>
          <button
            onClick={() => setOrientation({ tilt: optimalTilt })}
            className={`text-xs px-2 py-0.5 rounded ${
              tiltDiff <= 1
                ? 'bg-green-100 text-green-700'
                : 'text-solar-600 hover:text-solar-700 hover:bg-solar-50'
            }`}
          >
            {tiltDiff <= 1 ? '✓ Optimal' : `Optimal: ${optimalTilt.toFixed(0)}°`}
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
        <div className="flex justify-between text-xs text-gray-500">
          <span>0° (flat)</span>
          <span>90° (vertical)</span>
        </div>
      </div>

      {/* Azimuth Angle */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Azimuth: <span className="text-solar-600 font-semibold">{orientation.azimuth.toFixed(0)}°</span>
          </label>
          <button
            onClick={() => setOrientation({ azimuth: optimalAzimuth })}
            className={`text-xs px-2 py-0.5 rounded ${
              azimuthDiff <= 1
                ? 'bg-green-100 text-green-700'
                : 'text-solar-600 hover:text-solar-700 hover:bg-solar-50'
            }`}
          >
            {azimuthDiff <= 1 ? '✓ Optimal' : `Optimal: ${optimalAzimuth.toFixed(0)}°`}
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
        <div className="flex justify-between text-xs text-gray-500">
          <span>N</span>
          <span>E</span>
          <span>S</span>
          <span>W</span>
          <span>N</span>
        </div>
      </div>

      {/* Ambient Temperature */}
      <div className="mb-4">
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
        <div className="flex justify-between text-xs text-gray-500">
          <span>-10°C</span>
          <span>45°C</span>
        </div>
      </div>

      {/* Ground Albedo */}
      <div className="mb-4">
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
        <div className="flex justify-between text-xs text-gray-500">
          <span>Dark (0%)</span>
          <span>Snow (80%)</span>
        </div>
      </div>

      {/* Set Optimal Button - contextual label based on what needs adjustment */}
      {(() => {
        const tiltNeedsAdjust = tiltDiff > 1;
        const azimuthNeedsAdjust = azimuthDiff > 1;

        // Determine button label based on what needs adjustment
        let buttonLabel: string | JSX.Element;
        if (isOptimal) {
          buttonLabel = (
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Already Optimal
            </span>
          );
        } else if (tiltNeedsAdjust && azimuthNeedsAdjust) {
          buttonLabel = 'Apply Optimal Tilt & Azimuth';
        } else if (tiltNeedsAdjust) {
          buttonLabel = `Apply Optimal Tilt (${orientation.tilt.toFixed(0)}° → ${optimalTilt.toFixed(0)}°)`;
        } else if (azimuthNeedsAdjust) {
          buttonLabel = `Apply Optimal Azimuth (${orientation.azimuth.toFixed(0)}° → ${optimalAzimuth.toFixed(0)}°)`;
        } else {
          buttonLabel = 'Set Optimal Orientation';
        }

        return (
          <button
            onClick={setOptimalOrientation}
            disabled={isOptimal}
            className={`w-full py-2 font-medium rounded-lg transition-all text-sm ${
              isOptimal
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-solar-500 hover:bg-solar-600 text-white'
            }`}
          >
            {buttonLabel}
          </button>
        );
      })()}

      {/* Location Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Location: {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°</p>
        <p className="text-xs text-gray-500">Optimal for {location.latitude >= 0 ? 'Northern' : 'Southern'} Hemisphere</p>
      </div>

      {/* Panel Specs */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Panel Specifications</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded p-2">
            <span className="text-gray-500">Rated Power</span>
            <p className="font-semibold text-gray-800">{panelConfig.ratedPower}W</p>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <span className="text-gray-500">Efficiency</span>
            <p className="font-semibold text-gray-800">{(panelConfig.efficiency * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <span className="text-gray-500">Dimensions</span>
            <p className="font-semibold text-gray-800">{panelConfig.width.toFixed(2)} × {panelConfig.height.toFixed(2)}m</p>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <span className="text-gray-500">Temp Coeff</span>
            <p className="font-semibold text-gray-800">{panelConfig.tempCoefficient}%/°C</p>
          </div>
        </div>
      </div>
    </div>
  );
}
