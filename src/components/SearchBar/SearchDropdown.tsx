/**
 * Search Dropdown Portal
 *
 * Renders search results via React Portal to avoid z-index/overflow issues.
 * Features:
 * - Keyboard navigation (↑/↓/Enter/Esc)
 * - Resilient positioning (resize, scroll, visualViewport)
 * - Click-outside to close
 * - ResizeObserver for anchor element changes
 */

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Location } from '../../core/types';

interface SearchDropdownProps {
  results: Location[];
  isOpen: boolean;
  onSelect: (location: Location) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

interface Position {
  top: number;
  left: number;
  width: number;
}

export function SearchDropdown({
  results,
  isOpen,
  onSelect,
  onClose,
  anchorRef,
}: SearchDropdownProps) {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0, width: 0 });
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Calculate position based on anchor element
  // Uses useLayoutEffect to prevent visual flicker
  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const gap = 8; // pixels between anchor and dropdown

    // Calculate available space below vs above
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const dropdownHeight = Math.min(300, results.length * 60); // estimate

    // Position below by default, above if not enough space below
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setPosition({
      top: showAbove ? rect.top - dropdownHeight - gap : rect.bottom + gap,
      left: rect.left,
      width: Math.max(rect.width, 280), // minimum width for readability
    });
  }, [anchorRef, results.length]);

  // Setup position listeners when open
  useLayoutEffect(() => {
    if (!isOpen) return;

    // Initial position calculation
    updatePosition();

    // Window resize
    window.addEventListener('resize', updatePosition);

    // Scroll events (capture phase to catch all scrollable containers)
    window.addEventListener('scroll', updatePosition, true);

    // Visual viewport resize (mobile keyboard appearance)
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', updatePosition);
      visualViewport.addEventListener('scroll', updatePosition);
    }

    // ResizeObserver for anchor element size changes (panel toggles, etc.)
    if (anchorRef.current) {
      resizeObserverRef.current = new ResizeObserver(updatePosition);
      resizeObserverRef.current.observe(anchorRef.current);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', updatePosition);
        visualViewport.removeEventListener('scroll', updatePosition);
      }
      resizeObserverRef.current?.disconnect();
    };
  }, [isOpen, updatePosition]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < results.length) {
            onSelect(results[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, results, onSelect, onClose]);

  // Click outside to close (must check both container and portal dropdown)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Don't close if clicking inside the dropdown
      if (dropdownRef.current?.contains(target)) return;

      // Don't close if clicking inside the anchor (input container)
      if (anchorRef.current?.contains(target)) return;

      onClose();
    };

    // Use mousedown for faster response
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const activeItem = dropdownRef.current.children[activeIndex] as HTMLElement;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!isOpen || results.length === 0) return null;

  const dropdown = (
    <div
      ref={dropdownRef}
      role="listbox"
      aria-label="Search results"
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: '300px',
        overflowY: 'auto',
        zIndex: 9999,
      }}
    >
      {results.map((loc, index) => (
        <button
          key={`${loc.latitude}-${loc.longitude}-${index}`}
          role="option"
          aria-selected={index === activeIndex}
          onClick={() => onSelect(loc)}
          onMouseEnter={() => setActiveIndex(index)}
          className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-0 ${
            index === activeIndex
              ? 'bg-solar-50 text-solar-900'
              : 'hover:bg-gray-50 text-gray-800'
          }`}
        >
          <p className="text-sm font-medium truncate">{loc.address}</p>
          <p className="text-xs text-gray-500">
            {loc.latitude.toFixed(4)}°, {loc.longitude.toFixed(4)}°
            {loc.timezone && ` · ${loc.timezone}`}
          </p>
        </button>
      ))}
    </div>
  );

  return createPortal(dropdown, document.body);
}
