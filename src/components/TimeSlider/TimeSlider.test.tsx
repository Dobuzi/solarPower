import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeSlider } from './TimeSlider';
import { useSimulatorStore } from '../../store/simulatorStore';

const initialState = useSimulatorStore.getState();

vi.mock('../../hooks/useSolarCalculation', () => ({
  useSolarCalculation: () => ({
    summary: {
      instantPower: 500,
      dailyEnergy: 12000,
      weeklyEnergy: 84000,
      monthlyEnergy: 360000,
      yearlyEnergy: 4380000,
      peakPower: 900,
      peakHour: 12,
      capacityFactor: 0.2,
      performanceRatio: 0.85,
      sunriseLocal: '06:30',
      sunsetLocal: '18:30',
      solarNoonLocal: '12:00',
      daylightHours: 12,
      sunriseHour: 6.5,
      sunsetHour: 18.5,
      solarNoonHour: 12,
      dailySavings: 1.8,
      yearlySavings: 650,
      dailyCO2Offset: 5,
      yearlyCO2Offset: 1825,
      systemSizeKW: 5,
      currentTimeLocal: '10:00 AM',
    },
    daylightHours: 12,
  }),
}));

describe('TimeSlider', () => {
  beforeEach(() => {
    useSimulatorStore.setState(initialState, true);
    useSimulatorStore.setState({
      location: {
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
        address: 'Null Island',
      },
      date: new Date('2024-01-15T00:00:00Z'),
      animationHour: 10,
      isNight: false,
      isTwilight: false,
      setAnimationHour: (hour: number) => useSimulatorStore.setState({ animationHour: hour }),
      setDate: (date: Date) => useSimulatorStore.setState({ date }),
    });
  });

  it('should adjust time by 15 minutes with quick buttons', async () => {
    render(<TimeSlider />);
    expect(screen.getAllByText('10:00 AM')[0]).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '+15m' }));
    expect(screen.getAllByText('10:15 AM')[0]).toBeInTheDocument();
  });

  it('should adjust time by 1 hour with mobile quick buttons', async () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('max-width: 767px'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    render(<TimeSlider />);
    expect(screen.getAllByText('10:00 AM')[0]).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '+1h' }));
    expect(screen.getAllByText('11:00 AM')[0]).toBeInTheDocument();
  });

  it('should update time from time input', async () => {
    render(<TimeSlider />);

    const input = screen.getAllByLabelText('Time')[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: '11:30' } });

    expect(screen.getAllByText('11:30 AM')[0]).toBeInTheDocument();
  });
});
