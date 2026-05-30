import React from 'react';
import { Award, ExternalLink, Calendar } from 'lucide-react';
import { usePortfolio } from '../../../context/PortfolioContext';

const CertificationsSection = () => {
    const { state } = usePortfolio();
    const { sectionData, theme } = state;
    const certifications = sectionData['sec-certifications'] || [];

    if (!certifications.length) return null;

    const isBrutal = theme.id === 'neo-brutal';

    return (
        <section id="sec-certifications" style={{ padding: 'clamp(4rem, 8cqw, 8rem) 0', background: 'transparent' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
                <div className="gs_reveal" style={{ marginBottom: 40 }}>
                    <h2 style={{
                        fontSize: 'clamp(1.6rem, 3.2cqw, 2.4rem)',
                        fontWeight: 900,
                        color: theme.colors.text,
                        marginBottom: 10,
                        textTransform: isBrutal ? 'uppercase' : 'none'
                    }}>
                        Licenses & <span style={{ color: theme.colors.accent }}>Certifications</span>
                    </h2>
                    <div style={{ width: 60, height: 4, background: theme.colors.accent, borderRadius: isBrutal ? 0 : 2 }} />
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 24
                }}>
                    {certifications.map((cert, index) => (
                        <div
                            key={cert.id || index}
                            className="gs_reveal gs_reveal_up"
                            style={{
                                background: isBrutal ? theme.colors.primary : `color-mix(in srgb, ${theme.colors.primary} 60%, transparent)`,
                                backdropFilter: isBrutal ? 'none' : 'blur(10px)',
                                border: isBrutal ? `3px solid ${theme.colors.text}` : `1px solid color-mix(in srgb, ${theme.colors.text} 10%, transparent)`,
                                borderRadius: isBrutal ? 0 : 16,
                                padding: 24,
                                position: 'relative',
                                boxShadow: isBrutal ? `6px 6px 0 ${theme.colors.accent}` : '0 4px 20px rgba(0,0,0,0.1)',
                                transition: 'transform 0.25s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: isBrutal ? 0 : 12,
                                    background: `color-mix(in srgb, ${theme.colors.accent} 20%, transparent)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: theme.colors.accent, flexShrink: 0,
                                    border: isBrutal ? `2px solid ${theme.colors.text}` : 'none'
                                }}>
                                    <Award size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontSize: '0.8rem', fontWeight: 700, color: theme.colors.text,
                                        marginBottom: 4, lineHeight: 1.3
                                    }}>
                                        {cert.title}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.75rem', color: `color-mix(in srgb, ${theme.colors.text} 70%, transparent)`,
                                        fontWeight: 600, marginBottom: 8
                                    }}>
                                        {cert.issuer}
                                    </p>
                                    
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        fontSize: '0.65rem', color: `color-mix(in srgb, ${theme.colors.text} 50%, transparent)`,
                                        marginTop: 12
                                    }}>
                                        {cert.date && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Calendar size={14} /> {cert.date}
                                            </span>
                                        )}
                                        {cert.credentialUrl && (
                                            <a 
                                                href={cert.credentialUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    color: theme.colors.accent, textDecoration: 'none',
                                                    fontWeight: 600
                                                }}
                                            >
                                                View Credential <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CertificationsSection;
