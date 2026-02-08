import { useState, useCallback, useRef, useEffect } from 'react';
import { useGeocoding } from '../../hooks/useGeocoding';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Location } from '../../core/types';
import { SearchDropdown } from './SearchDropdown';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [lastSelection, setLastSelection] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const { isLoading, results, search, reverseGeocode, error } = useGeocoding();
  const setLocation = useSimulatorStore((state) => state.setLocation);
  const setOptimalOrientation = useSimulatorStore((state) => state.setOptimalOrientation);
  const location = useSimulatorStore((state) => state.location);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const listboxId = 'search-results-listbox';
  const canUseGeolocation = typeof window !== 'undefined' && !!navigator.geolocation && window.isSecureContext;

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        search(value);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 300);
  }, [search]);

  const handleSelect = useCallback((loc: Location) => {
    setLocation(loc);
    setOptimalOrientation();
    setLastSelection(loc.address);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  }, [setLocation, setOptimalOrientation]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (!canUseGeolocation || isLocating) return;

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const loc = await reverseGeocode(latitude, longitude);
          const nextLocation: Location = loc ?? {
            latitude,
            longitude,
            timezone: 'UTC',
            address: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
          };

          setLocation(nextLocation);
          setOptimalOrientation();
          setLastSelection(nextLocation.address);
          setQuery('');
          setIsOpen(false);
        } catch (err) {
          setGeoError('Unable to use your location right now.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setGeoError('Location permission was denied.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [canUseGeolocation, isLocating, reverseGeocode, setLocation, setOptimalOrientation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() && location.address) {
      setLastSelection(location.address);
    }
  }, [location.address, query]);

  // Close dropdown on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const placeholderText = isFocused
    ? 'Search location...'
    : (lastSelection || location.address || 'Search location...');

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        ref={inputRef as unknown as React.RefObject<HTMLDivElement>}
        className="flex items-center bg-white rounded-lg shadow-lg"
      >
        <div className="pl-4 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            query.trim() && results.length > 0 && setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
          aria-label="Search location"
          placeholder={placeholderText}
          className="w-full sm:w-64 px-4 py-3 text-gray-800 focus:outline-none bg-transparent min-h-[44px]"
        />
        {query && (
          <button
            onClick={handleClear}
            className="pr-2 text-gray-400 hover:text-gray-600 min-h-[44px]"
            aria-label="Clear search"
            type="button"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {isLoading && (
          <div className="pr-4 flex items-center gap-2" role="status" aria-live="polite">
            <div className="animate-spin h-5 w-5 border-2 border-solar-500 border-t-transparent rounded-full" />
            <span className="text-xs text-gray-500">Searching…</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={handleUseMyLocation}
          disabled={!canUseGeolocation || isLocating}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            canUseGeolocation
              ? 'border-solar-200 text-solar-700 hover:bg-solar-50 active:bg-solar-100'
              : 'border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          style={{ minHeight: '44px' }}
          title={canUseGeolocation ? 'Use your current location' : 'Location requires HTTPS and permission'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a3 3 0 110 6 3 3 0 010-6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a7.5 7.5 0 10-2.2 4.7" />
          </svg>
          {isLocating ? 'Locating…' : 'Use my location'}
        </button>
        {(geoError || error) && (
          <span className="text-xs text-red-600">{geoError || error}</span>
        )}
      </div>

      {/* Portal-based dropdown for proper z-index */}
      <SearchDropdown
        results={results}
        isOpen={isOpen}
        isLoading={isLoading}
        query={query}
        onSelect={handleSelect}
        onClose={handleClose}
        anchorRef={containerRef}
        listboxId={listboxId}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
      />

      {/* Current location display */}
      <div className="mt-2 text-sm text-white/90 bg-black/30 px-3 py-1 rounded-lg inline-block max-w-[calc(100vw-2rem)] whitespace-normal break-words leading-tight">
        {location.address}
      </div>
    </div>
  );
}
