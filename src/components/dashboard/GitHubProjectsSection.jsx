import React, { useState, useCallback, useMemo, useRef, memo } from 'react';
import {
    Github, Sparkles, Star, GitFork, ExternalLink, RefreshCw,
    CheckCircle2, XCircle, Loader2, AlertCircle, ChevronDown,
    Link, Globe, Code2, TrendingUp, Zap, ArrowRight, Search, Plus, Edit2
} from 'lucide-react';
import { importGitHubProjects, resyncGitHubProjects, validateGitHubUrl } from '../../lib/githubAI';
import { useUser } from '../../context/UserContext';

// ── Skeleton Loader Card ──────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="repo-card skeleton-card">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-desc" />
        <div className="skeleton-line skeleton-desc short" />
        <div className="skeleton-tags">
            <div className="skeleton-tag" />
            <div className="skeleton-tag" />
            <div className="skeleton-tag" />
        </div>
        <div className="skeleton-score" />
    </div>
);

// ── Score Bar ─────────────────────────────────────────────────────────────────
const ScoreBar = memo(({ score }) => {
    const color = score >= 80
        ? 'var(--accent-green)'
        : score >= 60
            ? '#f59e0b'
            : '#94a3b8';

    return (
        <div className="repo-score-bar-wrap">
            <div className="repo-score-bar-track">
                <div
                    className="repo-score-bar-fill"
                    style={{ width: `${score}%`, background: color }}
                />
            </div>
            <span className="repo-score-label" style={{ color }}>{score}</span>
        </div>
    );
});

// ── Repository Card ───────────────────────────────────────────────────────────
const RepoCard = memo(({ project, index, onToggleProperty, onEditProject }) => {
    const [expanded, setExpanded] = useState(false);
    const isRecommended = project.score >= 60;
    const isHighScore = project.score >= 80;

    return (
        <div
            className={`repo-card ${isHighScore ? 'repo-card--highlight' : ''} ${!isRecommended ? 'repo-card--dimmed' : ''}`}
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            {/* Header */}
            <div className="repo-card-header">
                <div className="repo-card-title-row">
                    <Code2 size={14} className="repo-name-icon" />
                    <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="repo-name"
                        title={project.repoName}
                    >
                        {project.customTitle || project.repoName}
                    </a>
                    {isHighScore && (
                        <span className="repo-badge repo-badge--top">
                            <Sparkles size={9} /> Top Pick
                        </span>
                    )}
                </div>

                <div className="repo-badge-row">
                    {isRecommended ? (
                        <span className="repo-badge repo-badge--recommended">
                            <CheckCircle2 size={11} /> Recommended
                        </span>
                    ) : (
                        <span className="repo-badge repo-badge--skip">
                            <XCircle size={11} /> Low Priority
                        </span>
                    )}
                </div>
            </div>

            {/* Description */}
            {(project.customDescription || project.description) && (
                <p className="repo-description">{project.customDescription || project.description}</p>
            )}

            {/* AI Summary */}
            {project.aiSummary && project.aiSummary !== project.description && (
                <p className="repo-ai-summary">
                    <Sparkles size={10} style={{ flexShrink: 0, color: 'var(--primary-blue)', marginTop: 2 }} />
                    {project.aiSummary}
                </p>
            )}

            {/* Tech Stack */}
            {project.technologies?.length > 0 && (
                <div className="repo-tech-tags">
                    {project.technologies.slice(0, 6).map(tech => (
                        <span key={tech} className="repo-tech-tag">{tech}</span>
                    ))}
                    {project.technologies.length > 6 && (
                        <span className="repo-tech-tag repo-tech-tag--more">
                            +{project.technologies.length - 6}
                        </span>
                    )}
                </div>
            )}

            {/* Stats Row */}
            <div className="repo-stats-row">
                <span className="repo-stat">
                    <Star size={12} />
                    {project.stars.toLocaleString()}
                </span>
                <span className="repo-stat">
                    <GitFork size={12} />
                    {project.forks.toLocaleString()}
                </span>
                {project.deploymentUrl && (
                    <a
                        href={project.deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="repo-stat repo-stat--live"
                    >
                        <Globe size={12} /> Live Demo
                    </a>
                )}
                <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="repo-stat repo-stat--link"
                >
                    <Github size={12} /> View
                </a>
            </div>

            {/* Score Bar */}
            <div className="repo-score-section">
                <span className="repo-score-title">AI Score</span>
                <ScoreBar score={project.score} />
            </div>

            {/* Action Row */}
            <div className="repo-action-row" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                    className={`repo-action-btn ${project.selected ? 'active' : ''}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleProperty?.(project.repoName, 'selected'); }}
                    title={project.selected ? "Remove from Portfolio" : "Add to Portfolio"}
                >
                    {project.selected ? <CheckCircle2 size={13} color="var(--accent-green)" /> : <Plus size={13} />}
                    {project.selected ? 'Added' : 'Add to Portfolio'}
                </button>

                {project.selected && (
                    <>
                        <button 
                            className={`repo-action-btn ${project.featured ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleProperty?.(project.repoName, 'featured'); }}
                            title={project.featured ? "Unfeature" : "Feature on Profile"}
                        >
                            <Star size={13} color={project.featured ? "#f59e0b" : "currentColor"} />
                            {project.featured ? 'Featured' : 'Feature'}
                        </button>

                        <button 
                            className="repo-action-btn"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditProject?.(project); }}
                            title="Edit Project Details"
                        >
                            <Edit2 size={13} />
                            Edit
                        </button>
                    </>
                )}

                <button 
                    className={`repo-action-btn ${project.hidden ? 'active' : ''}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleProperty?.(project.repoName, 'hidden'); }}
                    title={project.hidden ? "Unhide" : "Hide from recommendations"}
                    style={{ marginLeft: 'auto' }}
                >
                    {project.hidden ? 'Hidden' : 'Hide'}
                </button>
            </div>

            {/* Expandable Details */}
            {(project.strengths?.length > 0 || project.weaknesses?.length > 0) && (
                <>
                    <button
                        className="repo-expand-btn"
                        onClick={() => setExpanded(prev => !prev)}
                        aria-expanded={expanded}
                    >
                        <span>AI Insights</span>
                        <ChevronDown
                            size={14}
                            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.25s' }}
                        />
                    </button>

                    {expanded && (
                        <div className="repo-insights">
                            {project.strengths?.length > 0 && (
                                <div className="repo-insights-group">
                                    <span className="repo-insights-label" style={{ color: 'var(--accent-green)' }}>
                                        <CheckCircle2 size={11} /> Strengths
                                    </span>
                                    <ul className="repo-insights-list">
                                        {project.strengths.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {project.weaknesses?.length > 0 && (
                                <div className="repo-insights-group">
                                    <span className="repo-insights-label" style={{ color: '#f59e0b' }}>
                                        <Zap size={11} /> To Improve
                                    </span>
                                    <ul className="repo-insights-list">
                                        {project.weaknesses.map((w, i) => (
                                            <li key={i}>{w}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

// ── Progress Indicator ─────────────────────────────────────────────────────────
const ProgressBar = memo(({ step, progress, message }) => {
    const steps = [
        { key: 'validating', label: 'Validating URL', icon: <Search size={12} /> },
        { key: 'fetching', label: 'Fetching Repos', icon: <Github size={12} /> },
        { key: 'filtering', label: 'Filtering Quality', icon: <CheckCircle2 size={12} /> },
        { key: 'analyzing', label: 'AI Analyzing', icon: <Sparkles size={12} /> },
        { key: 'done', label: 'Complete', icon: <CheckCircle2 size={12} /> },
    ];
    const stepOrder = steps.map(s => s.key);
    const currentIdx = stepOrder.indexOf(step);

    return (
        <div className="github-progress-wrap">
            <div className="github-progress-steps">
                {steps.filter(s => s.key !== 'done').map((s, i) => {
                    const done = i < currentIdx;
                    const active = i === currentIdx;
                    return (
                        <div key={s.key} className={`github-progress-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                            <div className="github-progress-dot">
                                {done ? <CheckCircle2 size={13} /> : active ? <Loader2 size={13} className="spin-icon" /> : s.icon}
                            </div>
                            <span>{s.label}</span>
                            {i < steps.length - 2 && <div className={`github-progress-line ${done ? 'done' : ''}`} />}
                        </div>
                    );
                })}
            </div>

            <div className="github-progress-bar-wrap">
                <div className="github-progress-bar" style={{ width: `${progress}%` }} />
            </div>

            {message && (
                <p className="github-progress-msg">
                    <Loader2 size={13} className="spin-icon" /> {message}
                </p>
            )}
        </div>
    );
});

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = memo(({ githubUrl, onImport, isLoading }) => {
    const isDetected = !!githubUrl;

    return (
        <div className="github-empty-state" style={{ 
            border: isDetected ? '1px solid rgba(59,130,246,0.3)' : '',
            background: isDetected ? 'linear-gradient(to bottom right, rgba(59,130,246,0.05), transparent)' : ''
        }}>
            <div className="github-empty-icon" style={{
                background: isDetected ? 'var(--primary-blue)' : '',
                color: isDetected ? '#fff' : ''
            }}>
                <Github size={40} />
            </div>
            
            {isDetected ? (
                <>
                    <h3>GitHub Account Detected</h3>
                    <p style={{ fontWeight: '600', color: 'var(--text-dark)', margin: '0.5rem 0' }}>{githubUrl}</p>
                    <p>We found a GitHub profile connected to your persona. Fetch and analyze your projects to build an AI-powered portfolio.</p>
                    <button 
                        className="github-fetch-btn" 
                        onClick={onImport} 
                        disabled={isLoading}
                        style={{ marginTop: '1rem', alignSelf: 'center', minWidth: '200px', display: 'flex', justifyContent: 'center' }}
                    >
                        <Sparkles size={14} /> Fetch My Projects
                    </button>
                </>
            ) : (
                <>
                    <h3>Import Your GitHub Projects</h3>
                    <p>
                        Paste your GitHub profile URL above to automatically fetch, filter, and
                        get AI-powered portfolio recommendations for your best repositories.
                    </p>
                    <div className="github-empty-features">
                        <div className="github-empty-feature">
                            <Sparkles size={15} style={{ color: 'var(--primary-blue)' }} />
                            <span>AI Scores each repo 0–100</span>
                        </div>
                        <div className="github-empty-feature">
                            <CheckCircle2 size={15} style={{ color: 'var(--accent-green)' }} />
                            <span>Filters forks & tutorial repos</span>
                        </div>
                        <div className="github-empty-feature">
                            <TrendingUp size={15} style={{ color: '#f59e0b' }} />
                            <span>Highlights portfolio-worthy projects</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

// ── Filter Tabs ───────────────────────────────────────────────────────────────
const FilterTabs = memo(({ activeFilter, onChange, counts }) => {
    const tabs = [
        { key: 'all', label: 'All', count: counts.all },
        { key: 'recommended', label: 'Recommended', count: counts.recommended },
        { key: 'top', label: 'Top Picks', count: counts.top },
        { key: 'portfolio', label: 'Portfolio', count: counts.portfolio },
    ];
    return (
        <div className="repo-filter-tabs" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    className={`repo-filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
                    onClick={() => onChange(tab.key)}
                >
                    {tab.label}
                    <span className="repo-filter-count">{tab.count}</span>
                </button>
            ))}
        </div>
    );
});

// ══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
const GitHubProjectsSection = ({ user, onProjectsImported, onScrollToSection }) => {
    const { toggleProjectProperty, updateProjectDetails } = useUser();
    const [editingProject, setEditingProject] = useState(null);
    const [githubUrl, setGithubUrl] = useState(user?.githubUrl || user?.github || '');
    const [urlError, setUrlError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [importError, setImportError] = useState('');
    const [projects, setProjects] = useState(user?.githubProjects || []);
    const [lastSync, setLastSync] = useState(user?.lastGithubSync || null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [visibleCount, setVisibleCount] = useState(6);
    const [githubUsername, setGithubUsername] = useState(user?.githubUsername || '');

    const inputRef = useRef(null);
    const sectionRef = useRef(null);

    // Sync from user prop when it updates (e.g., after Firestore load)
    React.useEffect(() => {
        if (user?.githubProjects?.length > 0) {
            setProjects(user.githubProjects);
        }
        if (user?.githubUrl && !githubUrl) {
            setGithubUrl(user.githubUrl);
        } else if (user?.github && !githubUrl) {
            // Auto-detect from persona
            setGithubUrl(user.github);
        }
        if (user?.githubUsername) {
            setGithubUsername(user.githubUsername);
        }
        if (user?.lastGithubSync) {
            setLastSync(user.lastGithubSync);
        }
    }, [user?.githubProjects, user?.githubUrl, user?.githubUsername, user?.lastGithubSync, user?.github]);

    // Filtered & counted project lists
    const { filteredProjects, counts } = useMemo(() => {
        const portfolio = projects.filter(p => p.selected);
        const visible = projects.filter(p => !p.hidden);
        const recommended = visible.filter(p => p.score >= 60);
        const top = visible.filter(p => p.score >= 80);
        const counts = { all: visible.length, recommended: recommended.length, top: top.length, portfolio: portfolio.length };

        let filtered;
        if (activeFilter === 'recommended') filtered = recommended;
        else if (activeFilter === 'top') filtered = top;
        else if (activeFilter === 'portfolio') {
            // Sort portfolio: featured first, then score
            filtered = [...portfolio].sort((a, b) => {
                if (a.featured !== b.featured) return b.featured ? 1 : -1;
                return b.score - a.score;
            });
        }
        else filtered = visible;

        return { filteredProjects: filtered, counts };
    }, [projects, activeFilter]);

    const visibleProjects = useMemo(
        () => filteredProjects.slice(0, visibleCount),
        [filteredProjects, visibleCount]
    );

    const handleUrlChange = useCallback((e) => {
        setGithubUrl(e.target.value);
        setUrlError('');
        setImportError('');
    }, []);

    const handleImport = useCallback(async (isResync = false) => {
        const url = githubUrl.trim();

        // Inline validation
        const { valid, error } = validateGitHubUrl(url);
        if (!valid) {
            setUrlError(error);
            inputRef.current?.focus();
            return;
        }

        setIsLoading(true);
        setImportError('');
        setLoadingProgress(0);
        setLoadingStep('validating');
        setVisibleCount(6);

        try {
            const fn = isResync ? resyncGitHubProjects : importGitHubProjects;
            const result = await fn(
                url,
                { targetJob: user?.targetJob, githubUsername: user?.githubUsername },
                {
                    onProgress: (msg, pct) => {
                        setLoadingMessage(msg);
                        setLoadingProgress(pct);
                    },
                    onStep: (step) => setLoadingStep(step),
                }
            );

            setProjects(result.projects);
            setLastSync(result.syncedAt);
            setGithubUsername(result.username);
            setActiveFilter('all');

            // Persist to parent (UserContext → Firestore)
            onProjectsImported?.({
                githubUrl: result.githubUrl,
                githubUsername: result.username,
                githubProjects: result.projects,
                lastGithubSync: result.syncedAt,
            });

        } catch (err) {
            console.error('[GitHubProjectsSection] Import failed:', err);
            setImportError(err.message || 'Import failed. Please try again.');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
            setLoadingProgress(0);
            setLoadingMessage('');
        }
    }, [githubUrl, user?.targetJob, user?.githubUsername, onProjectsImported]);

    const handleResync = useCallback(() => handleImport(true), [handleImport]);

    const handleLoadMore = useCallback(() => {
        setVisibleCount(prev => prev + 6);
    }, []);

    const handleToggleProperty = useCallback((repoName, property, value = null) => {
        // Optimistic UI update
        setProjects(prev => prev.map(p => 
            p.repoName === repoName ? { ...p, [property]: value !== null ? value : !p[property] } : p
        ));
        // Persist to context/Firestore
        toggleProjectProperty(repoName, property, value);
    }, [toggleProjectProperty]);

    const hasProjects = projects.length > 0;
    const hasMore = visibleCount < filteredProjects.length;

    const syncDateStr = lastSync
        ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastSync))
        : null;

    return (
        <div className="github-section glass-card panel-animate" id="projects-section" ref={sectionRef}>
            {/* ── Section Header ── */}
            <div className="github-section-header">
                <div className="github-section-title-row">
                    <div className="github-section-icon">
                        <Github size={20} />
                    </div>
                    <div>
                        <h2 className="github-section-title">GitHub Projects</h2>
                        {githubUsername && (
                            <a
                                href={`https://github.com/${githubUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="github-username-link"
                            >
                                @{githubUsername}
                                <ExternalLink size={11} />
                            </a>
                        )}
                    </div>
                </div>

                <div className="github-section-actions">
                    {syncDateStr && (
                        <span className="github-sync-label">
                            Synced {syncDateStr}
                        </span>
                    )}
                    {hasProjects && (
                        <button
                            className="github-resync-btn"
                            onClick={handleResync}
                            disabled={isLoading}
                            title="Re-analyze GitHub repositories"
                        >
                            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
                            Refresh
                        </button>
                    )}
                </div>
            </div>

            {/* ── URL Input Row ── */}
            <div className="github-input-section">
                <div className={`github-url-wrap ${urlError ? 'error' : ''}`}>
                    <Github size={16} className="github-url-icon" />
                    <input
                        ref={inputRef}
                        type="url"
                        className="github-url-input"
                        placeholder="github.com/your-username"
                        value={githubUrl}
                        onChange={handleUrlChange}
                        onKeyDown={e => e.key === 'Enter' && !isLoading && handleImport()}
                        disabled={isLoading}
                        aria-label="GitHub profile URL"
                        id="github-url-input"
                        autoComplete="url"
                    />
                    <button
                        className="github-fetch-btn"
                        onClick={() => handleImport(false)}
                        disabled={isLoading || !githubUrl.trim()}
                        id="github-fetch-btn"
                    >
                        {isLoading ? (
                            <><Loader2 size={14} className="spin-icon" /> Analyzing...</>
                        ) : hasProjects ? (
                            <><RefreshCw size={14} /> Re-analyze</>
                        ) : (
                            <><Sparkles size={14} /> Fetch & Analyze</>
                        )}
                    </button>
                </div>

                {urlError && (
                    <p className="github-input-error">
                        <AlertCircle size={13} /> {urlError}
                    </p>
                )}

                {importError && (
                    <div className="github-import-error">
                        <AlertCircle size={16} />
                        <div>
                            <strong>Import failed</strong>
                            <p>{importError}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Loading Progress ── */}
            {isLoading && (
                <ProgressBar
                    step={loadingStep}
                    progress={loadingProgress}
                    message={loadingMessage}
                />
            )}

            {/* ── Skeleton Loaders ── */}
            {isLoading && (
                <div className="repo-grid">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {/* ── Empty State ── */}
            {!isLoading && !hasProjects && (
                <EmptyState githubUrl={githubUrl} onImport={() => handleImport(false)} isLoading={isLoading} />
            )}

            {/* ── Projects List ── */}
            {!isLoading && hasProjects && (
                <>


                    {/* Filter Tabs */}
                    <FilterTabs
                        activeFilter={activeFilter}
                        onChange={setActiveFilter}
                        counts={counts}
                    />

                    {/* Cards Grid */}
                    <div className="repo-grid">
                        {visibleProjects.map((project, i) => (
                            <RepoCard 
                                key={project.id || project.repoName} 
                                project={project} 
                                index={i} 
                                onToggleProperty={handleToggleProperty}
                                onEditProject={setEditingProject}
                            />
                        ))}
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <button className="repo-load-more-btn" onClick={handleLoadMore}>
                            Show {Math.min(6, filteredProjects.length - visibleCount)} more
                            <ChevronDown size={16} />
                        </button>
                    )}

                    {!hasMore && filteredProjects.length > 6 && (
                        <p className="repo-all-shown">All {filteredProjects.length} repositories shown</p>
                    )}
                </>
            )}

            {/* Customization Modal */}
            {editingProject && (
                <div className="modal-overlay" onClick={() => setEditingProject(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>Edit Project Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Title</label>
                                <input 
                                    type="text" 
                                    className="github-url-input" 
                                    style={{ width: '100%', marginTop: '0.2rem' }}
                                    defaultValue={editingProject.customTitle || editingProject.repoName}
                                    id="edit-project-title"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Description</label>
                                <textarea 
                                    className="github-url-input" 
                                    style={{ width: '100%', marginTop: '0.2rem', minHeight: '80px', resize: 'vertical' }}
                                    defaultValue={editingProject.customDescription || editingProject.description}
                                    id="edit-project-desc"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button className="repo-action-btn" onClick={() => setEditingProject(null)}>Cancel</button>
                                <button className="repo-action-btn active" onClick={() => {
                                    const title = document.getElementById('edit-project-title').value;
                                    const desc = document.getElementById('edit-project-desc').value;
                                    updateProjectDetails(editingProject.repoName, { customTitle: title, customDescription: desc });
                                    setEditingProject(null);
                                }}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GitHubProjectsSection;
