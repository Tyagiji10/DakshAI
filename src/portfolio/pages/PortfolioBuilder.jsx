import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useAppTheme } from '../hooks/useAppTheme';
import BuilderHeader from '../components/builder/BuilderHeader';
import BuilderPanel from '../components/builder/BuilderPanel';
import PreviewPanel from '../components/preview/PreviewPanel';
import '../styles/portfolio-builder.css';

const PortfolioBuilderContent = () => {
    const portfolioContext = usePortfolio();
    const state = portfolioContext?.state;
    const { isDark, getContrastText } = useAppTheme();

    if (!state) return (
        <div style={{
            height: '100%', width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDark ? '#0B0F19' : '#f1f5f9',
            transition: 'background 0.3s ease'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, color: isDark ? '#fff' : '#1e293b' }}>
                    Loading Workspace...
                </p>
            </div>
        </div>
    );

    // BUILDER UI accent — fixed indigo, never changes with portfolio theme.
    // This keeps sidebar tabs, buttons, chips visually consistent regardless
    // of which portfolio theme (glassmorphic / minimalist / neo-brutal) is selected.
    const BUILDER_ACCENT = '#6366f1';
    const BUILDER_ACCENT_TEXT = '#ffffff';

    // PORTFOLIO accent — only used inside BaseThemeWrapper (the live preview).
    const portfolioAccent = state?.theme?.colors?.accent || '#6366f1';

    /*
     * Design token system — all builder UI uses these CSS variables.
     * They automatically respond to the global app dark/light mode via
     * the `data-theme` attribute set on the wrapper below.
     */
    const designTokens = {
        /* ── BUILDER UI accent — fixed indigo, app-theme only ────────
           Never changes when user picks a portfolio theme preset.
           Keeps sidebar, tabs, buttons visually consistent always. */
        '--pb-accent':            BUILDER_ACCENT,
        '--pb-accent-alpha':      'rgba(99,102,241,0.15)',
        '--pb-accent-hover':      '#818cf8',
        '--pb-accent-text':       BUILDER_ACCENT_TEXT,

        /* ── PORTFOLIO preview accent — only for BaseThemeWrapper ────
           This is what the Design tab's color picker controls.
           Only used inside the live preview frame, not the builder UI. */
        '--pb-portfolio-accent':       portfolioAccent,
        '--pb-portfolio-accent-alpha': `${portfolioAccent}22`,

        /* ── Builder UI surfaces — follow app dark/light theme ───── */
        '--pb-bg-primary':        isDark ? '#04060b'                : '#f1f5f9',
        '--pb-bg-secondary':      isDark ? '#0f1420'                : '#ffffff',
        '--pb-bg-card':           isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
        '--pb-bg-sidebar':        isDark ? '#0f1420'                : '#ffffff',
        '--pb-bg-input':          isDark ? 'rgba(0,0,0,0.3)'        : 'rgba(0,0,0,0.04)',
        '--pb-bg-toolbar':        isDark ? 'rgba(11,15,25,0.92)'    : 'rgba(255,255,255,0.92)',
        '--pb-bg-chip':           'rgba(99,102,241,0.12)',

        /* Text */
        '--pb-text-primary':      isDark ? '#f1f5f9'  : '#0f172a',
        '--pb-text-secondary':    isDark ? '#94a3b8'  : '#475569',
        '--pb-text-muted':        isDark ? '#475569'  : '#94a3b8',
        '--pb-text-label':        isDark ? '#64748b'  : '#64748b',

        /* Borders */
        '--pb-border':            isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)',
        '--pb-border-card':       isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',

        /* Shadows */
        '--pb-shadow-card':       isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
        '--pb-shadow-accent':     '0 8px 24px rgba(99,102,241,0.3)',

        /* Icons */
        '--pb-icon':              isDark ? '#4b5563' : '#9ca3af',
        '--pb-icon-hover':        isDark ? '#94a3b8' : '#374151',

        /* Status */
        '--pb-success':           '#10b981',
        '--pb-warning':           '#f59e0b',
        '--pb-danger':            '#ef4444',

        /* Transition shorthand */
        '--pb-transition': 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',

        /* ── Legacy variables — keep for any remaining old references */
        '--theme-accent':       BUILDER_ACCENT,
        '--theme-accent-alpha': 'rgba(99,102,241,0.15)',
    };

    return (
        <div
            data-theme={isDark ? 'dark' : 'light'}
            data-pb="true"
            style={{
                ...designTokens,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                background: 'var(--pb-bg-primary)',
                color: 'var(--pb-text-primary)',
                transition: 'var(--pb-transition)',
            }}
        >
            <BuilderHeader />
            <div className="portfolio-builder-layout" style={{ flex: 1 }}>
                <div className="builder-sidebar">
                    <BuilderPanel />
                </div>
                <div className="preview-main">
                    <PreviewPanel />
                </div>
            </div>
        </div>
    );
};

const PortfolioBuilder = () => <PortfolioBuilderContent />;

export default PortfolioBuilder;
