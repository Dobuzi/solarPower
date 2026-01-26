import { useState, useCallback, useRef, useEffect } from 'react';
import { useGeocoding } from '../../hooks/useGeocoding';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Location } from '../../core/types';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, results, search } = useGeocoding();
  const setLocation = useSimulatorStore((state) => state.setLocation);
  const setOptimalOrientation = useSimulatorStore((state) => state.setOptimalOrientation);
  const location = useSimulatorStore((state) => state.location);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
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
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  }, [setLocation, setOptimalOrientation]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="pl-4 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search location..."
          className="w-64 px-4 py-3 text-gray-800 focus:outline-none"
        />
        {isLoading && (
          <div className="pr-4">
            <div className="animate-spin h-5 w-5 border-2 border-solar-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          {results.map((loc, index) => (
            <button
              key={index}
              onClick={() => handleSelect(loc)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <p className="text-sm text-gray-800 truncate">{loc.address}</p>
              <p className="text-xs text-gray-500">
                {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 text-sm text-white/90 bg-black/30 px-3 py-1 rounded-lg inline-block">
        {location.address}
      </div>
    </div>
  );
}
