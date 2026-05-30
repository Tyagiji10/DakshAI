import React from 'react';
import { usePortfolio } from '../../../context/PortfolioContext';

const AboutSection = () => {
    const { state } = usePortfolio();
    const p = state.personalInfo;

    return (
        <section className="portfolio-section about-section" style={{ padding: 'clamp(4rem, 8cqw, 8rem) 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'clamp(2rem, 5cqw, 4rem)', alignItems: 'center' }}>
                <div className="about-visual">
                    <div style={{ 
                        width: '100%', 
                        aspectRatio: '1', 
                        background: 'var(--theme-accent)', 
                        opacity: 0.1, 
                        borderRadius: 'var(--theme-radius)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(3rem, 10cqw, 5rem)'
                    }}>
                        👋
                    </div>
                </div>
                <div className="about-content">
                    <span style={{ color: 'var(--theme-accent)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', fontSize: 'clamp(0.65rem, 1.2cqw, 0.75rem)' }}>About Me</span>
                    <h2 style={{ fontSize: 'clamp(1.6rem, 3.2cqw, 2.4rem)', fontWeight: 800, margin: 'clamp(1rem, 2cqw, 1.5rem) 0' }}>Personal Journey</h2>
                    <p style={{ fontSize: 'clamp(0.8rem, 1.6cqw, 0.95rem)', lineHeight: 1.8, opacity: 0.8 }}>
                        {p.bio}
                    </p>
                    <div style={{ marginTop: 'clamp(1.5rem, 4cqw, 2.5rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <h4 style={{ fontWeight: 800, marginBottom: '8px', fontSize: 'clamp(0.85rem, 1.2cqw, 0.95rem)' }}>Name</h4>
                            <p style={{ opacity: 0.6, fontSize: 'clamp(0.75rem, 1.2cqw, 0.85rem)' }}>{p.fullName}</p>
                        </div>
                        <div>
                            <h4 style={{ fontWeight: 800, marginBottom: '8px', fontSize: 'clamp(0.85rem, 1.2cqw, 0.95rem)' }}>Role</h4>
                            <p style={{ opacity: 0.6, fontSize: 'clamp(0.75rem, 1.2cqw, 0.85rem)' }}>{p.headline}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
