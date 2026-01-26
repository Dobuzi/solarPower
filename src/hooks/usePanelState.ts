import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'solar-sim-panel-state';

export interface PanelVisibility {
  config: boolean;
  output: boolean;
  time: boolean;
}

interface PanelState {
  desktop: PanelVisibility;
  mobile: PanelVisibility;
}

const defaultState: PanelState = {
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
      return { ...defaultState, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load panel state:', e);
  }
  return defaultState;
}

function saveState(state: PanelState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save panel state:', e);
  }
}

export function usePanelState(isMobile: boolean) {
  const [state, setState] = useState<PanelState>(loadState);

  // Get current visibility based on device type
  const visibility = isMobile ? state.mobile : state.desktop;

  // Toggle a specific panel
  const togglePanel = useCallback((panel: keyof PanelVisibility) => {
    setState((prev) => {
      const deviceKey = isMobile ? 'mobile' : 'desktop';
      const newState = {
        ...prev,
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

  // Check if any panel is visible (for "Main View" detection)
  const isDetailView = visibility.config || visibility.output || visibility.time;

  return {
    visibility,
    togglePanel,
    setAllPanels,
    isDetailView,
  };
}

// Hook for responsive height detection
export function useCompactMode(): boolean {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      // Consider "compact" if viewport height is less than 800px
      setIsCompact(window.innerHeight < 800);
    };

    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  return isCompact;
}
