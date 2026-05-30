import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { usePortfolio } from '../../../context/PortfolioContext';

const NavbarSection = ({ visibleSections, variant }) => {
    const { state } = usePortfolio();
    const { personalInfo, sections, theme } = state;
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const sectionsSource = visibleSections || sections;
    const navLinks = sectionsSource
        .filter(s => s.visible && s.id !== 'sec-hero')
        .map(s => ({ name: s.title, href: `#${s.id}` }));

    const isNeoBrutal = theme.id === 'neo-brutal';
    const isHacker = variant === 'neo-hacker';

    // Theme specific styles
    const navWrapperStyle = {
        position: 'sticky', 
        top: 0, left: 0, right: 0, 
        zIndex: 100,
        display: 'flex', justifyContent: 'center',
        padding: isNeoBrutal ? '0' : (scrolled ? '12px 24px' : '24px'),
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    };

    const navInnerStyle = {
        background: scrolled 
            ? (isNeoBrutal ? theme.colors.primary : `color-mix(in srgb, ${theme.colors.primary} 75%, transparent)`)
            : 'transparent',
        backdropFilter: scrolled && !isNeoBrutal ? `blur(${theme.layout?.glassBlur || '24px'}) saturate(200%)` : 'none',
        border: scrolled && isNeoBrutal ? `3px solid #000` : 
               scrolled ? `1px solid color-mix(in srgb, ${theme.colors.text} 8%, transparent)` : '1px solid transparent',
        borderBottom: isNeoBrutal && !scrolled ? `3px solid #000` : undefined,
        boxShadow: scrolled && isNeoBrutal ? `6px 6px 0 ${theme.colors.accent}` : 
                   (scrolled && !isNeoBrutal ? `0 10px 30px -10px color-mix(in srgb, ${theme.colors.text} 15%, transparent)` : 'none'),
        borderRadius: isNeoBrutal ? 0 : (scrolled ? 100 : 0),
        width: isNeoBrutal ? '100%' : (scrolled ? 'max-content' : '100%'),
        maxWidth: '1400px',
        padding: isNeoBrutal ? '20px 40px' : (scrolled ? '12px 32px' : '0 16px'),
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 60,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: isHacker ? 'monospace' : 'inherit'
    };

    return (
        <nav className="gs_reveal" style={navWrapperStyle}>
            <div style={navInnerStyle}>
                
                {/* Logo/Name */}
                <a 
                    href="#sec-hero"
                    style={{ 
                        fontSize: '1.25rem', fontWeight: 900, color: isHacker ? '#4ade80' : theme.colors.text, 
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
                        transition: 'transform 0.2s', textTransform: isNeoBrutal ? 'uppercase' : 'none',
                        letterSpacing: isNeoBrutal ? '0.05em' : '0'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {personalInfo?.avatarUrl && (
                        <img src={personalInfo.avatarUrl} alt="Logo" style={{ 
                            width: 36, height: 36, 
                            borderRadius: isNeoBrutal ? 0 : '50%', objectFit: 'cover', 
                            border: isNeoBrutal ? `2px solid #000` : 'none' 
                        }} />
                    )}
                    {personalInfo?.siteTitle || personalInfo?.fullName?.split(' ')[0] || 'Portfolio'}
                    <span style={{ color: isHacker ? '#fff' : theme.colors.accent }}>.</span>
                </a>

                <style>{`
                    .desktop-nav { display: none; }
                    .mobile-toggle { display: block; }
                    @container (min-width: 768px) {
                        .desktop-nav { display: flex !important; }
                        .mobile-toggle { display: none !important; }
                    }
                `}</style>
                {/* Desktop Links */}
                <div className="desktop-nav items-center gap-8">
                    {navLinks.map((link, i) => (
                        <a
                            key={i}
                            href={link.href}
                            style={{ 
                                color: isHacker ? '#a3a3a3' : theme.colors.text, textDecoration: 'none', 
                                fontSize: '0.9rem', fontWeight: 700, transition: 'all 0.2s',
                                textTransform: isNeoBrutal ? 'uppercase' : 'none',
                                padding: isNeoBrutal ? '8px 16px' : '8px 0',
                                border: isNeoBrutal ? '2px solid transparent' : 'none',
                                borderRadius: isNeoBrutal ? 0 : 0
                            }}
                            onMouseEnter={e => {
                                if (isNeoBrutal) {
                                    e.currentTarget.style.borderColor = '#000';
                                    e.currentTarget.style.background = theme.colors.accent;
                                    e.currentTarget.style.color = '#000';
                                } else {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.color = theme.colors.accent;
                                }
                            }}
                            onMouseLeave={e => {
                                if (isNeoBrutal) {
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = isHacker ? '#a3a3a3' : theme.colors.text;
                                } else {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.color = isHacker ? '#a3a3a3' : theme.colors.text;
                                }
                            }}
                        >
                            {link.name}
                        </a>
                    ))}
                </div>
                {/* Mobile Menu Toggle */}
                <button 
                    className="mobile-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{ background: 'none', border: 'none', color: isHacker ? '#4ade80' : theme.colors.text, cursor: 'pointer' }}
                >
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: isNeoBrutal ? '#fff' : `color-mix(in srgb, ${theme.colors.primary} 95%, transparent)`,
                    backdropFilter: 'blur(20px)',
                    borderBottom: isNeoBrutal ? '3px solid #000' : `1px solid color-mix(in srgb, ${theme.colors.text} 10%, transparent)`,
                    padding: '24px', display: 'flex', flexDirection: 'column', gap: 16,
                    fontFamily: isHacker ? 'monospace' : 'inherit'
                }}>
                    {navLinks.map((link, i) => (
                        <a
                            key={i}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            style={{ 
                                color: isNeoBrutal ? '#000' : theme.colors.text, textDecoration: 'none', 
                                fontSize: '1.2rem', fontWeight: 800, padding: '12px',
                                border: isNeoBrutal ? '2px solid #000' : 'none',
                                background: isNeoBrutal ? theme.colors.accent : 'transparent',
                                textTransform: isNeoBrutal ? 'uppercase' : 'none'
                            }}
                        >
                            {link.name}
                        </a>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default NavbarSection;
