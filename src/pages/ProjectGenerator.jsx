import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getTrendingJobSkills, getProjectIdeaFromPool } from '../lib/ai';
import { availableSkills, jobLibrary } from '../lib/mockData';
import { haptic } from '../lib/haptics';
import {
    Sparkles, ChevronRight, Loader2,
    Target, Zap, Rocket, ChevronLeft, RefreshCcw,
    BookOpen, BarChart2, ShieldCheck, Layers, Clipboard,
    Download, HelpCircle, CheckCircle, FileText, Plus, FolderPlus,
    Settings
} from 'lucide-react';
import './ProjectGenerator.css';

const difficultyColor = {
    Beginner: { bg: 'rgba(16,185,129,0.1)', text: '#059669', border: 'rgba(16,185,129,0.3)' },
    Intermediate: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1', border: 'rgba(99,102,241,0.3)' },
    Advanced: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
};

const popularTechOptions = [
    'React', 'Node.js', 'PostgreSQL', 'MongoDB', 'Redis',
    'Python', 'FastAPI', 'Docker', 'AWS', 'TailwindCSS',
    'TypeScript', 'C++', 'Arduino', 'Raspberry Pi', 'Figma',
    'Tableau / PowerBI', 'Excel'
];

const domainFormats = {
    Software: [
        'Fullstack Web App', 'Mobile Application', 'CLI Tool/Utility',
        'REST/GraphQL API Service', 'Developer Library/Package', 'AI Agent / LLM Integration'
    ],
    'Hardware/Embedded': [
        'IoT Smart Device', 'Robotic / Automation System', 'Custom PCB Design',
        'Sensor Network Node', 'Wearable Tech Prototype'
    ],
    'Business/Management': [
        'Strategic Business Plan', 'Product PRD & Roadmap', 'Marketing Funnel Campaign',
        'Financial Analysis Model', 'Supply Chain Flow Blueprint'
    ],
    'Research/Other': [
        'Scientific Case Study', 'Data Science Analytics Report', 'Open Source Contributor Draft'
    ]
};

const industrySectors = [
    'Fintech (UPI/Banking)', 'Edtech (E-Learning)', 'Healthtech (Med-Care)', 
    'SaaS Dashboard', 'E-commerce & D2C', 'Logistics / Supply Chain', 
    'Agritech (Smart Farming)', 'Smart Cities / IoT', 'Developer Tools', 'Custom Core Engineering'
];

const ProjectGenerator = () => {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Configurator Wizard States
    const [isConfiguring, setIsConfiguring] = useState(() => {
        try {
            const savedIdeas = localStorage.getItem('daksh_generator_user_ideas');
            const savedCursor = localStorage.getItem('daksh_generator_user_cursor');
            const hasIdeas = savedIdeas ? JSON.parse(savedIdeas).length > 0 : false;
            const hasCursor = savedCursor ? parseInt(savedCursor, 10) >= 0 : false;
            return !(hasIdeas && hasCursor);
        } catch (_) {
            return true;
        }
    });
    const [wizardStep, setWizardStep] = useState(1);
    const [config, setConfig] = useState({
        projectDomain: 'Software',
        projectFormat: 'Fullstack Web App',
        timeline: '2 Weeks (Standard Sprint)',
        difficulty: 'Intermediate',
        industrySector: 'Fintech (UPI/Banking)',
        selectedTech: []
    });
    const [customTechText, setCustomTechText] = useState('');

    // Bookmarks & Session State
    const [ideas, setIdeas] = useState(() => {
        try {
            const saved = localStorage.getItem('daksh_generator_user_ideas');
            return saved ? JSON.parse(saved) : [];
        } catch (_) {
            return [];
        }
    });
    const [cursor, setCursor] = useState(() => {
        try {
            const saved = localStorage.getItem('daksh_generator_user_cursor');
            return saved ? parseInt(saved, 10) : -1;
        } catch (_) {
            return -1;
        }
    });
    const [cacheStatus, setCacheStatus] = useState(null);

    // Dashboard UI Tab State
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'specs' | 'milestones' | 'readme'
    const [openQuestionIndex, setOpenQuestionIndex] = useState(null); // Accordion state for recruiter prep
    const [checkedTasks, setCheckedTasks] = useState({}); // Toggled developer checklist tasks

    const currentIdea = cursor >= 0 ? ideas[cursor] : null;

    // Save ideas and cursor to localStorage whenever they change to reduce AI server load
    useEffect(() => {
        try {
            localStorage.setItem('daksh_generator_user_ideas', JSON.stringify(ideas));
            localStorage.setItem('daksh_generator_user_cursor', cursor.toString());
        } catch (e) {
            console.error("Failed to save project builder session state:", e);
        }
    }, [ideas, cursor]);

    // Load initial config presets when user object changes
    useEffect(() => {
        if (user && user.skills) {
            // Match user's dashboard skills against popular tech choices
            const matchingSkills = user.skills.filter(s => 
                popularTechOptions.some(pt => pt.toLowerCase() === s.toLowerCase())
            );
            setConfig(prev => ({
                ...prev,
                selectedTech: matchingSkills.slice(0, 6)
            }));
        }
    }, [user]);

    // Persist and load checklist state for each project
    useEffect(() => {
        if (currentIdea) {
            const savedState = localStorage.getItem(`task_progress_${currentIdea.projectTitle.replace(/\s+/g, '_')}`);
            if (savedState) {
                setCheckedTasks(JSON.parse(savedState));
            } else {
                setCheckedTasks({});
            }
        }
    }, [currentIdea]);

    const handleTaskToggle = (key) => {
        haptic.light();
        const updated = {
            ...checkedTasks,
            [key]: !checkedTasks[key]
        };
        setCheckedTasks(updated);
        if (currentIdea) {
            localStorage.setItem(`task_progress_${currentIdea.projectTitle.replace(/\s+/g, '_')}`, JSON.stringify(updated));
        }
    };

    const handleDomainChange = (domain) => {
        haptic.light();
        const formats = domainFormats[domain] || domainFormats.Software;
        setConfig(prev => ({
            ...prev,
            projectDomain: domain,
            projectFormat: formats[0]
        }));
    };

    const toggleTechSelect = (tech) => {
        haptic.light();
        setConfig(prev => {
            const isSelected = prev.selectedTech.includes(tech);
            return {
                ...prev,
                selectedTech: isSelected 
                    ? prev.selectedTech.filter(t => t !== tech)
                    : [...prev.selectedTech, tech]
            };
        });
    };

    const addCustomTech = () => {
        if (!customTechText.trim()) return;
        haptic.light();
        const cleanTech = customTechText.trim();
        setConfig(prev => {
            if (prev.selectedTech.includes(cleanTech)) return prev;
            return {
                ...prev,
                selectedTech: [...prev.selectedTech, cleanTech]
            };
        });
        setCustomTechText('');
    };

    const removeTechTag = (tech) => {
        haptic.light();
        setConfig(prev => ({
            ...prev,
            selectedTech: prev.selectedTech.filter(t => t !== tech)
        }));
    };

    const generateNewIdea = async () => {
        if (!user || !user.targetJob) {
            setError('Please select a Target Job on the Dashboard first.');
            haptic.error();
            return;
        }
        haptic.medium();
        setLoading(true);
        setError(null);
        setIsConfiguring(false);
        setActiveTab('overview');
        setOpenQuestionIndex(null);

        try {
            const jobEntry = jobLibrary.find(j => j.id === user.targetJob);
            const jobTitle = jobEntry?.title || user.targetJob;
            const jobCategory = jobEntry?.category || '';

            const jobSkills = await getTrendingJobSkills(jobTitle, availableSkills || []);
            const userSkills = user.skills || [];
            const safeJobSkills = Array.isArray(jobSkills) ? jobSkills :
                (jobSkills?.categorizedMaster ? Object.values(jobSkills.categorizedMaster).flat() : []);
            const missing = safeJobSkills.filter(s => !userSkills.includes(s));

            const userProfile = {
                name: user.name || 'the candidate',
                bio: user.bio || '',
                skills: userSkills,
                category: jobCategory
            };

            const result = await getProjectIdeaFromPool(
                jobTitle,
                missing.length > 0 ? missing : (jobEntry?.requiredSkills?.slice(0, 5) || ['Communication', 'Data Analysis']),
                userProfile,
                config
            );

            // Normalize result to prevent UI rendering crashes
            const normalized = {
                projectTitle: result?.projectTitle || 'Untitled Project',
                concept: result?.concept || 'No description provided.',
                targetSector: result?.targetSector || config.industrySector,
                difficulty: result?.difficulty || config.difficulty,
                techStack: Array.isArray(result?.techStack) ? result.techStack : config.selectedTech,
                architecturePattern: result?.architecturePattern || 'Custom Architecture',
                databaseSchema: result?.databaseSchema || 'No schematic details provided.',
                securityScaling: Array.isArray(result?.securityScaling) ? result.securityScaling : [],
                milestones: (Array.isArray(result?.milestones) ? result.milestones : []).map(m => ({
                    title: m?.title || 'General Milestone',
                    tasks: Array.isArray(m?.tasks) ? m.tasks : (Array.isArray(m?.steps) ? m.steps : [])
                })),
                recruiterPrep: (Array.isArray(result?.recruiterPrep) ? result.recruiterPrep : []).map(rp => ({
                    question: rp?.question || 'Interview Question',
                    sampleAnswer: rp?.sampleAnswer || rp?.answer || 'Provide a professional explanation of your implementation details.'
                })),
                readmeMarkdown: result?.readmeMarkdown || '# ' + (result?.projectTitle || 'Untitled Project')
            };

            // Compute local configuration cache tag matching backend hash
            const safeJob = jobTitle.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const configHash = `${config.projectDomain}_${config.projectFormat}_${config.timeline}_${config.difficulty}_${config.industrySector}_${config.selectedTech.sort().join('_')}`.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const cacheKey = `daksh_project_pool_v3_${safeJob}_${configHash}`;
            const cached = localStorage.getItem(cacheKey);
            setCacheStatus(cached ? 'cached' : 'fresh');

            setIdeas(prev => {
                const updated = [...prev, normalized];
                setCursor(updated.length - 1);
                return updated;
            });
        } catch (err) {
            console.error('Roadmap Generation Error:', err);
            setError(`Error: ${err.message || 'AI is currently busy. Please try again.'}`);
            setIsConfiguring(true); // Return to wizard on fail
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!currentIdea || !currentIdea.readmeMarkdown) return;
        haptic.light();
        navigator.clipboard.writeText(currentIdea.readmeMarkdown);
        alert('README.md markdown copied to clipboard successfully!');
    };

    const downloadReadmeFile = () => {
        if (!currentIdea || !currentIdea.readmeMarkdown) return;
        haptic.light();
        const element = document.createElement('a');
        const file = new Blob([currentIdea.readmeMarkdown], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `${currentIdea.projectTitle.toLowerCase().replace(/\s+/g, '_')}_README.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const goToPrev = () => {
        haptic.light();
        setCursor(c => Math.max(0, c - 1));
        setOpenQuestionIndex(null);
    };
    const goToNext = () => {
        haptic.light();
        setCursor(c => Math.min(ideas.length - 1, c + 1));
        setOpenQuestionIndex(null);
    };

    return (
        <div className="project-gen-container">
            {/* Header */}
            <div className="flex flex-col items-center justify-center gap-2 mb-8 text-center">
                <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-dark)' }}>
                    AI Project Builder
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Architect industry-grade portfolio projects aligned with real-world technical criteria.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="glass-card mb-6" style={{ borderColor: '#ef4444', background: 'rgba(239,68,68,0.05)', padding: '1rem' }}>
                    <p style={{ color: '#ef4444', margin: 0, fontWeight: 600 }}>{error}</p>
                </div>
            )}

            {/* Loading Overlay */}
            {loading && (
                <div className="blueprint-card py-16">
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-500 mb-4" size={44} />
                        <h3 className="text-xl font-bold mb-2">Architecting Blueprint Specifications...</h3>
                        <p className="text-sm text-center max-w-md text-muted">
                            Analyzing project domain, schema parameters, scaling standards, and generating README template.
                        </p>
                    </div>
                </div>
            )}

            {/* CONFIGURATOR WIZARD */}
            {!loading && isConfiguring && (
                <div className="blueprint-card text-left">
                    {/* Wizard Steps Indicator */}
                    <div className="wizard-stepper">
                        <div className={`step-dot ${wizardStep >= 1 ? 'active' : ''}`}><span>1</span> Domain & Experience</div>
                        <div className="step-connector"></div>
                        <div className={`step-dot ${wizardStep >= 2 ? 'active' : ''}`}><span>2</span> Format & Industry</div>
                        <div className="step-connector"></div>
                        <div className={`step-dot ${wizardStep >= 3 ? 'active' : ''}`}><span>3</span> Timeline & Technologies</div>
                    </div>

                    <div className="wizard-step-content mt-8">
                        {/* STEP 1: Domain & Experience */}
                        {wizardStep === 1 && (
                            <div className="fade-in-up">
                                <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                                    <Layers size={20} className="text-indigo-500" /> Select Project Classification
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div 
                                        className={`wizard-card-option ${config.projectDomain === 'Software' ? 'selected' : ''}`}
                                        onClick={() => handleDomainChange('Software')}
                                    >
                                        <div className="font-bold text-base mb-1">Software-based</div>
                                        <p className="text-xs text-muted">Web apps, REST/GraphQL APIs, mobile software, and AI integrations.</p>
                                    </div>
                                    <div 
                                        className={`wizard-card-option ${config.projectDomain === 'Hardware/Embedded' ? 'selected' : ''}`}
                                        onClick={() => handleDomainChange('Hardware/Embedded')}
                                    >
                                        <div className="font-bold text-base mb-1">Hardware / Core Engineering</div>
                                        <p className="text-xs text-muted">Robotics, IoT prototypes, custom electrical circuits, microcontrollers.</p>
                                    </div>
                                    <div 
                                        className={`wizard-card-option ${config.projectDomain === 'Business/Management' ? 'selected' : ''}`}
                                        onClick={() => handleDomainChange('Business/Management')}
                                    >
                                        <div className="font-bold text-base mb-1">Business & Product Management</div>
                                        <p className="text-xs text-muted">Product management PRDs, market strategy funnels, and valuation models.</p>
                                    </div>
                                    <div 
                                        className={`wizard-card-option ${config.projectDomain === 'Research/Other' ? 'selected' : ''}`}
                                        onClick={() => handleDomainChange('Research/Other')}
                                    >
                                        <div className="font-bold text-base mb-1">Technical Research & Case Studies</div>
                                        <p className="text-xs text-muted">Academic case study briefs, open-source drafts, and custom data reports.</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <BarChart2 size={20} className="text-indigo-500" /> Choose Challenge Level
                                </h3>
                                <div className="flex flex-wrap gap-3 mb-6">
                                    {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                                        <button 
                                            key={lvl}
                                            className={`difficulty-selector-btn ${config.difficulty === lvl ? 'active' : ''}`}
                                            onClick={() => setConfig(prev => ({ ...prev, difficulty: lvl }))}
                                        >
                                            {lvl === 'Beginner' && '🌱 '}
                                            {lvl === 'Intermediate' && '🚀 '}
                                            {lvl === 'Advanced' && '🔥 '}
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Format & Sector */}
                        {wizardStep === 2 && (
                            <div className="fade-in-up">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Zap size={20} className="text-indigo-500" /> Select Project Format
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                    {(domainFormats[config.projectDomain] || []).map(fmt => (
                                        <div 
                                            key={fmt}
                                            className={`wizard-card-option small ${config.projectFormat === fmt ? 'selected' : ''}`}
                                            onClick={() => setConfig(prev => ({ ...prev, projectFormat: fmt }))}
                                        >
                                            {fmt}
                                        </div>
                                    ))}
                                </div>

                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Target size={20} className="text-indigo-500" /> Select Target Industry Sector
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                    {industrySectors.map(sector => (
                                        <div 
                                            key={sector}
                                            className={`wizard-card-option small ${config.industrySector === sector ? 'selected' : ''}`}
                                            onClick={() => setConfig(prev => ({ ...prev, industrySector: sector }))}
                                        >
                                            {sector}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Timeline & Tech stack */}
                        {wizardStep === 3 && (
                            <div className="fade-in-up">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Rocket size={20} className="text-indigo-500" /> Choose Development Duration
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                                    {[
                                        '1 Week (Weekend sprint & MVP)',
                                        '2 Weeks (Standard development sprint)',
                                        '4 Weeks (Comprehensive production build)'
                                    ].map(timeOption => (
                                        <div 
                                            key={timeOption}
                                            className={`wizard-card-option small ${config.timeline === timeOption ? 'selected' : ''}`}
                                            onClick={() => setConfig(prev => ({ ...prev, timeline: timeOption }))}
                                        >
                                            {timeOption}
                                        </div>
                                    ))}
                                </div>

                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Sparkles size={20} className="text-indigo-500" /> Preferred Tech Stack Selection
                                </h3>
                                <p className="text-xs text-muted mb-3">
                                    Pre-select technologies you wish to practice. We prefilled these from your profile.
                                </p>

                                {/* Chosen Tags List */}
                                {config.selectedTech.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.03)', border: '1px dashed var(--border-color)' }}>
                                        {config.selectedTech.map(tech => (
                                            <span key={tech} className="selected-tech-pill">
                                                {tech}
                                                <button onClick={() => removeTechTag(tech)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Popular choices grid */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {popularTechOptions.map(tech => {
                                        const isSelected = config.selectedTech.includes(tech);
                                        return (
                                            <button 
                                                key={tech} 
                                                className={`tech-select-option ${isSelected ? 'active' : ''}`}
                                                onClick={() => toggleTechSelect(tech)}
                                            >
                                                {tech}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Custom Text Addition */}
                                <div className="flex gap-2 max-w-md">
                                    <input 
                                        type="text" 
                                        placeholder="Add custom technology (e.g. Next.js, Kubernetes)"
                                        value={customTechText}
                                        onChange={(e) => setCustomTechText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTech(); } }}
                                        className="wizard-custom-input"
                                    />
                                    <button 
                                        type="button" 
                                        className="wizard-add-btn"
                                        onClick={addCustomTech}
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Wizard Control Footer */}
                    <div className="wizard-footer mt-8 pt-5 border-t border-dashed" style={{ borderColor: 'var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                        {wizardStep > 1 ? (
                            <button className="frosted-btn secondary" onClick={() => { haptic.light(); setWizardStep(s => s - 1); }}>
                                <ChevronLeft size={16} /> Back
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {wizardStep < 3 ? (
                            <button className="frosted-btn" onClick={() => { haptic.light(); setWizardStep(s => s + 1); }}>
                                Next Step <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button className="frosted-btn generate" onClick={generateNewIdea}>
                                <Sparkles size={18} /> Architect Project Blueprint
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ROADMAP DASHBOARD DISPLAY */}
            {!loading && !isConfiguring && currentIdea && (
                <div className="blueprint-card text-left">
                    
                    {/* Upper Navigation Control Bar */}
                    <div className="dashboard-control-bar mb-6">
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="frosted-btn secondary text-xs" onClick={() => { haptic.light(); setIsConfiguring(true); }}>
                                <Settings size={14} /> Configure New Project
                            </button>
                            <button 
                                className="frosted-btn secondary text-xs" 
                                onClick={() => {
                                    haptic.medium();
                                    if (window.confirm("Are you sure you want to clear your project blueprint history? This cannot be undone.")) {
                                        setIdeas([]);
                                        setCursor(-1);
                                        setIsConfiguring(true);
                                        localStorage.removeItem('daksh_generator_user_ideas');
                                        localStorage.removeItem('daksh_generator_user_cursor');
                                    }
                                }}
                                style={{ borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                            >
                                Clear History
                            </button>
                        </div>

                        <div className="carousel-nav-indicators">
                            <button 
                                onClick={goToPrev} 
                                disabled={cursor === 0}
                                className="carousel-nav-btn"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-bold">
                                Idea {cursor + 1} of {ideas.length}
                            </span>
                            <button 
                                onClick={goToNext} 
                                disabled={cursor === ideas.length - 1}
                                className="carousel-nav-btn"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Blueprint Title Header */}
                    <div className="blueprint-header">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="sector-tag">🇮🇳 {currentIdea.targetSector || 'General Sector'}</span>
                            <span className="domain-tag">{config.projectDomain}</span>
                            {currentIdea.difficulty && (() => {
                                const dc = difficultyColor[currentIdea.difficulty] || difficultyColor['Intermediate'];
                                return (
                                    <span style={{
                                        fontSize: '0.68rem', fontWeight: '800', padding: '3px 10px', borderRadius: '99px',
                                        background: dc.bg, color: dc.text, border: `1px solid ${dc.border}`
                                    }}>
                                        {currentIdea.difficulty}
                                    </span>
                                );
                            })()}
                        </div>

                        <h2 className="text-3xl font-extrabold mb-3 leading-tight" style={{ color: 'var(--text-dark)' }}>
                            {currentIdea.projectTitle}
                        </h2>
                        <p className="text-base text-muted mb-5 leading-relaxed">
                            {currentIdea.concept}
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {(currentIdea.techStack || []).map(tech => (
                                <span key={tech} className="tech-badge-pill">{tech}</span>
                            ))}
                        </div>
                    </div>

                    {/* Tab Navigation Menu */}
                    <div className="tab-menu-nav">
                        <button className={`tab-menu-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { haptic.light(); setActiveTab('overview'); }}>
                            <BookOpen size={16} /> Overview & Pitch
                        </button>
                        <button className={`tab-menu-btn ${activeTab === 'specs' ? 'active' : ''}`} onClick={() => { haptic.light(); setActiveTab('specs'); }}>
                            <Layers size={16} /> Architecture Specs
                        </button>
                        <button className={`tab-menu-btn ${activeTab === 'milestones' ? 'active' : ''}`} onClick={() => { haptic.light(); setActiveTab('milestones'); }}>
                            <FileText size={16} /> Task Checklist
                        </button>
                        <button className={`tab-menu-btn ${activeTab === 'readme' ? 'active' : ''}`} onClick={() => { haptic.light(); setActiveTab('readme'); }}>
                            <FolderPlus size={16} /> Github README
                        </button>
                    </div>

                    {/* Tab 1 Content: Overview & Pitch */}
                    {activeTab === 'overview' && (
                        <div className="tab-body fade-in-up mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Target size={18} className="text-emerald-500" /> Recruiter Appeal
                                    </h3>
                                    <div className="glass-card recruiter-appeal-card mb-6">
                                        <div className="flex items-start gap-3">
                                            <Zap size={22} className="text-amber-500 mt-1 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-sm mb-1">Why recruiters will love this:</h4>
                                                <p className="text-sm leading-relaxed text-muted">{currentIdea.whyThisProject}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recruiter Interview Questions */}
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <HelpCircle size={18} className="text-indigo-500" /> Recruiter Interview Prep
                                    </h3>
                                    <p className="text-xs text-muted mb-4">
                                        Click on the questions below to review potential interview talking points tailored to this project.
                                    </p>

                                    <div className="recruiter-faq-list">
                                        {(currentIdea.recruiterPrep || []).map((prep, idx) => {
                                            const isOpen = openQuestionIndex === idx;
                                            return (
                                                <div 
                                                    key={idx} 
                                                    className={`recruiter-faq-item ${isOpen ? 'active' : ''}`}
                                                    onClick={() => { haptic.light(); setOpenQuestionIndex(isOpen ? null : idx); }}
                                                >
                                                    <div className="faq-question">
                                                        <span>Q{idx + 1}: {prep.question}</span>
                                                        <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                                                    </div>
                                                    {isOpen && (
                                                        <div className="faq-answer text-sm leading-relaxed" onClick={(e) => e.stopPropagation()}>
                                                            <div className="font-bold text-xs text-indigo-500 mb-1">PRO DEVELOPER TALKING POINT:</div>
                                                            {prep.sampleAnswer}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Quick specifications sidebar */}
                                <div>
                                    <div className="glass-card sidebar-stats">
                                        <h4 className="font-bold text-sm mb-3">Project Metadata</h4>
                                        <div className="stat-item">
                                            <span className="lbl">Difficulty</span>
                                            <span className="val">{currentIdea.difficulty}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="lbl">Domain</span>
                                            <span className="val">{config.projectDomain}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="lbl">Timeline</span>
                                            <span className="val">{config.timeline.split(' ')[0]} {config.timeline.split(' ')[1]}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="lbl">Architecture</span>
                                            <span className="val">{currentIdea.architecturePattern || 'Custom'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2 Content: Specifications */}
                    {activeTab === 'specs' && (
                        <div className="tab-body fade-in-up mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                        <Layers size={18} className="text-indigo-500" /> 
                                        {config.projectDomain === 'Hardware/Embedded' ? 'Hardware Component Schematics' : 
                                         config.projectDomain === 'Business/Management' ? 'Funnel Conversion & KPI Schematics' : 
                                         'Database Schema Design'}
                                    </h3>
                                    <p className="text-xs text-muted mb-4">
                                        Recommended layout specifications and field configurations for implementation.
                                    </p>
                                    <div className="code-block-container">
                                        <pre><code>{currentIdea.databaseSchema}</code></pre>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <ShieldCheck size={18} className="text-emerald-500" /> Security & Scaling
                                    </h3>
                                    <div className="security-tips-list">
                                        {(currentIdea.securityScaling || []).map((tip, idx) => (
                                            <div key={idx} className="security-tip-card">
                                                <div className="tip-badge">Tip {idx + 1}</div>
                                                <p className="text-xs text-muted leading-relaxed mt-2">{tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3 Content: Interactive Checklist */}
                    {activeTab === 'milestones' && (
                        <div className="tab-body fade-in-up mt-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <FileText size={18} className="text-indigo-500" /> Interactive Execution Roadmap
                                    </h3>
                                    <p className="text-xs text-muted">
                                        Toggles checklist tasks as you progress. Your progress is saved automatically.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="checklist-progress-ratio">
                                        {Object.values(checkedTasks).filter(Boolean).length} / {currentIdea?.milestones ? currentIdea.milestones.reduce((acc, curr) => acc + (Array.isArray(curr?.tasks) ? curr.tasks.length : 0), 0) : 0} Completed
                                    </span>
                                </div>
                            </div>

                            <div className="milestones-accordion-wrapper">
                                {(currentIdea.milestones || []).map((milestone, mIdx) => (
                                    <div key={mIdx} className="milestone-checkpoint-section">
                                        <div className="milestone-checkpoint-title">
                                            <span className="milestone-label">Milestone {mIdx + 1}</span>
                                            <h4 className="font-bold text-base">{milestone.title}</h4>
                                        </div>
                                        <div className="milestone-checkpoint-tasks mt-3 pl-4 border-l-2 border-indigo-100 dark:border-slate-800 ml-4">
                                            {(milestone.tasks || []).map((task, tIdx) => {
                                                const key = `${mIdx}-${tIdx}`;
                                                const isDone = !!checkedTasks[key];
                                                return (
                                                    <div 
                                                        key={tIdx} 
                                                        className={`interactive-task-row ${isDone ? 'checked' : ''}`}
                                                        onClick={() => handleTaskToggle(key)}
                                                    >
                                                        <div className="task-checkbox">
                                                            {isDone ? <CheckCircle size={16} className="text-indigo-500" /> : <div className="checkbox-empty" />}
                                                        </div>
                                                        <span className="task-text text-sm leading-relaxed">{task}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 4 Content: README Exporter */}
                    {activeTab === 'readme' && (
                        <div className="tab-body fade-in-up mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <FolderPlus size={18} className="text-indigo-500" /> Seed Your Github Repository
                                    </h3>
                                    <p className="text-xs text-muted">
                                        Export this detailed readme draft to make your project portfolio look professional.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="frosted-btn secondary text-xs" onClick={copyToClipboard} style={{ padding: '8px 14px' }}>
                                        <Clipboard size={14} /> Copy
                                    </button>
                                    <button className="frosted-btn text-xs" onClick={downloadReadmeFile} style={{ padding: '8px 14px' }}>
                                        <Download size={14} /> Download .md
                                    </button>
                                </div>
                            </div>

                            <div className="readme-markdown-preview-container">
                                <pre className="markdown-code-preview"><code>{currentIdea.readmeMarkdown}</code></pre>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default ProjectGenerator;
