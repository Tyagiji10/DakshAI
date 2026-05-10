import React, { useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2, Target, Zap, RefreshCw } from 'lucide-react';

const GRADE_COLOR = { 'A+': '#10b981', A: '#22c55e', B: '#f59e0b', C: '#f97316', D: '#ef4444' };
const SCORE_COLOR = (s) => s >= 75 ? '#10b981' : s >= 55 ? '#f59e0b' : '#ef4444';
const SCORE_BG    = (s) => s >= 75 ? 'rgba(16,185,129,0.1)' : s >= 55 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

// SVG Score Ring
const ScoreRing = ({ score, grade }) => {
    const R = 52, C = 2 * Math.PI * R;
    const dash = (score / 100) * C;
    const color = GRADE_COLOR[grade] || '#6366f1';
    return (
        <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={65} cy={65} r={R} fill="none" stroke="var(--border-color)" strokeWidth={10} />
            <circle cx={65} cy={65} r={R} fill="none" stroke={color} strokeWidth={10}
                strokeDasharray={`${dash} ${C - dash}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }} />
            <text x={65} y={72} textAnchor="middle" style={{ transform: 'rotate(90deg) translateX(-10px)', fontSize: '0px' }} />
            <g transform="rotate(90, 65, 65)">
                <text x={65} y={58} textAnchor="middle"
                    style={{ fontSize: '22px', fontWeight: '900', fill: color, fontFamily: 'Inter, sans-serif' }}>
                    {score}
                </text>
                <text x={65} y={76} textAnchor="middle"
                    style={{ fontSize: '12px', fontWeight: '700', fill: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                    Grade {grade}
                </text>
            </g>
        </svg>
    );
};

// Score Bar Row
const ScoreBar = ({ label, score, weight }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.55rem' }}>
        <div style={{ width: '145px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</div>
        <div style={{ flex: 1, height: '7px', background: 'var(--border-color)', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{
                width: `${score}%`, height: '100%', borderRadius: '9px',
                background: SCORE_COLOR(score), transition: 'width 0.9s ease'
            }} />
        </div>
        <div style={{ width: '38px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '800', color: SCORE_COLOR(score), flexShrink: 0 }}>
            {score}%
        </div>
        <div style={{ width: '38px', fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            ×{(weight * 100).toFixed(0)}%
        </div>
    </div>
);

// Keyword Chip
const KwChip = ({ text, type }) => {
    const colors = {
        matched:  { bg: 'rgba(16,185,129,0.1)',  color: '#059669', border: 'rgba(16,185,129,0.25)' },
        missing:  { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', border: 'rgba(239,68,68,0.25)' },
        synonym:  { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1', border: 'rgba(99,102,241,0.25)' },
        stuffed:  { bg: 'rgba(245,158,11,0.1)',  color: '#d97706', border: 'rgba(245,158,11,0.25)' },
    };
    const c = colors[type] || colors.matched;
    return (
        <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '9px', fontSize: '0.7rem',
            fontWeight: '700', background: c.bg, color: c.color, border: `1px solid ${c.border}`, margin: '2px'
        }}>{text}</span>
    );
};

// Feedback Card
const FeedbackCard = ({ item }) => {
    const bgs = { '🔴': 'rgba(239,68,68,0.06)', '🟡': 'rgba(245,158,11,0.06)', '🟢': 'rgba(16,185,129,0.06)' };
    const borders = { '🔴': 'rgba(239,68,68,0.2)', '🟡': 'rgba(245,158,11,0.2)', '🟢': 'rgba(16,185,129,0.2)' };
    return (
        <div style={{
            padding: '0.6rem 0.85rem', borderRadius: '0.5rem', marginBottom: '0.4rem',
            background: bgs[item.icon] || bgs['🟡'], border: `1px solid ${borders[item.icon] || borders['🟡']}`,
            display: 'flex', gap: '0.6rem', alignItems: 'flex-start'
        }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon || '💡'}</span>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>{item.message}</p>
        </div>
    );
};

const ATSScorePanel = ({ result, jdText, onReScore, isScoring, onOptimizeWithJD }) => {
    const [kwTab, setKwTab] = useState('matched'); // matched | missing | synonym
    const [showFeedback, setShowFeedback] = useState(true);

    if (!result) return null;

    const { overall, grade, breakdown, keywords, structure, formatting, strengths, weaknesses, suggestions, serverUsed } = result;
    const gradeColor = GRADE_COLOR[grade] || '#6366f1';

    return (
        <div style={{
            marginTop: '2rem', borderRadius: '1rem', overflow: 'hidden',
            border: '2px solid var(--border-color)', background: 'var(--primary-white)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ padding: '0.4rem', background: 'rgba(99,102,241,0.12)', borderRadius: '0.5rem' }}>
                        <Target size={18} style={{ color: '#6366f1' }} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                            ATS Score Analysis
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {serverUsed ? '🧠 Powered by all-MiniLM-L6-v2 + spaCy' : '⚡ Keyword analysis mode (start Python server for semantic NLP)'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {onOptimizeWithJD && jdText && (
                        <button onClick={onOptimizeWithJD} style={{
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            padding: '0.4rem 0.85rem', borderRadius: '0.5rem', border: 'none',
                            background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
                            fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer'
                        }}>
                            <Zap size={13} /> Optimize Resume
                        </button>
                    )}
                    <button onClick={onReScore} disabled={isScoring} style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.4rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)',
                        background: 'var(--bg-light)', color: 'var(--text-muted)',
                        fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer'
                    }}>
                        {isScoring ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Re-Score
                    </button>
                </div>
            </div>

            <div style={{ padding: '1.2rem 1.4rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>

                    {/* Left: Score Ring + Summary */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <ScoreRing score={overall} grade={grade} />
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                    Overall ATS Score
                                </div>
                                <div style={{
                                    fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9px', display: 'inline-block',
                                    background: SCORE_BG(overall), color: SCORE_COLOR(overall), fontWeight: '700', border: `1px solid ${SCORE_COLOR(overall)}40`
                                }}>
                                    {overall >= 80 ? '✅ ATS Ready' : overall >= 60 ? '⚠️ Needs Work' : '❌ Major Issues'}
                                </div>
                                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Formatting: {formatting?.score}% compatible
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Sections: {structure?.present?.length || 0} of {(structure?.present?.length || 0) + (structure?.missing?.length || 0)} present
                                </div>
                            </div>
                        </div>

                        {/* Strengths & Weaknesses */}
                        {strengths?.length > 0 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#059669', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✅ Strengths</div>
                                {strengths.map((s, i) => (
                                    <div key={i} style={{ fontSize: '0.74rem', color: 'var(--text-dark)', display: 'flex', gap: '0.35rem', marginBottom: '2px' }}>
                                        <CheckCircle size={12} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} /> {s}
                                    </div>
                                ))}
                            </div>
                        )}
                        {weaknesses?.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#dc2626', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠️ Weaknesses</div>
                                {weaknesses.map((w, i) => (
                                    <div key={i} style={{ fontSize: '0.74rem', color: 'var(--text-dark)', display: 'flex', gap: '0.35rem', marginBottom: '2px' }}>
                                        <XCircle size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} /> {w}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Section Bars */}
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score Breakdown</div>
                        {breakdown && Object.entries(breakdown).map(([key, val]) => (
                            <ScoreBar key={key} label={val.label} score={val.score} weight={val.weight} />
                        ))}
                        {formatting?.issues?.length > 0 && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#dc2626', marginBottom: '0.25rem' }}>⚠️ Formatting Issues</div>
                                {formatting.issues.map((iss, i) => (
                                    <div key={i} style={{ fontSize: '0.7rem', color: '#dc2626' }}>• {iss}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Keywords Section */}
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                        {[
                            { id: 'matched', label: `✅ Matched (${keywords?.matched?.length || 0})` },
                            { id: 'missing', label: `❌ Missing (${keywords?.missing?.length || 0})` },
                            { id: 'synonym', label: `🔁 Synonyms (${keywords?.synonymMatched?.length || 0})` },
                        ].map(t => (
                            <button key={t.id} onClick={() => setKwTab(t.id)} style={{
                                padding: '0.3rem 0.65rem', borderRadius: '0.4rem', border: 'none',
                                fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer',
                                background: kwTab === t.id ? 'var(--primary-blue)' : 'var(--bg-light)',
                                color: kwTab === t.id ? '#fff' : 'var(--text-muted)',
                                transition: 'all 0.15s'
                            }}>{t.label}</button>
                        ))}
                        {keywords?.stuffed?.length > 0 && (
                            <button onClick={() => setKwTab('stuffed')} style={{
                                padding: '0.3rem 0.65rem', borderRadius: '0.4rem', border: 'none',
                                fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer',
                                background: kwTab === 'stuffed' ? '#d97706' : 'var(--bg-light)',
                                color: kwTab === 'stuffed' ? '#fff' : '#d97706',
                            }}>⚠️ Stuffed ({keywords.stuffed.length})</button>
                        )}
                    </div>
                    <div style={{ minHeight: '40px' }}>
                        {kwTab === 'matched' && keywords?.matched?.map((k, i) => <KwChip key={i} text={k} type="matched" />)}
                        {kwTab === 'missing' && (
                            keywords?.missing?.length > 0
                                ? keywords.missing.map((k, i) => <KwChip key={i} text={k} type="missing" />)
                                : <span style={{ fontSize: '0.78rem', color: '#10b981' }}>🎉 No missing keywords! Great JD alignment.</span>
                        )}
                        {kwTab === 'synonym' && keywords?.synonymMatched?.map((s, i) => (
                            <KwChip key={i} text={`${s.jd} → ${s.found}`} type="synonym" />
                        ))}
                        {kwTab === 'stuffed' && keywords?.stuffed?.map((k, i) => <KwChip key={i} text={k} type="stuffed" />)}
                    </div>
                </div>

                {/* AI Feedback */}
                {suggestions?.length > 0 && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <button
                            onClick={() => setShowFeedback(!showFeedback)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '0.6rem' }}
                        >
                            <AlertCircle size={15} style={{ color: '#6366f1' }} />
                            AI Improvement Suggestions ({suggestions.length})
                            {showFeedback ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {showFeedback && suggestions.map((s, i) => <FeedbackCard key={i} item={s} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ATSScorePanel;
