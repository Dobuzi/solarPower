import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeSlider } from './TimeSlider';
import { useSimulatorStore } from '../../store/simulatorStore';

const initialState = useSimulatorStore.getState();

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

  it('should update time from time input', async () => {
    render(<TimeSlider />);

    const input = screen.getAllByLabelText('Time')[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: '11:30' } });

    expect(screen.getAllByText('11:30 AM')[0]).toBeInTheDocument();
  });
});
