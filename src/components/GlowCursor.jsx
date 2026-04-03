import React, { useEffect, useRef, useState } from 'react';

const GlowCursor = () => {
    const dotRef = useRef(null);
    const outlineRef = useRef(null);
    const requestRef = useRef(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const outlinePos = useRef({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const onMouseMove = (e) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
            if (!isVisible) setIsVisible(true);
        };

        const onMouseEnter = () => setIsVisible(true);
        const onMouseLeave = () => setIsVisible(false);

        const onMouseDown = () => setIsHovering(true);
        const onMouseUp = () => setIsHovering(false);

        const onMouseOver = (e) => {
            const target = e.target;
            const isClickable = 
                target.tagName === 'BUTTON' || 
                target.tagName === 'A' || 
                target.closest('button') || 
                target.closest('a') || 
                window.getComputedStyle(target).cursor === 'pointer';
            
            setIsHovering(isClickable);
        };

        const animate = () => {
            // Smoothly interpolate outline position towards mouse position
            const easing = 0.15;
            outlinePos.current.x += (mousePos.current.x - outlinePos.current.x) * easing;
            outlinePos.current.y += (mousePos.current.y - outlinePos.current.y) * easing;

            if (dotRef.current) {
                dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
            }
            if (outlineRef.current) {
                outlineRef.current.style.transform = `translate3d(${outlinePos.current.x}px, ${outlinePos.current.y}px, 0)`;
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseenter', onMouseEnter);
        window.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mouseover', onMouseOver);

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseenter', onMouseEnter);
            window.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mouseover', onMouseOver);
            cancelAnimationFrame(requestRef.current);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <>
            <style>{`
                .cursor-dot {
                    width: 8px;
                    height: 8px;
                    background-color: var(--accent-green);
                    position: fixed;
                    top: -4px;
                    left: -4px;
                    border-radius: 50%;
                    z-index: 999999;
                    pointer-events: none;
                    transition: width 0.3s, height 0.3s, background-color 0.3s;
                }
                .cursor-outline {
                    width: 40px;
                    height: 40px;
                    background-color: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    position: fixed;
                    top: -20px;
                    left: -20px;
                    border-radius: 50%;
                    z-index: 999998;
                    pointer-events: none;
                    backdrop-filter: blur(2px);
                    transition: width 0.3s, height 0.3s, background-color 0.3s, border-color 0.3s;
                }
                .cursor-hover .cursor-dot {
                    width: 4px;
                    height: 4px;
                    background-color: var(--primary-blue);
                }
                .cursor-hover .cursor-outline {
                    width: 60px;
                    height: 60px;
                    top: -30px;
                    left: -30px;
                    background-color: rgba(59, 130, 246, 0.2);
                    border-color: rgba(59, 130, 246, 0.4);
                    backdrop-filter: blur(4px);
                }
                @media (max-width: 768px) {
                    .cursor-dot, .cursor-outline { display: none !important; }
                }
            `}</style>
            <div className={isHovering ? 'cursor-hover' : ''}>
                <div ref={dotRef} className="cursor-dot" />
                <div ref={outlineRef} className="cursor-outline" />
            </div>
        </>
    );
};

export default GlowCursor;
