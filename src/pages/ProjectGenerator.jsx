import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getTrendingJobSkills, getProjectIdeaFromPool } from '../lib/ai';
import { availableSkills, jobLibrary } from '../lib/mockData';
import { haptic } from '../lib/haptics';
import {
    Lightbulb, Sparkles, ChevronRight, Loader2,
    Target, Zap, Rocket, ChevronLeft, RefreshCcw,
    BookOpen, BarChart2
} from 'lucide-react';
import './ProjectGenerator.css';

const difficultyColor = {
    Beginner: { bg: 'rgba(16,185,129,0.1)', text: '#059669', border: 'rgba(16,185,129,0.3)' },
    Intermediate: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1', border: 'rgba(99,102,241,0.3)' },
    Advanced: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
};

const ProjectGenerator = () => {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // History of generated ideas + current index pointer
    const [ideas, setIdeas] = useState([]);      // array of roadmap objects
    const [cursor, setCursor] = useState(-1);    // index of currently displayed idea
    const [cacheStatus, setCacheStatus] = useState(null); // 'cached' | 'fresh'

    const currentIdea = cursor >= 0 ? ideas[cursor] : null;

    const generateNewIdea = async () => {
        if (!user || !user.targetJob) {
            setError('Please select a Target Job on the Dashboard first.');
            haptic.error();
            return;
        }
        haptic.medium();
        setLoading(true);
        setError(null);
        try {
            // Resolve job ID → full title + category
            const jobEntry = jobLibrary.find(j => j.id === user.targetJob);
            const jobTitle = jobEntry?.title || user.targetJob;
            const jobCategory = jobEntry?.category || '';

            const jobSkills = await getTrendingJobSkills(jobTitle, availableSkills || []);
            const userSkills = user.skills || [];
            const safeJobSkills = Array.isArray(jobSkills) ? jobSkills :
                (jobSkills?.categorizedMaster ? Object.values(jobSkills.categorizedMaster).flat() : []);
            const missing = safeJobSkills.filter(s => !userSkills.includes(s));

            // Pass full user profile for personalization
            const userProfile = {
                name: user.name || 'the candidate',
                bio: user.bio || '',
                skills: userSkills,
                category: jobCategory
            };

            const result = await getProjectIdeaFromPool(
                jobTitle,
                missing.length > 0 ? missing : (jobEntry?.requiredSkills?.slice(0, 5) || ['Communication', 'Data Analysis']),
                userProfile
            );

            // Check if it came from cache (instant) or was freshly generated
            const safeJob = jobTitle.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const cacheKey = `daksh_project_pool_v2_${safeJob}`;
            const cached = localStorage.getItem(cacheKey);
            setCacheStatus(cached ? 'cached' : 'fresh');

            setIdeas(prev => {
                const updated = [...prev, result];
                setCursor(updated.length - 1);
                return updated;
            });
        } catch (err) {
            console.error('Roadmap Generation Error:', err);
            setError(`Error: ${err.message || 'AI is currently busy. Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    const goToPrev = () => {
        haptic.light();
        setCursor(c => Math.max(0, c - 1));
    };
    const goToNext = () => {
        haptic.light();
        setCursor(c => Math.min(ideas.length - 1, c + 1));
    };

    return (
        <div className="project-gen-container">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div className="text-left">
                    <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text-dark)' }}>
                        Project Blueprints
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        AI-powered project ideas tailored to India's current job market & your skill gaps.
                    </p>
                </div>
            </div>

            {/* ── Error ───────────────────────────────────────────────── */}
            {error && (
                <div className="glass-card mb-6" style={{ borderColor: '#ef4444', background: 'rgba(239,68,68,0.05)', padding: '1rem' }}>
                    <p style={{ color: '#ef4444', margin: 0, fontWeight: 600 }}>{error}</p>
                </div>
            )}

            {/* ── Loading ─────────────────────────────────────────────── */}
            {loading && (
                <div className="blueprint-card">
                    <div className="flex flex-col items-center justify-center py-12">
                        <div style={{ width: 44, height: 44, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }} />
                        <h3 className="text-lg font-bold mb-2">Architecting your next idea...</h3>
                        <p className="text-sm text-center max-w-md text-muted">
                            Scanning India's job market trends and your skill profile to design a unique blueprint.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Idea Card ───────────────────────────────────────────── */}
            {!loading && currentIdea && (
                <div className="blueprint-card text-left">

                    {/* Navigation Bar — fully responsive */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: '0.75rem',
                        marginBottom: '1.5rem', padding: '0.75rem 1rem',
                        background: 'rgba(99,102,241,0.04)', borderRadius: '14px',
                        border: '1px solid rgba(99,102,241,0.1)'
                    }}>
                        <button
                            onClick={goToPrev}
                            disabled={cursor === 0}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '10px', cursor: cursor === 0 ? 'not-allowed' : 'pointer',
                                background: cursor === 0 ? 'rgba(100,116,139,0.05)' : 'rgba(99,102,241,0.08)',
                                border: `1px solid ${cursor === 0 ? 'rgba(100,116,139,0.1)' : 'rgba(99,102,241,0.2)'}`,
                                color: cursor === 0 ? '#94a3b8' : '#6366f1',
                                fontWeight: '700', fontSize: '0.8rem', transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>

                        <div style={{ textAlign: 'center', minWidth: '100px' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-dark)' }}>
                                Idea {cursor + 1} of {ideas.length}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '2px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Generated This Session
                                </div>
                                {cacheStatus && (
                                    <span style={{
                                        fontSize: '0.6rem', fontWeight: '800', padding: '2px 7px',
                                        borderRadius: '99px',
                                        background: cacheStatus === 'cached' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                                        color: cacheStatus === 'cached' ? '#059669' : '#6366f1',
                                        border: `1px solid ${cacheStatus === 'cached' ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`
                                    }}>
                                        {cacheStatus === 'cached' ? '⚡ Instant' : '✨ Fresh'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={goToNext}
                            disabled={cursor === ideas.length - 1}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '10px', cursor: cursor === ideas.length - 1 ? 'not-allowed' : 'pointer',
                                background: cursor === ideas.length - 1 ? 'rgba(100,116,139,0.05)' : 'rgba(99,102,241,0.08)',
                                border: `1px solid ${cursor === ideas.length - 1 ? 'rgba(100,116,139,0.1)' : 'rgba(99,102,241,0.2)'}`,
                                color: cursor === ideas.length - 1 ? '#94a3b8' : '#6366f1',
                                fontWeight: '700', fontSize: '0.8rem', transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Blueprint Header */}
                    <div className="blueprint-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Zap size={16} style={{ color: '#6366f1' }} />
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Personalized Indian Market Blueprint
                                </span>
                            </div>
                            {currentIdea.targetSector && (
                                <span style={{
                                    fontSize: '0.68rem', fontWeight: '800', padding: '3px 10px', borderRadius: '99px',
                                    background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)'
                                }}>
                                    🇮🇳 {currentIdea.targetSector}
                                </span>
                            )}
                            {currentIdea.difficulty && (() => {
                                const dc = difficultyColor[currentIdea.difficulty] || difficultyColor['Intermediate'];
                                return (
                                    <span style={{
                                        fontSize: '0.68rem', fontWeight: '800', padding: '3px 10px', borderRadius: '99px',
                                        background: dc.bg, color: dc.text, border: `1px solid ${dc.border}`
                                    }}>
                                        <BarChart2 size={10} style={{ display: 'inline', marginRight: 4 }} />
                                        {currentIdea.difficulty}
                                    </span>
                                );
                            })()}
                        </div>

                        <h2 className="text-4xl font-black mb-4" style={{ color: 'var(--text-dark)', lineHeight: 1.1 }}>
                            {currentIdea.projectTitle}
                        </h2>
                        <p className="text-lg leading-relaxed mb-5" style={{ color: 'var(--text-muted)', maxWidth: '700px' }}>
                            {currentIdea.concept}
                        </p>

                        {/* Tech Stack Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '0.5rem' }}>
                            {(currentIdea.techStack || []).map(tech => (
                                <span key={tech} style={{
                                    background: 'rgba(99,102,241,0.07)', padding: '5px 14px',
                                    borderRadius: '99px', fontSize: '0.78rem', fontWeight: '700',
                                    color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)'
                                }}>{tech}</span>
                            ))}
                        </div>
                    </div>

                    <div className="blueprint-grid mt-8">
                        {/* Left: Step by Step Plan */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <BookOpen size={22} style={{ color: '#6366f1' }} />
                                <h3 className="text-xl font-bold">4-Step Execution Plan</h3>
                            </div>
                            <div className="milestone-track">
                                {(currentIdea.stepByStep || []).map((step, idx) => (
                                    <div key={idx} className="milestone-node">
                                        <span className="week-badge">Step {idx + 1}</span>
                                        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.7, marginTop: '0.4rem' }}>
                                            {step.replace(/^Step \d+[:\-–]\s*/i, '')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Strategy + Why */}
                        <div>
                            {currentIdea.whyThisProject && (
                                <div className="glass-card mb-6" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px dashed #e5e7eb' }}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Target size={20} style={{ color: '#10b981' }} />
                                        <h3 className="text-base font-bold">Why This Project?</h3>
                                    </div>
                                    <p className="text-sm leading-relaxed text-muted">{currentIdea.whyThisProject}</p>
                                </div>
                            )}

                            <div className="glass-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px dashed #e5e7eb' }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <Rocket size={20} style={{ color: '#f59e0b' }} />
                                    <h3 className="text-base font-bold">Quick Start Tips</h3>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {['Initialize a private GitHub repo and commit daily', 'Deploy early on Vercel / Railway / Render', 'Write a proper README with screenshots', 'Add this to your portfolio & LinkedIn'].map((tip, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                                            <ChevronRight size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(99,102,241,0.08)', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className="frosted-btn"
                            onClick={generateNewIdea}
                            disabled={loading}
                            style={{ padding: '12px 28px' }}
                        >
                            <RefreshCcw size={16} />
                            Generate New Idea
                        </button>
                    </div>
                </div>
            )}

            {/* ── Empty State ─────────────────────────────────────────── */}
            {!loading && !currentIdea && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Lightbulb size={80} style={{ color: '#6366f1', marginBottom: '1.5rem' }} />
                    <h2 className="text-2xl font-bold mb-4">Ready to build something world-class?</h2>
                    <p className="text-muted max-w-lg mb-8">
                        Get an AI-generated project idea perfectly tailored to India's booming job market and your specific skill gaps.
                    </p>
                    {user && user.targetJob ? (
                        <button className="frosted-btn" onClick={generateNewIdea}>
                            <Sparkles size={20} />
                            Generate My First Idea
                        </button>
                    ) : (
                        <p className="text-sm font-bold text-red-500">
                            ← Go to Dashboard to select a Target Job first
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectGenerator;
