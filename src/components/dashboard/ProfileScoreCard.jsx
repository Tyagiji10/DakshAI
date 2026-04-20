import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import ScoreRing from './ScoreRing';
import { useTilt } from '../../hooks/useTilt';

const ProfileScoreCard = React.memo(({ ps, psColor, psLabel, psSummary, handleFactorClick }) => {
    const tiltRef = useTilt();

    return (
        <div ref={tiltRef} className="glass-card tilt-card profile-score-card" style={{ borderLeft: '5px solid ' + (ps.total === 100 ? '#a855f7' : psColor) }}>
            {/* Confetti particles when 100% */}
            {ps.total === 100 && [
                { left: '10%', delay: '0s', color: '#ef4444' },
                { left: '20%', delay: '0.15s', color: '#f97316' },
                { left: '30%', delay: '0.05s', color: '#eab308' },
                { left: '40%', delay: '0.25s', color: '#22c55e' },
                { left: '50%', delay: '0.1s', color: '#3b82f6' },
                { left: '60%', delay: '0.3s', color: '#8b5cf6' },
                { left: '70%', delay: '0.2s', color: '#ec4899' },
                { left: '80%', delay: '0.35s', color: '#ef4444' },
                { left: '90%', delay: '0.08s', color: '#22c55e' },
                { left: '15%', delay: '0.4s', color: '#f97316' },
                { left: '45%', delay: '0.45s', color: '#8b5cf6' },
                { left: '75%', delay: '0.18s', color: '#eab308' },
            ].map((p, i) => (
                <div key={i} className="confetti-particle" style={{ left: p.left, top: '-8px', background: p.color, animationDelay: p.delay, animationDuration: `${1.2 + i * 0.1}s` }} />
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Shield size={20} style={{ color: ps.total === 100 ? '#a855f7' : psColor }} />
                <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-dark)' }}>Profile Score</h3>
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: '700', padding: '2px 9px', borderRadius: '99px', background: ps.total === 100 ? 'rgba(168,85,247,0.15)' : ps.total >= 80 ? 'rgba(16,185,129,0.12)' : ps.total >= 55 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', color: ps.total === 100 ? '#a855f7' : ps.total >= 80 ? '#059669' : ps.total >= 55 ? '#b45309' : '#dc2626' }}>
                    {ps.total === 100 ? '🎉 Perfect Score!' : psLabel}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                <ScoreRing score={ps.total} size={110} stroke={10} />
                <div style={{ flex: 1, minWidth: '180px' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.6rem', lineHeight: '1.55' }}>{psSummary}</p>
                    <div style={{ background: 'var(--border-color)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                        <div className={ps.total === 100 ? 'rainbow-bar' : ''} style={{ height: '100%', borderRadius: '99px', width: ps.total + '%', background: ps.total === 100 ? undefined : ps.total >= 80 ? 'linear-gradient(90deg,#10b981,#059669)' : ps.total >= 55 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)', transition: 'width 1s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: ps.total === 100 ? '#a855f7' : 'var(--text-muted)', marginTop: '0.3rem', display: 'block', fontWeight: ps.total === 100 ? '700' : '400' }}>{ps.total}/100 points {ps.total === 100 ? '🏆' : ''}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem', marginBottom: '0.9rem' }}>
                {ps.factors.map(f => (
                    <div
                        key={f.label}
                        onClick={() => handleFactorClick(f)}
                        title={f.action === 'navigate' ? 'Go to Portfolio' : 'Jump to section'}
                        style={{ padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-light)', cursor: 'pointer', transition: 'border-color 0.18s, transform 0.15s, box-shadow 0.18s', position: 'relative' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.73rem', fontWeight: '700', color: 'var(--text-dark)' }}>{f.label}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: f.score === f.max ? '#10b981' : 'var(--text-muted)' }}>{f.score}/{f.max}</span>
                                <ArrowRight size={11} style={{ color: '#6366f1', flexShrink: 0 }} />
                            </div>
                        </div>
                        <div style={{ background: 'var(--border-color)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '99px', width: Math.round((f.score / f.max) * 100) + '%', background: f.score === f.max ? '#10b981' : f.score > 0 ? '#3b82f6' : '#e5e7eb', transition: 'width 0.8s ease' }} />
                        </div>
                        {f.tip && <p style={{ fontSize: '0.65rem', color: '#6366f1', margin: '5px 0 0', lineHeight: '1.4' }}>{f.tip}</p>}
                    </div>
                ))}
            </div>

            {ps.factors.some(f => f.tip) && (
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '0.75rem 0.9rem' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary-blue)', margin: '0 0 0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Wins</p>
                    <ul style={{ margin: 0, paddingLeft: '1rem', listStyle: 'disc' }}>
                        {ps.factors.filter(f => f.tip).map(f => (
                            <li key={f.label} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem', lineHeight: '1.5' }}>{f.tip}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
});

export default ProfileScoreCard;
