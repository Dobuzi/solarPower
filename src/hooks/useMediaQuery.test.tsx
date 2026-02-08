import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, useIsMobile, useIsTablet, usePrefersReducedMotion } from './useMediaQuery';


describe('useMediaQuery', () => {
  it('should update when media query changes', () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];

    window.matchMedia = ((query: string) => {
      return {
        matches: false,
        media: query,
        addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb),
        removeEventListener: () => {},
      } as MediaQueryList;
    }) as typeof window.matchMedia;

    const { result } = renderHook(() => useMediaQuery('(max-width: 600px)'));
    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach((cb) => cb({ matches: true } as MediaQueryListEvent));
    });

    expect(result.current).toBe(true);
  });

  it('should remove listener on unmount', () => {
    const removeListener = vi.fn();
    window.matchMedia = ((query: string) => {
      return {
        matches: true,
        media: query,
        addEventListener: () => {},
        removeEventListener: removeListener,
      } as MediaQueryList;
    }) as typeof window.matchMedia;

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 600px)'));
    unmount();

    expect(removeListener).toHaveBeenCalled();
  });

  it('should expose convenience hooks', () => {
    window.matchMedia = ((query: string) => {
      return {
        matches: query.includes('max-width: 767px'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      } as MediaQueryList;
    }) as typeof window.matchMedia;

    const { result: isMobile } = renderHook(() => useIsMobile());
    const { result: isTablet } = renderHook(() => useIsTablet());
    const { result: reduced } = renderHook(() => usePrefersReducedMotion());

    expect(isMobile.current).toBe(true);
    expect(isTablet.current).toBe(false);
    expect(reduced.current).toBe(false);
  });
});
