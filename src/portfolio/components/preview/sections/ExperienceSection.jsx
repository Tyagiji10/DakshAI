import React from 'react';
import { usePortfolio } from '../../../context/PortfolioContext';
import { MapPin, Calendar } from 'lucide-react';

const ExperienceSection = ({ section }) => {
    const { state } = usePortfolio();
    const data = state.sectionData[section.id];
    const accent = state.theme.colors.accent;

    if (!data || data.length === 0) return null;

    return (
        <section id={section.id} style={{ padding: 'clamp(4rem, 8cqw, 8rem) 0' }}>
            <div className="gs_reveal">
                <h2 style={{
                    fontSize: 'clamp(1.6rem, 3.2cqw, 2.4rem)', fontWeight: 900, marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--theme-text)'
                }}>
                    {section.title}
                </h2>
                <div style={{ width: 48, height: 4, background: accent, borderRadius: 2, marginBottom: 48 }} />

                {/* Timeline */}
                <div style={{ position: 'relative', paddingLeft: 40 }}>
                    {/* Vertical line */}
                    <div style={{
                        position: 'absolute', left: 10, top: 0, bottom: 0,
                        width: 2, background: `linear-gradient(to bottom, ${accent} 0%, transparent 100%)`
                    }} />

                    {data.map((exp, i) => (
                        <div
                            key={exp.id}
                            className="gs_reveal gs_reveal_left"
                            style={{ position: 'relative', marginBottom: 40 }}
                        >
                            {/* Timeline dot */}
                            <div style={{
                                position: 'absolute', left: -36, top: 6,
                                width: 14, height: 14, borderRadius: '50%',
                                background: accent,
                                border: `3px solid var(--theme-bg)`,
                                boxShadow: `0 0 12px ${accent}60`,
                                zIndex: 1,
                            }} />

                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 'var(--theme-radius)',
                                padding: '24px 28px',
                                boxShadow: 'none',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                    <div>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--theme-text)', marginBottom: 4 }}>{exp.role}</h3>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: accent }}>{exp.company}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: 5,
                                            fontSize: '0.65rem', color: 'var(--theme-text)', opacity: 0.5, fontWeight: 600
                                        }}>
                                            <Calendar size={11} />{exp.duration}
                                        </span>
                                        {exp.location && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', color: 'var(--theme-text)', opacity: 0.4 }}>
                                                <MapPin size={10} />{exp.location}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Description as bullet list */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {(exp.description || '').split('\n').filter(Boolean).map((line, li) => {
                                        const clean = line.replace(/^[•\-]\s*/, '').trim();
                                        if (!clean) return null;
                                        return (
                                            <div key={li} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                                <span style={{ color: accent, marginTop: 2, flexShrink: 0, fontSize: '0.6rem' }}>▸</span>
                                                <span style={{ fontSize: '0.75rem', lineHeight: 1.65, opacity: 0.75, color: 'var(--theme-text)' }}>{clean}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ExperienceSection;
