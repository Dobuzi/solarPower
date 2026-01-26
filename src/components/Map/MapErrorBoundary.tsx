/**
 * Error Boundary for MapCanvas
 *
 * Catches rendering errors in the map component and provides
 * a recovery UI with a reload button.
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Map Error:', error);
    console.error('Error Info:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
            <svg
              className="w-16 h-16 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Map Loading Error
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              The map encountered an error. This can happen due to network issues
              or tile loading problems.
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-50 p-2 rounded">
                {this.state.error.message.slice(0, 100)}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-solar-500 text-white rounded-lg hover:bg-solar-600 transition-colors font-medium"
            >
              Reload Map
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
