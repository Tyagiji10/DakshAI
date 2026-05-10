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
        let rect = null;
        
        const handleMouseEnter = () => {
            rect = el.getBoundingClientRect();
            el.style.transition = 'transform 0.1s ease-out';
        };

        const handleMouseMove = (e) => {
            if (!rect) rect = el.getBoundingClientRect();

            // Get adaptive intensity from CSS
            const intensity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tilt-intensity')) || 0;
            if (intensity === 0) return;

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate rotation (max 12 degrees * intensity)
            const rotateX = ((y - centerY) / centerY) * -12 * intensity;
            const rotateY = ((x - centerX) / centerX) * 12 * intensity;
            
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        };

        const handleMouseLeave = () => {
            rect = null;
            el.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        };

        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            el.removeEventListener('mouseenter', handleMouseEnter);
            el.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [active]);

    return ref;
};
