import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the window to the top on every route change (forward AND back navigation).
 * Prevents the footer-flash caused by the browser retaining the previous scroll
 * position while the new page's async data is still loading.
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Instant reset
        window.scrollTo(0, 0);
        
        // Safety timeout to catch async content shifts
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }, 10);
        
        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
}


