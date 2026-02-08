import { useMemo, memo } from 'react';
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
import { useSimulatorStore, selectSystemSize } from '../../store/simulatorStore';

function PowerChartInner() {
  const { hourlyPowerData, dailyOutput, isNight } = useSolarCalculation();
  const { animationHour } = useSimulatorStore();
  const systemSizeKw = useSimulatorStore(selectSystemSize);

  // Convert power data to kW for cleaner display
  const data = useMemo(() => {
    return hourlyPowerData.map((h) => ({
      hour: h.hour,
      powerKw: h.power / 1000, // Convert W to kW
      isNight: h.isNight,
      label: `${h.hour}:00`,
    }));
  }, [hourlyPowerData]);

  // Calculate Y-axis domain based on system capacity and peak power
  const yAxisDomain = useMemo(() => {
    const peakKw = Math.max(...data.map(d => d.powerKw), 0);
    // yMax = max(peak * 1.1, systemCapacity * 1.05) rounded up to nice number
    const maxValue = Math.max(peakKw * 1.1, systemSizeKw * 1.05);
    // Round up to nearest 0.5 kW for cleaner axis
    const yMax = Math.ceil(maxValue * 2) / 2;
    return [0, Math.max(yMax, 1)]; // At least 1 kW max
  }, [data, systemSizeKw]);

  // Find sunrise/sunset hours for shading
  const nightHours = useMemo(() => {
    const morningEnd = data.findIndex((d) => !d.isNight);
    const eveningStart = data.findLastIndex((d) => !d.isNight) + 1;
    return { morningEnd, eveningStart };
  }, [data]);

  // Current power at animation hour (in kW)
  const currentPowerKw = useMemo(() => {
    const hourIndex = Math.floor(animationHour);
    return data[hourIndex]?.powerKw || 0;
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
            tickFormatter={(v) => `${v.toFixed(1)}`}
            domain={yAxisDomain}
            axisLine={{ stroke: '#d1d5db' }}
            label={{ value: 'kW', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6b7280', dx: 15 }}
          />

          <Tooltip
            formatter={(value: number) => [`${value.toFixed(2)} kW`, 'Power']}
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
            y={currentPowerKw}
            r={6}
            fill={isNight ? '#6366f1' : '#f59e0b'}
            stroke="white"
            strokeWidth={2}
          />

          {/* Power line */}
          <Line
            type="monotone"
            dataKey="powerKw"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: 'white' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Current power indicator */}
      <div className="flex justify-between items-center mt-1 px-1">
        <span className="text-xs text-gray-500">Local Hour</span>
        <div className={`flex items-center px-2 py-0.5 rounded ${isNight ? 'bg-indigo-100' : 'bg-solar-100'}`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${isNight ? 'bg-indigo-500' : 'bg-solar-500'}`} />
          <span className={`text-xs font-medium ${isNight ? 'text-indigo-700' : 'text-solar-700'}`}>
            Now: {currentPowerKw.toFixed(2)} kW
          </span>
        </div>
      </div>
    </div>
  );
}

export const PowerChart = memo(PowerChartInner);
