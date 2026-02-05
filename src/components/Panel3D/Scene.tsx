import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Text } from '@react-three/drei';
import { SolarPanel } from './SolarPanel';
import { Sun } from './Sun';
import { Ground } from './Ground';
import { useSimulatorStore } from '../../store/simulatorStore';
import { useMemo, useRef, useCallback } from 'react';

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
      {/* Sun direction label */}
      <Text
        position={[sunDirection.x, 0.1, sunDirection.z + 0.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {isNight ? 'Moon' : 'Sun'}
      </Text>
    </group>
  );
}

interface SceneProps {
  // Optional: Pass bottom sheet state for context-aware camera
  bottomSheetState?: 'peek' | 'default' | 'full' | 'closed';
}

export function Scene({ bottomSheetState = 'closed' }: SceneProps) {
  const { isNight, isTwilight, solarPosition } = useSimulatorStore();

  // UX Refinement: Sun-aware camera as one-time assist, not automation
  // - Applies only on first entry or explicit reset
  // - Stops permanently after user manually rotates once
  // - Does NOT auto-adjust on time slider changes
  // ENABLED for zero-onboarding: users immediately see optimal view
  const sunAwareCamera = true; // Subtle auto-adjustment toward sun direction

  // Track user interaction: once user rotates, disable all camera automation permanently
  const hasUserRotated = useRef(false);

  // Detect mobile/touch device for adjusted controls
  const isMobile = useMemo(() => {
    return 'ontouchstart' in window || window.innerWidth < 768;
  }, []);

  // Ambient light intensity based on time of day
  const ambientIntensity = useMemo(() => {
    if (isNight) return 0.2; // Slightly increased for better shadow readability
    if (isTwilight) return 0.3;
    return 0.45; // Increased ambient for better contrast without over-darkening
  }, [isNight, isTwilight]);

  // Panel mounting height: 1.0m above ground
  const panelBaseY = 0.52;

  // Camera setup with one-time sun-aware framing hint
  // UX Intent: Provide helpful initial framing, then respect user control
  const cameraInitialPosition: [number, number, number] = useMemo(() => {
    const basePos: [number, number, number] = [6, 4.5, -6];

    // Only apply sun-aware framing if:
    // 1. Feature is enabled
    // 2. User has never rotated (first-time hint only)
    // 3. Solar position exists
    if (!sunAwareCamera || hasUserRotated.current || !solarPosition) {
      return basePos;
    }

    // Calculate optimal viewing angle (~90° from sun for best lighting)
    const sunAzimuthRad = (solarPosition.azimuth - 180) * Math.PI / 180;
    const cameraOffsetAngle = sunAzimuthRad + Math.PI / 2;

    const distance = Math.sqrt(basePos[0] ** 2 + basePos[2] ** 2);
    const x = Math.sin(cameraOffsetAngle) * distance;
    const z = -Math.cos(cameraOffsetAngle) * distance;

    return [x, basePos[1], z];
  }, [sunAwareCamera, solarPosition]); // Removed isUserControlling - only check once

  const cameraTarget: [number, number, number] = [0, panelBaseY, 0];

  // UX Refinement: Context-aware camera sensitivity
  // When bottom sheet is expanded, reduce camera rotation to prevent accidental movement
  // This keeps user focus on settings without camera "fighting" for attention
  const controlsConfig = useMemo(() => {
    const isSheetExpanded = bottomSheetState === 'default' || bottomSheetState === 'full';

    if (isMobile) {
      return {
        // Mobile base speeds (comfortable one-handed control)
        rotateSpeed: isSheetExpanded ? 0.3 : 0.5,  // Further reduced when sheet open
        zoomSpeed: isSheetExpanded ? 0.4 : 0.6,
        panSpeed: isSheetExpanded ? 0.3 : 0.5,
        dampingFactor: 0.1, // Slightly more damping for stability
        enableRotate: true, // Always allow (just slower when sheet open)
      };
    }

    // Desktop: unchanged for precision
    return {
      rotateSpeed: 1.0,
      zoomSpeed: 1.0,
      panSpeed: 1.0,
      dampingFactor: 0.05,
      enableRotate: true,
    };
  }, [isMobile, bottomSheetState]);

  // Handle OrbitControls interaction events
  // UX Intent: Detect when user takes manual control and respect that choice
  // Performance: useCallback prevents OrbitControls re-render
  const handleControlStart = useCallback(() => {
    // Mark that user has interacted - disable sun-aware framing permanently
    hasUserRotated.current = true;
  }, []);

  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={cameraInitialPosition} fov={50} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={controlsConfig.enableRotate}
          enableDamping={true}
          dampingFactor={controlsConfig.dampingFactor}
          rotateSpeed={controlsConfig.rotateSpeed}
          zoomSpeed={controlsConfig.zoomSpeed}
          panSpeed={controlsConfig.panSpeed}
          target={cameraTarget}
          minDistance={3}
          maxDistance={30}
          // UX: Conservative angle limits prevent "lost" feeling
          // Never go below horizon, never go directly overhead
          minPolarAngle={Math.PI / 8}  // ~22° minimum (not too flat)
          maxPolarAngle={Math.PI / 2 - 0.1}  // Just above horizon
          onStart={handleControlStart}
        />

        {/* Lighting - Tuned for clear sun-to-panel-to-shadow relationship */}
        <ambientLight intensity={ambientIntensity} color={isNight ? '#a5b4fc' : '#ffffff'} />
        <hemisphereLight
          color={isNight ? '#3730a3' : '#87ceeb'}
          groundColor={isNight ? '#1e1b4b' : '#4ade80'}
          intensity={isNight ? 0.2 : 0.6}
        />

        {/* Point light for night ambient */}
        {isNight && (
          <pointLight
            position={[0, 10, 0]}
            intensity={0.15}
            color="#a5b4fc"
            distance={30}
          />
        )}

        {/* Sky */}
        <SkyDome />

        {/* Scene objects */}
        {/* Panel group at realistic mounting height: 1.0m above ground */}
        <group position={[0, panelBaseY, 0]}>
          <SolarPanel />
        </group>
        <Sun />
        <Ground />

        {/* Orientation cues: Compass and indicators reinforce spatial relationships */}
        <Compass />
        <ScaleReference />
        <SunAzimuthIndicator />
      </Canvas>
    </div>
  );
}
