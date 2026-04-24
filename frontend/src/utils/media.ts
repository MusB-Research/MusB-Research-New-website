import { API } from './auth';

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1576091160550-217359ece236?q=80&w=2070&auto=format&fit=crop';

/**
 * Ensures a media URL is absolute and correctly formatted.
 * Handles relative paths by prefixing them with the API base URL.
 */
export function getMediaUrl(url: string | null | undefined): string {
    if (!url) return FALLBACK_IMAGE;

    // If it's already an absolute URL (starts with http or https), return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // If it starts with /media/, prepend the API base
    if (url.startsWith('/media/')) {
        return `${API}${url}`;
    }

    // If it's just a path like "news_images/something.webp", prepend /media/ and API base
    if (!url.startsWith('/')) {
        return `${API}/media/${url}`;
    }

    // Default: prepend API base to any other relative path
    return `${API}${url}`;
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
