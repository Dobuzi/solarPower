import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
} from 'recharts';
import { useSolarCalculation } from '../../hooks/useSolarCalculation';
import { useSimulatorStore } from '../../store/simulatorStore';

export function PowerChart() {
  const { hourlyPowerData, dailyOutput, isNight } = useSolarCalculation();
  const { animationHour } = useSimulatorStore();

  const data = useMemo(() => {
    return hourlyPowerData.map((h) => ({
      hour: h.hour,
      power: Math.round(h.power),
      isNight: h.isNight,
      label: `${h.hour}:00`,
    }));
  }, [hourlyPowerData]);

  // Find sunrise/sunset hours for shading
  const nightHours = useMemo(() => {
    const morningEnd = data.findIndex((d) => !d.isNight);
    const eveningStart = data.findLastIndex((d) => !d.isNight) + 1;
    return { morningEnd, eveningStart };
  }, [data]);

  // Current power at animation hour
  const currentPower = useMemo(() => {
    const hourIndex = Math.floor(animationHour);
    return data[hourIndex]?.power || 0;
  }, [data, animationHour]);

  if (!dailyOutput) return null;

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
          <defs>
            <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
            formatter={(value: number) => [`${value.toLocaleString()} W`, 'Power']}
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
            stroke={isNight ? '#6366f1' : '#f59e0b'}
            strokeWidth={2}
            strokeDasharray="5 5"
          />

          {/* Current time indicator - dot */}
          <ReferenceDot
            x={Math.floor(animationHour)}
            y={currentPower}
            r={6}
            fill={isNight ? '#6366f1' : '#f59e0b'}
            stroke="white"
            strokeWidth={2}
          />

          {/* Power line */}
          <Line
            type="monotone"
            dataKey="power"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: 'white' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Current power indicator */}
      <div className="flex justify-between items-center mt-1 px-1">
        <span className="text-xs text-gray-500">Hour</span>
        <div className={`flex items-center px-2 py-0.5 rounded ${isNight ? 'bg-indigo-100' : 'bg-solar-100'}`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${isNight ? 'bg-indigo-500' : 'bg-solar-500'}`} />
          <span className={`text-xs font-medium ${isNight ? 'text-indigo-700' : 'text-solar-700'}`}>
            Now: {(currentPower / 1000).toFixed(2)} kW
          </span>
        </div>
      </div>
    </div>
  );
}
