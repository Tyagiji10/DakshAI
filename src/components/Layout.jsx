import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Compass, BookOpen, Briefcase, FileText, Sparkles, LogOut, Sun, Moon, Menu, ChevronLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Header = () => {
    const { lang, setLang, t, logout, user, theme, toggleTheme } = useUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="app-header">
            <div className="flex items-center gap-2 md:hidden text-primary">
                <Sparkles size={24} />
                <span className="text-xl">Daksh.AI</span>
            </div>
            <div className="hidden md:block text-muted text-sm font-medium">
                {t(`Welcome back, ${user.name.split(' ')[0]}! Ready to level up?`, `वापसी पर स्वागत है, ${user.name.split(' ')[0]}! क्या आप आगे बढ़ने के लिए तैयार हैं?`)}
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-1 rounded-full transition-colors"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={22} color="var(--text-dark)" /> : <Moon size={22} color="var(--primary-blue)" />}
                </button>

                <div className="lang-toggle hidden md:flex">
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
                    <LogOut size={16} /> <span className="hidden md:inline">{t('Logout', 'लॉग आउट')}</span>
                </button>
            </div>
        </header>
    );
};

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const { t } = useUser();
    const navLinks = [
        { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: t('Dashboard', 'डैशबोर्ड') },
        { to: '/analyzer', icon: <Compass size={20} />, label: t('Skill Gap', 'कौशल अंतर') },
        { to: '/learning', icon: <BookOpen size={20} />, label: t('Learning Path', 'सीखने का मार्ग') },
        { to: '/portfolio', icon: <Briefcase size={20} />, label: t('Portfolio', 'पोर्टफोलियो') },
        { to: '/resume-builder', icon: <FileText size={20} />, label: t('Resume Maker', 'रेज़्यूमे मेकर') }
    ];

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-logo">
                <div className="logo-container">
                    <Sparkles size={24} color="#10B981" />
                    <span className="logo-text">Daksh.AI</span>
                </div>
                <button
                    className="toggle-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
                >
                    {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>
            <nav className="sidebar-nav">
                {navLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        {link.icon}
                        <span className="nav-text">{link.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
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
    <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
        &copy; Copyright of this web application reserved by Daksh.AI.
    </footer>
);

const Layout = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    return (
        <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
            <main className="main-content">
                <Header />
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
