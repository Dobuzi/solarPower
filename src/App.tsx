import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import { MapCanvas } from './components/Map';
import { Scene } from './components/Panel3D';
import { Controls } from './components/Controls';
import { DataPanel } from './components/DataPanel';
import { TimeSlider } from './components/TimeSlider';
import { SearchBar } from './components/SearchBar';
import { DebugPanel } from './components/DebugPanel/DebugPanel';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { PanelToggles } from './components/PanelToggles';
import { useIsMobile } from './hooks/useMediaQuery';
import { usePanelState } from './hooks/usePanelState';

type ViewMode = 'map' | '3d' | 'split';

// Debug panel toggle - only in dev mode
function DebugPanelToggle() {
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
      <button
        onClick={() => setShowDebug(prev => !prev)}
        className="absolute bottom-4 left-4 z-20 bg-black/70 text-green-400 px-2 py-1 rounded text-xs font-mono hover:bg-black/90 hidden md:block"
        title="Toggle Debug Panel (Ctrl+Shift+D)"
      >
        {showDebug ? '🔧 Hide' : '🔧 Debug'}
      </button>
      {showDebug && (
        <div className="absolute bottom-12 left-4 z-20 pointer-events-auto hidden md:block">
          <DebugPanel />
        </div>
      )}
    </>
  );
}

// Desktop Layout Component
function DesktopLayout({
  viewMode,
  setViewMode,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}) {
  const isMobile = useIsMobile();
  const { visibility, togglePanel, setAllPanels, isDetailView } = usePanelState(isMobile);

  return (
    <>
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

        {/* Right side controls */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* View mode toggle */}
          <div className="bg-white rounded-lg shadow-lg p-1 flex space-x-1">
            {(['map', '3d', 'split'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-solar-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {mode === '3d' ? '3D' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Panel toggles */}
          <PanelToggles
            visibility={visibility}
            onToggle={togglePanel}
            isDetailView={isDetailView}
            onToggleAll={setAllPanels}
          />
        </div>
      </div>

      {/* Left sidebar - Controls (collapsible) */}
      {visibility.config && (
        <div className="absolute top-36 left-4 bottom-4 pointer-events-none z-10 overflow-y-auto">
          <div className="pointer-events-auto">
            <Controls />
          </div>
        </div>
      )}

      {/* Right sidebar - Data Panel (collapsible) */}
      {visibility.output && (
        <div className="absolute top-36 right-4 bottom-4 pointer-events-none z-10 overflow-y-auto">
          <div className="pointer-events-auto">
            <DataPanel />
          </div>
        </div>
      )}

      {/* Bottom - Time Slider (collapsible) */}
      {visibility.time && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
          <div className="pointer-events-auto w-96 max-w-[calc(100vw-2rem)]">
            <TimeSlider />
          </div>
        </div>
      )}

      {/* Debug Panel - Dev only */}
      <DebugPanelToggle />
    </>
  );
}

// Mobile Layout Component
function MobileLayout({ viewMode, setViewMode }: { viewMode: ViewMode; setViewMode: (mode: ViewMode) => void }) {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  return (
    <>
      {/* Compact Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
        <div
          className="px-3 py-2"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-solar-400 to-solar-600 p-1.5 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              </div>
              <span className="font-bold text-gray-800">Solar Sim</span>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('map')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'map' ? 'bg-white shadow text-solar-600' : 'text-gray-500'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === '3d' ? 'bg-white shadow text-solar-600' : 'text-gray-500'
                }`}
              >
                3D
              </button>
            </div>
          </div>
          <div className="mt-2">
            <SearchBar />
          </div>
        </div>
      </div>

      <MobileBottomSheet
        isOpen={bottomSheetOpen}
        onToggle={() => setBottomSheetOpen(!bottomSheetOpen)}
      />
    </>
  );
}

function App() {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'map' : 'split');
  const mapRef = useRef<L.Map | null>(null);
  const { visibility } = usePanelState(isMobile);

  // Switch to non-split mode on mobile
  useEffect(() => {
    if (isMobile && viewMode === 'split') {
      setViewMode('map');
    }
  }, [isMobile, viewMode]);

  // Handle map ready callback
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  // Invalidate map size when panels change or view mode changes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [visibility, viewMode]);

  return (
    <div className="h-full w-full bg-gray-100 relative overflow-hidden">
      {/* Main visualization area */}
      <div
        className="absolute inset-0"
        style={{
          top: isMobile ? 'calc(env(safe-area-inset-top) + 80px)' : 0,
          bottom: isMobile ? '60px' : 0,
        }}
      >
        {viewMode === 'map' && <MapCanvas onMapReady={handleMapReady} />}
        {viewMode === '3d' && <Scene />}
        {viewMode === 'split' && !isMobile && (
          <div className="flex h-full">
            <div className="w-1/2 h-full border-r border-gray-300">
              <MapCanvas onMapReady={handleMapReady} />
            </div>
            <div className="w-1/2 h-full">
              <Scene />
            </div>
          </div>
        )}
      </div>

      {/* Responsive Layout */}
      {isMobile ? (
        <MobileLayout viewMode={viewMode} setViewMode={setViewMode} />
      ) : (
        <DesktopLayout viewMode={viewMode} setViewMode={setViewMode} />
      )}
    </div>
  );
}

export default App;
