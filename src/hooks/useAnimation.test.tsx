import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimation } from './useAnimation';
import { useSimulatorStore } from '../store/simulatorStore';

const initialState = useSimulatorStore.getState();

describe('useAnimation', () => {
  let rafCallback: FrameRequestCallback | null = null;

  beforeEach(() => {
    useSimulatorStore.setState(initialState, true);

    global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    }) as unknown as typeof requestAnimationFrame;

    global.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    rafCallback = null;
    vi.restoreAllMocks();
  });

  it('should toggle animation state', () => {
    const setIsAnimating = vi.fn((isAnimating: boolean) => {
      useSimulatorStore.setState({ isAnimating });
    });

    useSimulatorStore.setState({
      isAnimating: false,
      setIsAnimating,
    });

    const { result } = renderHook(() => useAnimation());

    act(() => {
      result.current.toggle();
    });

    expect(setIsAnimating).toHaveBeenCalledWith(true);
    expect(useSimulatorStore.getState().isAnimating).toBe(true);
  });

  it('should advance animation hour based on speed', () => {
    const setAnimationHour = vi.fn((hour: number) => {
      useSimulatorStore.setState({ animationHour: hour });
    });

    useSimulatorStore.setState({
      animationHour: 0,
      animationSpeed: 2,
      isAnimating: true,
      setAnimationHour,
    });

    renderHook(() => useAnimation());

    act(() => {
      if (!rafCallback) throw new Error('RAF callback not set');
      rafCallback(1000);
    });

    act(() => {
      if (!rafCallback) throw new Error('RAF callback not set');
      rafCallback(2000);
    });

    expect(setAnimationHour).toHaveBeenCalled();
    expect(useSimulatorStore.getState().animationHour).toBeCloseTo(2, 2);
  });
});
