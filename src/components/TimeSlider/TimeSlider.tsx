import { useCallback, useMemo, useRef } from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';
import { useAnimation } from '../../hooks/useAnimation';
import { useSolarCalculation } from '../../hooks/useSolarCalculation';
import { formatLocalHour } from '../../core/timezone';

export function TimeSlider() {
  const { date, setDate, isNight, isTwilight, location } = useSimulatorStore();
  const { isAnimating, animationHour, toggle, setAnimationHour } = useAnimation();
  const { setAnimationSpeed, animationSpeed } = useSimulatorStore();
  const { summary, daylightHours } = useSolarCalculation();

  // Debounce slider drag for performance
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const now = Date.now();

    // Clear any pending update
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
    }

    // Throttle updates to every 50ms during drag
    if (now - lastUpdateRef.current > 50) {
      setAnimationHour(value);
      lastUpdateRef.current = now;
    } else {
      // Schedule update for drag end
      pendingUpdateRef.current = setTimeout(() => {
        setAnimationHour(value);
        pendingUpdateRef.current = null;
      }, 50);
    }
  }, [setAnimationHour]);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get sunrise/sunset hours directly from summary (computed via getLocalHourFromUtc)
  const sunTimes = useMemo(() => {
    if (!summary) {
      return { sunrise: 6, sunset: 18, valid: false, isPolarNight: false, isMidnightSun: false };
    }

    const { sunriseHour, sunsetHour } = summary;

    // Validate sun times
    const isValidSunrise = !isNaN(sunriseHour) && sunriseHour >= 0 && sunriseHour < 24;
    const isValidSunset = !isNaN(sunsetHour) && sunsetHour >= 0 && sunsetHour < 24;

    // Detect polar conditions
    // Polar night: no sunrise (sun never rises) - daylightHours near 0
    // Midnight sun: no sunset (sun never sets) - daylightHours near 24
    const isPolarNight = daylightHours < 0.5;
    const isMidnightSun = daylightHours > 23.5;

    // Invalid if times are missing or inverted (can happen at extreme latitudes)
    const valid = isValidSunrise && isValidSunset && sunriseHour < sunsetHour && !isPolarNight && !isMidnightSun;

    return {
      sunrise: isValidSunrise ? sunriseHour : 6,
      sunset: isValidSunset ? sunsetHour : 18,
      valid,
      isPolarNight,
      isMidnightSun,
    };
  }, [summary, daylightHours]);

  // Time period indicator
  const timePeriod = useMemo(() => {
    if (sunTimes.isPolarNight) return { label: 'Polar Night', color: 'bg-indigo-700', textColor: 'text-indigo-100' };
    if (sunTimes.isMidnightSun) return { label: 'Midnight Sun', color: 'bg-amber-500', textColor: 'text-amber-100' };
    if (isNight) return { label: 'Night', color: 'bg-indigo-500', textColor: 'text-indigo-700' };
    if (isTwilight) return { label: 'Twilight', color: 'bg-orange-500', textColor: 'text-orange-700' };
    return { label: 'Day', color: 'bg-solar-500', textColor: 'text-solar-700' };
  }, [isNight, isTwilight, sunTimes.isPolarNight, sunTimes.isMidnightSun]);

  // Gradient background for slider
  const sliderGradient = useMemo(() => {
    if (sunTimes.isPolarNight) {
      // Full night tint
      return '#312e81';
    }
    if (sunTimes.isMidnightSun) {
      // Full day tint
      return '#fde047';
    }
    if (!sunTimes.valid) {
      // Fallback neutral gradient
      return 'linear-gradient(to right, #6b7280 0%, #6b7280 100%)';
    }

    // Normal day/night gradient
    return `linear-gradient(to right,
      #312e81 0%,
      #312e81 ${(sunTimes.sunrise / 24) * 100}%,
      #fbbf24 ${((sunTimes.sunrise + 1) / 24) * 100}%,
      #fde047 50%,
      #fbbf24 ${((sunTimes.sunset - 1) / 24) * 100}%,
      #312e81 ${(sunTimes.sunset / 24) * 100}%,
      #312e81 100%)`;
  }, [sunTimes]);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-gray-700">Time Control</h3>
          <div className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${timePeriod.color} text-white`}>
            {timePeriod.label}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggle}
            className={`p-2 rounded-lg transition-colors ${
              isAnimating
                ? 'bg-solar-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isAnimating ? 'Pause' : 'Play'}
          >
            {isAnimating ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <select
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            className="text-sm bg-gray-100 border-0 rounded-lg px-2 py-2"
            title="Animation speed"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-2xl font-bold ${isNight ? 'text-indigo-700' : 'text-gray-800'}`}>
            {formatLocalHour(animationHour)}
          </span>
          <span className="text-sm text-gray-500">{formatDate(date)}</span>
        </div>

        {/* Slider with day/night visualization */}
        <div className="relative">
          {/* Night/Day background gradient */}
          <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-lg overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background: sliderGradient,
                opacity: 0.3,
              }}
            />
          </div>

          <input
            type="range"
            min="0"
            max="23.99"
            step="0.1"
            value={animationHour}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200/50 rounded-lg appearance-none cursor-pointer accent-solar-500 relative z-10"
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>

        {/* Sunrise/Sunset markers - only show if valid */}
        <div className="relative h-3 mt-1">
          {sunTimes.valid && (
            <>
              <div
                className="absolute flex flex-col items-center"
                style={{ left: `${(sunTimes.sunrise / 24) * 100}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-0.5 h-2 bg-orange-400" />
                <span className="text-xs text-orange-600 font-medium">↑</span>
              </div>
              <div
                className="absolute flex flex-col items-center"
                style={{ left: `${(sunTimes.sunset / 24) * 100}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-0.5 h-2 bg-orange-400" />
                <span className="text-xs text-orange-600 font-medium">↓</span>
              </div>
            </>
          )}
          {sunTimes.isPolarNight && (
            <div className="text-xs text-indigo-600 text-center">No sunrise today (polar night)</div>
          )}
          {sunTimes.isMidnightSun && (
            <div className="text-xs text-amber-600 text-center">No sunset today (midnight sun)</div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={date.toISOString().split('T')[0]}
          onChange={(e) => {
            const newDate = new Date(e.target.value);
            newDate.setHours(Math.floor(animationHour), 0, 0, 0);
            setDate(newDate);
          }}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-solar-500 focus:border-solar-500"
        />
      </div>

      {/* Quick time buttons */}
      <div className="flex gap-2 mt-3">
        {sunTimes.valid && (
          <>
            <button
              onClick={() => setAnimationHour(sunTimes.sunrise)}
              className="flex-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
            >
              Sunrise
            </button>
            <button
              onClick={() => setAnimationHour(12)}
              className="flex-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
            >
              Noon
            </button>
            <button
              onClick={() => setAnimationHour(sunTimes.sunset)}
              className="flex-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
            >
              Sunset
            </button>
          </>
        )}
        {!sunTimes.valid && (
          <button
            onClick={() => setAnimationHour(12)}
            className="flex-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
          >
            Solar Noon
          </button>
        )}
      </div>

      {/* Time basis indicator */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Simulated time ({location.timezone})
        </p>
      </div>
    </div>
  );
}
