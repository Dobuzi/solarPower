import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getMediaQueryMatch, useMediaQuery, useIsMobile, useIsTablet, usePrefersReducedMotion } from './useMediaQuery';


const createMediaQueryList = (
  matches: boolean,
  media: string,
  addEventListener?: MediaQueryList['addEventListener'],
  removeEventListener?: MediaQueryList['removeEventListener'],
): MediaQueryList => {
  return {
    matches,
    media,
    onchange: null,
    addEventListener: addEventListener ?? (() => {}),
    removeEventListener: removeEventListener ?? (() => {}),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as MediaQueryList;
};

describe('useMediaQuery', () => {
  it('returns false when no window is available', () => {
    expect(getMediaQueryMatch('(max-width: 600px)', undefined)).toBe(false);
  });

  it('returns match result from provided window', () => {
    const mockWindow = {
      matchMedia: (query: string) => ({ matches: query.includes('max-width: 600px') }),
    } as Window;

    expect(getMediaQueryMatch('(max-width: 600px)', mockWindow)).toBe(true);
    expect(getMediaQueryMatch('(min-width: 1200px)', mockWindow)).toBe(false);
  });

  it('should update when media query changes', () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];

    window.matchMedia = ((query: string) => {
      return createMediaQueryList(
        false,
        query,
        (_: string, cb: EventListenerOrEventListenerObject) => {
          if (typeof cb === 'function') {
            listeners.push(cb as (e: MediaQueryListEvent) => void);
          }
        },
      );
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
      return createMediaQueryList(true, query, undefined, removeListener);
    }) as typeof window.matchMedia;

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 600px)'));
    unmount();

    expect(removeListener).toHaveBeenCalled();
  });

  it('should expose convenience hooks', () => {
    window.matchMedia = ((query: string) => {
      return createMediaQueryList(query.includes('max-width: 767px'), query);
    }) as typeof window.matchMedia;

    const { result: isMobile } = renderHook(() => useIsMobile());
    const { result: isTablet } = renderHook(() => useIsTablet());
    const { result: reduced } = renderHook(() => usePrefersReducedMotion());

    expect(isMobile.current).toBe(true);
    expect(isTablet.current).toBe(false);
    expect(reduced.current).toBe(false);
  });
});
