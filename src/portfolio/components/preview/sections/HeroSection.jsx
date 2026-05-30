import React from 'react';
import { usePortfolio } from '../../../context/PortfolioContext';
import { Github, Linkedin, Twitter, Globe, ArrowRight, Terminal } from 'lucide-react';

const SocialIcon = ({ href, icon, accent, isNeoBrutal }) => {
    if (!href) return null;
    const url = href.startsWith('http') ? href : `https://${href}`;
    return (
        <a href={url} target="_blank" rel="noopener noreferrer"
            style={{
                width: 44, height: 44, borderRadius: isNeoBrutal ? 0 : '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isNeoBrutal ? '#fff' : 'rgba(255,255,255,0.06)',
                border: isNeoBrutal ? '2px solid #000' : '1px solid rgba(255,255,255,0.12)',
                color: isNeoBrutal ? '#000' : 'rgba(255,255,255,0.7)',
                boxShadow: isNeoBrutal ? `2px 2px 0 ${accent}` : 'none',
                transition: 'all 0.25s', textDecoration: 'none',
            }}
            onMouseEnter={e => { 
                if (isNeoBrutal) {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                    e.currentTarget.style.boxShadow = `4px 4px 0 ${accent}`;
                } else {
                    e.currentTarget.style.background = `${accent}22`; 
                    e.currentTarget.style.borderColor = accent; 
                    e.currentTarget.style.color = accent; 
                }
            }}
            onMouseLeave={e => { 
                if (isNeoBrutal) {
                    e.currentTarget.style.transform = 'translate(0, 0)';
                    e.currentTarget.style.boxShadow = `2px 2px 0 ${accent}`;
                } else {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; 
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; 
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; 
                }
            }}
        >
            {icon}
        </a>
    );
};

const HeroSection = ({ section, variant }) => {
    const { state } = usePortfolio();
    const { fullName, headline, bio, avatarUrl, socialLinks } = state.personalInfo;
    const accent = state.theme.colors.accent;
    const isNeoBrutal = state.theme.id === 'neo-brutal';
    
    // Layout modes
    const isLeftAligned = ['glass-ai', 'glass-startup', 'neo-designer', 'neo-agency', 'neo-hacker'].includes(variant);
    const isMassiveType = variant === 'neo-designer';
    const isHacker = variant === 'neo-hacker';
    const isAI = variant === 'glass-ai';

    return (
        <section id={section.id} className={`hero-section ${isLeftAligned ? 'hero-left-aligned' : 'hero-centered'}`} style={{
            position: 'relative',
            padding: variant === 'glass-minimal' ? 'clamp(80px, 12cqw, 150px) 0' : 'clamp(40px, 6cqw, 80px) 0',
            overflow: 'hidden',
            minHeight: '80vh'
        }}>
            <style>{`
                .hero-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    gap: 40px;
                }
                .hero-content {
                    max-width: 900px;
                    width: 100%;
                    padding: 0 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .hero-bio {
                    margin: 0 auto 40px;
                }
                .hero-actions {
                    justify-content: center;
                }
                
                @container (min-width: 900px) {
                    .hero-section.hero-left-aligned {
                        flex-direction: row;
                        justify-content: space-between;
                        text-align: left;
                        gap: 60px;
                    }
                    .hero-section.hero-left-aligned .hero-content {
                        max-width: 700px;
                        align-items: flex-start;
                        text-align: left;
                    }
                    .hero-section.hero-left-aligned .hero-bio {
                        margin: 0 0 40px 0;
                    }
                    .hero-section.hero-left-aligned .hero-actions {
                        justify-content: flex-start;
                    }
                }
            `}</style>

            {/* Ambient blob for Glass themes */}
            {!isNeoBrutal && (
                <div style={{
                    position: 'absolute', 
                    top: isLeftAligned ? '10%' : '-20%', 
                    left: isLeftAligned ? '80%' : '50%', 
                    transform: 'translateX(-50%)',
                    width: isAI ? 800 : 600, height: isAI ? 800 : 600, 
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
                    pointerEvents: 'none', zIndex: 0
                }} />
            )}

            <div className="gs_reveal gs_reveal_up hero-content" style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                
                {/* Hacker Terminal Header */}
                {isHacker && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1e1e1e', padding: '6px 12px', border: '2px solid #000', marginBottom: 20, color: '#4ade80', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        <Terminal size={14} /> guest@portfolio:~$ ./start.sh
                    </div>
                )}

                {/* Avatar (if centered) */}
                {avatarUrl && !isLeftAligned && (
                    <div className="gs_reveal" style={{ display: 'flex', justifyContent: 'center' }}>
                        <img
                            src={avatarUrl}
                            alt={fullName}
                            style={{
                                width: variant === 'neo-creator' ? 160 : 120, 
                                height: variant === 'neo-creator' ? 160 : 120, 
                                borderRadius: isNeoBrutal ? 0 : '50%',
                                objectFit: 'cover', margin: '0 auto 32px',
                                display: 'block',
                                border: isNeoBrutal ? `4px solid #fff` : `3px solid ${accent}`,
                                boxShadow: isNeoBrutal ? `8px 8px 0 ${accent}` : `0 0 40px ${accent}40`
                            }}
                        />
                    </div>
                )}

                {/* Name */}
                <h1 style={{
                    fontSize: isMassiveType ? 'clamp(3.5rem, 8cqw, 6.5rem)' : 'clamp(2.2rem, 5cqw, 4rem)',
                    fontWeight: 900,
                    lineHeight: isMassiveType ? 1 : 1.1,
                    marginBottom: '1.2rem',
                    letterSpacing: isNeoBrutal ? '-0.04em' : '-0.03em',
                    color: isHacker ? '#4ade80' : 'var(--theme-text)',
                    fontFamily: isHacker ? 'monospace' : 'inherit',
                    ...(isNeoBrutal && !isHacker && { textTransform: 'uppercase', textShadow: `4px 4px 0 ${accent}` })
                }}>
                    {fullName || 'Your Name'}<span style={{ color: isHacker ? '#fff' : accent }}>.</span>
                </h1>

                {/* Headline */}
                <p style={{
                    fontSize: isMassiveType ? 'clamp(1.1rem, 2.5cqw, 1.4rem)' : 'clamp(0.9rem, 2cqw, 1.1rem)', 
                    fontWeight: 600,
                    color: isHacker ? '#fff' : accent,
                    marginBottom: 24,
                    letterSpacing: isNeoBrutal ? '0.05em' : '0.02em',
                    textTransform: isNeoBrutal && !isHacker ? 'uppercase' : 'none',
                    fontFamily: isHacker ? 'monospace' : 'inherit',
                    ...(isNeoBrutal && !isHacker && { background: accent, color: '#000', display: 'inline-block', padding: '6px 16px', border: '2px solid #000' })
                }}>
                    {headline || 'Creative Developer'}
                </p>

                {/* Bio */}
                <p className="hero-bio" style={{
                    fontSize: variant === 'glass-minimal' ? '1.1rem' : 'clamp(0.85rem, 1.6cqw, 1rem)', 
                    lineHeight: 1.8,
                    color: isHacker ? '#a3a3a3' : 'var(--theme-text)',
                    opacity: isHacker ? 1 : 0.7,
                    fontFamily: isHacker ? 'monospace' : 'inherit',
                    maxWidth: 800
                }}>
                    {isHacker ? `> ${bio || 'Building impactful digital experiences.'}` : (bio || 'Building impactful digital experiences.')}
                </p>

                {/* Buttons & Socials */}
                <div className="hero-actions" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24, flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <a href="#sec-projects" className="primary-btn" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: variant === 'glass-startup' ? '16px 32px' : '12px 28px', 
                            borderRadius: isNeoBrutal ? 0 : 8,
                            background: isHacker ? '#4ade80' : accent, 
                            color: isHacker ? '#000' : '#fff', 
                            fontWeight: 800, textDecoration: 'none',
                            textTransform: isNeoBrutal ? 'uppercase' : 'none',
                            fontFamily: isHacker ? 'monospace' : 'inherit',
                            transition: 'all 0.25s'
                        }}>
                            View Work <ArrowRight size={18} />
                        </a>
                    </div>
                    
                    {socialLinks && (
                        <div style={{ display: 'flex', gap: 12 }}>
                            <SocialIcon href={socialLinks.github} icon={<Github size={20} />} accent={accent} isNeoBrutal={isNeoBrutal} />
                            <SocialIcon href={socialLinks.linkedin} icon={<Linkedin size={20} />} accent={accent} isNeoBrutal={isNeoBrutal} />
                            <SocialIcon href={socialLinks.twitter} icon={<Twitter size={20} />} accent={accent} isNeoBrutal={isNeoBrutal} />
                            <SocialIcon href={socialLinks.website} icon={<Globe size={20} />} accent={accent} isNeoBrutal={isNeoBrutal} />
                        </div>
                    )}
                </div>
            </div>

            {/* Avatar (if left-aligned) */}
            {avatarUrl && isLeftAligned && (
                <div className="gs_reveal gs_reveal_left" style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        position: 'absolute', top: -20, left: -20, right: -20, bottom: -20,
                        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, zIndex: -1
                    }} />
                    <img
                        src={avatarUrl}
                        alt={fullName}
                        style={{
                            width: 'clamp(250px, 30cqw, 400px)', height: 'clamp(250px, 30cqw, 400px)', 
                            borderRadius: isNeoBrutal ? 0 : '10%',
                            objectFit: 'cover',
                            border: isNeoBrutal ? `6px solid #fff` : `4px solid ${accent}`,
                            boxShadow: isNeoBrutal ? `12px 12px 0 ${accent}` : `0 0 60px ${accent}50`
                        }}
                    />
                </div>
            )}
        </section>
    );
};

export default HeroSection;
