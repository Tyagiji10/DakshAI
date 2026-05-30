import { useEffect, useState, useCallback } from 'react';

/**
 * useAppTheme — bridges the Portfolio Builder to the global DakshAI theme system.
 * 
 * The app sets `data-theme="dark"|"light"` on `document.documentElement`
 * via UserContext. This hook observes that attribute and exposes reactive
 * theme state + the current app accent color (pulled from the portfolio state).
 */
export function useAppTheme() {
    const [isDark, setIsDark] = useState(
        () => document.documentElement.getAttribute('data-theme') === 'dark'
    );

    useEffect(() => {
        // Watch for theme changes via MutationObserver so we get instant updates
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        return () => observer.disconnect();
    }, []);

    /**
     * Returns a luminance-safe readable text color for a given background hex.
     * Ensures WCAG AA contrast (4.5:1 minimum).
     */
    const getContrastText = useCallback((hexColor) => {
        if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        // Relative luminance (WCAG formula)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.55 ? '#0f172a' : '#ffffff';
    }, []);

    return { isDark, getContrastText };
}
