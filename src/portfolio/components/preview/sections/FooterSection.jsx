import React from 'react';
import { usePortfolio } from '../../../context/PortfolioContext';

const FooterSection = () => {
    const { state } = usePortfolio();
    const { personalInfo, theme, sections, socialLinks } = state;
    const year = new Date().getFullYear();

    const activeSections = sections.filter(sec => sec.visible);

    return (
        <footer className="w-full border-t border-white/10 mt-16 md:mt-24 pt-12 px-6 lg:px-12 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
            <div className="w-full flex flex-col items-center justify-center text-center" style={{ maxWidth: 1100, margin: '0 auto' }}>
                <div className="flex flex-col items-center gap-8 mb-10 w-full">
                    
                    {/* Brand / Logo */}
                    <div className="flex flex-col items-center group">
                        <div className="text-3xl md:text-4xl font-extrabold uppercase tracking-tighter mb-2 transition-transform group-hover:scale-105" style={{ color: theme.colors.text }}>
                            {(personalInfo.fullName || 'User').split(' ')[0]}<span style={{ color: theme.colors.accent }}>.</span>
                        </div>
                        <p className="text-sm font-medium opacity-60 max-w-xs" style={{ color: theme.colors.text }}>
                            Building digital experiences with modern web technologies.
                        </p>
                    </div>

                    {/* Socials */}
                    {socialLinks && Object.values(socialLinks).some(val => val) && (
                        <div className="flex flex-col items-center">
                            <h4 className="text-sm font-bold uppercase tracking-widest opacity-40 mb-4" style={{ color: theme.colors.text }}>Connect</h4>
                            <div className="flex flex-wrap justify-center gap-5">
                                {socialLinks.github && <a href={socialLinks.github} target="_blank" rel="noreferrer" className="text-sm font-bold transition-all hover:-translate-y-1" style={{ color: theme.colors.accent }}>GitHub</a>}
                                {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-sm font-bold transition-all hover:-translate-y-1" style={{ color: theme.colors.accent }}>LinkedIn</a>}
                                {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="text-sm font-bold transition-all hover:-translate-y-1" style={{ color: theme.colors.accent }}>Twitter</a>}
                                {socialLinks.website && <a href={socialLinks.website} target="_blank" rel="noreferrer" className="text-sm font-bold transition-all hover:-translate-y-1" style={{ color: theme.colors.accent }}>Website</a>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col items-center pt-8 border-t border-white/5 gap-4 w-full">
                    <div className="text-xs font-medium opacity-50 text-center" style={{ color: theme.colors.text }}>
                        &copy; {year} {personalInfo.fullName}. All rights reserved.
                    </div>
                    <div className="text-xs font-medium opacity-50 text-center" style={{ color: theme.colors.text }}>
                        Designed & Built with passion.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default FooterSection;
