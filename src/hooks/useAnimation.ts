import { useEffect, useRef, useCallback } from 'react';
import { useSimulatorStore } from '../store/simulatorStore';

export function useAnimation() {
  const { isAnimating, animationSpeed, animationHour, setAnimationHour, setIsAnimating } = useSimulatorStore();
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Update hour based on animation speed
    // Speed 1 = 1 hour per second, Speed 2 = 2 hours per second, etc.
    const hourIncrement = (delta / 1000) * animationSpeed;

    setAnimationHour((animationHour + hourIncrement) % 24);

    frameRef.current = requestAnimationFrame(animate);
  }, [animationHour, animationSpeed, setAnimationHour]);

  useEffect(() => {
    if (isAnimating) {
      lastTimeRef.current = 0;
      frameRef.current = requestAnimationFrame(animate);
    } else {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isAnimating, animate]);

  const play = useCallback(() => setIsAnimating(true), [setIsAnimating]);
  const pause = useCallback(() => setIsAnimating(false), [setIsAnimating]);
  const toggle = useCallback(() => setIsAnimating(!isAnimating), [isAnimating, setIsAnimating]);

  return {
    isAnimating,
    animationSpeed,
    animationHour,
    play,
    pause,
    toggle,
    setAnimationHour,
  };
}
