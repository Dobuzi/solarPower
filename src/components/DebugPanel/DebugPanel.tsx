/**
 * Debug Panel - Development-only component for exposing calculation details
 *
 * Shows intermediate values in the power calculation pipeline:
 * - Irradiance components (GHI, DNI, DHI)
 * - POA irradiance breakdown
 * - Loss factors
 * - Power at each stage
 */

import { useSimulatorStore, selectSystemSize } from '../../store/simulatorStore';

// Only show in development mode
const DEV_MODE = import.meta.env.DEV;

export function DebugPanel() {
  if (!DEV_MODE) return null;

  const {
    solarPosition,
    irradiance,
    poaIrradiance,
    instantPower,
    dailyOutput,
    currentLosses,
    cellTemperature,
    panelConfig,
    panelCount,
    ambientTemp,
    location,
    animationHour,
    orientation,
    linkeTurbidity,
    albedo,
  } = useSimulatorStore();

  const systemSize = useSimulatorStore(selectSystemSize);

  if (!solarPosition || !irradiance || !poaIrradiance) {
    return (
      <div className="bg-black/80 text-green-400 font-mono text-xs p-3 rounded-lg max-w-sm">
        <div className="text-yellow-400 font-bold mb-2">🔧 DEBUG PANEL</div>
        <div>Waiting for calculation...</div>
      </div>
    );
  }

  // Calculate expected theoretical max
  const stcIrradiance = 1000; // W/m² at STC
  const theoreticalMaxDC = panelConfig.ratedPower * panelCount;
  const irradianceRatio = poaIrradiance.effectiveIrradiance / stcIrradiance;
  const expectedDC = theoreticalMaxDC * irradianceRatio;

  // Get current hour's data from daily output
  const hourIndex = Math.floor(animationHour);
  const currentHourData = dailyOutput?.hourlyData[hourIndex];

  return (
    <div className="bg-black/90 text-green-400 font-mono text-xs p-3 rounded-lg max-w-md overflow-auto max-h-[80vh]">
      <div className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
        🔧 DEBUG PANEL
        <span className="text-gray-500 font-normal">(dev only)</span>
      </div>

      {/* System Info */}
      <Section title="System">
        <Row label="Location" value={`${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`} />
        <Row label="Timezone" value={location.timezone} />
        <Row label="Elevation" value={`${location.elevation || 0}m`} />
        <Row label="Animation Hour" value={animationHour.toFixed(2)} />
        <Row label="System Size" value={`${systemSize.toFixed(2)} kW (${panelCount} × ${panelConfig.ratedPower}W)`} />
        <Row label="Panel Tilt" value={`${orientation.tilt.toFixed(1)}°`} />
        <Row label="Panel Azimuth" value={`${orientation.azimuth.toFixed(1)}°`} />
      </Section>

      {/* Solar Position */}
      <Section title="Solar Position">
        <Row label="Elevation" value={`${solarPosition.elevation.toFixed(2)}°`} />
        <Row label="Azimuth" value={`${solarPosition.azimuth.toFixed(2)}°`} />
        <Row label="Zenith" value={`${solarPosition.zenith.toFixed(2)}°`} />
        <Row label="Is Night" value={solarPosition.isNight ? 'YES' : 'no'} warn={solarPosition.isNight} />
      </Section>

      {/* Irradiance (Horizontal) */}
      <Section title="Irradiance (Horizontal)">
        <Row label="GHI" value={`${irradiance.ghi.toFixed(1)} W/m²`} warn={irradiance.ghi < 100 && !solarPosition.isNight} />
        <Row label="DNI" value={`${irradiance.dni.toFixed(1)} W/m²`} warn={irradiance.dni < 200 && !solarPosition.isNight} />
        <Row label="DHI" value={`${irradiance.dhi.toFixed(1)} W/m²`} />
        <Row label="Extraterrestrial" value={`${irradiance.extraterrestrial.toFixed(1)} W/m²`} />
        <Row label="Air Mass" value={irradiance.airMass.toFixed(3)} />
        <Row label="Clearness Index" value={irradiance.clearnessIndex.toFixed(3)} warn={irradiance.clearnessIndex < 0.4 && !solarPosition.isNight} />
        <Row label="Linke Turbidity" value={linkeTurbidity.toFixed(1)} />
      </Section>

      {/* POA Irradiance */}
      <Section title="POA Irradiance (Tilted Surface)">
        <Row label="Total POA" value={`${poaIrradiance.total.toFixed(1)} W/m²`} />
        <Row label="Beam" value={`${poaIrradiance.beam.toFixed(1)} W/m²`} />
        <Row label="Diffuse" value={`${poaIrradiance.diffuse.toFixed(1)} W/m²`} />
        <Row label="Reflected" value={`${poaIrradiance.reflected.toFixed(1)} W/m²`} />
        <Row label="Angle of Incidence" value={`${poaIrradiance.angleOfIncidence.toFixed(2)}°`} />
        <Row label="Effective (after IAM)" value={`${poaIrradiance.effectiveIrradiance.toFixed(1)} W/m²`} warn={poaIrradiance.effectiveIrradiance < 500 && !solarPosition.isNight} />
        <Row label="Ground Albedo" value={albedo.toFixed(2)} />
      </Section>

      {/* Temperature */}
      <Section title="Temperature">
        <Row label="Ambient" value={`${ambientTemp.toFixed(1)}°C`} />
        <Row label="Cell Temp" value={`${cellTemperature.toFixed(1)}°C`} />
        <Row label="Temp Rise" value={`+${(cellTemperature - ambientTemp).toFixed(1)}°C`} />
      </Section>

      {/* Loss Factors */}
      <Section title="Loss Factors (multipliers)">
        {currentLosses && (
          <>
            <Row label="Temperature" value={currentLosses.temperature.toFixed(4)} warn={currentLosses.temperature < 0.9} />
            <Row label="Incidence Angle (IAM)" value={currentLosses.incidenceAngle.toFixed(4)} warn={currentLosses.incidenceAngle < 0.9} />
            <Row label="Spectral" value={currentLosses.spectral.toFixed(4)} />
            <Row label="System Total" value={currentLosses.systemTotal.toFixed(4)} />
            <Row label="Inverter Clipping" value={`${currentLosses.inverterClipping.toFixed(2)}%`} />
          </>
        )}
      </Section>

      {/* Power Calculation */}
      <Section title="Power Calculation">
        <Row label="Irradiance Ratio" value={`${(irradianceRatio * 100).toFixed(1)}%`} warn={irradianceRatio < 0.5 && !solarPosition.isNight} />
        <Row label="Theoretical Max DC" value={`${(theoreticalMaxDC / 1000).toFixed(2)} kW`} />
        <Row label="Expected DC (irrad only)" value={`${(expectedDC / 1000).toFixed(2)} kW`} />
        {currentHourData && (
          <>
            <Row label="Actual DC Power" value={`${(currentHourData.dcPower / 1000).toFixed(3)} kW`} />
            <Row label="Actual AC Power" value={`${(currentHourData.acPower / 1000).toFixed(3)} kW`} />
          </>
        )}
        <Row
          label="Instant Power (display)"
          value={`${(instantPower / 1000).toFixed(3)} kW`}
          warn={instantPower < expectedDC * 0.5 && !solarPosition.isNight}
        />
      </Section>

      {/* Daily Summary */}
      {dailyOutput && (
        <Section title="Daily Output">
          <Row label="Daily Energy" value={`${(dailyOutput.dailyEnergy / 1000).toFixed(2)} kWh`} />
          <Row label="Peak Power" value={`${(dailyOutput.peakPower / 1000).toFixed(2)} kW`} />
          <Row label="Peak Hour" value={`${dailyOutput.peakHour}:00`} />
          <Row label="Capacity Factor" value={`${(dailyOutput.capacityFactor * 100).toFixed(1)}%`} />
          <Row label="Performance Ratio" value={`${(dailyOutput.performanceRatio * 100).toFixed(1)}%`} />
        </Section>
      )}

      {/* Diagnostic */}
      <Section title="Diagnostic">
        {instantPower < expectedDC * 0.3 && !solarPosition.isNight && (
          <div className="text-red-400 mb-1">⚠️ Power much lower than expected!</div>
        )}
        {irradiance.dni < 200 && irradiance.ghi > 100 && (
          <div className="text-red-400 mb-1">⚠️ DNI suspiciously low vs GHI</div>
        )}
        {irradiance.clearnessIndex < 0.4 && irradiance.ghi > 100 && (
          <div className="text-yellow-400 mb-1">⚠️ Low clearness index</div>
        )}
        {currentLosses && currentLosses.temperature < 0.85 && (
          <div className="text-yellow-400 mb-1">⚠️ High temperature losses</div>
        )}
      </Section>
    </div>
  );
}

// Helper components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-cyan-400 font-semibold border-b border-cyan-800 mb-1">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`flex justify-between ${warn ? 'text-red-400' : ''}`}>
      <span className="text-gray-400">{label}:</span>
      <span className={warn ? 'font-bold' : ''}>{value}</span>
    </div>
  );
}
