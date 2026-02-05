/**
 * Panel Toggle Buttons
 *
 * Provides hide/show buttons for Config, Output, and Time panels.
 * Features:
 * - Clear ON/OFF visual states
 * - Main/Detail view toggle with explicit state
 * - Accessible labels and tooltips
 */

import { PanelVisibility } from '../../hooks/usePanelState';

interface PanelTogglesProps {
  visibility: PanelVisibility;
  onToggle: (panel: keyof PanelVisibility) => void;
  isDetailView: boolean;
  onToggleAll: (visible: boolean) => void;
}

export function PanelToggles({
  visibility,
  onToggle,
  isDetailView,
  onToggleAll,
}: PanelTogglesProps) {
  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-1">
      {/* Main/Detail toggle with explicit state indicator */}
      <button
        onClick={() => onToggleAll(!isDetailView)}
        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
          isDetailView
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-solar-500 text-white hover:bg-solar-600'
        }`}
        title={isDetailView ? 'Hide all panels (Main View)' : 'Show all panels (Detail View)'}
        aria-label={isDetailView ? 'Switch to Main View' : 'Switch to Detail View'}
      >
        {isDetailView ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="hidden sm:inline">Main</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Detail</span>
          </>
        )}
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Config toggle with clear ON/OFF state */}
      <button
        onClick={() => onToggle('config')}
        className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
          visibility.config
            ? 'bg-solar-100 text-solar-700 border border-solar-300'
            : 'text-gray-400 hover:bg-gray-50 border border-transparent'
        }`}
        title={`${visibility.config ? 'Hide' : 'Show'} Config Panel`}
        aria-label={`${visibility.config ? 'Hide' : 'Show'} Config Panel`}
        aria-pressed={visibility.config}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden lg:inline">{visibility.config ? 'Config' : 'Config'}</span>
      </button>

      {/* Output toggle with clear ON/OFF state */}
      <button
        onClick={() => onToggle('output')}
        className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
          visibility.output
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
            : 'text-gray-400 hover:bg-gray-50 border border-transparent'
        }`}
        title={`${visibility.output ? 'Hide' : 'Show'} Output Panel`}
        aria-label={`${visibility.output ? 'Hide' : 'Show'} Output Panel`}
        aria-pressed={visibility.output}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="hidden lg:inline">{visibility.output ? 'Output' : 'Output'}</span>
      </button>

      {/* Time toggle with clear ON/OFF state */}
      <button
        onClick={() => onToggle('time')}
        className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
          visibility.time
            ? 'bg-blue-100 text-blue-700 border border-blue-300'
            : 'text-gray-400 hover:bg-gray-50 border border-transparent'
        }`}
        title={`${visibility.time ? 'Hide' : 'Show'} Time Panel`}
        aria-label={`${visibility.time ? 'Hide' : 'Show'} Time Panel`}
        aria-pressed={visibility.time}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden lg:inline">{visibility.time ? 'Time' : 'Time'}</span>
      </button>
    </div>
  );
}
