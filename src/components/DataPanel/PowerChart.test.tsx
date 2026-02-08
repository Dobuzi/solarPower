import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PowerChart } from './PowerChart';

vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="LineChart">{children}</div>,
  Line: () => <div data-testid="Line" />,
  XAxis: () => <div data-testid="XAxis" />,
  YAxis: () => <div data-testid="YAxis" />,
  CartesianGrid: () => <div data-testid="Grid" />,
  Tooltip: () => <div data-testid="Tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="Responsive">{children}</div>,
  ReferenceLine: () => <div data-testid="ReferenceLine" />,
  ReferenceArea: () => <div data-testid="ReferenceArea" />,
  ReferenceDot: () => <div data-testid="ReferenceDot" />,
}));

vi.mock('../../hooks/useSolarCalculation', () => ({
  useSolarCalculation: () => ({
    hourlyPowerData: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      power: hour * 100,
      dcPower: hour * 120,
      irradiance: 200,
      temperature: 25,
      isNight: hour < 6 || hour > 18,
    })),
    dailyOutput: { dailyEnergy: 1000 },
    isNight: false,
  }),
}));

vi.mock('../../store/simulatorStore', () => ({
  useSimulatorStore: (selector?: any) => {
    if (selector) {
      return selector({ panelConfig: { ratedPower: 1000 }, panelCount: 1 });
    }
    return { animationHour: 12 };
  },
  selectSystemSize: (state: any) => (state.panelConfig.ratedPower * state.panelCount) / 1000,
}));


describe('PowerChart', () => {
  it('should render chart with indicators', () => {
    render(<PowerChart />);

    expect(screen.getByTestId('Responsive')).toBeInTheDocument();
    expect(screen.getByTestId('LineChart')).toBeInTheDocument();
    expect(screen.getByText(/Now:/)).toBeInTheDocument();
  });
});
