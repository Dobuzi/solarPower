/**
 * Controls Component - Touch-Optimized
 *
 * Features:
 * - Sliders with stepper buttons (+/-) for precise control
 * - 44px minimum tap targets for all interactive elements
 * - Throttled slider updates to prevent jank
 * - touch-action: pan-y on sliders to prevent scroll conflicts
 * - Persistent expand/collapse state (versioned localStorage)
 * - Reset button with confirmation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSimulatorStore, selectOptimalTilt, selectOptimalAzimuth, selectSystemSize } from '../../store/simulatorStore';
import { panelPresets } from '../../models/panelPresets';
import { useCompactMode } from '../../hooks/usePanelState';
import { useIsMobile } from '../../hooks/useMediaQuery';

// Storage key for mode state (versioned)
// Progressive disclosure: Simple (default) vs Pro mode
const STORAGE_KEY = 'solar-sim-config-mode-v3';

type ControlMode = 'simple' | 'pro';

interface ConfigState {
  version: number;
  mode: ControlMode;
}

function loadConfigState(): ConfigState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === 3) {
        return parsed;
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[Config] Failed to load state:', e);
    }
  }
  // Default to Simple mode for zero-onboarding
  return { version: 3, mode: 'simple' };
}

function saveConfigState(state: ConfigState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[Config] Failed to save state:', e);
    }
  }
}

// Stepper Button Component
interface StepperButtonProps {
  onClick: () => void;
  disabled?: boolean;
  direction: 'minus' | 'plus';
}

function StepperButton({ onClick, disabled, direction }: StepperButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center
        w-11 h-11
        bg-white border-2 border-gray-300 rounded-lg
        text-gray-700 font-bold text-lg
        transition-colors
        disabled:opacity-30 disabled:cursor-not-allowed
        active:bg-gray-100
        hover:border-solar-400 hover:text-solar-600
      `}
      style={{
        // Ensure 44px minimum tap target
        minWidth: '44px',
        minHeight: '44px',
      }}
      aria-label={direction === 'minus' ? 'Decrease' : 'Increase'}
    >
      {direction === 'minus' ? '−' : '+'}
    </button>
  );
}

// Slider with Steppers Component
interface SliderWithSteppersProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  optimalValue?: number;
  onSetOptimal?: () => void;
}

function SliderWithSteppers({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  formatValue,
  optimalValue,
  onSetOptimal,
}: SliderWithSteppersProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync local value when prop changes (but not during drag)
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleSliderChange = (newValue: number) => {
    setLocalValue(newValue);

    // Throttle updates during drag for smoother UX
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }

    throttleTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, 50); // 50ms throttle
  };

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    // Apply final value on release
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }
    onChange(localValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const displayValue = formatValue ? formatValue(value) : `${value.toFixed(0)}${unit}`;

  const isOptimal = optimalValue !== undefined && Math.abs(value - optimalValue) <= step;

  return (
    <div>
      {/* Label and value */}
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">
          {label}: <span className="text-solar-600 font-semibold">{displayValue}</span>
        </label>
        {optimalValue !== undefined && onSetOptimal && (
          <button
            onClick={onSetOptimal}
            className={`text-xs px-3 py-1.5 rounded transition-colors ${
              isOptimal
                ? 'bg-green-100 text-green-700 font-medium'
                : 'bg-solar-50 text-solar-600 hover:bg-solar-100 font-medium'
            }`}
            style={{ minHeight: '32px' }}
          >
            {isOptimal ? '✓ Optimal' : `→${optimalValue.toFixed(0)}${unit}`}
          </button>
        )}
      </div>

      {/* Slider + Steppers */}
      <div className="flex items-center gap-2 group">
        <StepperButton onClick={handleDecrement} disabled={value <= min} direction="minus" />

        <div className="flex-1 relative">
          <span
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded bg-gray-800 text-white opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100"
            aria-hidden="true"
          >
            {displayValue}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            aria-valuetext={displayValue}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-solar-500"
            style={{
              // Prevent vertical scroll when dragging horizontally
              touchAction: 'pan-y',
              // Increase hit area vertically
              padding: '8px 0',
            }}
          />
        </div>

        <StepperButton onClick={handleIncrement} disabled={value >= max} direction="plus" />
      </div>
    </div>
  );
}

export function Controls() {
  const isCompact = useCompactMode();
  const isMobile = useIsMobile();
  const [configState, setConfigState] = useState<ConfigState>(loadConfigState);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
    resetConfig,
  } = useSimulatorStore();

  const optimalTilt = useSimulatorStore(selectOptimalTilt);
  const optimalAzimuth = useSimulatorStore(selectOptimalAzimuth);
  const systemSize = useSimulatorStore(selectSystemSize);

  // Toggle between Simple and Pro mode
  const toggleMode = useCallback(() => {
    setConfigState((prev) => {
      const newMode: ControlMode = prev.mode === 'simple' ? 'pro' : 'simple';
      const newState: ConfigState = { ...prev, mode: newMode };
      saveConfigState(newState);
      if (import.meta.env.DEV) {
        console.log(`[Config] Mode: ${prev.mode} -> ${newMode}`);
      }
      return newState;
    });
  }, []);

  // Handle reset with confirmation
  const handleReset = useCallback(() => {
    if (resetConfig) {
      resetConfig();
    }
    setShowResetConfirm(false);
  }, [resetConfig]);

  // Dynamic sizing for mobile
  const marginBottom = isCompact ? 'mb-3' : 'mb-4';
  const spacing = isMobile ? 'space-y-4' : 'space-y-3';

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-xl ${isMobile ? 'p-0' : 'p-5'} ${isMobile ? 'w-full' : isCompact ? 'w-72' : 'w-80'}`}>
      {!isMobile && (
        <h2 className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold text-gray-800 ${marginBottom}`}>
          Panel Configuration
        </h2>
      )}

      {/* Essential Controls - Always Visible */}
      <div className={spacing}>
        {/* Panel Preset */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Panel Model</label>
          <select
            value={panelPresetId}
            onChange={(e) => setPanelPreset(e.target.value)}
            className="w-full px-3 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-solar-500 focus:border-solar-500"
            style={{
              // Ensure 44px minimum tap target
              minHeight: '44px',
            }}
          >
            {panelPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} ({preset.config.ratedPower}W)
              </option>
            ))}
          </select>
        </div>

        {/* Panel Count with Stepper */}
        <SliderWithSteppers
          label="Panels"
          value={panelCount}
          min={1}
          max={100}
          step={1}
          unit=""
          onChange={setPanelCount}
          formatValue={(v) => `${v} (${systemSize.toFixed(1)} kW)`}
        />

        {/* Tilt Angle with Stepper */}
        <SliderWithSteppers
          label="Tilt"
          value={orientation.tilt}
          min={0}
          max={90}
          step={1}
          unit="°"
          onChange={(tilt) => setOrientation({ tilt })}
          optimalValue={optimalTilt}
          onSetOptimal={() => setOrientation({ tilt: optimalTilt })}
        />

        {/* Azimuth Angle with Stepper */}
        <SliderWithSteppers
          label="Azimuth"
          value={orientation.azimuth}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={(azimuth) => setOrientation({ azimuth })}
          optimalValue={optimalAzimuth}
          onSetOptimal={() => setOrientation({ azimuth: optimalAzimuth })}
        />
        {/* Compass labels for azimuth */}
        <div className="flex justify-between text-xs text-gray-400 -mt-2 px-11">
          <span>N</span><span>E</span><span>S</span><span>W</span><span>N</span>
        </div>

        {/* Apply Optimal Button */}
        <button
          onClick={setOptimalOrientation}
          disabled={isOptimal}
          className={`w-full py-3 font-medium rounded-lg transition-all text-sm ${
            isOptimal
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-solar-500 hover:bg-solar-600 active:bg-solar-700 text-white'
          }`}
          style={{
            // Ensure 44px minimum tap target
            minHeight: '44px',
          }}
        >
          {isOptimal ? '✓ Optimal Orientation' : 'Apply Optimal Orientation'}
        </button>
      </div>

      {/* Simple/Pro Mode Toggle */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Mode</span>
          <button
            onClick={toggleMode}
            className={`relative inline-flex items-center h-7 rounded-full w-14 transition-colors focus:outline-none focus:ring-2 focus:ring-solar-500 focus:ring-offset-2 ${
              configState.mode === 'pro' ? 'bg-solar-500' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={configState.mode === 'pro'}
            aria-label="Toggle Simple/Pro mode"
          >
            <span
              className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${
                configState.mode === 'pro' ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span className={configState.mode === 'simple' ? 'font-semibold text-gray-700' : ''}>
            Simple
          </span>
          <span className={configState.mode === 'pro' ? 'font-semibold text-solar-600' : ''}>
            Pro
          </span>
        </div>
      </div>

      {/* Pro Mode Controls - Progressive Disclosure */}
      {configState.mode === 'pro' && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in">
          <div className={spacing}>
            {/* Ambient Temperature with Stepper */}
            <SliderWithSteppers
              label="Ambient Temp"
              value={ambientTemp}
              min={-10}
              max={45}
              step={1}
              unit="°C"
              onChange={setAmbientTemp}
            />

            {/* Ground Albedo with Stepper */}
            <SliderWithSteppers
              label="Ground Reflectance"
              value={albedo}
              min={0}
              max={0.8}
              step={0.05}
              unit=""
              onChange={setAlbedo}
              formatValue={(v) => `${(v * 100).toFixed(0)}%`}
            />

            {/* Location Info */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-700 mb-1">Location</p>
              <p>{location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°</p>
              <p>{location.latitude >= 0 ? 'Northern' : 'Southern'} Hemisphere</p>
            </div>

            {/* Panel Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-gray-500 block mb-1">Rated Power</span>
                <p className="font-semibold text-gray-800 text-base">{panelConfig.ratedPower}W</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-gray-500 block mb-1">Efficiency</span>
                <p className="font-semibold text-gray-800 text-base">{(panelConfig.efficiency * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Reset Button */}
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 text-sm font-medium text-red-600 border-2 border-red-300 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors"
                style={{
                  minHeight: '44px',
                }}
              >
                Reset to Defaults
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 text-center">Reset all configuration?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="py-3 text-sm font-medium text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                    style={{ minHeight: '44px' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    className="py-3 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 active:bg-red-700"
                    style={{ minHeight: '44px' }}
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
