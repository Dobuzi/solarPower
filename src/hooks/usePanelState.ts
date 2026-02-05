/**
 * Panel State Management Hook
 *
 * Manages visibility state for Config, Output, and Time panels.
 * Features:
 * - Separate state for desktop/mobile
 * - localStorage persistence with versioning
 * - Graceful fallback for incompatible state
 * - Main/Detail view toggle
 */

import { useState, useEffect, useCallback } from 'react';

// Version the storage key to allow breaking changes
const STORAGE_KEY = 'solar-sim-panel-state-v2';
const STORAGE_VERSION = 2;

export interface PanelVisibility {
  config: boolean;
  output: boolean;
  time: boolean;
}

interface PanelState {
  version: number;
  desktop: PanelVisibility;
  mobile: PanelVisibility;
}

const defaultState: PanelState = {
  version: STORAGE_VERSION,
  desktop: {
    config: true,
    output: true,
    time: true,
  },
  mobile: {
    config: true,
    output: true,
    time: true,
  },
};

function loadState(): PanelState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PanelState>;

      // Validate version compatibility
      if (parsed.version !== STORAGE_VERSION) {
        if (import.meta.env.DEV) {
          console.log('[PanelState] Version mismatch, using defaults');
        }
        return defaultState;
      }

      // Validate structure
      if (parsed.desktop && parsed.mobile) {
        return {
          version: STORAGE_VERSION,
          desktop: { ...defaultState.desktop, ...parsed.desktop },
          mobile: { ...defaultState.mobile, ...parsed.mobile },
        };
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[PanelState] Failed to load state:', e);
    }
  }

  return defaultState;
}

function saveState(state: PanelState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[PanelState] Failed to save state:', e);
    }
  }
}

export function usePanelState(isMobile: boolean) {
  const [state, setState] = useState<PanelState>(loadState);
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);

  // Detect device type transitions (desktop ↔ mobile)
  // This ensures we don't apply invalid state after breakpoint changes
  useEffect(() => {
    if (prevIsMobile !== isMobile) {
      setPrevIsMobile(isMobile);

      // Reload state to ensure consistency after breakpoint transition
      const currentState = loadState();
      setState(currentState);
    }
  }, [isMobile, prevIsMobile]);

  // Get current visibility based on device type
  const visibility = isMobile ? state.mobile : state.desktop;

  // Toggle a specific panel
  const togglePanel = useCallback((panel: keyof PanelVisibility) => {
    setState((prev) => {
      const deviceKey = isMobile ? 'mobile' : 'desktop';
      const newState = {
        ...prev,
        version: STORAGE_VERSION,
        [deviceKey]: {
          ...prev[deviceKey],
          [panel]: !prev[deviceKey][panel],
        },
      };
      saveState(newState);
      return newState;
    });
  }, [isMobile]);

  // Set all panels visible/hidden
  const setAllPanels = useCallback((visible: boolean) => {
    setState((prev) => {
      const deviceKey = isMobile ? 'mobile' : 'desktop';
      const newState = {
        ...prev,
        version: STORAGE_VERSION,
        [deviceKey]: {
          config: visible,
          output: visible,
          time: visible,
        },
      };
      saveState(newState);
      return newState;
    });
  }, [isMobile]);

  // Check if any panel is visible
  // "Detail view" = at least one panel visible
  // "Main view" = all panels hidden
  const isDetailView = visibility.config || visibility.output || visibility.time;

  return {
    visibility,
    togglePanel,
    setAllPanels,
    isDetailView,
  };
}

// Hook for responsive height detection
// Determines if panels should use compact layout based on available space
export function useCompactMode(): boolean {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      // Consider "compact" if viewport height is less than 800px
      // This threshold ensures essential controls remain visible without scrolling
      setIsCompact(window.innerHeight < 800);
    };

    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  return isCompact;
}
