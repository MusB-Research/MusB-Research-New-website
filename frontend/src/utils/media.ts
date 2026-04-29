import { API } from './auth';

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1576091160550-217359ece236?q=80&w=2070&auto=format&fit=crop';

/**
 * Ensures a media URL is absolute and correctly formatted.
 * Handles relative paths by prefixing them with the API base URL.
 */
export function getMediaUrl(url: string | null | undefined): string {
    if (!url) return FALLBACK_IMAGE;

    let cleanPath = url;

    // Handle absolute URLs that might be pointing to localhost or old domains
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // If it's a media URL from any source (even localhost), try to extract the relative path
        // to re-resolve it against the current API base.
        const mediaIndex = url.indexOf('/media/');
        if (mediaIndex !== -1) {
            cleanPath = url.substring(mediaIndex + 7); // extract path after "/media/"
        } else {
            return url; // It's a real external absolute URL, keep it
        }
    }

    const baseUrl = (API || 'http://localhost:8000').replace(/\/$/, '');
    
    // Remove leading slash if present
    const pathWithoutLeadingSlash = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
    
    // Ensure we don't have double /media/ if the path already starts with it
    const finalPath = pathWithoutLeadingSlash.startsWith('media/') 
        ? pathWithoutLeadingSlash.substring(6) 
        : pathWithoutLeadingSlash;
    
    return `${baseUrl}/media/${finalPath}`;
}

/**
 * Image error handler that replaces the broken image with a fallback.
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== FALLBACK_IMAGE) {
        target.src = FALLBACK_IMAGE;
    }
};
