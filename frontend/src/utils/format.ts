/**
 * Utility for formatting currency using native Intl.NumberFormat API.
 */

/**
 * Returns the currency symbol for a given currency code (e.g., '$' for 'USD').
 */
export const getCurrencySymbol = (currency: string): string => {
    try {
        const parts = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).formatToParts(0);
        return parts.find(p => p.type === 'currency')?.value || '$';
    } catch (e) {
        // Fallback for unsupported currency codes
        return '$';
    }
};

/**
 * Formats a number as a currency string.
 */
export const formatCurrency = (amount: number | string, currency: string): string => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(val)) return currency + ' ' + (amount || '0');
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(val);
};
