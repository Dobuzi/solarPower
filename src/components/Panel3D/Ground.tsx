import { useMemo } from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

export function Ground() {
  const { isNight, isTwilight } = useSimulatorStore();

  // Ground color changes with time of day
  const groundColor = useMemo(() => {
    if (isNight) return '#1e3a32'; // Dark green-gray for night
    if (isTwilight) return '#2d5a4a'; // Muted green for twilight
    return '#4ade80'; // Bright green for day
  }, [isNight, isTwilight]);

  const gridColor = useMemo(() => {
    if (isNight) return '#374151';
    return '#9ca3af';
  }, [isNight]);

  const gridSecondaryColor = useMemo(() => {
    if (isNight) return '#4b5563';
    return '#d1d5db';
  }, [isNight]);

  return (
    <>
      {/* Ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color={groundColor}
          roughness={0.8}
          metalness={0.1}
          emissive={isNight ? '#0d1f1a' : '#000000'}
          emissiveIntensity={isNight ? 0.1 : 0}
        />
      </mesh>

      {/* Grid helper for reference */}
      <gridHelper
        args={[20, 20, gridColor, gridSecondaryColor]}
        position={[0, -0.49, 0]}
      />

      {/* Horizon line indicator */}
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[24.9, 25, 64]} />
        <meshBasicMaterial
          color={isNight ? '#4b5563' : '#9ca3af'}
          opacity={0.3}
          transparent
        />
      </mesh>
    </>
  );
}
