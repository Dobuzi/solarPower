import { useState, useRef } from 'react';
import { Controls } from '../Controls';
import { DataPanel } from '../DataPanel';
import { TimeSlider } from '../TimeSlider';

type Tab = 'time' | 'config' | 'output';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileBottomSheet({ isOpen, onToggle }: MobileBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<Tab>('time');
  const sheetRef = useRef<HTMLDivElement>(null);

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'time',
      label: 'Time',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      id: 'output',
      label: 'Output',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '70vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-pointer"
          onClick={onToggle}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-solar-600 border-b-2 border-solar-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: 'calc(70vh - 100px)' }}
        >
          <div className="p-4">
            {activeTab === 'time' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Time Control</h3>
                <TimeSlider />
              </div>
            )}

            {activeTab === 'config' && (
              <div>
                {/* Remove the wrapper styling since Controls has its own */}
                <div className="[&>div]:w-full [&>div]:shadow-none [&>div]:bg-transparent [&>div]:p-0">
                  <Controls />
                </div>
              </div>
            )}

            {activeTab === 'output' && (
              <div>
                {/* Remove the wrapper styling since DataPanel has its own */}
                <div className="[&>div]:w-full [&>div]:shadow-none [&>div]:bg-transparent [&>div]:p-0 [&>div]:max-h-none">
                  <DataPanel />
                </div>
              </div>
            )}
          </div>
        </div>
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
                  setActiveTab(tab.id);
                  onToggle();
                }}
                className="flex-1 flex flex-col items-center justify-center py-3 text-gray-500 hover:text-solar-600 transition-colors"
              >
                {tab.icon}
                <span className="text-xs mt-1">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
