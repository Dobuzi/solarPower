import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Text } from '@react-three/drei';
import { SolarPanel } from './SolarPanel';
import { Sun } from './Sun';
import { Ground } from './Ground';
import { useSimulatorStore } from '../../store/simulatorStore';
import { useMemo } from 'react';

function SkyDome() {
  const { solarPosition, isNight } = useSimulatorStore();

  const skyParams = useMemo(() => {
    if (!solarPosition) {
      return { sunPosition: [0, -1, 0] as [number, number, number], turbidity: 10 };
    }

    const elevationRad = solarPosition.elevation * Math.PI / 180;
    const azimuthRad = (solarPosition.azimuth - 180) * Math.PI / 180;

    const y = Math.sin(elevationRad);
    const horizontalDist = Math.cos(elevationRad);
    const x = Math.sin(azimuthRad) * horizontalDist;
    const z = -Math.cos(azimuthRad) * horizontalDist;

    // Turbidity affects sky color - higher at sunrise/sunset
    const turbidity = solarPosition.elevation > 0
      ? 10 - (solarPosition.elevation / 90) * 5
      : 10;

    return {
      sunPosition: [x * 100, y * 100, z * 100] as [number, number, number],
      turbidity,
    };
  }, [solarPosition]);

  // Night sky uses darker settings
  if (isNight) {
    return (
      <Sky
        distance={450000}
        sunPosition={[0, -1, 0]}
        turbidity={10}
        rayleigh={0.1}
        mieCoefficient={0.001}
        mieDirectionalG={0.8}
      />
    );
  }

  return (
    <Sky
      distance={450000}
      sunPosition={skyParams.sunPosition}
      inclination={0.5}
      azimuth={0.25}
      turbidity={skyParams.turbidity}
      rayleigh={2}
    />
  );
}

// Compass component showing cardinal directions
function Compass() {
  const { orientation } = useSimulatorStore();

  const directions = [
    { label: 'N', angle: 0, color: '#ef4444' },
    { label: 'E', angle: 90, color: '#6b7280' },
    { label: 'S', angle: 180, color: '#6b7280' },
    { label: 'W', angle: 270, color: '#6b7280' },
  ];

  return (
    <group position={[0, -0.48, 0]}>
      {/* Compass circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7, 7.2, 64]} />
        <meshBasicMaterial color="#374151" opacity={0.5} transparent />
      </mesh>

      {/* Cardinal direction markers */}
      {directions.map(({ label, angle, color }) => {
        const rad = (angle - 90) * Math.PI / 180;
        const x = Math.cos(rad) * 7.5;
        const z = Math.sin(rad) * 7.5;
        return (
          <group key={label}>
            {/* Direction marker */}
            <mesh position={[x, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.2, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>
            {/* Direction label */}
            <Text
              position={[x * 1.15, 0.1, z * 1.15]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.5}
              color={color}
              anchorX="center"
              anchorY="middle"
            >
              {label}
            </Text>
          </group>
        );
      })}

      {/* Panel azimuth indicator arrow */}
      <group rotation={[0, -(orientation.azimuth - 180) * Math.PI / 180, 0]}>
        <mesh position={[0, 0.02, -3]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 0.6, 8]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[0, 0.01, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 3]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>
    </group>
  );
}

// Scale reference showing 1 meter marks
function ScaleReference() {
  return (
    <group position={[-8, -0.48, 8]}>
      {/* 1m scale bar */}
      <mesh position={[0.5, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 0.05]} />
        <meshBasicMaterial color="#374151" />
      </mesh>
      {/* End caps */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, 0.2]} />
        <meshBasicMaterial color="#374151" />
      </mesh>
      <mesh position={[1, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, 0.2]} />
        <meshBasicMaterial color="#374151" />
      </mesh>
      {/* Label */}
      <Text
        position={[0.5, 0.1, 0.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        color="#374151"
        anchorX="center"
        anchorY="middle"
      >
        1m
      </Text>
    </group>
  );
}

// Sun azimuth indicator on ground
function SunAzimuthIndicator() {
  const { solarPosition, isNight } = useSimulatorStore();

  const sunDirection = useMemo(() => {
    if (!solarPosition) return null;
    const azimuthRad = (solarPosition.azimuth - 180) * Math.PI / 180;
    return {
      x: Math.sin(azimuthRad) * 6,
      z: -Math.cos(azimuthRad) * 6,
    };
  }, [solarPosition]);

  if (!sunDirection) return null;

  const color = isNight ? '#6366f1' : '#f59e0b';
  const opacity = isNight ? 0.3 : 0.6;

  return (
    <group position={[0, -0.47, 0]}>
      {/* Dashed line from center to sun direction */}
      <mesh position={[sunDirection.x / 2, 0, sunDirection.z / 2]} rotation={[-Math.PI / 2, 0, Math.atan2(sunDirection.x, -sunDirection.z)]}>
        <planeGeometry args={[0.08, Math.sqrt(sunDirection.x ** 2 + sunDirection.z ** 2)]} />
        <meshBasicMaterial color={color} opacity={opacity} transparent />
      </mesh>
      {/* Sun direction marker */}
      <mesh position={[sunDirection.x, 0.01, sunDirection.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

export function Scene() {
  const { isNight, isTwilight } = useSimulatorStore();

  // Ambient light intensity based on time of day
  const ambientIntensity = useMemo(() => {
    if (isNight) return 0.15;
    if (isTwilight) return 0.25;
    return 0.4;
  }, [isNight, isTwilight]);

  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />

        {/* Lighting */}
        <ambientLight intensity={ambientIntensity} color={isNight ? '#a5b4fc' : '#ffffff'} />
        <hemisphereLight
          color={isNight ? '#3730a3' : '#87ceeb'}
          groundColor={isNight ? '#1e1b4b' : '#4ade80'}
          intensity={isNight ? 0.15 : 0.5}
        />

        {/* Point light for night ambient */}
        {isNight && (
          <pointLight
            position={[0, 10, 0]}
            intensity={0.1}
            color="#a5b4fc"
            distance={30}
          />
        )}

        {/* Sky */}
        <SkyDome />

        {/* Scene objects */}
        <group position={[0, 0.5, 0]}>
          <SolarPanel />
        </group>
        <Sun />
        <Ground />

        {/* Compass and indicators */}
        <Compass />
        <ScaleReference />
        <SunAzimuthIndicator />
      </Canvas>
    </div>
  );
}
