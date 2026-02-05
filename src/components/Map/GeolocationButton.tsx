/**
 * Geolocation Button Component
 *
 * Mobile-hardened geolocation with:
 * - Secure context check (HTTPS requirement)
 * - Portal-based toast for visibility above all UI
 * - Comprehensive error handling
 * - DEV logging for debugging
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSimulatorStore } from '../../store/simulatorStore';
import { useGeocoding } from '../../hooks/useGeocoding';

export function GeolocationButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setLocation = useSimulatorStore((state) => state.setLocation);
  const setOptimalOrientation = useSimulatorStore((state) => state.setOptimalOrientation);
  const { reverseGeocode } = useGeocoding();

  // Auto-dismiss error toast
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleGetLocation = () => {
    if (import.meta.env.DEV) {
      console.log('[Locate] Button clicked');
      console.log('[Locate] isSecureContext:', window.isSecureContext);
      console.log('[Locate] navigator.geolocation:', !!navigator.geolocation);
    }

    // Check 1: Geolocation API exists
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser';
      setError(msg);
      if (import.meta.env.DEV) {
        console.error('[Locate] Geolocation API not available');
      }
      return;
    }

    // Check 2: Secure context (HTTPS or localhost)
    // Mobile browsers often block geolocation on http://192.168.x.x
    if (!window.isSecureContext) {
      const msg = 'Location requires HTTPS on mobile devices. Use localhost or HTTPS.';
      setError(msg);
      if (import.meta.env.DEV) {
        console.error('[Locate] Not a secure context. Current origin:', window.location.origin);
        console.error('[Locate] Mobile browsers require HTTPS for geolocation (except localhost)');
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    if (import.meta.env.DEV) {
      console.log('[Locate] Requesting position...');
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          if (import.meta.env.DEV) {
            console.log(`[Locate] Success: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }

          // Reverse geocode to get address
          const location = await reverseGeocode(latitude, longitude);

          if (location) {
            if (import.meta.env.DEV) {
              console.log('[Locate] Setting location in store');
            }
            setLocation(location);
            setOptimalOrientation();
          } else {
            // Fallback: create location object with just coordinates
            if (import.meta.env.DEV) {
              console.warn('[Locate] Reverse geocode failed, using coordinates only');
            }
            setLocation({
              latitude,
              longitude,
              timezone: 'UTC', // Fallback timezone
              address: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
            });
            setOptimalOrientation();
          }

          setIsLoading(false);
        } catch (err) {
          const msg = 'Failed to get location details';
          setError(msg);
          setIsLoading(false);
          if (import.meta.env.DEV) {
            console.error('[Locate] Error processing location:', err);
          }
        }
      },
      (err) => {
        setIsLoading(false);

        let msg = 'Failed to get location';
        if (import.meta.env.DEV) {
          console.error('[Locate] Error code:', err.code, err.message);
        }

        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Location permission denied. Enable location in Settings → [Browser] → Location.';
            if (import.meta.env.DEV) {
              console.error('[Locate] PERMISSION_DENIED - User denied permission or permissions policy blocked it');
            }
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Location unavailable. Check device location services are enabled.';
            if (import.meta.env.DEV) {
              console.error('[Locate] POSITION_UNAVAILABLE - Device cannot determine position');
            }
            break;
          case err.TIMEOUT:
            msg = 'Location request timed out. Try again or check GPS signal.';
            if (import.meta.env.DEV) {
              console.error('[Locate] TIMEOUT - Failed to get position within 10s');
            }
            break;
          default:
            if (import.meta.env.DEV) {
              console.error('[Locate] Unknown error:', err);
            }
        }

        setError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <>
      {/* Geolocation Button */}
      <button
        onClick={handleGetLocation}
        disabled={isLoading}
        className={`
          fixed bottom-20 right-4 z-20
          bg-white rounded-full shadow-lg
          p-3
          hover:bg-gray-50 active:bg-gray-100
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          md:bottom-4
        `}
        style={{
          minWidth: '48px',
          minHeight: '48px',
        }}
        title="Go to current location"
        aria-label="Go to current location"
      >
        {isLoading ? (
          <div className="animate-spin h-6 w-6">
            <svg className="w-6 h-6 text-solar-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        ) : (
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>

      {/* Error Toast - Portal to document.body for maximum visibility */}
      {error && createPortal(
        <div
          className="fixed left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-2xl animate-fade-in md:left-auto md:right-4 md:max-w-sm"
          style={{
            // Place above bottom sheet (z-50) and all other UI
            zIndex: 9999,
            // Position above mobile bottom nav
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium leading-tight">{error}</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
