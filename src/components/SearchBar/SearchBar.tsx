import { useState, useCallback, useRef, useEffect } from 'react';
import { useGeocoding } from '../../hooks/useGeocoding';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Location } from '../../core/types';
import { SearchDropdown } from './SearchDropdown';

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

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

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

  return (
    <div ref={containerRef} className="relative">
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
          onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
          placeholder="Search location..."
          className="w-64 px-4 py-3 text-gray-800 focus:outline-none bg-transparent"
        />
        {isLoading && (
          <div className="pr-4">
            <div className="animate-spin h-5 w-5 border-2 border-solar-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Portal-based dropdown for proper z-index */}
      <SearchDropdown
        results={results}
        isOpen={isOpen}
        onSelect={handleSelect}
        onClose={handleClose}
        anchorRef={containerRef}
      />

      {/* Current location display */}
      <div className="mt-2 text-sm text-white/90 bg-black/30 px-3 py-1 rounded-lg inline-block max-w-full truncate">
        {location.address}
      </div>
    </div>
  );
}
