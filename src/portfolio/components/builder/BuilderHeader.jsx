import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ExternalLink, ChevronLeft, CheckCircle, AlertCircle, TrendingUp, X } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { downloadPortfolioZip } from '../../services/export';
import { calculatePortfolioScore } from '../../utils/scoreCalculator';

const BuilderHeader = () => {
    const navigate = useNavigate();
    const { state } = usePortfolio();
    const { isDark } = useAppTheme();
    const { personalInfo, sections, theme } = state || {};
    
    const [isScoreOpen, setIsScoreOpen] = useState(false);
    const scoreRef = useRef(null);

    const { score, missing } = calculatePortfolioScore(state);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (scoreRef.current && !scoreRef.current.contains(event.target)) {
                setIsScoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpenPreview = () => {
        localStorage.setItem('portfolio_draft_preview', JSON.stringify(state));
        window.open('/p/preview/preview-draft', '_blank');
    };

    const is3D = theme?.id === '3d-premium';
    const isBrutal = theme?.id === 'neo-brutal';
    const isGlass = theme?.id === 'glassmorphic';
    
    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'var(--pb-header-height)',
        background: 'var(--pb-bg-toolbar)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--pb-border)',
        position: 'sticky',
        top: 0,
        zIndex: 99999,
        transition: 'all 0.3s ease'
    };

    const getScoreColor = () => {
        if (isDark) {
            if (score >= 90) return '#10b981'; // Green
            if (score >= 75) return '#facc15'; // Yellow
            if (score >= 50) return '#f97316'; // Orange
            return '#ef4444'; // Red
        }
        // Light theme — use darker, more saturated variants for visibility
        if (score >= 90) return '#059669'; // Darker green
        if (score >= 75) return '#b45309'; // Darker amber (instead of pale yellow)
        if (score >= 50) return '#c2410c'; // Darker orange
        return '#dc2626'; // Darker red
    };

    const getScoreIcon = () => {
        if (score >= 90) return <CheckCircle size={11} color={getScoreColor()} className="score-icon" />;
        if (score >= 75) return <TrendingUp size={11} color={getScoreColor()} className="score-icon" />;
        return <AlertCircle size={11} color={getScoreColor()} className="score-icon" />;
    };

    return (
        <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                ...headerStyle,
                paddingLeft: 'var(--pb-header-padding)',
                paddingRight: 'var(--pb-header-padding)'
            }}
        >
            <style>{`
                @media (max-width: 767px) {
                    .mobile-shrink-btn {
                        height: 30px !important;
                        padding: 0 6px !important;
                        font-size: 0.75rem !important;
                    }
                    .mobile-shrink-btn-square {
                        height: 30px !important;
                        width: 30px !important;
                    }
                    .pb-header-left {
                        gap: 4px !important;
                    }
                    .pb-header-right {
                        gap: 6px !important;
                    }
                }
            `}</style>
            {/* Left — back + logo */}
            <div className="pb-header-left" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)', flex: 1, minWidth: 0 }}>
                <button
                    className="mobile-shrink-btn-square"
                    onClick={() => navigate('/portfolio')}
                    title="Back to Dashboard"
                    style={{
                        width: 'var(--pb-back-size)', 
                        height: 'var(--pb-back-size)', 
                        borderRadius: 'var(--pb-back-radius)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--pb-text-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'transform 0.2s, color 0.2s',
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--pb-text-primary)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <ChevronLeft size={14} />
                </button>

                <div style={{ width: '1px', height: 'var(--pb-separator-height)', background: 'var(--pb-border)' }} />

                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    style={{ 
                        fontSize: 'var(--pb-logo-font-size)', fontWeight: 800, color: 'var(--pb-text-primary)', 
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'default',
                        minWidth: 0
                    }}
                >
                    {personalInfo?.avatarUrl && (
                        <img 
                            src={personalInfo.avatarUrl} 
                            alt="Logo" 
                            style={{ 
                                width: 'var(--pb-avatar-size)', 
                                height: 'var(--pb-avatar-size)', 
                                borderRadius: '50%', 
                                objectFit: 'cover' 
                            }} 
                        />
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {personalInfo?.siteTitle || personalInfo?.fullName?.split(' ')[0] || 'Portfolio Studio'}
                    </span>
                    <span style={{ color: '#3b82f6', flexShrink: 0 }}>.</span>
                </motion.div>
            </div>

            {/* Center — Title (Desktop: Single line) */}
            <div style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                color: isDark ? '#ffffff' : '#6366f1',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                pointerEvents: 'none',
                textShadow: isDark ? '0 0 10px rgba(255, 255, 255, 0.25)' : '0 0 8px rgba(99, 102, 241, 0.15)',
            }} className="hidden md:block">
                Portfolio Website Builder
            </div>

            {/* Center — Title (Mobile: Two lines) */}
            <div style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                textAlign: 'center',
                gap: '1px'
            }} className="block md:hidden">
                <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
                    whiteSpace: 'nowrap'
                }}>
                    Portfolio Website
                </span>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: isDark ? '#ffffff' : '#6366f1',
                    textShadow: isDark ? '0 0 8px rgba(255, 255, 255, 0.2)' : 'none',
                }}>
                    Builder
                </span>
            </div>

            {/* Right — actions */}
            <div className="pb-header-right" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 24px)' }}>
                <button
                    onClick={handleOpenPreview}
                    title="Open full preview"
                    className="hidden sm:flex mobile-shrink-btn"
                    style={{
                        alignItems: 'center', gap: 6,
                        height: 'var(--pb-btn-height)',
                        padding: 'var(--pb-btn-padding)',
                        borderRadius: 'var(--pb-btn-radius)',
                        background: 'transparent',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.15)',
                        color: 'var(--pb-text-primary)',
                        fontSize: '0.85rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                    onMouseLeave={e => { 
                        e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'; 
                        e.currentTarget.style.color = 'var(--pb-text-primary)'; 
                    }}
                >
                    <ExternalLink size={13} />
                    <span>Preview</span>
                </button>

                {/* Score Indicator */}
                <div style={{ position: 'relative' }} ref={scoreRef}>
                    <button
                        className="mobile-shrink-btn"
                        onClick={() => setIsScoreOpen(!isScoreOpen)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            height: 'var(--pb-btn-height)',
                            padding: 'var(--pb-btn-padding)',
                            borderRadius: 'var(--pb-btn-radius)',
                            background: `color-mix(in srgb, ${getScoreColor()} 10%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${getScoreColor()} 30%, transparent)`,
                            color: 'var(--pb-text-primary)',
                            fontSize: '0.85rem', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = `color-mix(in srgb, ${getScoreColor()} 20%, transparent)`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `color-mix(in srgb, ${getScoreColor()} 10%, transparent)`; }}
                    >
                        {getScoreIcon()}
                        <span style={{ color: getScoreColor() }}>{score}%</span>
                    </button>

                    <AnimatePresence>
                        {isScoreOpen && (
                            <>
                                <div 
                                    style={{
                                        position: 'fixed',
                                        inset: 0,
                                        zIndex: 999,
                                        cursor: 'default',
                                        background: 'rgba(0,0,0,0.4)', // Add a subtle dark overlay so they know it's a modal
                                        backdropFilter: 'blur(2px)' // Small blur to separate background further
                                    }}
                                    onClick={(e) => { e.stopPropagation(); setIsScoreOpen(false); }}
                                    onMouseMove={(e) => { e.stopPropagation(); if(e.nativeEvent) e.nativeEvent.stopImmediatePropagation(); }}
                                />
                                <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    top: 'var(--pb-dropdown-top)',
                                    right: 0,
                                    width: 320,
                                    background: isDark ? '#0f172a' : '#ffffff', 
                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                                    borderRadius: 12,
                                    padding: 20,
                                    boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.08)',
                                    zIndex: 1000,
                                    cursor: 'default'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? '#fff' : '#0f172a', margin: 0 }}>Portfolio Score</h3>
                                    <button onClick={() => setIsScoreOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer' }}><X size={13} /></button>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getScoreColor(), lineHeight: 1 }}>{score}%</div>
                                    <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.4 }}>
                                        {score >= 90 ? 'Excellent! Your portfolio is complete and ready.' : 
                                         score >= 75 ? 'Looking good, but there is room for improvement.' :
                                         'Your portfolio needs more details to stand out.'}
                                    </div>
                                </div>

                                {missing.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Improvement Suggestions</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {missing.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 10, borderRadius: 8 }}>
                                                    <AlertCircle size={11} color="#facc15" style={{ marginTop: 2, flexShrink: 0 }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 2 }}>{item.label}</div>
                                                        <div style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>{item.suggestion}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <motion.button
                    className="mobile-shrink-btn"
                    onClick={() => downloadPortfolioZip(state)}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        height: 'var(--pb-btn-height)',
                        padding: 'var(--pb-btn-padding)',
                        borderRadius: 'var(--pb-btn-radius)',
                        background: '#3b82f6',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.85rem', fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    <Download size={14} className="export-icon" />
                    <span className="hidden sm:inline">Export</span>
                </motion.button>
            </div>
        </motion.header>
    );
};

export default BuilderHeader;
