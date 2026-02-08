import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchBar } from './SearchBar';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Location } from '../../core/types';

let mockResults: Location[] = [];
const mockSearch = vi.fn();

vi.mock('../../hooks/useGeocoding', () => ({
  useGeocoding: () => ({
    isLoading: false,
    results: mockResults,
    error: null,
    search: mockSearch,
    reverseGeocode: vi.fn(),
  }),
}));

const initialState = useSimulatorStore.getState();

describe('SearchBar', () => {
  beforeEach(() => {
    mockResults = [];
    mockSearch.mockClear();
    vi.useFakeTimers();
    useSimulatorStore.setState(initialState, true);
    useSimulatorStore.setState({
      setLocation: vi.fn(),
      setOptimalOrientation: vi.fn(),
      location: {
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
        address: 'Null Island',
      },
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should show empty state when no results', async () => {
    render(<SearchBar />);

    const input = screen.getByRole('combobox', { name: 'Search location' });
    fireEvent.change(input, { target: { value: 'Paris' } });
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText('No results. Try a city, address, or coordinates.')).toBeInTheDocument();
  });

  it('should select a result via keyboard', async () => {
    mockResults = [
      {
        latitude: 35.6895,
        longitude: 139.6917,
        timezone: 'Asia/Tokyo',
        address: 'Tokyo, Japan',
      },
    ];

    render(<SearchBar />);

    const input = screen.getByRole('combobox', { name: 'Search location' });
    fireEvent.change(input, { target: { value: 'Tokyo' } });
    act(() => {
      vi.runAllTimers();
    });

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'Enter' });

    const { setLocation } = useSimulatorStore.getState();
    expect(setLocation).toHaveBeenCalledWith(mockResults[0]);
  });

  it('should use last location as placeholder when not focused', () => {
    render(<SearchBar />);

    const input = screen.getByRole('combobox', { name: 'Search location' });
    expect(input).toHaveAttribute('placeholder', 'Null Island');
  });

  it('should disable use my location when geolocation is unavailable', () => {
    const originalGeolocation = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });

    render(<SearchBar />);

    const button = screen.getByRole('button', { name: 'Use my location' });
    expect(button).toBeDisabled();

    Object.defineProperty(navigator, 'geolocation', { value: originalGeolocation, configurable: true });
  });
});
