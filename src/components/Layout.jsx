import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Compass, BookOpen, Briefcase, FileText, Sparkles, LogOut, Sun, Moon, MessageSquare, Lightbulb } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { haptic } from '../lib/haptics';
import { usePerformanceScale } from '../hooks/usePerformanceScale';

const Header = () => {
    const { logout, user, theme, toggleTheme } = useUser();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

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
        { to: '/resume-builder', icon: <FileText size={20} />, label: 'Resume Maker' },
        { to: '/interview-prep', icon: <MessageSquare size={20} />, label: 'Interview' },
        { to: '/project-generator', icon: <Lightbulb size={20} />, label: 'Projects' }
    ];

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

            {/* Right Box: Profile Dropdown */}
            <div className="settings-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 0 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
                        width: '240px',
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '20px',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        padding: '1.25rem',
                        animation: 'reveal 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        {/* User Details */}
                        <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                            <div style={{ fontWeight: '800', color: 'var(--text-dark)', fontSize: '1rem', marginBottom: '2px' }}>{user?.name || 'Student'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'shiva79262@gmail.com'}</div>
                        </div>

                        {/* Visual & Experience */}
                        <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Visual & Experience</div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
                                    <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>Theme</span>
                                </div>
                                <button 
                                    onClick={() => { haptic.light(); toggleTheme(); }}
                                    style={{ border: 'none', background: 'var(--primary-blue)', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '800' }}
                                >
                                    {theme === 'dark' ? 'LIGHT' : 'DARK'}
                                </button>
                            </div>

                            {/* Haptics - Mobile Only */}
                            <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Sparkles size={18} color="#10B981" />
                                    <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>Haptics</span>
                                </div>
                                <button 
                                    onClick={() => { haptic.setEnabled(!haptic.isEnabled()); haptic.light(); navigate(0); }}
                                    style={{ border: 'none', background: haptic.isEnabled() ? '#10B981' : '#cbd5e1', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '800' }}
                                >
                                    {haptic.isEnabled() ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>

                        {/* Language */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Interface Language</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {[
                                    { label: 'English', code: 'en' },
                                    { label: 'Hindi', code: 'hi' },
                                    { label: 'Tamil', code: 'ta' },
                                    { label: 'Kannada', code: 'kn' }
                                ].map(lang => (
                                    <button 
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        style={{ padding: '8px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-light)', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-dark)' }}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
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
    <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <div>&copy; {new Date().getFullYear()} Daksh.AI by Shaurya. All rights reserved.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseOver={e => e.target.style.color = 'var(--primary-blue)'} onMouseOut={e => e.target.style.color = 'var(--text-muted)'}>Privacy Policy</Link>
            <span style={{ opacity: 0.3 }}>•</span>
            <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseOver={e => e.target.style.color = 'var(--primary-blue)'} onMouseOut={e => e.target.style.color = 'var(--text-muted)'}>Terms & Conditions</Link>
        </div>
    </footer>
);

const Layout = ({ children }) => {
    usePerformanceScale(); // Auto-activates [data-perf-scale] on root

    return (
        <div className="app-layout" style={{ display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', margin: 0 }}>
                <div className="page-container">
                    {children}
                </div>
                <Footer />
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
