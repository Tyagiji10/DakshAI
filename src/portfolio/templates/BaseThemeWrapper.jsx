import React from 'react';
import { usePortfolio, THEME_PRESETS } from '../context/PortfolioContext';

import HeroSection from '../components/preview/sections/HeroSection';
import SkillsSection from '../components/preview/sections/SkillsSection';
import ProjectsSection from '../components/preview/sections/ProjectsSection';
import ExperienceSection from '../components/preview/sections/ExperienceSection';
import EducationSection from '../components/preview/sections/EducationSection';
import CertificationsSection from '../components/preview/sections/CertificationsSection';
import ContactSection from '../components/preview/sections/ContactSection';
import NavbarSection from '../components/preview/sections/NavbarSection';
import FooterSection from '../components/preview/sections/FooterSection';

const SECTION_MAP = {
    'hero': HeroSection,
    'skills': SkillsSection,
    'projects': ProjectsSection,
    'experience': ExperienceSection,
    'education': EducationSection,
    'certifications': CertificationsSection,
    'contact': ContactSection
};

const GOOGLE_FONTS = {
    "'Inter', sans-serif": 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
    "'Poppins', sans-serif": 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap',
    "'Montserrat', sans-serif": 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap',
};

import { sanitizeTextColor } from '../utils/colorUtils';

const BaseThemeWrapper = () => {
    const { state } = usePortfolio();
    const themeId = state.theme.id;
    const accent = state.theme.colors.accent;
    const isNeoBrutal = themeId === 'neo-brutal';
    
    const bgType = state.theme.background?.type || 'solid';
    const bgDirection = state.theme.background?.direction || '135deg';
    const bgColors = state.theme.background?.colors || ['#0B0F19', '#1e1b4b'];
    
    const backgroundCSS = bgType === 'gradient' 
        ? `linear-gradient(${bgDirection}, ${bgColors[0]}, ${bgColors[1]})`
        : (state.theme.colors.background || '#0B0F19');

    const fontFamily = state.theme.fontFamily || "'Inter', sans-serif";
    const safeTextColor = sanitizeTextColor(state.theme.colors.text, bgType === 'solid' ? state.theme.colors.background : bgColors[0]);

    const themeStyles = {
        '--theme-primary': state.theme.colors.primary,
        '--theme-accent': accent,
        '--theme-accent-alpha': `${accent}20`,
        '--theme-text': safeTextColor,
        '--theme-radius': isNeoBrutal ? '0px' : '16px',
        '--theme-glass': `blur(${state.theme.layout?.glassBlur || '16px'})`,
        background: backgroundCSS,
        color: safeTextColor,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        fontFamily: fontFamily,
        overflowX: 'hidden',
        containerType: 'inline-size'
    };

    const variant = state.theme.variant || (isNeoBrutal ? 'neo-designer' : 'glass-ai');

    const visibleSections = state.sections.filter(sec => {
        if (!sec.visible) return false;
        if (sec.type === 'hero') return true;
        
        const data = state.sectionData[sec.id];
        if (sec.type === 'skills') {
            return data && (data.technical?.length > 0 || data.tools?.length > 0 || data.soft?.length > 0);
        }
        if (sec.type === 'experience' || sec.type === 'projects' || sec.type === 'education' || sec.type === 'certifications') {
            return data && data.length > 0;
        }
        if (sec.type === 'contact') {
            const hasContactInfo = data && (data.email?.trim() || data.phone?.trim() || data.address?.trim() || data.formspreeId?.trim());
            const hasSocial = state.personalInfo.socialLinks && Object.values(state.personalInfo.socialLinks).some(link => link?.trim());
            return hasContactInfo || hasSocial;
        }
        return true;
    });

    return (
        <>
            {/* Inject Google Font for current selection */}
            <link rel="stylesheet" href={GOOGLE_FONTS[fontFamily] || GOOGLE_FONTS["'Inter', sans-serif"]} />

            <div className={`theme-wrapper theme-${themeId} variant-${variant}`} style={themeStyles}>
                <NavbarSection visibleSections={visibleSections} variant={variant} />
                <main className="portfolio-layout-grid" style={{ flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '0 clamp(16px, 5cqw, 48px)' }}>
                    {visibleSections.map(section => {
                        const SectionComponent = SECTION_MAP[section.type];
                        return SectionComponent ? <SectionComponent key={section.id} section={section} variant={variant} /> : null;
                    })}
                </main>
                <FooterSection />

                {/* Global theme CSS */}
                <style>{`
                    :root, html, body {
                        color-scheme: light !important;
                    }
                    .portfolio-layout-grid {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: space-between;
                        gap: 2rem 4%;
                    }
                    .portfolio-layout-grid > section {
                        width: 100%;
                    }
                    @container (min-width: 1024px) {
                        .portfolio-layout-grid > #sec-experience,
                        .portfolio-layout-grid > #sec-education,
                        .portfolio-layout-grid > #sec-certifications {
                            width: 48%;
                        }
                    }
                    .responsive-skills-grid {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 32px;
                    }
                    @container (min-width: 1024px) {
                        .responsive-skills-grid {
                            grid-template-columns: 1fr 1fr;
                        }
                    }

                    .theme-neo-brutal * { font-family: ${fontFamily} !important; }
                    .theme-neo-brutal .primary-btn {
                        border: 2px solid #fff !important;
                        box-shadow: 4px 4px 0px ${accent} !important;
                        border-radius: 0 !important;
                    }
                    .theme-neo-brutal .primary-btn:active {
                        transform: translate(4px, 4px) !important;
                        box-shadow: 0 0 0 ${accent} !important;
                    }
                    .theme-neo-brutal .skill-card, .theme-neo-brutal .project-card {
                        border: 2px solid #fff !important;
                        box-shadow: 5px 5px 0 ${accent} !important;
                        border-radius: 0 !important;
                    }
                    .theme-glassmorphic * { font-family: ${fontFamily} !important; }
                    .theme-glassmorphic .skill-card, .theme-glassmorphic .project-card {
                        background: rgba(255,255,255,0.04) !important;
                        backdrop-filter: blur(16px) !important;
                        -webkit-backdrop-filter: blur(16px) !important;
                    }
                `}</style>
            </div>
        </>
    );
};

export default BaseThemeWrapper;
