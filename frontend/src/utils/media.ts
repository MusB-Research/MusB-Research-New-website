import { API } from './auth';

/** 
 * Fallback image for news/events when no image is provided.
 * Using a high-quality medical/research related Unsplash image.
 */
export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1532187875605-1ef64ef24192?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';

/**
 * Resolves a media URL from the backend.
 * Handles absolute URLs, relative paths, and legacy /media/ prefixes.
 */
export function getMediaUrl(url: string | null | undefined): string {
    if (!url) return FALLBACK_IMAGE;

    // 1. If it's already an absolute URL (contains ://), return it directly.
    // This makes the function idempotent and handles external images (Unsplash, etc.)
    if (url.includes('://')) {
        return url;
    }

    // 2. Clean the path: remove redundant /media/ or leading slashes
    let cleanPath = url;
    
    // If it contains /media/ (e.g. from an old absolute URL that was partially cleaned)
    const mediaIndex = url.indexOf('/media/');
    if (mediaIndex !== -1) {
        cleanPath = url.substring(mediaIndex + 7);
    } else if (url.startsWith('media/')) {
        cleanPath = url.substring(6);
    } else if (url.startsWith('/')) {
        cleanPath = url.substring(1);
    }

    // 3. Construct the final URL using the API base
    const baseUrl = (API || 'http://localhost:8003').replace(/\/$/, '');
    
    // Ensure we don't have multiple slashes
    const finalPath = cleanPath.replace(/^\/+/, '');
    
    return `${baseUrl}/media/${finalPath}`;
}

/**
 * Extracts the YouTube Video ID from various URL formats.
 */
export function getYoutubeId(url: string | null | undefined): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Image error handler to provide a fallback if the image fails to load.
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== FALLBACK_IMAGE) {
        target.src = FALLBACK_IMAGE;
    }
};
