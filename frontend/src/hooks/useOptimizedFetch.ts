import { useRef, useCallback, useState } from 'react';

interface CacheEntry {
    data: any;
    timestamp: number;
    inProgress?: Promise<any>;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<any>>();

export const useOptimizedFetch = () => {
    const cacheRef = useRef(cache);

    const fetchData = useCallback(async (url: string, fetchFn: () => Promise<any>, options = { skipCache: false, ttl: CACHE_TTL }) => {
        // Return cached data if valid
        if (!options.skipCache) {
            const cached = cacheRef.current.get(url);
            if (cached && Date.now() - cached.timestamp < options.ttl) {
                return cached.data;
            }
        }

        // Return pending request if one is in progress (deduplicate)
        if (pendingRequests.has(url)) {
            return pendingRequests.get(url);
        }

        // Execute and cache fetch
        const promise = fetchFn().then(data => {
            cacheRef.current.set(url, { data, timestamp: Date.now() });
            pendingRequests.delete(url);
            return data;
        }).catch(err => {
            pendingRequests.delete(url);
            throw err;
        });

        pendingRequests.set(url, promise);
        return promise;
    }, []);

    const clearCache = useCallback((url?: string) => {
        if (url) {
            cacheRef.current.delete(url);
        } else {
            cacheRef.current.clear();
        }
    }, []);

    return { fetchData, clearCache };
};

// Batch multiple requests
export const batchFetch = async (requests: Array<{ url: string; fn: () => Promise<any> }>, fetchFn: any) => {
    return Promise.all(requests.map(r => fetchFn(r.url, r.fn)));
};
