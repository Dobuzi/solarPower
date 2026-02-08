import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePanelState } from './usePanelState';


describe('usePanelState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should toggle panel visibility and persist', () => {
    const { result } = renderHook(() => usePanelState(false));

    expect(result.current.visibility.config).toBe(true);

    act(() => {
      result.current.togglePanel('config');
    });

    expect(result.current.visibility.config).toBe(false);

    const stored = localStorage.getItem('solar-sim-panel-state-v2');
    expect(stored).toContain('"config":false');
  });

  it('should set all panels visibility', () => {
    const { result } = renderHook(() => usePanelState(false));

    act(() => {
      result.current.setAllPanels(false);
    });

    expect(result.current.visibility.config).toBe(false);
    expect(result.current.visibility.output).toBe(false);
    expect(result.current.visibility.time).toBe(false);
  });

  it('should load defaults on version mismatch', () => {
    localStorage.setItem('solar-sim-panel-state-v2', JSON.stringify({ version: 1, desktop: { config: false } }));
    const { result } = renderHook(() => usePanelState(false));
    expect(result.current.visibility.config).toBe(true);
  });

  it('should handle mobile state and toggle', () => {
    const { result, rerender } = renderHook(({ isMobile }) => usePanelState(isMobile), { initialProps: { isMobile: true } });
    expect(result.current.visibility.config).toBe(true);

    act(() => {
      result.current.togglePanel('config');
    });
    expect(result.current.visibility.config).toBe(false);

    rerender({ isMobile: false });
    expect(result.current.visibility.config).toBe(true);
  });
});
