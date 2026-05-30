import React from 'react';
import { usePortfolio } from '../../../context/PortfolioContext';
import { GraduationCap, Calendar } from 'lucide-react';

const EducationSection = ({ section }) => {
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
                <div style={{ width: 48, height: 4, background: accent, borderRadius: 2, marginBottom: 40 }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                    {data.map((ed, i) => (
                        <div
                            key={ed.id}
                            className="gs_reveal gs_reveal_up"
                            style={{
                                padding: '24px 28px',
                                borderRadius: 'var(--theme-radius)',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                boxShadow: 'none',
                                display: 'flex', gap: 16, alignItems: 'flex-start',
                            }}
                        >
                            <div style={{
                                width: 44, height: 44, borderRadius: 10,
                                background: `${accent}18`, border: `1px solid ${accent}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <GraduationCap size={20} style={{ color: accent }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--theme-text)', marginBottom: 4 }}>
                                    {ed.institution}
                                </h3>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: accent, marginBottom: 6 }}>
                                    {ed.degree}
                                </p>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--theme-text)', opacity: 0.5 }}>
                                        <Calendar size={11} /> {ed.year}
                                    </span>
                                    {ed.gpa && (
                                        <span style={{
                                            fontSize: '0.6rem', fontWeight: 700,
                                            padding: '2px 8px', borderRadius: 99,
                                            background: `${accent}18`, color: accent
                                        }}>
                                            GPA: {ed.gpa}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default EducationSection;
