import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ExternalLink, ChevronLeft, CheckCircle, AlertCircle, TrendingUp, X } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { downloadPortfolioZip } from '../../services/export';
import { calculatePortfolioScore } from '../../utils/scoreCalculator';

const BuilderHeader = () => {
    const navigate = useNavigate();
    const { state } = usePortfolio();
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
        height: '68px',
        background: '#0b0f19',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
        position: 'sticky',
        top: 0,
        zIndex: 99999,
        transition: 'all 0.3s ease'
    };

    const getScoreColor = () => {
        if (score >= 90) return '#10b981'; // Green
        if (score >= 75) return '#facc15'; // Yellow
        if (score >= 50) return '#f97316'; // Orange
        return '#ef4444'; // Red
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
                paddingLeft: 'clamp(16px, 4vw, 32px)',
                paddingRight: 'clamp(16px, 4vw, 32px)'
            }}
        >
            <style>{`
                @media (max-width: 639px) {
                    .mobile-shrink-btn {
                        height: 34px !important;
                    }
                    .mobile-shrink-btn-square {
                        height: 34px !important;
                        width: 34px !important;
                    }
                }
            `}</style>
            {/* Left — back + logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)', flex: 1, minWidth: 0 }}>
                <button
                    className="mobile-shrink-btn-square"
                    onClick={() => navigate('/portfolio')}
                    title="Back to Dashboard"
                    style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'transform 0.2s, color 0.2s',
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <ChevronLeft size={16} />
                </button>

                <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.2)' }} />

                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    style={{ 
                        fontSize: '1.25rem', fontWeight: 800, color: '#fff', 
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'default',
                        minWidth: 0
                    }}
                >
                    {personalInfo?.avatarUrl && (
                        <img 
                            src={personalInfo.avatarUrl} 
                            alt="Logo" 
                            style={{ 
                                width: 32, height: 32, 
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

            {/* Center — Title */}
            <div style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                pointerEvents: 'none'
            }} className="hidden md:block">
                Portfolio website builder
            </div>

            {/* Right — actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 24px)' }}>
                <button
                    onClick={handleOpenPreview}
                    title="Open full preview"
                    className="hidden sm:flex mobile-shrink-btn"
                    style={{
                        alignItems: 'center', gap: 6,
                        height: 44, padding: '0 16px', borderRadius: 22,
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        fontSize: '0.85rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.color = '#fff'; }}
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
                            height: 44, padding: '0 16px', borderRadius: 22,
                            background: `color-mix(in srgb, ${getScoreColor()} 10%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${getScoreColor()} 30%, transparent)`,
                            color: '#fff',
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
                                    top: '48px',
                                    right: 0,
                                    width: 320,
                                    background: '#0f172a', // solid slate-900
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12,
                                    padding: 20,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    zIndex: 1000,
                                    cursor: 'default'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Portfolio Score</h3>
                                    <button onClick={() => setIsScoreOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={13} /></button>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getScoreColor(), lineHeight: 1 }}>{score}%</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                        {score >= 90 ? 'Excellent! Your portfolio is complete and ready.' : 
                                         score >= 75 ? 'Looking good, but there is room for improvement.' :
                                         'Your portfolio needs more details to stand out.'}
                                    </div>
                                </div>

                                {missing.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Improvement Suggestions</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {missing.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                                                    <AlertCircle size={11} color="#facc15" style={{ marginTop: 2, flexShrink: 0 }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{item.label}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.suggestion}</div>
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
                        height: 44, padding: '0 20px', borderRadius: 22,
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
