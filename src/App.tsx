import { useState, useEffect } from 'react';
import { MapCanvas } from './components/Map';
import { Scene } from './components/Panel3D';
import { Controls } from './components/Controls';
import { DataPanel } from './components/DataPanel';
import { TimeSlider } from './components/TimeSlider';
import { SearchBar } from './components/SearchBar';
import { DebugPanel } from './components/DebugPanel/DebugPanel';

type ViewMode = 'map' | '3d' | 'split';

// Debug panel toggle - only in dev mode
function DebugPanelToggle() {
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug panel
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setShowDebug(prev => !prev)}
        className="absolute bottom-4 left-4 z-20 bg-black/70 text-green-400 px-2 py-1 rounded text-xs font-mono hover:bg-black/90"
        title="Toggle Debug Panel (Ctrl+Shift+D)"
      >
        {showDebug ? '🔧 Hide Debug' : '🔧 Debug'}
      </button>

      {/* Debug panel */}
      {showDebug && (
        <div className="absolute bottom-12 left-4 z-20 pointer-events-auto">
          <DebugPanel />
        </div>
      )}
    </>
  );
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  return (
    <div className="h-full w-full bg-gray-100 relative overflow-hidden">
      {/* Main visualization area */}
      <div className="absolute inset-0">
        {viewMode === 'map' && <MapCanvas />}
        {viewMode === '3d' && <Scene />}
        {viewMode === 'split' && (
          <div className="flex h-full">
            <div className="w-1/2 h-full border-r border-gray-300">
              <MapCanvas />
            </div>
            <div className="w-1/2 h-full">
              <Scene />
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none z-10">
        <div className="pointer-events-auto">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-gradient-to-r from-solar-400 to-solar-600 p-2 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Solar Power Simulator</h1>
              <p className="text-sm text-gray-500">Calculate PV energy generation worldwide</p>
            </div>
          </div>
          <SearchBar />
        </div>

        {/* View mode toggle */}
        <div className="pointer-events-auto bg-white rounded-lg shadow-lg p-1 flex space-x-1">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-solar-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === '3d'
                ? 'bg-solar-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            3D
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'split'
                ? 'bg-solar-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Split
          </button>
        </div>
      </div>

      {/* Left sidebar - Controls */}
      <div className="absolute top-36 left-4 bottom-4 pointer-events-none z-10 overflow-y-auto">
        <div className="pointer-events-auto">
          <Controls />
        </div>
      </div>

      {/* Right sidebar - Data Panel */}
      <div className="absolute top-16 right-4 bottom-4 pointer-events-none z-10 overflow-y-auto">
        <div className="pointer-events-auto">
          <DataPanel />
        </div>
      </div>

      {/* Bottom - Time Slider */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
        <div className="pointer-events-auto w-96">
          <TimeSlider />
        </div>
      </div>

      {/* Debug Panel - Dev only, toggle with keyboard shortcut */}
      <DebugPanelToggle />
    </div>
  );
}

export default App;
