/**
 * Solar Panel 3D Component
 *
 * Renders an array of solar panels with correct rotation behavior:
 * - Azimuth rotates around world vertical (Y-axis)
 * - Tilt rotates around panel hinge axis (after azimuth applied)
 * - Pivot point at bottom edge for realistic mounting
 * - Max 3 rows, expands horizontally
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulatorStore } from '../../store/simulatorStore';

export function SolarPanel() {
  const groupRef = useRef<THREE.Group>(null);
  const { panelConfig, orientation, poaIrradiance, panelCount, isNight, isTwilight } = useSimulatorStore();

  // Calculate intensity for visual effect
  const intensity = useMemo(() => {
    if (!poaIrradiance) return 0;
    return Math.min(1, poaIrradiance.total / 1000);
  }, [poaIrradiance]);

  // Panel color based on irradiance and time of day
  const panelColor = useMemo(() => {
    if (isNight) {
      // Night mode: low-saturation blue-gray to maintain visibility
      return new THREE.Color(0x2d3748); // Dark slate gray
    }
    if (isTwilight) {
      // Twilight: slightly desaturated
      const baseColor = new THREE.Color(0x1e3a5f);
      const twilightColor = new THREE.Color(0x4a5568);
      return baseColor.lerp(twilightColor, 0.3);
    }
    // Daytime: blue with intensity-based glow
    const baseColor = new THREE.Color(0x1a365d); // Dark blue
    const glowColor = new THREE.Color(0x3b82f6); // Bright blue
    return baseColor.lerp(glowColor, intensity * 0.5);
  }, [intensity, isNight, isTwilight]);

  // Frame color changes with time of day
  const frameColor = useMemo(() => {
    if (isNight) return '#4a5568'; // Lighter gray for night visibility
    return '#374151';
  }, [isNight]);

  // Calculate grid layout: max 3 rows, expand horizontally
  // Layout fills downward first (up to 3 rows), then starts new column
  const gridLayout = useMemo(() => {
    const maxRows = 3;
    const rows = Math.min(maxRows, panelCount);
    const cols = Math.ceil(panelCount / maxRows);
    return { cols, rows, maxRows };
  }, [panelCount]);

  // Apply correct rotation order: azimuth (yaw around world Y) then tilt (pitch around local X)
  // Pivot point is at bottom edge of panel array for realistic hinge behavior
  useFrame(() => {
    if (groupRef.current) {
      const tiltRad = orientation.tilt * Math.PI / 180;
      const azimuthRad = (orientation.azimuth - 180) * Math.PI / 180;

      // Reset rotation
      groupRef.current.rotation.set(0, 0, 0);

      // Step 1: Apply azimuth (yaw) around world vertical (Y-axis)
      groupRef.current.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), azimuthRad);

      // Step 2: Apply tilt (pitch) around the now-rotated local X-axis
      // This creates the correct hinge behavior
      groupRef.current.rotateOnAxis(new THREE.Vector3(1, 0, 0), -tiltRad);
    }
  });

  const spacing = 0.1;
  const panelWidth = panelConfig.width;
  const panelHeight = panelConfig.height;

  // Calculate pivot offset to place rotation axis at bottom edge of array
  const pivotOffset = useMemo(() => {
    // Bottom edge is at negative Z (panels extend in +Z direction)
    return (gridLayout.rows - 1) * (panelHeight + spacing) / 2;
  }, [gridLayout.rows, panelHeight, spacing]);

  return (
    <group ref={groupRef}>
      {/* Offset panels so rotation pivot is at bottom edge */}
      <group position={[0, 0, pivotOffset]}>
        {Array.from({ length: panelCount }).map((_, index) => {
          // Fill downward first (max 3 rows), then start new column
          const row = index % gridLayout.maxRows;
          const col = Math.floor(index / gridLayout.maxRows);

          // Center the array horizontally
          const x = (col - (gridLayout.cols - 1) / 2) * (panelWidth + spacing);
          // Stack vertically (downward in +Z direction)
          const z = (row - (gridLayout.rows - 1) / 2) * (panelHeight + spacing);

          return (
            <group key={index} position={[x, 0, z]}>
              {/* Panel frame */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[panelWidth, 0.04, panelHeight]} />
                <meshStandardMaterial
                  color={frameColor}
                  metalness={0.8}
                  roughness={0.3}
                  emissive={isNight ? '#1a1a2e' : '#000000'}
                  emissiveIntensity={isNight ? 0.1 : 0}
                />
              </mesh>

              {/* Solar cells */}
              <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
                <boxGeometry args={[panelWidth - 0.05, 0.01, panelHeight - 0.05]} />
                <meshStandardMaterial
                  color={panelColor}
                  metalness={isNight ? 0.2 : 0.4}
                  roughness={isNight ? 0.4 : 0.2}
                  emissive={isNight ? '#1a1a2e' : panelColor}
                  emissiveIntensity={isNight ? 0.05 : intensity * 0.3}
                />
              </mesh>

              {/* Cell grid lines */}
              {Array.from({ length: 6 }).map((_, i) => (
                <mesh key={`h${i}`} position={[0, 0.031, (i - 2.5) * (panelHeight / 6)]}>
                  <boxGeometry args={[panelWidth - 0.05, 0.002, 0.005]} />
                  <meshStandardMaterial color={isNight ? '#2d3748' : '#1e3a5f'} />
                </mesh>
              ))}
              {Array.from({ length: 10 }).map((_, i) => (
                <mesh key={`v${i}`} position={[(i - 4.5) * (panelWidth / 10), 0.031, 0]}>
                  <boxGeometry args={[0.005, 0.002, panelHeight - 0.05]} />
                  <meshStandardMaterial color={isNight ? '#2d3748' : '#1e3a5f'} />
                </mesh>
              ))}
            </group>
          );
        })}

        {/* Mounting structure - horizontal rail */}
        <mesh position={[0, -0.15, -pivotOffset]} castShadow>
          <boxGeometry args={[gridLayout.cols * (panelWidth + spacing), 0.05, 0.1]} />
          <meshStandardMaterial
            color={isNight ? '#718096' : '#6b7280'}
            metalness={0.7}
            roughness={0.3}
            emissive={isNight ? '#1a1a2e' : '#000000'}
            emissiveIntensity={isNight ? 0.05 : 0}
          />
        </mesh>

        {/* Mounting legs - support posts at each end */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * (gridLayout.cols * (panelWidth + spacing) / 2 - 0.2), -0.3, -pivotOffset]}
            castShadow
          >
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial
              color={isNight ? '#718096' : '#6b7280'}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
