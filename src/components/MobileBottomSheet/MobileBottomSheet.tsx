/**
 * Mobile Bottom Sheet Component
 *
 * Mobile-hardened with:
 * - Peek state (minimal ~72px) for true collapse
 * - Subtle backdrop (0.1 opacity) to communicate closability
 * - Proper touch-action CSS to prevent scroll conflicts
 * - Active tab always clickable (toggles collapse)
 * - Comprehensive DEV logging
 */

import { useState, useRef, useEffect } from 'react';
import { Controls } from '../Controls';
import { DataPanel } from '../DataPanel';
import { TimeSlider } from '../TimeSlider';

type Tab = 'time' | 'config' | 'output';
type SnapPoint = 'peek' | 'default' | 'full';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onToggle: () => void;
  onSnapPointChange?: (snapPoint: SnapPoint) => void;
}

// Peek height calculation
// Handle (~20px) + Tabs (~44px) + Safe Area (~34px max) = ~98px
// We use 72px base + safe area for a minimal but accessible peek
const PEEK_HEIGHT_PX = 72;

export function MobileBottomSheet({ isOpen, onToggle, onSnapPointChange }: MobileBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<Tab>('output');
  const [snapPoint, setSnapPoint] = useState<SnapPoint>('default');
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const hasSeenHint = useRef<boolean>(false); // Track if user has seen the handle hint

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'output',
      label: 'Output',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'config',
      label: 'Config',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'time',
      label: 'Time',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  // Calculate snap heights (pixels)
  const getSnapHeights = () => {
    const defaultHeightPx = viewportHeight * 0.45; // 45% of viewport
    const fullHeightPx = viewportHeight * 0.85; // 85% of viewport

    return {
      peek: PEEK_HEIGHT_PX,
      default: defaultHeightPx,
      full: fullHeightPx,
    };
  };

  const snapHeights = getSnapHeights();
  const currentHeight = snapHeights[snapPoint];

  // Log height diagnostics
  useEffect(() => {
    if (import.meta.env.DEV && sheetRef.current) {
      const rendered = sheetRef.current.getBoundingClientRect().height;
      console.log(`[Sheet] Snap: ${snapPoint}, Target: ${currentHeight.toFixed(0)}px, Rendered: ${rendered.toFixed(0)}px`);
      console.log(`[Sheet] Heights: peek=${snapHeights.peek}px, default=${snapHeights.default.toFixed(0)}px, full=${snapHeights.full.toFixed(0)}px`);
    }
  }, [snapPoint, currentHeight, snapHeights.peek, snapHeights.default, snapHeights.full]);

  // Notify parent of snap point changes for context-aware UI behavior
  useEffect(() => {
    onSnapPointChange?.(snapPoint);
  }, [snapPoint, onSnapPointChange]);

  // Handle viewport resize (orientation change)
  useEffect(() => {
    const handleResize = () => {
      const newHeight = window.innerHeight;
      const oldHeight = viewportHeight;

      // Detect if this is likely keyboard opening/closing
      const heightDiff = Math.abs(newHeight - oldHeight);
      const isLikelyKeyboard = heightDiff > 200;

      if (import.meta.env.DEV) {
        console.log(`[Sheet] Viewport resize: ${oldHeight} -> ${newHeight}, diff: ${heightDiff}`);
      }

      setViewportHeight(newHeight);

      if (isLikelyKeyboard) {
        if (newHeight < oldHeight) {
          // Keyboard opened - expand if at peek
          if (snapPoint === 'peek') {
            setSnapPoint('default');
            if (import.meta.env.DEV) console.log('[Sheet] Keyboard opened, expanding to default');
          }
        } else {
          // Keyboard closed
          if (import.meta.env.DEV) console.log('[Sheet] Keyboard closed');
        }
      }
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [viewportHeight, snapPoint]);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only drag from handle area (not from tabs or content)
    const target = e.target as Element;
    const isHandle = target.closest('[data-drag-handle]');

    if (isHandle) {
      startY.current = e.touches[0].clientY;
      currentY.current = e.touches[0].clientY;
      isDragging.current = true;

      if (import.meta.env.DEV) {
        console.log('[Sheet] Drag start from handle');
      }
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    currentY.current = e.touches[0].clientY;
  };

  // Handle touch end - snap to nearest point
  const handleTouchEnd = () => {
    if (!isDragging.current) return;

    const deltaY = currentY.current - startY.current;
    const threshold = 50; // pixels

    if (import.meta.env.DEV) {
      console.log(`[Sheet] Drag end, deltaY: ${deltaY}, current snap: ${snapPoint}`);
    }

    if (Math.abs(deltaY) < threshold) {
      isDragging.current = false;
      if (import.meta.env.DEV) {
        console.log('[Sheet] Drag distance below threshold, no snap change');
      }
      return;
    }

    // Swipe down (deltaY positive)
    if (deltaY > 0) {
      if (snapPoint === 'full') {
        setSnapPoint('default');
        if (import.meta.env.DEV) console.log('[Sheet] Snap: full -> default');
      } else if (snapPoint === 'default') {
        setSnapPoint('peek');
        if (import.meta.env.DEV) console.log('[Sheet] Snap: default -> peek');
      } else {
        onToggle(); // Close if already at peek
        if (import.meta.env.DEV) console.log('[Sheet] Closing from peek');
      }
    }
    // Swipe up (deltaY negative)
    else {
      if (snapPoint === 'peek') {
        setSnapPoint('default');
        if (import.meta.env.DEV) console.log('[Sheet] Snap: peek -> default');
      } else if (snapPoint === 'default') {
        setSnapPoint('full');
        if (import.meta.env.DEV) console.log('[Sheet] Snap: default -> full');
      }
    }

    isDragging.current = false;
  };

  // Cycle snap points when handle is tapped
  const handleHandleTap = (e: React.MouseEvent) => {
    // Prevent double-handling if touch also fired
    e.stopPropagation();

    if (import.meta.env.DEV) {
      console.log(`[Sheet] Handle tapped, current snap: ${snapPoint}`);
    }

    if (snapPoint === 'peek') {
      setSnapPoint('default');
      if (import.meta.env.DEV) console.log('[Sheet] Tap: peek -> default');
    } else if (snapPoint === 'default') {
      setSnapPoint('full');
      if (import.meta.env.DEV) console.log('[Sheet] Tap: default -> full');
    } else {
      setSnapPoint('peek');
      if (import.meta.env.DEV) console.log('[Sheet] Tap: full -> peek');
    }
  };

  // Handle tab click - toggle collapse if already active
  const handleTabClick = (tabId: Tab) => {
    if (import.meta.env.DEV) {
      console.log(`[Sheet] Tab clicked: ${tabId}, active: ${activeTab}, snap: ${snapPoint}`);
    }

    if (tabId === activeTab) {
      // Clicking active tab toggles collapse
      if (snapPoint === 'peek') {
        setSnapPoint('default');
        if (import.meta.env.DEV) console.log('[Sheet] Tab toggle: peek -> default');
      } else {
        setSnapPoint('peek');
        if (import.meta.env.DEV) console.log('[Sheet] Tab toggle: collapse to peek');
      }
    } else {
      // Switching to different tab
      setActiveTab(tabId);
      if (import.meta.env.DEV) console.log('[Sheet] Tab switch to:', tabId);
      // Expand to default if currently at peek
      if (snapPoint === 'peek') {
        setSnapPoint('default');
        if (import.meta.env.DEV) console.log('[Sheet] Auto-expand to default on tab switch');
      }
    }
  };

  return (
    <>
      {/* Backdrop - show when sheet is expanded (not at peek) */}
      {/* Subtle opacity (0.1) to communicate "tap here to close" */}
      {isOpen && snapPoint !== 'peek' && (
        <div
          className={`fixed inset-0 z-40 transition-opacity ${
            snapPoint === 'full' ? 'bg-black/30' : 'bg-black/10'
          }`}
          onPointerDown={(e) => {
            // Only collapse if clicking the backdrop itself (not bubbled from sheet)
            if (e.target === e.currentTarget) {
              if (import.meta.env.DEV) {
                console.log(`[Sheet] Outside tap: ${snapPoint} -> peek`);
              }
              setSnapPoint('peek');
            }
          }}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          height: `${currentHeight}px`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle - drag only area with touch-action: none */}
        <div
          data-drag-handle
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onClick={handleHandleTap}
          style={{
            // Prevent scrolling when touching handle
            touchAction: 'none',
          }}
        >
          <div
            className="w-12 h-1.5 bg-gray-400 rounded-full transition-colors hover:bg-gray-500"
            style={{
              // Subtle pulse hint on first open (zero-onboarding discoverability)
              animation: !hasSeenHint.current && isOpen ? 'handlePulse 2s ease-out' : 'none',
            }}
            onAnimationEnd={() => { hasSeenHint.current = true; }}
          />
          <style>{`
            @keyframes handlePulse {
              0%, 100% { transform: scaleX(1); opacity: 1; }
              50% { transform: scaleX(1.2); opacity: 0.8; }
            }
          `}</style>
        </div>

        {/* Tabs - always clickable, no disabled state */}
        <div
          className="flex border-b border-gray-200"
          style={{
            // Allow vertical scrolling but prevent horizontal pan
            touchAction: 'pan-y',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              // IMPORTANT: Never disable active tab - it needs to toggle collapse
              disabled={false}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-solar-600 border-b-2 border-solar-500'
                  : 'text-gray-500 hover:text-gray-700 active:text-gray-900'
              }`}
              style={{
                minHeight: '44px',
                // Ensure button is always interactive
                pointerEvents: 'auto',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content - scroll only area with touch-action: pan-y */}
        {/* Only show content when not at peek */}
        {snapPoint !== 'peek' && (
          <div
            className="overflow-y-auto overscroll-contain"
            style={{
              height: `calc(${currentHeight}px - 68px - env(safe-area-inset-bottom, 0px))`,
              WebkitOverflowScrolling: 'touch',
              // Allow vertical scrolling, prevent sheet drag
              touchAction: 'pan-y',
            }}
          >
            <div className="p-3">
              {activeTab === 'time' && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-800">Time Control</h3>
                  <TimeSlider />
                </div>
              )}

              {activeTab === 'config' && (
                <div>
                  <div className="[&>div]:w-full [&>div]:shadow-none [&>div]:bg-transparent [&>div]:p-0">
                    <Controls />
                  </div>
                </div>
              )}

              {activeTab === 'output' && (
                <div>
                  <div className="[&>div]:w-full [&>div]:shadow-none [&>div]:bg-transparent [&>div]:p-0 [&>div]:max-h-none">
                    <DataPanel />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collapsed Tab Bar (when sheet is closed) */}
      {!isOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (import.meta.env.DEV) {
                    console.log(`[Sheet] Collapsed tab bar clicked: ${tab.id}`);
                  }
                  setActiveTab(tab.id);
                  setSnapPoint('default');
                  onToggle();
                }}
                className="flex-1 flex flex-col items-center justify-center py-2 text-gray-500 hover:text-solar-600 active:text-solar-700 transition-colors"
                style={{
                  minHeight: '44px',
                }}
              >
                {tab.icon}
                <span className="text-xs mt-0.5">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
