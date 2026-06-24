import React, { useEffect, useState } from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
    const [isVisible, setIsVisible] = useState(true);

    // Pause animations when tab is inactive to save CPU/battery
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    return (
        <div className={`animated-bg-root ${!isVisible ? 'paused' : ''}`} aria-hidden="true">
            {/* Layer 1: Base Gradient */}
            <div className="animated-bg-layer animated-bg-base"></div>

            {/* Layer 2: Aurora Lights */}
            <div className="animated-bg-layer animated-bg-aurora animated-bg-aurora-1"></div>
            <div className="animated-bg-layer animated-bg-aurora animated-bg-aurora-2"></div>

            {/* Layer 3: Floating Blobs */}
            <div className="animated-bg-layer animated-bg-blob animated-bg-blob-1"></div>
            <div className="animated-bg-layer animated-bg-blob animated-bg-blob-2"></div>
            <div className="animated-bg-layer animated-bg-blob animated-bg-blob-3"></div>

            {/* Layer 4: Glass Atmosphere */}
            <div className="animated-bg-layer animated-bg-glass"></div>

            {/* Layer 5: Particle Layer */}
            <div className="animated-bg-layer animated-bg-particles animated-bg-particles-1"></div>
            <div className="animated-bg-layer animated-bg-particles animated-bg-particles-2"></div>

            {/* Layer 6: Soft Vignette */}
            <div className="animated-bg-layer animated-bg-vignette"></div>
        </div>
    );
};

export default AnimatedBackground;
