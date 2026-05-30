import React from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Compass, BookOpen, Briefcase, FileText, Sparkles, LogOut, Sun, Moon, MessageSquare, Lightbulb, Github, Linkedin, Trash2, ChevronDown, ChevronUp, Edit2, Vibrate } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { haptic } from '../lib/haptics';
import { usePerformanceScale } from '../hooks/usePerformanceScale';

const Header = () => {
    const { logout, user, theme, toggleTheme, tiltEnabled, toggleTilt } = useUser();
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
                <Sparkles size={26} color="#10B981" />
                <span className="text-xl font-bold ml-2" style={{ color: 'var(--text-dark)' }}>Daksh.AI</span>
            </div>

            {/* Center Box: Navigation Links */}
            <nav className="hidden lg:flex items-center justify-center" style={{ gap: '6px' }}>
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

            {/* Right Box: Theme Toggle + Profile Dropdown */}
            <div className="settings-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 0 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                {/* Theme Toggle — inline in navbar */}
                <button
                    id="theme-toggle-btn"
                    onClick={() => { haptic.light(); toggleTheme(); }}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    style={{
                        width: '38px', height: '38px',
                        borderRadius: '50%',
                        border: '1px solid var(--border-color)',
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(8px)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        color: theme === 'dark' ? '#f59e0b' : '#6366f1',
                        flexShrink: 0,
                    }}
                    className="theme-toggle-btn"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Profile Avatar */}
                <button
                    onClick={() => {
                        haptic.light();
                        setIsProfileOpen(!isProfileOpen);
                    }}
                    className="flex items-center gap-2 p-1 rounded-full transition-all border border-transparent hover:border-[var(--border-color)]"
                    style={{ background: 'transparent', cursor: 'pointer', position: 'relative' }}
                >
                    <div className="w-9 h-9 md:w-10 md:h-10" style={{ borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-blue)', background: 'var(--bg-light)' }}>
                        <img
                            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                </button>

                {isProfileOpen && (
                    <div className="profile-dropdown-menu fade-in" style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '12px',
                        width: '300px',
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(32px)',
                        borderRadius: '24px',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                        zIndex: 1000,
                        padding: '1.5rem',
                        animation: 'reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        maxHeight: '85vh',
                        overflowY: 'auto'
                    }}>
                        {/* Section: Profile */}
                        <div style={{ marginBottom: '0.75rem' }}>
                            <button 
                                onClick={() => { haptic.light(); setExpandedSection(expandedSection === 'profile' ? null : 'profile'); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', padding: '0.5rem 0', cursor: 'pointer' }}
                            >
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={14} /> Profile
                                </div>
                                <div style={{ color: 'var(--text-muted)' }}>
                                    {expandedSection === 'profile' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </button>
                            
                            {expandedSection === 'profile' && (
                                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-light)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', color: 'var(--text-dark)', fontSize: '1rem' }}>{user?.name || 'Student'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{user?.email || 'user@example.com'}</div>
                                    </div>
                                    
                                    {user?.bio && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', lineHeight: '1.5', padding: '8px', background: 'var(--glass-bg)', borderRadius: '10px', fontStyle: 'italic' }}>
                                            "{user.bio.substring(0, 80)}{user.bio.length > 80 ? '...' : ''}"
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <a href={user?.github || '#'} target="_blank" rel="noreferrer" style={{ color: user?.github ? '#24292e' : '#cbd5e1', transition: 'transform 0.2s', display: 'flex', alignItems: 'center' }}>
                                                <Github size={18} />
                                            </a>
                                            <a href={user?.linkedin || '#'} target="_blank" rel="noreferrer" style={{ color: user?.linkedin ? '#0077b5' : '#cbd5e1', transition: 'transform 0.2s', display: 'flex', alignItems: 'center' }}>
                                                <Linkedin size={18} />
                                            </a>
                                        </div>
                                        <button 
                                            onClick={() => { 
                                                haptic.light(); 
                                                setLocalLinks({ 
                                                    github: user?.github || '', 
                                                    linkedin: user?.linkedin || '' 
                                                });
                                                setIsEditingSocialLinks(!isEditingSocialLinks); 
                                            }}
                                            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                                            title="Edit Social Links"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>

                                    {isEditingSocialLinks && (
                                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', padding: '10px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--primary-blue)' }}>
                                            <div style={{ position: 'relative' }}>
                                                <Github size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Github URL"
                                                    value={localLinks.github}
                                                    onChange={(e) => setLocalLinks({ ...localLinks, github: e.target.value })}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    style={{ width: '100%', padding: '8px 8px 8px 28px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem', outline: 'none', background: 'var(--bg-light)', color: 'var(--text-dark)', cursor: 'text' }}
                                                />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <Linkedin size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#0077b5' }} />
                                                <input 
                                                    type="text" 
                                                    placeholder="LinkedIn URL"
                                                    value={localLinks.linkedin}
                                                    onChange={(e) => setLocalLinks({ ...localLinks, linkedin: e.target.value })}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    style={{ width: '100%', padding: '8px 8px 8px 28px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem', outline: 'none', background: 'var(--bg-light)', color: 'var(--text-dark)', cursor: 'text' }}
                                                />
                                            </div>
                                            <button 
                                                onClick={() => { 
                                                    haptic.medium(); 
                                                    setUser({ ...user, ...localLinks });
                                                    setIsEditingSocialLinks(false); 
                                                }}
                                                style={{ padding: '10px', borderRadius: '12px', background: 'var(--primary-blue)', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', marginTop: '4px' }}
                                                className="hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Save Links
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Section: Setting */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <button 
                                onClick={() => { haptic.light(); setExpandedSection(expandedSection === 'setting' ? null : 'setting'); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', padding: '0.5rem 0', cursor: 'pointer' }}
                            >
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sparkles size={14} /> Setting
                                </div>
                                <div style={{ color: 'var(--text-muted)' }}>
                                    {expandedSection === 'setting' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </button>

                            {expandedSection === 'setting' && (
                                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                                    {/* Language */}
                                    <div style={{ background: 'var(--bg-light)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Select Language</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                            {[
                                                { label: 'English', code: 'en' },
                                                { label: 'Hindi', code: 'hi' },
                                                { label: 'Tamil', code: 'ta' },
                                                { label: 'Kannada', code: 'kn' }
                                            ].map(lang => (
                                                <button 
                                                    key={lang.code}
                                                    onClick={() => changeLanguage(lang.code)}
                                                    style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-dark)' }}
                                                >
                                                    {lang.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Theme, 3D & Cache Row */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => { haptic.light(); toggleTheme(); }}
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '16px', background: 'var(--bg-light)', border: '1px solid var(--border-color)', color: 'var(--text-dark)', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                                            >
                                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                                                {theme === 'dark' ? 'Light' : 'Dark'}
                                            </button>
                                            <button 
                                                onClick={() => { haptic.light(); toggleTilt(); }}
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '16px', background: tiltEnabled ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-light)', border: '1px solid ' + (tiltEnabled ? 'var(--primary-blue)' : 'var(--border-color)'), color: tiltEnabled ? 'var(--primary-blue)' : 'var(--text-dark)', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                            >
                                                <Sparkles size={16} />
                                                3D {tiltEnabled ? 'ON' : 'OFF'}
                                            </button>
                                        </div>
                                        <button 
                                            onClick={handleClearCache}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '16px', background: 'var(--bg-light)', border: '1px solid var(--border-color)', color: '#ef4444', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                            Clear Cache
                                        </button>
                                    </div>

                                    {/* Mobile Only: Haptics Toggle */}
                                    <div className="md:hidden" style={{ display: 'flex' }}>
                                        <button 
                                            onClick={toggleHaptics}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '16px', background: hapticsOn ? 'var(--primary-blue)' : 'var(--bg-light)', border: '1px solid var(--border-color)', color: hapticsOn ? 'white' : 'var(--text-dark)', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            <Vibrate size={16} />
                                            Haptics {hapticsOn ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Logout Actions */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <button 
                                onClick={() => { haptic.error(); logout(); navigate('/login'); setIsProfileOpen(false); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                className="hover:bg-red-500 hover:text-white"
                            >
                                <LogOut size={18} /> Logout Session
                            </button>
                        </div>
                    </div>
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

    return (
        <nav className="bottom-nav shadow">
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

const Layout = ({ children }) => {
    const { pathname } = useLocation();
    const isBuilder = pathname.includes('/portfolio/builder');
    
    usePerformanceScale(); // Auto-activates [data-perf-scale] on root

    return (
        <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Header />
            <main className="main-content" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                width: '100%', 
                margin: 0,
                overflow: isBuilder ? 'hidden' : 'auto' 
            }}>
                {isBuilder ? (
                    children
                ) : (
                    <>
                        <div className="page-container">
                            {children}
                        </div>
                        <Footer />
                    </>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
