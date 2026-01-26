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
import { useSimulatorStore } from '../../store/simulatorStore';

export function EnergyChart() {
  const { cumulativeEnergyData, dailyOutput, isNight, hourlyPowerData } = useSolarCalculation();
  const { animationHour } = useSimulatorStore();

  const data = useMemo(() => {
    return cumulativeEnergyData.map((d) => ({
      hour: d.hour,
      energy: Math.round(d.energy),
      label: `${d.hour}:00`,
    }));
  }, [cumulativeEnergyData]);

  // Find sunrise/sunset hours for shading
  const nightHours = useMemo(() => {
    if (!hourlyPowerData.length) return { morningEnd: 6, eveningStart: 18 };
    const morningEnd = hourlyPowerData.findIndex((d) => !d.isNight);
    const eveningStart = hourlyPowerData.findLastIndex((d) => !d.isNight) + 1;
    return { morningEnd: morningEnd > 0 ? morningEnd : 0, eveningStart: eveningStart < 24 ? eveningStart : 24 };
  }, [hourlyPowerData]);

  // Current cumulative energy at animation hour
  const currentEnergy = useMemo(() => {
    const hourIndex = Math.floor(animationHour);
    return data[hourIndex]?.energy || 0;
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
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            axisLine={{ stroke: '#d1d5db' }}
          />

          <Tooltip
            formatter={(value: number) => [`${(value / 1000).toFixed(2)} kWh`, 'Cumulative Energy']}
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
            y={currentEnergy}
            r={6}
            fill={isNight ? '#6366f1' : '#10b981'}
            stroke="white"
            strokeWidth={2}
          />

          {/* Energy area */}
          <Area
            type="monotone"
            dataKey="energy"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#energyGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Current energy indicator */}
      <div className="flex justify-between items-center mt-1 px-1">
        <span className="text-xs text-gray-500">Hour</span>
        <div className={`flex items-center px-2 py-0.5 rounded ${isNight ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${isNight ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
          <span className={`text-xs font-medium ${isNight ? 'text-indigo-700' : 'text-emerald-700'}`}>
            Cumulative: {(currentEnergy / 1000).toFixed(2)} kWh
          </span>
        </div>
      </div>
    </div>
  );
}
