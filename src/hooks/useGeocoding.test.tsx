import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeocoding } from './useGeocoding';


describe('useGeocoding', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return results for search', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        { lat: '10', lon: '20', display_name: 'Test Place' },
      ]),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useGeocoding());

    await act(async () => {
      const res = await result.current.search('Test');
      expect(res).toHaveLength(1);
    });

    expect(result.current.results[0].address).toBe('Test Place');
  });

  it('should handle failed search', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const { result } = renderHook(() => useGeocoding());

    await act(async () => {
      const res = await result.current.search('Fail');
      expect(res).toHaveLength(0);
    });

    expect(result.current.error).toBe('Geocoding request failed');
  });

  it('should handle unknown error type', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      throw 'bad';
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useGeocoding());

    await act(async () => {
      const res = await result.current.search('Boom');
      expect(res).toHaveLength(0);
    });

    expect(result.current.error).toBe('Unknown error');
  });

  it('should reset state when query is empty', async () => {
    const { result } = renderHook(() => useGeocoding());
    await act(async () => {
      const res = await result.current.search('  ');
      expect(res).toHaveLength(0);
    });
    expect(result.current.results).toHaveLength(0);
  });

  it('should reverse geocode', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ display_name: 'Reverse Place' }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useGeocoding());

    await act(async () => {
      const res = await result.current.reverseGeocode(1, 2);
      expect(res?.address).toBe('Reverse Place');
    });
  });

  it('should fallback to coordinates when display name missing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useGeocoding());

    await act(async () => {
      const res = await result.current.reverseGeocode(1.2345, 6.789);
      expect(res?.address).toContain('1.2345');
    });
  });

  it('should handle reverse geocode failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const { result } = renderHook(() => useGeocoding());

    await act(async () => {
      const res = await result.current.reverseGeocode(1, 2);
      expect(res).toBeNull();
    });

    expect(result.current.error).toBe('Reverse geocoding request failed');
  });
});
