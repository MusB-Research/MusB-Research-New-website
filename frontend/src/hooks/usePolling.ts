import { useEffect, useRef } from 'react';

/**
 * Custom hook to poll an async function at a regular interval.
 * @param callback The async function to call
 * @param intervalMs The interval in milliseconds (default: 30000ms / 30s)
 * @param enabled Whether polling is enabled (default: true)
 */
export function usePolling(callback: () => Promise<void>, intervalMs: number = 30000, enabled: boolean = true) {
    const savedCallback = useRef(callback);

    // Remember the latest callback
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval
    useEffect(() => {
        if (!enabled) return;

        // Call immediately on mount/enable if needed, 
        // but usually the component already has an initial fetch.
        
        const tick = () => {
            savedCallback.current();
        };

        const id = setInterval(tick, intervalMs);
        return () => clearInterval(id);
    }, [intervalMs, enabled]);
}
