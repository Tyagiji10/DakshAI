import { useEffect, useRef } from 'react';

/**
 * useTilt
 * Adds a high-performance 3D tilt effect to a component.
 * Respects the --tilt-intensity CSS variable.
 */
export const useTilt = (active = true) => {
    const ref = useRef(null);

    useEffect(() => {
        if (!active || !ref.current) return;

        const el = ref.current;
        
        const handleMouseMove = (e) => {
            // Get adaptive intensity from CSS
            const intensity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tilt-intensity')) || 0;
            if (intensity === 0) return;

            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate rotation (max 10 degrees * intensity)
            const rotateX = ((y - centerY) / centerY) * -10 * intensity;
            const rotateY = ((x - centerX) / centerX) * 10 * intensity;
            
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        };

        const handleMouseLeave = () => {
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        };

        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            el.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [active]);

    return ref;
};
