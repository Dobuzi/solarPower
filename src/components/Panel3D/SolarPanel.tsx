import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulatorStore } from '../../store/simulatorStore';

export function SolarPanel() {
  const meshRef = useRef<THREE.Group>(null);
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

  // Calculate grid layout
  const gridLayout = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(panelCount));
    const rows = Math.ceil(panelCount / cols);
    return { cols, rows };
  }, [panelCount]);

  useFrame(() => {
    if (meshRef.current) {
      // Apply orientation
      const tiltRad = orientation.tilt * Math.PI / 180;
      const azimuthRad = (orientation.azimuth - 180) * Math.PI / 180;

      meshRef.current.rotation.x = -tiltRad;
      meshRef.current.rotation.y = azimuthRad;
    }
  });

  const spacing = 0.1;
  const panelWidth = panelConfig.width;
  const panelHeight = panelConfig.height;

  return (
    <group ref={meshRef}>
      {Array.from({ length: panelCount }).map((_, index) => {
        const col = index % gridLayout.cols;
        const row = Math.floor(index / gridLayout.cols);
        const x = (col - (gridLayout.cols - 1) / 2) * (panelWidth + spacing);
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

      {/* Mounting structure */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[gridLayout.cols * (panelWidth + spacing), 0.05, 0.1]} />
        <meshStandardMaterial
          color={isNight ? '#718096' : '#6b7280'}
          metalness={0.7}
          roughness={0.3}
          emissive={isNight ? '#1a1a2e' : '#000000'}
          emissiveIntensity={isNight ? 0.05 : 0}
        />
      </mesh>

      {/* Mounting legs */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (gridLayout.cols * (panelWidth + spacing) / 2 - 0.2), -0.3, 0]}
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
  );
}
