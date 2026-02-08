import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';


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
});
