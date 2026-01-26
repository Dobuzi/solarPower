import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  ReferenceArea,
} from 'recharts';
import { useSolarCalculation } from '../../hooks/useSolarCalculation';
import { useSimulatorStore, selectSystemSize } from '../../store/simulatorStore';

export function EnergyChart() {
  const { cumulativeEnergyData, dailyOutput, isNight, hourlyPowerData } = useSolarCalculation();
  const { animationHour } = useSimulatorStore();
  const systemSizeKw = useSimulatorStore(selectSystemSize);

  // Convert energy data to kWh for cleaner display
  const data = useMemo(() => {
    return cumulativeEnergyData.map((d) => ({
      hour: d.hour,
      energyKwh: d.energy / 1000, // Convert Wh to kWh
      label: `${d.hour}:00`,
    }));
  }, [cumulativeEnergyData]);

  // Calculate Y-axis domain based on system capacity and daily energy
  const yAxisDomain = useMemo(() => {
    const maxEnergyKwh = Math.max(...data.map(d => d.energyKwh), 0);
    // Estimate max possible daily energy (system kW × ~6 peak sun hours)
    const theoreticalMaxKwh = systemSizeKw * 8;
    // yMax = max(actual * 1.1, theoretical * 0.5) for reasonable scale
    const maxValue = Math.max(maxEnergyKwh * 1.1, theoreticalMaxKwh * 0.5);
    // Round up to nearest 1 kWh for cleaner axis
    const yMax = Math.ceil(maxValue);
    return [0, Math.max(yMax, 1)]; // At least 1 kWh max
  }, [data, systemSizeKw]);

  // Find sunrise/sunset hours for shading
  const nightHours = useMemo(() => {
    if (!hourlyPowerData.length) return { morningEnd: 6, eveningStart: 18 };
    const morningEnd = hourlyPowerData.findIndex((d) => !d.isNight);
    const eveningStart = hourlyPowerData.findLastIndex((d) => !d.isNight) + 1;
    return { morningEnd: morningEnd > 0 ? morningEnd : 0, eveningStart: eveningStart < 24 ? eveningStart : 24 };
  }, [hourlyPowerData]);

  // Current cumulative energy at animation hour (in kWh)
  const currentEnergyKwh = useMemo(() => {
    const hourIndex = Math.floor(animationHour);
    return data[hourIndex]?.energyKwh || 0;
  }, [data, animationHour]);

  if (!dailyOutput) return null;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
          <defs>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {/* Night shading - morning */}
          {nightHours.morningEnd > 0 && (
            <ReferenceArea
              x1={0}
              x2={nightHours.morningEnd}
              fill="#1e1b4b"
              fillOpacity={0.1}
            />
          )}

          {/* Night shading - evening */}
          {nightHours.eveningStart < 24 && (
            <ReferenceArea
              x1={nightHours.eveningStart}
              x2={23}
              fill="#1e1b4b"
              fillOpacity={0.1}
            />
          )}

          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(h) => `${h}`}
            ticks={[0, 6, 12, 18, 24]}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(v) => `${v.toFixed(1)}`}
            domain={yAxisDomain}
            axisLine={{ stroke: '#d1d5db' }}
            label={{ value: 'kWh', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6b7280', dx: 15 }}
          />

          <Tooltip
            formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Cumulative Energy']}
            labelFormatter={(hour) => `${hour}:00`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
            }}
          />

          {/* Current time indicator - vertical line */}
          <ReferenceLine
            x={animationHour}
            stroke={isNight ? '#6366f1' : '#10b981'}
            strokeWidth={2}
            strokeDasharray="5 5"
          />

          {/* Current time indicator - dot */}
          <ReferenceDot
            x={Math.floor(animationHour)}
            y={currentEnergyKwh}
            r={6}
            fill={isNight ? '#6366f1' : '#10b981'}
            stroke="white"
            strokeWidth={2}
          />

          {/* Energy area */}
          <Area
            type="monotone"
            dataKey="energyKwh"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#energyGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Current energy indicator */}
      <div className="flex justify-between items-center mt-1 px-1">
        <span className="text-xs text-gray-500">Local Hour</span>
        <div className={`flex items-center px-2 py-0.5 rounded ${isNight ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${isNight ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
          <span className={`text-xs font-medium ${isNight ? 'text-indigo-700' : 'text-emerald-700'}`}>
            Cumulative: {currentEnergyKwh.toFixed(2)} kWh
          </span>
        </div>
      </div>
    </div>
  );
}
