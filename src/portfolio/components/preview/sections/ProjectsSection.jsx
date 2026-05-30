import React from 'react';
import { usePortfolio } from '../../../context/PortfolioContext';
import { ExternalLink, Github, ArrowRight } from 'lucide-react';

const ProjectsSection = ({ section, variant }) => {
    const { state } = usePortfolio();
    const data = state.sectionData[section.id];
    const accent = state.theme.colors.accent;
    const isNeoBrutal = state.theme.id === 'neo-brutal';

    if (!data || data.length === 0) return null;

    const getInitialLetter = (title) => (title || 'P')[0].toUpperCase();

    // Variant Specific logic
    const isDesigner = variant === 'neo-designer';
    const isStartup = variant === 'glass-startup';
    const isHacker = variant === 'neo-hacker';
    const isMinimal = variant === 'glass-minimal';

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

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isStartup ? 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' : 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', 
                    gap: isDesigner ? 40 : 28 
                }}>
                    {data.map((project, i) => (
                        <div
                            key={project.id}
                            className="project-card gs_reveal gs_reveal_up"
                            style={{
                                borderRadius: isNeoBrutal ? 0 : (isStartup ? 16 : 'var(--theme-radius)'),
                                overflow: 'hidden',
                                background: isNeoBrutal ? '#fff' : 'rgba(255,255,255,0.03)',
                                border: isNeoBrutal ? '3px solid #000' : '1px solid rgba(255,255,255,0.08)',
                                boxShadow: isNeoBrutal ? `8px 8px 0 ${accent}` : 'none',
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onMouseEnter={e => {
                                if (isNeoBrutal) {
                                    e.currentTarget.style.transform = 'translate(-4px, -4px)';
                                    e.currentTarget.style.boxShadow = `12px 12px 0 ${accent}`;
                                } else {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = `0 15px 30px ${accent}20`;
                                    e.currentTarget.style.borderColor = `${accent}50`;
                                }
                            }}
                            onMouseLeave={e => {
                                if (isNeoBrutal) {
                                    e.currentTarget.style.transform = 'translate(0, 0)';
                                    e.currentTarget.style.boxShadow = `8px 8px 0 ${accent}`;
                                } else {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                }
                            }}
                        >
                            {/* Cover image or gradient placeholder */}
                            <div style={{ 
                                height: isStartup ? 220 : 180, 
                                overflow: 'hidden', position: 'relative', 
                                background: isNeoBrutal ? '#f8fafc' : '#0d1117',
                                borderBottom: isNeoBrutal ? '3px solid #000' : 'none'
                            }}>
                                {project.image ? (
                                    <img src={project.image} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{
                                        width: '100%', height: '100%',
                                        background: isNeoBrutal ? `repeating-linear-gradient(45deg, ${accent}20, ${accent}20 10px, transparent 10px, transparent 20px)` : `linear-gradient(135deg, ${accent}25 0%, ${accent}08 100%)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <span style={{
                                            fontSize: '4rem', fontWeight: 900,
                                            color: isNeoBrutal ? '#000' : accent, opacity: isNeoBrutal ? 1 : 0.25,
                                            userSelect: 'none'
                                        }}>
                                            {getInitialLetter(project.title)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: isStartup ? 32 : 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <h3 style={{ 
                                    fontSize: isDesigner ? '1.4rem' : '1.1rem', 
                                    fontWeight: 900, marginBottom: 8, 
                                    color: isNeoBrutal ? '#000' : 'var(--theme-text)',
                                    fontFamily: isHacker ? 'monospace' : 'inherit'
                                }}>
                                    {project.title}
                                </h3>
                                
                                {project.description && (
                                    <p style={{ 
                                        fontSize: '0.85rem', lineHeight: 1.65, 
                                        opacity: isNeoBrutal ? 0.8 : 0.7, 
                                        marginBottom: 20, 
                                        color: isNeoBrutal ? '#333' : 'var(--theme-text)',
                                        flex: 1
                                    }}>
                                        {project.description}
                                    </p>
                                )}

                                {/* Tech chips */}
                                {project.technologies?.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                                        {project.technologies.map((tech, ti) => (
                                            <span key={ti} style={{
                                                fontSize: '0.7rem', fontWeight: 700,
                                                padding: '4px 12px', borderRadius: isNeoBrutal ? 0 : 99,
                                                background: isNeoBrutal ? accent : `${accent}15`,
                                                border: isNeoBrutal ? '2px solid #000' : `1px solid ${accent}30`,
                                                color: isNeoBrutal ? '#000' : accent,
                                                fontFamily: isHacker ? 'monospace' : 'inherit'
                                            }}>
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Links */}
                                {(project.link || project.github) && (
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        {project.link && (
                                            <a href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                                                target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    fontSize: '0.8rem', fontWeight: 800,
                                                    color: isNeoBrutal ? '#000' : accent, 
                                                    textDecoration: 'none',
                                                    padding: isNeoBrutal ? '8px 16px' : '8px 0', 
                                                    borderRadius: isNeoBrutal ? 0 : 8,
                                                    background: isNeoBrutal ? '#fff' : 'transparent',
                                                    border: isNeoBrutal ? '2px solid #000' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => {
                                                    if(isNeoBrutal) e.currentTarget.style.background = accent;
                                                    else e.currentTarget.style.opacity = 0.8;
                                                }}
                                                onMouseLeave={e => {
                                                    if(isNeoBrutal) e.currentTarget.style.background = '#fff';
                                                    else e.currentTarget.style.opacity = 1;
                                                }}
                                            >
                                                <ExternalLink size={16} /> Live Demo
                                            </a>
                                        )}
                                        {project.github && (
                                            <a href={project.github.startsWith('http') ? project.github : `https://${project.github}`}
                                                target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    fontSize: '0.8rem', fontWeight: 800,
                                                    color: isNeoBrutal ? '#fff' : 'var(--theme-text)', 
                                                    textDecoration: 'none',
                                                    padding: isNeoBrutal ? '8px 16px' : '8px 0', 
                                                    borderRadius: isNeoBrutal ? 0 : 8,
                                                    background: isNeoBrutal ? '#000' : 'transparent',
                                                    border: isNeoBrutal ? '2px solid #000' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => {
                                                    if(!isNeoBrutal) e.currentTarget.style.color = accent;
                                                    else e.currentTarget.style.background = '#333';
                                                }}
                                                onMouseLeave={e => {
                                                    if(!isNeoBrutal) e.currentTarget.style.color = 'var(--theme-text)';
                                                    else e.currentTarget.style.background = '#000';
                                                }}
                                            >
                                                <Github size={16} /> Source Code
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProjectsSection;
