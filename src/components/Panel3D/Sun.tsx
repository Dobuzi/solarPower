import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulatorStore } from '../../store/simulatorStore';

export function Sun() {
  const sunRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const { solarPosition, isNight } = useSimulatorStore();

  const sunPosition = useMemo(() => {
    if (!solarPosition) {
      return new THREE.Vector3(0, -10, 0);
    }

    const distance = 15;
    const elevationRad = solarPosition.elevation * Math.PI / 180;
    const azimuthRad = (solarPosition.azimuth - 180) * Math.PI / 180;

    const y = Math.sin(elevationRad) * distance;
    const horizontalDist = Math.cos(elevationRad) * distance;
    const x = Math.sin(azimuthRad) * horizontalDist;
    const z = -Math.cos(azimuthRad) * horizontalDist;

    return new THREE.Vector3(x, y, z);
  }, [solarPosition]);

  // Sun intensity based on elevation - gradual fade for twilight
  const intensity = useMemo(() => {
    if (!solarPosition) return 0;
    if (solarPosition.elevation < -6) return 0; // Below civil twilight
    if (solarPosition.elevation < 0) {
      // Twilight: gradual fade
      return Math.max(0, (solarPosition.elevation + 6) / 6) * 0.3;
    }
    return Math.min(1, solarPosition.elevation / 45);
  }, [solarPosition]);

  // Sun color changes throughout the day
  const sunColor = useMemo(() => {
    if (!solarPosition) return '#fbbf24';
    if (solarPosition.elevation < -6) return '#4a5568'; // Gray when far below horizon
    if (solarPosition.elevation < 0) return '#f97316'; // Orange during twilight
    if (solarPosition.elevation < 15) return '#fb923c'; // Orange-yellow at low elevation
    return '#fbbf24'; // Yellow when higher
  }, [solarPosition]);

  const glowColor = useMemo(() => {
    if (!solarPosition) return '#fcd34d';
    if (solarPosition.elevation < -6) return '#6b7280';
    if (solarPosition.elevation < 0) return '#fdba74';
    return '#fcd34d';
  }, [solarPosition]);

  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.position.copy(sunPosition);
    }
    if (lightRef.current) {
      lightRef.current.position.copy(sunPosition);
      lightRef.current.intensity = Math.max(0, intensity * 2);
    }
  });

  // Show sun indicator even when below horizon (but not visible sphere)
  const showSunSphere = solarPosition && solarPosition.elevation > -18;
  const isBelowHorizon = solarPosition && solarPosition.elevation < 0;

  return (
    <>
      {/* Sun sphere - visible during day and twilight, faded when below horizon */}
      {showSunSphere && (
        <group ref={sunRef} position={sunPosition}>
          {/* Sun sphere */}
          <mesh>
            <sphereGeometry args={[0.8, 32, 32]} />
            <meshBasicMaterial
              color={sunColor}
              transparent={isBelowHorizon || false}
              opacity={isBelowHorizon ? 0.3 : 1}
            />
          </mesh>

          {/* Sun glow */}
          <mesh>
            <sphereGeometry args={[1.2, 32, 32]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={isBelowHorizon ? 0.1 : 0.3 + intensity * 0.3}
            />
          </mesh>

          {/* Sun rays - only show above horizon */}
          {!isBelowHorizon && Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0]}
                rotation={[0, 0, angle]}
              >
                <boxGeometry args={[0.8, 0.1, 0.1]} />
                <meshBasicMaterial color="#fde68a" transparent opacity={0.5 * intensity} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Directional light from sun */}
      <directionalLight
        ref={lightRef}
        position={sunPosition}
        intensity={intensity * 2}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Sun path indicator line - shows where sun travels */}
      {isBelowHorizon && solarPosition && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, 0, 0, sunPosition.x, 0, sunPosition.z])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#f97316" opacity={0.3} transparent />
        </line>
      )}

      {/* Moon indicator for night */}
      {isNight && solarPosition && solarPosition.elevation < -6 && (
        <group position={[
          -sunPosition.x * 0.8,
          Math.max(5, Math.abs(sunPosition.y) * 0.5),
          -sunPosition.z * 0.8
        ]}>
          <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="#e2e8f0" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.7, 32, 32]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={0.2} />
          </mesh>
        </group>
      )}
    </>
  );
}
