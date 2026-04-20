import React, { useState, useEffect } from 'react';

const ScoreRing = React.memo(({ score, size = 110, stroke = 10 }) => {
    const [displayScore, setDisplayScore] = useState(0);
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;

    useEffect(() => {
        let startTime;
        let animationFrame;
        const duration = 1000; // 1s

        const animate = (time) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            setDisplayScore(Math.floor(easeProgress * score));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [score]);

    const offset = circumference - (displayScore / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size}>
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="transparent"
                    stroke="var(--border-color)"
                    strokeWidth={stroke}
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="transparent"
                    stroke={score === 100 ? '#a855f7' : score >= 80 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444'}
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.1s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: score === 100 ? '#a855f7' : 'var(--text-dark)' }}>{displayScore}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Points</span>
            </div>
        </div>
    );
});

export default ScoreRing;
