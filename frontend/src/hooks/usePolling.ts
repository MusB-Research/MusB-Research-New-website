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

    // Background polling is completely disabled globally per request 
    // to prevent API rate limiting and frontend performance degradation.
    // The hook signature is preserved to avoid breaking imports in other files.
    useEffect(() => {
        return;
    }, [intervalMs, enabled]);
}
