import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Compass, BookOpen, Briefcase, FileText, Sparkles, LogOut, Sun, Moon } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Header = () => {
    const { lang, setLang, t, logout, user, theme, toggleTheme } = useUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('daksh_welcomed');
        logout();
        navigate('/login');
    };

    const navLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: t('Dashboard', 'डैशबोर्ड') },
        { to: '/analyzer', icon: <Compass size={18} />, label: t('Skill Gap', 'कौशल अंतर') },
        { to: '/learning', icon: <BookOpen size={18} />, label: t('Learning Path', 'सीखने का मार्ग') },
        { to: '/portfolio', icon: <Briefcase size={18} />, label: t('Portfolio', 'पोर्टफोलियो') },
        { to: '/resume-builder', icon: <FileText size={18} />, label: t('Resume Maker', 'रेज़्यूमे मेकर') }
    ];

    return (
        <header className="app-header">
            {/* Left Box: Logo */}
            <div className="logo-container">
                <Sparkles size={24} color="#10B981" />
                <span className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>Daksh.AI</span>
            </div>

            {/* Center Box: Navigation Links */}
            <nav className="hidden lg:flex items-center justify-center flex-1" style={{ gap: '10px' }}>
                {navLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => `top-nav-item nav-magnetic ${isActive ? 'active' : ''}`}
                    >
                        {link.icon}
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Right Box: Settings */}
            <div className="settings-container">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full transition-colors"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={20} color="var(--text-dark)" /> : <Moon size={20} color="var(--primary-blue)" />}
                </button>

                <div className="lang-toggle hidden lg:flex">
                    <button
                        className={`lang-option ${lang === 'en' ? 'active' : ''}`}
                        onClick={() => setLang('en')}
                    >
                        EN
                    </button>
                    <button
                        className={`lang-option ${lang === 'hi' ? 'active' : ''}`}
                        onClick={() => setLang('hi')}
                    >
                        HI
                    </button>
                </div>

                <button
                    onClick={handleLogout}
                    className="btn btn-outline flex items-center gap-2"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                    <LogOut size={16} /> <span className="hidden xl:inline">{t('Logout', 'लॉग आउट')}</span>
                </button>
            </div>
        </header>
    );
};

const BottomNav = () => {
    const { t } = useUser();
    const navLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: t('Home', 'होम') },
        { to: '/analyzer', icon: <Compass size={20} />, label: t('Gap', 'अंतर') },
        { to: '/learning', icon: <BookOpen size={20} />, label: t('Learn', 'सीखें') },
        { to: '/portfolio', icon: <Briefcase size={20} />, label: t('Profile', 'प्रोफ़ाइल') },
        { to: '/resume-builder', icon: <FileText size={20} />, label: t('Resume', 'रेज़्यूमे') }
    ];

    return (
        <nav className="bottom-nav shadow">
            {navLinks.map((link) => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
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
    return (
        <div className="app-layout" style={{ display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', margin: 0 }}>
                <div className="page-container" style={{ margin: '0 auto', maxWidth: '1200px', width: '100%' }}>
                    {children}
                </div>
                <Footer />
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
