import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download, ExternalLink, ChevronLeft, ChevronRight,
    CheckCircle, AlertCircle, TrendingUp, X,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { downloadPortfolioZip } from '../../services/export';
import { calculatePortfolioScore } from '../../utils/scoreCalculator';

/* ─────────────────────────────────────────────────────────────────
   BuilderHeader — Premium SaaS Floating Navbar
   All business logic is unchanged; only the UI shell is redesigned.
───────────────────────────────────────────────────────────────── */
const BuilderHeader = () => {
    const navigate = useNavigate();
    const { state } = usePortfolio();
    const { isDark } = useAppTheme();
    const { personalInfo, sections, theme } = state || {};

    const [isScoreOpen, setIsScoreOpen] = useState(false);
    const scoreRef = useRef(null);

    // ── Original score calculation (unchanged) ──────────────────
    const { score, missing } = calculatePortfolioScore(state);

    // ── Click-outside handler (unchanged) ──────────────────────
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (scoreRef.current && !scoreRef.current.contains(event.target)) {
                setIsScoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Original preview handler (unchanged) ───────────────────
    const handleOpenPreview = () => {
        localStorage.setItem('portfolio_draft_preview', JSON.stringify(state));
        window.open('/p/preview/preview-draft', '_blank');
    };

    // ── Original score colour logic (unchanged) ─────────────────
    const getScoreColor = () => {
        if (isDark) {
            if (score >= 90) return '#10b981';
            if (score >= 75) return '#facc15';
            if (score >= 50) return '#f97316';
            return '#ef4444';
        }
        if (score >= 90) return '#059669';
        if (score >= 75) return '#b45309';
        if (score >= 50) return '#c2410c';
        return '#dc2626';
    };

    const getScoreIcon = () => {
        if (score >= 90) return <CheckCircle size={16} color={getScoreColor()} className="pbh-score-icon" />;
        if (score >= 75) return <TrendingUp size={16} color={getScoreColor()} className="pbh-score-icon" />;
        return <AlertCircle size={16} color={getScoreColor()} className="pbh-score-icon" />;
    };

    // Avatar fallback
    const avatarSrc = personalInfo?.avatarUrl
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(
            personalInfo?.fullName || 'User'
        )}&background=4F7CFF&color=fff`;

    const displayName = personalInfo?.siteTitle
        || personalInfo?.fullName?.split(' ')[0]
        || 'Portfolio';

    return (
        <>
            {/* ── Scoped styles ───────────────────────────────── */}
            <style>{`
                /* Wrapper that adds the floating margin */
                .pbh-wrapper {
                    position: sticky;
                    top: 0;
                    z-index: 99999;
                    padding: 8px 16px;
                    pointer-events: none;   /* let clicks pass through padding */
                }

                /* The floating pill itself */
                .pbh-bar {
                    pointer-events: auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 64px;
                    padding: 0 16px 0 12px;
                    border-radius: 20px;
                    background: rgba(8, 12, 28, 0.82);
                    backdrop-filter: blur(32px) saturate(180%);
                    -webkit-backdrop-filter: blur(32px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.07);
                    box-shadow:
                        0 0 0 1px rgba(255,255,255,0.03) inset,
                        0 24px 80px rgba(0, 0, 0, 0.55),
                        0 4px 16px rgba(0, 0, 0, 0.3);
                    /* glass reflection */
                    background-image:
                        linear-gradient(
                            135deg,
                            rgba(255,255,255,0.04) 0%,
                            transparent 50%
                        );
                    position: relative;
                    overflow: visible;
                }

                /* Light theme pill */
                [data-theme='light'] .pbh-bar {
                    background: rgba(255, 255, 255, 0.88);
                    background-image: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%);
                    border-color: rgba(0,0,0,0.07);
                    box-shadow:
                        0 0 0 1px rgba(255,255,255,0.95) inset,
                        0 20px 60px rgba(0,0,0,0.12);
                }

                /* ── Back button ── */
                .pbh-back {
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.75);
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
                }
                .pbh-back:hover {
                    background: rgba(79,124,255,0.18);
                    border-color: rgba(79,124,255,0.4);
                    color: #4F7CFF;
                    transform: scale(1.08) translateX(-1px);
                    box-shadow: 0 0 16px rgba(79,124,255,0.3);
                }
                [data-theme='light'] .pbh-back {
                    background: rgba(0,0,0,0.05);
                    border-color: rgba(0,0,0,0.1);
                    color: #374151;
                }
                [data-theme='light'] .pbh-back:hover {
                    background: rgba(79,124,255,0.1);
                    border-color: rgba(79,124,255,0.3);
                    color: #4F7CFF;
                }

                /* ── Avatar ── */
                .pbh-avatar-wrap {
                    position: relative;
                    flex-shrink: 0;
                }
                .pbh-avatar {
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                    display: block;
                    border: 2px solid rgba(79,124,255,0.55);
                    box-shadow:
                        0 0 0 3px rgba(79,124,255,0.12),
                        0 0 12px rgba(79,124,255,0.22);
                    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s;
                }
                .pbh-avatar:hover {
                    transform: scale(1.06);
                    box-shadow:
                        0 0 0 3px rgba(79,124,255,0.2),
                        0 0 18px rgba(79,124,255,0.38);
                }
                .pbh-avatar-ring {
                    position: absolute;
                    inset: -3px;
                    border-radius: 50%;
                    background: conic-gradient(from 0deg, #4F7CFF, #a855f7, #4F7CFF);
                    filter: blur(5px);
                    opacity: 0.4;
                    z-index: 0;
                    animation: pbh-ring-spin 5s linear infinite;
                }
                @keyframes pbh-ring-spin { to { transform: rotate(360deg); } }

                /* ── User info ── */
                .pbh-user-info {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    min-width: 0;
                }
                .pbh-name-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .pbh-name {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #f1f5f9;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    letter-spacing: -0.01em;
                }
                [data-theme='light'] .pbh-name { color: #0f172a; }

                .pbh-verify-dot {
                    width: 7px; height: 7px;
                    border-radius: 50%;
                    background: #4F7CFF;
                    box-shadow: 0 0 5px rgba(79,124,255,0.6);
                    flex-shrink: 0;
                }
                .pbh-sub-row {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    cursor: pointer;
                    color: rgba(148,163,184,0.7);
                    font-size: 0.68rem;
                    font-weight: 500;
                    transition: color 0.2s;
                    white-space: nowrap;
                }
                .pbh-sub-row:hover { color: #a5b4fc; }
                [data-theme='light'] .pbh-sub-row { color: var(--text-muted); }
                [data-theme='light'] .pbh-sub-row:hover { color: #4f46e5; }

                /* ── Dividers ── */
                .pbh-divider {
                    width: 1px;
                    height: 36px;
                    background: linear-gradient(to bottom,
                        transparent 0%,
                        rgba(255,255,255,0.12) 30%,
                        rgba(255,255,255,0.12) 70%,
                        transparent 100%
                    );
                    flex-shrink: 0;
                    animation: pbh-divider-pulse 3s ease-in-out infinite;
                }
                [data-theme='light'] .pbh-divider {
                    background: linear-gradient(to bottom,
                        transparent, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, transparent
                    );
                }
                @keyframes pbh-divider-pulse {
                    0%,100% { opacity: 0.7; } 50% { opacity: 1; }
                }

                /* ── Center branding ── */
                .pbh-center {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0;
                    pointer-events: none;
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    white-space: nowrap;
                }
                .pbh-center-label {
                    font-size: 0.52rem;
                    font-weight: 700;
                    letter-spacing: 0.38em;
                    text-transform: uppercase;
                    color: rgba(148,163,184,0.5);
                    line-height: 1;
                }
                .pbh-center-title {
                    font-size: 1.3rem;
                    font-weight: 800;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    line-height: 1.1;
                    background: linear-gradient(135deg, #e2e8f0 0%, #ffffff 40%, #a5b4fc 80%, #818cf8 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                [data-theme='light'] .pbh-center-title {
                    background: linear-gradient(135deg, #1e293b 0%, #4f46e5 60%, #6366f1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* ── Score card ── */
                .pbh-score-card {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    justify-content: center;
                    gap: 2px;
                    width: 120px;
                    height: 48px;
                    padding: 0 12px;
                    border-radius: 14px;
                    background: rgba(20, 16, 6, 0.65);
                    border: 1px solid rgba(250,204,21,0.18);
                    box-shadow:
                        0 0 24px rgba(250,204,21,0.08),
                        inset 0 1px 0 rgba(255,255,255,0.05);
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
                    position: relative;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .pbh-score-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(250,204,21,0.06) 0%, transparent 60%);
                    pointer-events: none;
                }
                .pbh-score-card:hover {
                    transform: translateY(-3px);
                    box-shadow:
                        0 8px 32px rgba(250,204,21,0.18),
                        0 0 0 1px rgba(250,204,21,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.07);
                    border-color: rgba(250,204,21,0.35);
                }
                [data-theme='light'] .pbh-score-card {
                    background: rgba(255,251,235,0.9);
                    border-color: rgba(180,83,9,0.2);
                    box-shadow: 0 4px 20px rgba(180,83,9,0.08);
                }
                [data-theme='light'] .pbh-score-card:hover {
                    box-shadow: 0 8px 28px rgba(180,83,9,0.15);
                }

                .pbh-score-top {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .pbh-score-value {
                    font-size: 1rem;
                    font-weight: 800;
                    line-height: 1;
                    letter-spacing: -0.02em;
                }
                .pbh-score-label {
                    font-size: 0.58rem;
                    font-weight: 600;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    color: rgba(148,163,184,0.7);
                    margin-top: 0;
                }
                [data-theme='light'] .pbh-score-label { color: #92400e; }

                /* Score dropdown panel — unchanged logic, restyled */
                .pbh-score-panel {
                    position: absolute;
                    top: calc(100% + 12px);
                    right: 0;
                    width: 320px;
                    border-radius: 16px;
                    padding: 20px;
                    z-index: 1000;
                    cursor: default;
                }

                /* ── Download button ── */
                .pbh-download-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 3px;
                    width: 70px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(145deg, #4F7CFF 0%, #5F8DFF 100%);
                    border: none;
                    color: #fff;
                    cursor: pointer;
                    flex-shrink: 0;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
                    box-shadow:
                        0 0 16px rgba(79,124,255,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.2);
                }
                .pbh-download-btn::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 50%;
                    background: rgba(255,255,255,0.1);
                    border-radius: 14px 14px 0 0;
                    pointer-events: none;
                }
                .pbh-download-btn:hover {
                    transform: translateY(-2px) scale(1.03);
                    box-shadow:
                        0 8px 28px rgba(79,124,255,0.45),
                        inset 0 1px 0 rgba(255,255,255,0.25);
                    background: linear-gradient(145deg, #5F8DFF 0%, #6F9DFF 100%);
                }
                .pbh-download-btn:active {
                    transform: scale(0.96);
                    box-shadow: 0 4px 12px rgba(79,124,255,0.3);
                }
                .pbh-download-label {
                    font-size: 0.6rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    line-height: 1;
                }

                /* ── Preview ghost button (desktop only) ── */
                .pbh-preview-btn {
                    display: flex; align-items: center; gap: 5px;
                    height: 36px;
                    padding: 0 14px;
                    border-radius: 10px;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.12);
                    color: rgba(255,255,255,0.6);
                    font-size: 0.78rem; font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .pbh-preview-btn:hover {
                    border-color: rgba(79,124,255,0.5);
                    color: #a5b4fc;
                    background: rgba(79,124,255,0.08);
                }
                [data-theme='light'] .pbh-preview-btn {
                    border-color: rgba(0,0,0,0.12);
                    color: #475569;
                }
                [data-theme='light'] .pbh-preview-btn:hover {
                    border-color: #6366f1;
                    color: #4f46e5;
                }

                /* ── Mobile responsive — single row, no wrap ── */
                @media (max-width: 767px) {
                    .pbh-wrapper { padding: 6px 8px; }
                    .pbh-bar {
                        height: 56px;
                        min-height: unset;
                        padding: 0 10px;
                        border-radius: 16px;
                        flex-wrap: nowrap;   /* SINGLE ROW */
                        gap: 6px;
                        overflow: visible;
                    }
                    /* Hide back button on mobile */
                    .pbh-back { display: none !important; }
                    .pbh-left { gap: 6px !important; flex: 1; min-width: 0; }
                    .pbh-right { gap: 6px !important; flex-shrink: 0; }
                    /* Center title stays visible inline via absolute positioning */
                    .pbh-center { display: flex; }
                    .pbh-center-mobile { display: none !important; }
                    .pbh-divider { display: flex; height: 28px; }
                    /* Avatar */
                    .pbh-avatar { width: 24px; height: 24px; border-width: 1px; box-shadow: 0 0 0 2px rgba(79,124,255,0.12); }
                    .pbh-avatar-ring { inset: -1px; filter: blur(2px); }
                    /* Text */
                    .pbh-name { font-size: 0.7rem; }
                    .pbh-sub-row { display: none; }   /* too small for sub row */
                    .pbh-verify-dot { width: 4px; height: 4px; }
                    /* Center branding — smaller */
                    .pbh-center-label { font-size: 0.38rem; letter-spacing: 0.15em; }
                    .pbh-center-title { font-size: 0.7rem; letter-spacing: 0.05em; }
                    /* Score card — row layout, compact */
                    .pbh-score-card { width: auto; min-width: 54px; height: 32px; padding: 0 6px; flex-direction: row; align-items: center; gap: 3px; border-radius: 8px; }
                    .pbh-score-top { gap: 3px; }
                    .pbh-score-value { font-size: 0.75rem; }
                    .pbh-score-label { display: none; }
                    /* Download button */
                    .pbh-download-btn { width: 44px; height: 32px; border-radius: 8px; gap: 2px; }
                    .pbh-download-label { font-size: 0.45rem; }
                    .pbh-dl-icon { width: 11px !important; height: 11px !important; }
                    .pbh-score-icon { width: 10px !important; height: 10px !important; }
                    /* Hide preview */
                    .pbh-preview-btn { display: none !important; }

                    /* Ensure score dropdown panel is visible and centered on mobile viewports */
                    .pbh-score-panel {
                        position: fixed;
                        top: 72px;
                        left: 16px;
                        right: 16px;
                        width: auto;
                        max-width: 340px;
                        margin: 0 auto;
                    }
                }

                /* Mobile center branding row — disabled (we keep center inline) */
                .pbh-center-mobile {
                    display: none !important;
                }
            `}</style>

            {/* ── Floating wrapper ────────────────────────────── */}
            <div className="pbh-wrapper">
                <motion.div
                    id="pb-builder-header"
                    className="pbh-bar"
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* ══ LEFT ══════════════════════════════════ */}
                    <div className="pbh-left" style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                        {/* Back button */}
                        <button
                            className="pbh-back"
                            onClick={() => navigate('/portfolio')}
                            title="Back to Dashboard"
                            aria-label="Back to Portfolio Dashboard"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {/* Avatar */}
                        <div className="pbh-avatar-wrap" style={{ position: 'relative', flexShrink: 0 }}>
                            <div className="pbh-avatar-ring" />
                            <img
                                src={avatarSrc}
                                alt={displayName}
                                className="pbh-avatar"
                                style={{ position: 'relative', zIndex: 1 }}
                            />
                        </div>

                        {/* Name + subtitle */}
                        <div className="pbh-user-info">
                            <div className="pbh-name-row">
                                <span className="pbh-name">{displayName}</span>
                                <span className="pbh-verify-dot" title="Verified" />
                            </div>
                            <div className="pbh-sub-row" onClick={handleOpenPreview} title="Open Preview">
                                <span>View your projects</span>
                                <ChevronRight size={13} />
                            </div>
                        </div>
                    </div>

                    {/* ── Left divider ── */}
                    <div className="pbh-divider" />

                    {/* ══ CENTER ════════════════════════════════ */}
                    <div className="pbh-center">
                        <span className="pbh-center-label">Portfolio Website</span>
                        <span className="pbh-center-title">Builder</span>
                    </div>

                    {/* ── Right divider ── */}
                    <div className="pbh-divider" />

                    {/* ══ RIGHT ═════════════════════════════════ */}
                    <div className="pbh-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

                        {/* Preview ghost button (desktop) */}
                        <button
                            className="pbh-preview-btn hidden sm:flex"
                            onClick={handleOpenPreview}
                            title="Open full preview"
                        >
                            <ExternalLink size={13} />
                            <span>Preview</span>
                        </button>

                        {/* ── Score analytics card ── */}
                        <div style={{ position: 'relative' }} ref={scoreRef}>
                            <button
                                className="pbh-score-card"
                                onClick={() => setIsScoreOpen(!isScoreOpen)}
                                aria-label={`Portfolio score: ${score}%`}
                                aria-expanded={isScoreOpen}
                            >
                                <div className="pbh-score-top">
                                    {getScoreIcon()}
                                    <span
                                        className="pbh-score-value"
                                        style={{ color: getScoreColor() }}
                                    >
                                        {score}%
                                    </span>
                                </div>
                                <span className="pbh-score-label">Performance</span>
                            </button>

                            {/* Score dropdown — original logic, restyled shell */}
                            <AnimatePresence>
                                {isScoreOpen && (
                                    <>
                                        {/* Backdrop */}
                                        <div
                                            style={{
                                                position: 'fixed', inset: 0, zIndex: 999,
                                                background: 'rgba(0,0,0,0.4)',
                                                backdropFilter: 'blur(2px)',
                                                cursor: 'default',
                                            }}
                                            onClick={(e) => { e.stopPropagation(); setIsScoreOpen(false); }}
                                            onMouseMove={(e) => { e.stopPropagation(); }}
                                        />
                                        <motion.div
                                            className="pbh-score-panel"
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                background: isDark ? '#0f172a' : '#ffffff',
                                                border: isDark
                                                    ? '1px solid rgba(255,255,255,0.1)'
                                                    : '1px solid rgba(0,0,0,0.08)',
                                                boxShadow: isDark
                                                    ? '0 10px 40px rgba(0,0,0,0.6)'
                                                    : '0 10px 40px rgba(0,0,0,0.1)',
                                            }}
                                        >
                                            {/* Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? '#fff' : '#0f172a', margin: 0 }}>
                                                    Portfolio Score
                                                </h3>
                                                <button
                                                    onClick={() => setIsScoreOpen(false)}
                                                    style={{ background: 'none', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer' }}
                                                    aria-label="Close score panel"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>

                                            {/* Score summary */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getScoreColor(), lineHeight: 1 }}>
                                                    {score}%
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.4 }}>
                                                    {score >= 90
                                                        ? 'Excellent! Your portfolio is complete and ready.'
                                                        : score >= 75
                                                            ? 'Looking good, but there is room for improvement.'
                                                            : 'Your portfolio needs more details to stand out.'}
                                                </div>
                                            </div>

                                            {/* Missing items */}
                                            {missing.length > 0 && (
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Improvement Suggestions
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        {missing.map((item, idx) => (
                                                            <div
                                                                key={idx}
                                                                style={{
                                                                    display: 'flex', alignItems: 'flex-start', gap: 8,
                                                                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                                    padding: 10, borderRadius: 8,
                                                                }}
                                                            >
                                                                <AlertCircle size={11} color="#facc15" style={{ marginTop: 2, flexShrink: 0 }} />
                                                                <div>
                                                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 2 }}>
                                                                        {item.label}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                                                        {item.suggestion}
                                                                    </div>
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

                        {/* ── Download button ── */}
                        <motion.button
                            className="pbh-download-btn"
                            onClick={() => downloadPortfolioZip(state)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.94 }}
                            aria-label="Download portfolio ZIP"
                            title="Download portfolio"
                        >
                            <Download size={20} strokeWidth={2.2} className="pbh-dl-icon" />
                            <span className="pbh-download-label">Download</span>
                        </motion.button>
                    </div>

                    {/* ══ MOBILE CENTER ROW ════════════════════ */}
                    <div className="pbh-center-mobile">
                        <span className="pbh-center-label">Portfolio Website</span>
                        <span className="pbh-center-title">Builder</span>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default BuilderHeader;
