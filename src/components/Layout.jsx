import React, { useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Briefcase, FileText, Sparkles, LogOut, Sun, Moon, MessageSquare, Lightbulb, Github, Linkedin, Trash2, ChevronDown, ChevronUp, Edit2, Vibrate, User, Settings, Box, Check, ChevronRight, Star } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { haptic } from '../lib/haptics';
import { usePerformanceScale } from '../hooks/usePerformanceScale';
import ThemeToggle from './ThemeToggle';

const Header = () => {
    const { logout, user, theme, toggleTheme, tiltEnabled, toggleTilt, navOpacity, setNavOpacity } = useUser();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [expandedSection, setExpandedSection] = React.useState('profile');
    const [isEditingSocialLinks, setIsEditingSocialLinks] = React.useState(false);
    const [localLinks, setLocalLinks] = React.useState({ github: '', linkedin: '' });
    const [hapticsOn, setHapticsOn] = React.useState(haptic.isEnabled());
    const dropdownRef = React.useRef(null);

    const toggleHaptics = () => {
        const newVal = !hapticsOn;
        haptic.setEnabled(newVal);
        setHapticsOn(newVal);
        if (newVal) haptic.light();
    };

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const changeLanguage = (langCode) => {
        haptic.medium();
        // Google Translate Cookie: /en/[langCode]
        document.cookie = `googtrans=/en/${langCode}; path=/`;
        // Also set for subdomains if needed
        document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
        window.location.reload();
    };

    const navLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/learning', icon: <BookOpen size={20} />, label: 'Learning Path' },
        { to: '/portfolio', icon: <Briefcase size={20} />, label: 'Portfolio' },
        { to: '/resume-builder', icon: <FileText size={20} />, label: 'Resume Maker' },
        { to: '/interview-prep', icon: <MessageSquare size={20} />, label: 'Interview' },
        { to: '/project-generator', icon: <Lightbulb size={20} />, label: 'Projects' }
    ];

    const { pathname } = useLocation();
    const currentTab = navLinks.find(link => pathname.startsWith(link.to)) || { label: 'Daksh.AI' };

    const handleClearCache = () => {
        haptic.error();
        if (window.confirm("Clear all locally cached data? This will log you out.")) {
            localStorage.clear();
            sessionStorage.clear();
            logout();
            navigate('/login');
            window.location.reload();
        }
    };

    return (
        <header className="app-header">
            {/* Left Box: Logo */}
            <div className="logo-container" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', flex: '1 0 0', display: 'flex', alignItems: 'center' }}>
                <img src="/brand/nav-logo.svg" alt="D" style={{ height: '22px', transform: 'translate(4px, -2px)' }} />
                <span className="text-xl font-bold" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px', marginLeft: '-2px' }}>aksh.AI</span>
            </div>

            {/* Center Box: Navigation Links (Desktop) & Mobile Page Title */}
            <nav className="hidden lg:flex items-center justify-center" style={{ gap: '6px', flex: '1 0 auto' }}>
                {navLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => `top-nav-item nav-magnetic ${isActive ? 'active' : ''}`}
                        onClick={() => haptic.light()}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {link.icon}
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Mobile Page Title Indicator */}
            <div className="flex lg:hidden" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 10 }}>
                <div key={currentTab.label} className="mobile-page-title" style={{ pointerEvents: 'auto' }}>
                    {currentTab.label}
                </div>
            </div>

            {/* Right Box: Theme Toggle + Profile Dropdown */}
            <div className="settings-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 0 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                {/* Theme Toggle — inline in navbar */}
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="nav-context" />

                {/* Profile Avatar */}
                <button
                    onClick={() => {
                        haptic.light();
                        setIsProfileOpen(!isProfileOpen);
                    }}
                    className="flex items-center gap-2 p-1 rounded-full transition-all border border-transparent hover:border-[var(--border-color)]"
                    style={{ background: 'transparent', cursor: 'pointer', position: 'relative' }}
                >
                    <span
                        className="hidden lg:flex"
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--text-dark)',
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'right'
                        }}
                    >
                        {user?.name?.split(' ')[0] || 'Profile'}
                    </span>
                    <div className="w-10 h-10 md:w-11 md:h-11" style={{ borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-blue)', background: 'var(--bg-light)' }}>
                        <img
                            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                </button>

                {isProfileOpen && (
                    <>
                        {/* Full Screen Blurred Backdrop via Portal */}
                        {createPortal(
                            <div
                                className="profile-backdrop fade-in"
                                onClick={() => setIsProfileOpen(false)}
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    zIndex: 49,
                                }}
                            />,
                            document.body
                        )}

                        {/* ── Premium Profile Dropdown ── */}
                        <div className="profile-dropdown-menu pdm-popup" aria-label="Profile settings panel">

                            {/* ── Hero Header ── */}
                            <div className="pdm-hero">
                                <div className="pdm-avatar-wrap">
                                    <div className="pdm-avatar-glow" />
                                    <img
                                        src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`}
                                        alt="Profile"
                                        className="pdm-avatar"
                                    />
                                    <button
                                        className="pdm-edit-avatar-btn"
                                        onClick={() => { haptic.light(); setLocalLinks({ github: user?.github || '', linkedin: user?.linkedin || '' }); setIsEditingSocialLinks(!isEditingSocialLinks); }}
                                        title="Edit social links"
                                        aria-label="Edit profile links"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                </div>
                                <div className="pdm-hero-info">
                                    <h2 className="pdm-hero-name">{user?.name || 'Student'}</h2>
                                    <p className="pdm-hero-email">{user?.email || 'user@example.com'}</p>
                                    <div className="pdm-premium-badge">
                                        <Star size={10} />
                                        <span>Premium</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Social Edit Inline ── */}
                            {isEditingSocialLinks && (
                                <div className="fade-in pdm-social-edit">
                                    <div className="pdm-social-input-wrap">
                                        <Github size={13} className="pdm-social-icon" />
                                        <input
                                            type="text"
                                            placeholder="GitHub URL"
                                            value={localLinks.github}
                                            onChange={(e) => setLocalLinks({ ...localLinks, github: e.target.value })}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            className="pdm-social-input"
                                            aria-label="GitHub URL"
                                        />
                                    </div>
                                    <div className="pdm-social-input-wrap">
                                        <Linkedin size={13} className="pdm-social-icon" style={{ color: '#0077b5' }} />
                                        <input
                                            type="text"
                                            placeholder="LinkedIn URL"
                                            value={localLinks.linkedin}
                                            onChange={(e) => setLocalLinks({ ...localLinks, linkedin: e.target.value })}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            className="pdm-social-input"
                                            aria-label="LinkedIn URL"
                                        />
                                    </div>
                                    <button
                                        onClick={() => { haptic.medium(); setUser({ ...user, ...localLinks }); setIsEditingSocialLinks(false); }}
                                        className="pdm-save-btn"
                                    >
                                        Save Links
                                    </button>
                                </div>
                            )}

                            {/* ── Nav Cards ── */}
                            <div className="pdm-nav-cards">
                                {/* Profile Card */}
                                <button
                                    id="pdm-profile-card-btn"
                                    className={`pdm-nav-card ${expandedSection === 'profile' ? 'pdm-nav-card--active' : ''}`}
                                    onClick={() => { haptic.light(); setExpandedSection(expandedSection === 'profile' ? null : 'profile'); }}
                                    aria-expanded={expandedSection === 'profile'}
                                    aria-controls="pdm-profile-panel"
                                >
                                    <div className="pdm-nav-card-icon">
                                        <User size={16} />
                                    </div>
                                    <span className="pdm-nav-card-label">Profile</span>
                                    <ChevronRight size={16} className={`pdm-nav-chevron ${expandedSection === 'profile' ? 'pdm-nav-chevron--down' : ''}`} />
                                </button>

                                {/* Profile Panel */}
                                {expandedSection === 'profile' && (
                                    <div id="pdm-profile-panel" className="pdm-expand-panel fade-in">
                                        {user?.bio && (
                                            <div className="pdm-bio-card">
                                                <p>{user.bio.substring(0, 100)}{user.bio.length > 100 ? '...' : ''}</p>
                                            </div>
                                        )}
                                        <div className="pdm-social-links">
                                            <a href={user?.github || '#'} target="_blank" rel="noreferrer" className={`pdm-social-link ${!user?.github ? 'pdm-social-link--dim' : ''}`} aria-label="GitHub profile">
                                                <Github size={16} />
                                                <span>GitHub</span>
                                            </a>
                                            <a href={user?.linkedin || '#'} target="_blank" rel="noreferrer" className={`pdm-social-link pdm-social-link--linkedin ${!user?.linkedin ? 'pdm-social-link--dim' : ''}`} aria-label="LinkedIn profile">
                                                <Linkedin size={16} />
                                                <span>LinkedIn</span>
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Settings Card */}
                                <button
                                    id="pdm-settings-card-btn"
                                    className={`pdm-nav-card ${expandedSection === 'setting' ? 'pdm-nav-card--active' : ''}`}
                                    onClick={() => { haptic.light(); setExpandedSection(expandedSection === 'setting' ? null : 'setting'); }}
                                    aria-expanded={expandedSection === 'setting'}
                                    aria-controls="pdm-settings-panel"
                                >
                                    <div className="pdm-nav-card-icon">
                                        <Settings size={16} />
                                    </div>
                                    <span className="pdm-nav-card-label">Settings</span>
                                    <ChevronRight size={16} className={`pdm-nav-chevron ${expandedSection === 'setting' ? 'pdm-nav-chevron--down' : ''}`} />
                                </button>

                                {/* Settings Panel */}
                                {expandedSection === 'setting' && (
                                    <div id="pdm-settings-panel" className="pdm-expand-panel fade-in">

                                        {/* ── Language Grid ── */}
                                        <p className="pdm-section-label">Preferred Language</p>
                                        <div className="pdm-lang-grid">
                                            {[
                                                { label: 'English', native: 'English', sub: 'Default', code: 'en' },
                                                { label: 'Hindi', native: 'हिन्दी', sub: 'Hindi', code: 'hi' },
                                                { label: 'Tamil', native: 'தமிழ்', sub: 'Tamil', code: 'ta' },
                                                { label: 'Kannada', native: 'ಕನ್ನಡ', sub: 'Kannada', code: 'kn' },
                                            ].map(lang => {
                                                const isSelected = (document.cookie.includes(`googtrans=/en/${lang.code}`) || (lang.code === 'en' && !document.cookie.includes('googtrans=/en/')));
                                                return (
                                                    <button
                                                        key={lang.code}
                                                        id={`pdm-lang-${lang.code}`}
                                                        className={`pdm-lang-card ${isSelected ? 'pdm-lang-card--selected' : ''}`}
                                                        onClick={() => changeLanguage(lang.code)}
                                                        aria-label={`Switch to ${lang.label}`}
                                                        aria-pressed={isSelected}
                                                    >
                                                        <span className="pdm-lang-native">{lang.native}</span>
                                                        <span className="pdm-lang-sub">{lang.sub}</span>
                                                        {isSelected && (
                                                            <span className="pdm-lang-check" aria-hidden="true">
                                                                <Check size={10} />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* ── Preferences Toggles ── */}
                                        <p className="pdm-section-label" style={{ marginTop: '20px' }}>Preferences</p>
                                        <div className="pdm-pref-grid">
                                            {/* Light Mode toggle */}
                                            <div
                                                className="pdm-pref-card"
                                                onClick={() => { haptic.light(); toggleTheme(); }}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { haptic.light(); toggleTheme(); } }}
                                            >
                                                <div className="pdm-pref-icon">
                                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                                </div>
                                                <div className="pdm-pref-text">
                                                    <span className="pdm-pref-title">Light Mode</span>
                                                    <span className="pdm-pref-desc">Brighter Interface</span>
                                                </div>
                                                <div
                                                    className={`pdm-toggle ${theme === 'light' ? 'pdm-toggle--on' : ''}`}
                                                    aria-hidden="true"
                                                >
                                                    <div className="pdm-toggle-thumb" />
                                                </div>
                                            </div>

                                            {/* 3D Effects toggle — hidden on mobile */}
                                            <div
                                                className="pdm-pref-card pdm-desktop-only"
                                                onClick={() => { haptic.light(); toggleTilt(); }}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`${tiltEnabled ? 'Disable' : 'Enable'} 3D effects`}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { haptic.light(); toggleTilt(); } }}
                                            >
                                                <div className="pdm-pref-icon">
                                                    <Box size={18} />
                                                </div>
                                                <div className="pdm-pref-text">
                                                    <span className="pdm-pref-title">3D Effects</span>
                                                    <span className="pdm-pref-desc">Enhanced Depth</span>
                                                </div>
                                                <div
                                                    className={`pdm-toggle ${tiltEnabled ? 'pdm-toggle--on' : ''}`}
                                                    aria-hidden="true"
                                                >
                                                    <div className="pdm-toggle-thumb" />
                                                </div>
                                            </div>

                                            {/* Haptics (mobile only) */}
                                            <div
                                                className="pdm-pref-card md:hidden"
                                                onClick={toggleHaptics}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`${hapticsOn ? 'Disable' : 'Enable'} haptics`}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleHaptics(); }}
                                            >
                                                <div className="pdm-pref-icon">
                                                    <Vibrate size={18} />
                                                </div>
                                                <div className="pdm-pref-text">
                                                    <span className="pdm-pref-title">Haptics</span>
                                                    <span className="pdm-pref-desc">Tactile Feedback</span>
                                                </div>
                                                <div
                                                    className={`pdm-toggle ${hapticsOn ? 'pdm-toggle--on' : ''}`}
                                                    aria-hidden="true"
                                                >
                                                    <div className="pdm-toggle-thumb" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Nav Bar Transparency Slider — Mobile Only ── */}
                                        <div className="md:hidden">
                                            <p className="pdm-section-label" style={{ marginTop: '20px' }}>Nav Transparency</p>
                                            <div className="pdm-pref-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', cursor: 'default' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="pdm-pref-icon" style={{ flexShrink: 0 }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20" /></svg>
                                                    </div>
                                                    <div className="pdm-pref-text" style={{ flex: 1 }}>
                                                        <span className="pdm-pref-title">Bottom Bar Glass</span>
                                                        <span className="pdm-pref-desc">{Math.round(navOpacity * 100)}% opacity</span>
                                                    </div>
                                                </div>
                                                <input
                                                    id="nav-opacity-slider"
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.05"
                                                    value={navOpacity}
                                                    onChange={(e) => setNavOpacity(parseFloat(e.target.value))}
                                                    className="pdm-opacity-slider"
                                                    aria-label="Bottom navigation bar transparency"
                                                />
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                    <span>Transparent</span>
                                                    <span>Opaque</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Danger Zone ── */}
                            <div className="pdm-danger-zone">
                                <button
                                    id="pdm-clear-cache-btn"
                                    className="pdm-danger-card"
                                    onClick={handleClearCache}
                                    aria-label="Clear cache"
                                >
                                    <div className="pdm-danger-icon">
                                        <Trash2 size={16} />
                                    </div>
                                    <div className="pdm-danger-text">
                                        <span className="pdm-danger-title">Clear Cache</span>
                                        <span className="pdm-danger-desc">Remove temporary files</span>
                                    </div>
                                    <ChevronRight size={15} className="pdm-danger-chevron" />
                                </button>

                                <button
                                    id="pdm-logout-btn"
                                    className="pdm-logout-card"
                                    onClick={() => { haptic.error(); logout(); navigate('/login'); setIsProfileOpen(false); }}
                                    aria-label="Logout"
                                >
                                    <div className="pdm-logout-icon">
                                        <LogOut size={16} />
                                    </div>
                                    <div className="pdm-danger-text">
                                        <span className="pdm-danger-title">Logout Session</span>
                                        <span className="pdm-danger-desc">Sign out from your account</span>
                                    </div>
                                    <ChevronRight size={15} className="pdm-danger-chevron" />
                                </button>
                            </div>

                        </div>
                    </>
                )}
            </div>
            <div id="google_translate_element" style={{ display: 'none' }}></div>
        </header>
    );
};

const BottomNav = () => {
    const navLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
        { to: '/learning', icon: <BookOpen size={20} />, label: 'Learn' },
        { to: '/portfolio', icon: <Briefcase size={20} />, label: 'Works' },
        { to: '/resume-builder', icon: <FileText size={20} />, label: 'Resume' },
        { to: '/interview-prep', icon: <MessageSquare size={20} />, label: 'Talk' },
        { to: '/project-generator', icon: <Lightbulb size={20} />, label: 'Ideas' }
    ];

    const { theme, navOpacity } = useUser();

    return (
        <nav className="bottom-nav">
            <div
                className="bottom-nav-pill"
                style={{
                    background: theme === 'dark'
                        ? `rgba(0,0,0,${navOpacity})`
                        : `rgba(255,255,255,${navOpacity})`
                }}
            >
                {navLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => haptic.light()}
                    >
                        {link.icon}
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

const Footer = () => (
    <footer className="app-footer">
        <div>&copy; {new Date().getFullYear()} Daksh.AI by Shaurya. All rights reserved.</div>
        <div className="footer-links">
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <span className="dot">•</span>
            <Link to="/terms" className="footer-link">Terms & Conditions</Link>
        </div>
    </footer>
);

/** Ordered route paths that map to bottom-nav tabs (must match BottomNav order) */
const BOT_NAV_ROUTES = [
    '/dashboard',
    '/learning',
    '/portfolio',
    '/resume-builder',
    '/interview-prep',
    '/project-generator',
];

const Layout = ({ children }) => {
    const { pathname } = useLocation();
    const isBuilder = pathname.includes('/portfolio/builder');
    const isInterviewPrep = pathname.includes('/interview-prep');

    usePerformanceScale(); // Auto-activates [data-perf-scale] on root

    const scrollRef = useRef(null);
    const transitionRef = useRef(null);

    // Reset scroll and trigger lightweight transition on route change
    useEffect(() => {
        const scrollEl = scrollRef.current;
        if (scrollEl) {
            scrollEl.scrollTo(0, 0);
        }

        const transitionEl = transitionRef.current;
        if (transitionEl) {
            transitionEl.classList.remove('page-transition');
            void transitionEl.offsetWidth;
            transitionEl.classList.add('page-transition');
        }
    }, [pathname]);

    return (
        <div className="app-layout">
            <Header />
            <main
                ref={scrollRef}
                className={`main-content${isBuilder ? ' main-content--locked' : ''}`}
                style={{ margin: 0, minHeight: 0 }}
            >
                <div ref={transitionRef} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%', width: '100%' }}>
                    {isBuilder || isInterviewPrep ? (
                        children
                    ) : (
                        <>
                            <div className="page-container">
                                {children}
                            </div>
                            <Footer />
                        </>
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
