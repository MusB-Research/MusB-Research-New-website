import { useState, useEffect, useRef } from 'react';
import { authFetch, API } from '../utils/auth';

interface PostalResult {
    city: string;
    state: string;
    country: string;
    country_code: string;
    postcode: string;
    lat?: number;
    lon?: number;
    formatted: string;
    provider: string;
}

interface UsePostalLookupProps {
    zipCode: string;
    country: string;
    onSuccess?: (result: PostalResult) => void;
    onClear?: () => void;
    delay?: number;
}

export const usePostalLookup = ({ zipCode, country, onSuccess, onClear, delay = 800 }: UsePostalLookupProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PostalResult | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const getCC = (c: string, z: string) => {
        const clean = (c || '').toLowerCase().trim();
        const map: Record<string, string> = {
            'united states': 'us', 'usa': 'us', 'us': 'us',
            'india': 'in', 'in': 'in', 'ind': 'in',
            'united kingdom': 'gb', 'uk': 'gb', 'gb': 'gb', 'great britain': 'gb',
            'canada': 'ca', 'ca': 'ca',
            'australia': 'au', 'au': 'au',
            'germany': 'de', 'de': 'de', 'deutschland': 'de',
            'france': 'fr', 'fr': 'fr',
            'italy': 'it', 'it': 'it',
            'spain': 'es', 'es': 'es',
            'brazil': 'br', 'br': 'br',
            'mexico': 'mx', 'mx': 'mx',
            'japan': 'jp', 'jp': 'jp',
            'south africa': 'za', 'za': 'za',
            'pakistan': 'pk', 'pk': 'pk',
            'singapore': 'sg', 'sg': 'sg',
            'united arab emirates': 'ae', 'uae': 'ae', 'ae': 'ae'
        };
        
        if (map[clean]) return map[clean];
        if (clean.length === 2) return clean;
        
        // Guess based on format if country is empty
        if (!clean) {
            if (z.length === 6 && /^\d+$/.test(z)) return 'in';
            if (z.length === 5 && /^\d+$/.test(z)) return 'us';
            if (/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(z)) return 'ca';
            if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(z)) return 'gb';
        }
        
        return 'us'; 
    };

    const validate = (cc: string, z: string) => {
        const patterns: Record<string, RegExp> = {
            'us': /^\d{5}(-\d{4})?$/,
            'in': /^\d{6}$/,
            'ca': /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
            'gb': /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
            'au': /^\d{4}$/,
            'de': /^\d{5}$/,
            'fr': /^\d{5}$/,
            'sg': /^\d{6}$/,
            'jp': /^\d{3}-\d{4}$|^\d{7}$/
        };
        return patterns[cc] ? patterns[cc].test(z) : z.length >= 3;
    };


    useEffect(() => {
        const cleanZip = (zipCode || '').trim();
        if (cleanZip.length < 3) {
            setResult(null);
            setError(null);
            if (onClear) onClear();
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const timer = setTimeout(async () => {
            const countryCode = getCC(country, cleanZip);
            
            // Only search if valid for that country or meets minimum length
            if (!validate(countryCode, cleanZip)) {
                return;
            }

            setIsLoading(true);
            setError(null);

            const controller = new AbortController();
            abortControllerRef.current = controller;

            try {
                const url = `/api/zip-lookup/${countryCode}/${encodeURIComponent(cleanZip)}/`;
                const response = await authFetch(url, { signal: controller.signal });
                
                if (response.ok) {
                    const data: PostalResult = await response.json();
                    setResult(data);
                    if (onSuccess) onSuccess(data);
                } else {
                    const errData = await response.json().catch(() => ({}));
                    setError(errData.error || 'Location not found');
                    setResult(null);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("Postal lookup failed:", err);
                    setError("Failed to fetch location");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, delay);

        return () => {
            clearTimeout(timer);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [zipCode, country]);

    return { isLoading, error, result };
};
