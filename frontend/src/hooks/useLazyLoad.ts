import { useState, useCallback, useEffect } from 'react';

/**
 * Senior Developer Utility: useLazyLoad
 * A reusable hook to handle "chunked" loading (pagination) for any data array.
 * This ensures that large clinical datasets don't bottleneck the UI thread.
 */
export function useLazyLoad<T>(data: T[], chunkSize: number = 20) {
    const [visibleCount, setVisibleCount] = useState(chunkSize);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const loadMore = useCallback(() => {
        if (visibleCount < data.length) {
            setIsLoadingMore(true);
            // Simulate a small delay for smoother UI transition (clinical feel)
            setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + chunkSize, data.length));
                setIsLoadingMore(false);
            }, 500);
        }
    }, [visibleCount, data.length, chunkSize]);

    const visibleData = data.slice(0, visibleCount);
    const hasMore = visibleCount < data.length;

    return {
        visibleData,
        hasMore,
        isLoadingMore,
        loadMore,
        totalCount: data.length,
        visibleCount
    };
}
