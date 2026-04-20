import { useState, useEffect } from 'react';

/**
 * usePerformanceScale
 * Detects device hardware capabilities and user preferences to scale UI graphics.
 * Returns: 'low-power' | 'standard' | 'ultra'
 */
export const usePerformanceScale = () => {
    const [scale, setScale] = useState('standard');

    useEffect(() => {
        const detectScale = () => {
            // 1. Check System Preferences
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) return 'low-power';

            // 2. Hardware Detection (Heuristic)
            const cores = navigator.hardwareConcurrency || 4;
            // navigator.deviceMemory is in GB (Chrome/Edge only)
            const memory = navigator.deviceMemory || 4; 
            const isMobile = window.innerWidth <= 768;

            // ULTRA MODE: Powerful Desktop / Newest Phone
            // Requirements: 8+ cores AND 8+ GB RAM (or 6+ cores and high-res desktop)
            if (cores >= 8 && memory >= 8) {
                return 'ultra';
            }
            if (!isMobile && cores >= 6 && memory >= 6) {
                return 'ultra';
            }

            // LOW POWER MODE: Very old hardware or battery saver
            // Requirements: < 2 cores OR < 2GB RAM
            if (cores <= 2 || memory <= 2) {
                return 'low-power';
            }

            // DEFAULT: Standard quality
            return 'standard';
        };

        const result = detectScale();
        setScale(result);

        // Optional: Expose results to global CSS for easy styling
        document.documentElement.setAttribute('data-perf-scale', result);

        // Clean up or listen for changes (e.g. window resize) is usually overkill for hardware
    }, []);

    return scale;
};
