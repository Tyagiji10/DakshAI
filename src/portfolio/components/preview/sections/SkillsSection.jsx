import React from 'react';
import { usePortfolio } from '../../../context/PortfolioContext';

const SkillsSection = ({ section, variant }) => {
    const { state } = usePortfolio();
    const data = state.sectionData[section.id];
    const accent = state.theme.colors.accent;
    const isNeoBrutal = state.theme.id === 'neo-brutal';

    if (!data) return null;

    const allGroups = [
        { label: 'Technical', chips: data.technical || [] },
        { label: 'Tools & Platforms', chips: data.tools || [] },
        { label: 'Soft Skills', chips: data.soft || [] },
    ].filter(g => g.chips.length > 0);

    if (allGroups.length === 0) return null;

    // Variant Specific logic
    const isDesigner = variant === 'neo-designer';
    const isStartup = variant === 'glass-startup';
    const isHacker = variant === 'neo-hacker';
    const isMinimal = variant === 'glass-minimal';
    const isAI = variant === 'glass-ai';

    return (
        <section id={section.id} style={{ padding: 'clamp(4rem, 8cqw, 8rem) 0' }}>
            <div className="gs_reveal">
                <h2 style={{
                    fontSize: isDesigner ? 'clamp(2.5rem, 5cqw, 4rem)' : 'clamp(1.6rem, 3.2cqw, 2.4rem)', 
                    fontWeight: 900, marginBottom: 8,
                    textTransform: isNeoBrutal ? 'uppercase' : 'none',
                    letterSpacing: isNeoBrutal ? '0.05em' : '0',
                    color: isHacker ? '#4ade80' : 'var(--theme-text)',
                    fontFamily: isHacker ? 'monospace' : 'inherit',
                    textAlign: isMinimal ? 'center' : 'left'
                }}>
                    {isHacker ? '> ' : ''}{section.title}
                </h2>
                
                <div style={{ 
                    width: isDesigner ? 100 : 48, 
                    height: isDesigner ? 8 : 4, 
                    background: accent, 
                    borderRadius: 2, 
                    marginBottom: 40,
                    margin: isMinimal ? '0 auto 40px' : '0 0 40px' 
                }} />

                <div className="responsive-skills-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: isStartup ? 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' : 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                    gap: isDesigner ? 40 : 24
                }}>
                    {allGroups.map((group, gi) => (
                        <div
                            key={group.label}
                            className="skill-card gs_reveal gs_reveal_up"
                            style={{
                                padding: isStartup ? 40 : 32,
                                borderRadius: isNeoBrutal ? 0 : (isStartup ? 16 : 'var(--theme-radius)'),
                                background: isNeoBrutal ? '#fff' : (isAI ? `linear-gradient(135deg, ${accent}10, transparent)` : 'rgba(255,255,255,0.03)'),
                                border: isNeoBrutal ? '3px solid #000' : '1px solid rgba(255,255,255,0.08)',
                                boxShadow: isNeoBrutal ? `8px 8px 0 ${accent}` : 'none',
                                transition: 'transform 0.25s, box-shadow 0.25s',
                                display: 'flex', flexDirection: 'column', height: '100%',
                            }}
                            onMouseEnter={e => {
                                if (isNeoBrutal) {
                                    e.currentTarget.style.transform = 'translate(-4px, -4px)';
                                    e.currentTarget.style.boxShadow = `12px 12px 0 ${accent}`;
                                } else {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = `0 16px 40px ${accent}20`;
                                }
                            }}
                            onMouseLeave={e => {
                                if (isNeoBrutal) {
                                    e.currentTarget.style.transform = 'translate(0, 0)';
                                    e.currentTarget.style.boxShadow = `8px 8px 0 ${accent}`;
                                } else {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            <h3 style={{ 
                                fontSize: isHacker ? '1rem' : '0.65rem', 
                                fontWeight: 800, 
                                textTransform: 'uppercase', 
                                letterSpacing: '1.5px', 
                                color: isNeoBrutal ? '#000' : accent, 
                                marginBottom: 24,
                                fontFamily: isHacker ? 'monospace' : 'inherit'
                            }}>
                                {isHacker ? `# ${group.label}` : group.label}
                            </h3>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: isDesigner ? 16 : 12, marginTop: 'auto' }}>
                                {group.chips.map((skill, i) => (
                                    <span 
                                        key={i} 
                                        style={{
                                            padding: isDesigner ? '12px 24px' : '8px 16px',
                                            borderRadius: isNeoBrutal ? 0 : (isStartup ? 8 : 'calc(var(--theme-radius) / 2)'),
                                            background: isNeoBrutal ? accent : `${accent}14`,
                                            border: isNeoBrutal ? `2px solid #000` : `1px solid ${accent}30`,
                                            color: isNeoBrutal ? '#000' : 'var(--theme-text)',
                                            fontSize: isDesigner ? '1rem' : '0.75rem', 
                                            fontWeight: isNeoBrutal ? 800 : 600,
                                            opacity: isNeoBrutal ? 1 : 0.9,
                                            transition: 'all 0.2s',
                                            cursor: 'default',
                                            fontFamily: isHacker ? 'monospace' : 'inherit',
                                            boxShadow: isNeoBrutal && isDesigner ? '4px 4px 0 #000' : 'none'
                                        }}
                                        onMouseEnter={e => {
                                            if (isNeoBrutal && isDesigner) {
                                                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                                e.currentTarget.style.boxShadow = '6px 6px 0 #000';
                                            } else if (!isNeoBrutal) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.backgroundColor = `${accent}25`;
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (isNeoBrutal && isDesigner) {
                                                e.currentTarget.style.transform = 'translate(0, 0)';
                                                e.currentTarget.style.boxShadow = '4px 4px 0 #000';
                                            } else if (!isNeoBrutal) {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.backgroundColor = `${accent}14`;
                                            }
                                        }}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SkillsSection;
