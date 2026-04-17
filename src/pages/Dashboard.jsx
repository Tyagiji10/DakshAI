import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { useUser } from '../context/UserContext';
import { haptic } from '../lib/haptics';
import { availableSkills, jobLibrary } from '../lib/mockData';
import { getTrendingJobSkills, categorizeSkill } from '../lib/ai';
import {
    Check, Target, User, Sparkles, Camera, Mail, FileText, UploadCloud, AlertCircle, Loader2, Trash2, TrendingUp, Shield, Zap, Star, ArrowRight, Edit2, X, Github, Linkedin, ExternalLink, Rocket, MessageSquare, Lightbulb,
    Plus, Search, ChevronDown, ChevronUp
} from 'lucide-react';
import Cropper from 'react-easy-crop';


// ─── Profile Score Engine ────────────────────────────────────────────────────
function computeProfileScore(user, aiMasterSkills = null, allJobs = jobLibrary) {
    if (!user) return { total: 0, factors: [], matchedSkills: [], missingSkills: [], jobTitle: null };

    const job = allJobs.find(j => j.id === user.targetJob);
    const userSkillsList = user.skills || [];

    // Factor 1: Bio (max 20pts)
    const bioLen = (user.bio || '').trim().length;
    const bioScore = bioLen === 0 ? 0 : bioLen < 40 ? 8 : bioLen < 100 ? 14 : 20;

    // Factor 2: Portfolio / Project Links (max 25pts)
    const links = (user.portfolioLinks || []).length;
    const linkScore = links === 0 ? 0 : links === 1 ? 10 : links === 2 ? 18 : 25;

    // Factor 3: Skill–Dream Job Match (max 35pts)
    let skillScore = 0;
    let matchedSkills = [];
    let missingSkills = [];
    if (job) {
        let masterList = [];
        if (aiMasterSkills) {
            if (aiMasterSkills.categorizedMaster && Object.keys(aiMasterSkills.categorizedMaster).length > 0) {
                // Flatten the unified categorizedMaster for the score
                masterList = Object.values(aiMasterSkills.categorizedMaster).flat();
            } else if (aiMasterSkills.masterList && aiMasterSkills.masterList.length > 0) {
                // Fallback for legacy masterList structure
                masterList = aiMasterSkills.masterList;
            } else if (Array.isArray(aiMasterSkills) && aiMasterSkills.length > 0) {
                masterList = aiMasterSkills;
            }
        }

        if (!masterList || masterList.length === 0) {
            masterList = job.requiredSkills || [];
        }

        matchedSkills = masterList.filter(s => userSkillsList.includes(s));
        missingSkills = masterList.filter(s => !userSkillsList.includes(s));
        skillScore = masterList.length > 0 ? Math.round((matchedSkills.length / masterList.length) * 35) : 0;
    } else if (userSkillsList.length >= 3) {
        skillScore = 10; // partial bonus for having skills but no dream job
    }

    // Factor 4: Dream Job selected (max 20pts)
    const jobScore = user.targetJob ? 20 : 0;

    const total = Math.min(100, bioScore + linkScore + skillScore + jobScore);

    const skillTip = missingSkills.length > 0
        ? 'Add skills: ' + missingSkills.slice(0, 3).join(', ') + '.'
        : (!job ? 'Select a Dream Job to unlock skill matching.' : null);
    return {
        total,
        factors: [
            { label: 'Bio / About', score: bioScore, max: 20, tip: bioLen < 40 ? 'Write at least 40 characters in your bio.' : null, action: 'scroll', target: 'bio-section' },
            { label: 'Project Links', score: linkScore, max: 25, tip: links === 0 ? 'Add at least one project link in Portfolio.' : links < 3 ? 'Add more project links for a higher score.' : null, action: 'navigate', target: '/portfolio' },
            { label: 'Skill Match', score: skillScore, max: 35, tip: skillTip, action: 'scroll', target: 'skills-section' },
            { label: 'Dream Job Set', score: jobScore, max: 20, tip: !user.targetJob ? 'Select your Dream Job below.' : null, action: 'scroll', target: 'dreamjob-section' },
        ],
        matchedSkills,
        missingSkills,
        jobTitle: job ? job.title : 'Target Job',
    };
}

// ─── Animated Ring ───────────────────────────────────────────────────────────
const ScoreRing = memo(({ score, size = 120, stroke = 10 }) => {
    const [display, setDisplay] = useState(0);
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (display / 100) * circ;

    useEffect(() => {
        let frame;
        const start = performance.now();
        const duration = 900;
        const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            setDisplay(Math.round(progress * score));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [score]);

    const color = score >= 80 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444';
    const label = score >= 80 ? 'Excellent' : score >= 55 ? 'Good' : 'Needs Work';

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
                    strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: '800', color, lineHeight: 1 }}>{display}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: '700', color, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '2px' }}>{label}</span>
            </div>
        </div>
    );
});

// ── Static Skill Data (Outside component to prevent re-execution) ────────────────
const DEFAULT_CATEGORIES = [
    { title: "💻 Programming Languages", skills: ["Python", "Java", "C", "C++", "C#", "JavaScript", "TypeScript", "HTML & CSS", "Go", "Rust", "Swift", "Kotlin", "Ruby", "Haskell", "Lisp", "Scheme", "F#", "OCaml", "Erlang", "Elixir", "Bash", "PowerShell", "Perl", "Lua", "PHP", "SQL", "R", "MATLAB", "SAS", "Verilog", "VHDL", "Julia", "Elm", "Crystal", "Nim"] },
    { title: "🚀 Frameworks", skills: ["React", "Angular", "Vue.js", "Svelte", "Next.js", "Django", "Flask", "Spring Boot", "ASP.NET Core", "React Native", "Flutter", "SwiftUI", "Jetpack Compose", "Xamarin", "Express.js", "FastAPI", "NestJS", "Ruby on Rails", "Node.js", "Tailwind CSS", "Redux", "Bootstrap"] },
    { title: "📚 Libraries", skills: ["Lodash", "D3.js", "Chart.js", "Axios", "NumPy", "Pandas", "Matplotlib", "Seaborn", "Requests", "Guava", "Apache Commons", "Hibernate", "Boost", "OpenCV", "Eigen", "TensorFlow", "PyTorch", "Scikit-learn", "Keras"] },
    { title: "☁️ Data & Cloud", skills: ["MySQL", "PostgreSQL", "MongoDB", "Oracle", "Redis", "Cassandra", "Neo4j", "NoSQL", "Hadoop", "Spark", "Kafka", "Flink", "AWS", "Azure", "GCP", "IBM Cloud", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions"] },
    { title: "⚙️ Engineering & Tools", skills: ["Git", "GitHub", "Version Control", "VS Code", "Postman", "npm", "Yarn", "Webpack", "Vite", "Babel", "Jupyter Notebook", "AutoCAD", "SolidWorks", "Simulink", "Excel", "Tableau", "PowerBI", "SAP", "ERP Systems", "SPSS", "LaTeX", "EndNote", "NVivo"] },
    { title: "💼 Core & Soft Skills", skills: ["Algorithms", "Data Structures", "System Design", "Networking", "Security", "Cloud Architecture", "Cybersecurity", "Software Engineering", "Machine Learning", "Testing & Debugging", "APIs", "REST/GraphQL", "Responsive Design", "Web Performance Optimization", "Communication", "Leadership", "Collaboration", "Critical Thinking", "Problem Solving", "Adaptability", "Teamwork", "Innovation", "Agile", "Scrum", "Agile/Scrum", "Stakeholder Management", "Strategic Management", "Business Analytics", "Financial Modeling", "Operations Management", "Brand Management", "Market Research", "Negotiation", "Decision-Making", "Data Analysis", "Statistics", "Research Methodology", "Academic Writing", "Presentation Skills", "Biotechnology", "Physics", "Chemistry", "Mathematics", "CAD/CAM", "Embedded Systems", "AI/ML", "Data Science"] }
];

// ── Shared Sub-Components (Memoized for Performance) ─────────────────────────
const MatchAnalysisPanel = memo(({ matchPercentage, ps, handleAddSkillWithAi, navigate, strategicSuggestions, user }) => (
    <div className="skill-gap-analyzer-panel panel-animate stagger-1 relative z-10">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <Target size={22} className="text-indigo-500" />
                <h2 className="text-xl font-extrabold m-0" style={{ color: 'var(--text-dark)' }}>AI Skill Gap Analyzer</h2>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Comparing your skills for: <span className="font-bold text-indigo-500">{ps.jobTitle}</span>
            </p>
        </div>

        <div className="analyzer-grid">
            <div className="analyzer-column">
                <div className="analyzer-card">
                    <div className="flex justify-between items-end mb-2">
                        <h3 className="text-2xl font-black m-0" style={{ color: 'var(--text-dark)' }}>{matchPercentage}% Match</h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${matchPercentage >= 70 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                            {matchPercentage >= 70 ? 'Ready for Hire' : 'Gaps to bridge'}
                        </span>
                    </div>
                    <div className="match-bar-container">
                        <div className={`match-bar-fill ${matchPercentage >= 80 ? 'rainbow-bar' : ''}`} style={{ width: `${matchPercentage}%`, background: matchPercentage >= 80 ? undefined : matchPercentage >= 55 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
                    </div>
                </div>

                <div className="analyzer-card">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-indigo-500/10 pb-2" style={{ color: 'var(--text-muted)' }}>
                        <TrendingUp size={14} className="text-amber-500" /> Career Trajectory Match
                    </h4>
                    <div className="flex flex-col gap-2.5">
                        {strategicSuggestions.length > 0 ? strategicSuggestions.map((s, i) => (
                            <div key={i} className="suggestion-item">
                                <div className="suggestion-bullet" style={{ background: 'var(--primary-blue)' }}></div>
                                <span className="text-[13px] leading-relaxed">{s}</span>
                            </div>
                        )) : (
                            <p className="text-xs font-bold text-success flex items-center gap-2"><Check size={14} /> Profile is fully optimized!</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="analyzer-column">
                <div className="analyzer-card h-full">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-indigo-500/10 pb-2" style={{ color: 'var(--text-muted)' }}>
                        <Check size={14} className="text-success" /> Acquired Skills
                    </h4>
                    <div className="skill-tag-list">
                        {user.skills && user.skills.length > 0 ? (
                            [...user.skills]
                            .map(s => (typeof s === 'string' ? s : s?.name || ''))
                            .filter(Boolean)
                            .sort((a,b) => {
                                const matched = ps?.matchedSkills || [];
                                return (matched.includes(b) ? 1 : 0) - (matched.includes(a) ? 1 : 0);
                            })
                            .map(s => {
                                const isMatched = (ps?.matchedSkills || []).includes(s);
                                return (
                                    <span 
                                        key={s || Math.random().toString()} 
                                        className={`skill-tag-mini acquired ${isMatched ? 'golden shadow-sm' : 'opacity-40 grayscale'} transition-all`}
                                        title={isMatched ? "High Priority: Required for target job" : "Standard Inventory Skill"}
                                    >
                                        {s}
                                    </span>
                                );
                            })
                        ) : (
                            <p className="text-xs italic text-muted">No skills added yet.</p>
                        )}
                    </div>
                </div>
                <div className="analyzer-card h-full">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-indigo-500/10 pb-2" style={{ color: 'var(--text-muted)' }}>
                        <Zap size={14} className="text-error" /> Top Missing Skills
                    </h4>
                    <div className="skill-tag-list">
                        {ps.missingSkills.length > 0 ? ps.missingSkills.slice(0, 12).map(s => (
                            <span key={s} className="skill-tag-mini missing cursor-pointer hover:bg-red-500 hover:text-white transition-all active:scale-95" onClick={() => handleAddSkillWithAi(s, false)} title="Add to profile">
                                + {s}
                            </span>
                        )) : <p className="text-xs font-bold text-success">Perfect Match!</p>}
                    </div>
                </div>
            </div>
        </div>

        <div className="analyzer-footer border-t border-indigo-500/5 mt-4 pt-4">
            <button className="smart-path-btn group" onClick={() => navigate('/learning')}>
                <TrendingUp size={18} /> View Dynamic Learning Path <ArrowRight size={16} className="ml-auto group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    </div>
));

const DreamJobSection = memo(({ jobLibrary, user, updateTargetJob, categorizedMissingSkills, handleAddSkillWithAi, ps, isAiLoadingSkills, aiMasterSkills, customJobInput, setCustomJobInput, handleAddCustomJob }) => (
    <div className="glass-card panel-animate stagger-2 relative z-10" id="dreamjob-section" style={{ borderLeft: '6px solid var(--accent-green)' }}>
        <div className="flex items-center gap-2 mb-1">
            <Rocket className="text-success" size={24} />
            <h2 className="text-2xl font-bold m-0" style={{ color: 'var(--text-dark)' }}>AI Career Blueprint</h2>
        </div>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{aiMasterSkills?.roleMotivation || "Select your goal to instantly synchronize AI skill recommendations."}</p>

        <div className="dreamjob-layout">
            <div className="job-sidebar">
                <div className="job-grid">
                    {jobLibrary.map(job => (
                        <div key={job.id} onClick={() => updateTargetJob(job.id)}
                            className={`job-card ${user.targetJob === job.id ? 'selected' : ''}`}>
                            <div className="flex-1">
                                <div className="job-title font-bold text-sm mb-1">{job.title}</div>
                                <div className="text-[10px] font-black uppercase opacity-60 tracking-wider text-muted">{job.category}</div>
                            </div>
                            {user.targetJob === job.id ? <div className="bg-white/20 rounded-full p-1"><Check size={14} strokeWidth={4} /></div> : <Target size={18} className="opacity-30" />}
                        </div>
                    ))}
                    {/* Custom Job Input */}
                    <div className="job-card !p-3 !bg-transparent border-dashed border-2 hover:border-indigo-400 opacity-70 hover:opacity-100 transition-all flex flex-col justify-center items-center cursor-default group">
                        <form onSubmit={handleAddCustomJob} className="w-full flex items-center gap-2 m-0">
                            <input
                                type="text"
                                value={customJobInput || ''}
                                onChange={(e) => setCustomJobInput(e.target.value)}
                                placeholder="Type custom role. press Enter"
                                className="w-full text-[11px] bg-transparent border-b border-slate-300 dark:border-slate-700 outline-none focus:border-indigo-500 py-1 font-bold text-center group-hover:placeholder-indigo-400"
                            />
                            {customJobInput && <button type="submit" className="text-indigo-500 hover:text-indigo-700 active:scale-95"><Plus size={16} /></button>}
                        </form>
                    </div>
                </div>
            </div>

            <div className="suggestions-side-panel shadow-inner">
                {user.targetJob ? (
                    <>
                        <div className="flex items-center gap-2 mb-4 border-b border-indigo-500/10 pb-3">
                            <Sparkles size={18} className="text-indigo-500" />
                            <h4 className="text-sm font-black m-0" style={{ color: 'var(--text-dark)' }}>AI Strategy for {ps.jobTitle}</h4>
                        </div>

                        {isAiLoadingSkills ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Loader2 className="animate-spin text-indigo-500" size={32} />
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-600/50">Analyzing Blueprint...</span>
                            </div>
                        ) : aiMasterSkills ? (
                            <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                                {/* Market Pulse Cards */}
                                <div>
                                    <div className="market-pulse-grid" style={{ marginBottom: '0.5rem' }}>
                                        <div className="market-pulse-card">
                                            <span className="text-[9px] font-black uppercase text-indigo-500 block mb-1">Expected Salary</span>
                                            <div className="text-sm font-bold text-indigo-700">{aiMasterSkills.marketPulse?.salaryRange}</div>
                                        </div>
                                        <div className="market-pulse-card">
                                            <span className="text-[9px] font-black uppercase text-indigo-500 block mb-1">Market Demand</span>
                                            <div className="text-sm font-bold text-indigo-700">{aiMasterSkills.marketPulse?.demand}</div>
                                        </div>
                                    </div>
                                    <div className="text-[9px] font-bold italic opacity-60 text-right px-2" style={{ color: 'var(--text-muted)' }}>* This is AI-generated expected data for the current market.</div>
                                </div>

                                {/* Career Strategy */}
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/70 mb-3 block">Strategic Advice</span>
                                    <div className="flex flex-col gap-3">
                                        {aiMasterSkills.careerInsights?.map((tip, idx) => (
                                            <div key={idx} className="strategy-tip-card">
                                                <Lightbulb size={12} className="flex-shrink-0 text-amber-500 mt-1" />
                                                <span>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Skills Header */}
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/70 mb-3 block">Priority Skills to Add</span>
                                    {Object.keys(categorizedMissingSkills).length > 0 ? Object.entries(categorizedMissingSkills).map(([cat, skills]) => (
                                        <div key={cat} className="mb-4">
                                            <span className="text-[9px] font-bold text-muted mb-2 block">{cat}</span>
                                            <div className="flex flex-wrap gap-2">
                                                {skills.map(s => (
                                                    <button key={s} onClick={() => handleAddSkillWithAi(s, false)}
                                                        className="blueprint-skill-btn">
                                                        + {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-xs font-bold text-success flex items-center gap-2"><Check size={16} /> All skills acquired!</p>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center opacity-40">
                        <Target size={48} className="mb-4" />
                        <p className="text-sm font-extrabold uppercase tracking-widest px-8 leading-relaxed">Select a dream job to unlock your real-time career roadmap</p>
                    </div>
                )}
            </div>
        </div>
    </div>
));

const SkillsAccordion = memo(({ categories, user, openCategories, toggleCategory, toggleSkill, skillSearchQuery, setSkillSearchQuery, isCategorizingSkill, handleAddSkillWithAi, newSkillsInput, setNewSkillsInput, handleAddCustomSkill, handleClearAllSkills }) => (
    <div className="glass-card panel-animate stagger-3 relative z-10" id="skills-section">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <Shield className="text-indigo-500" size={24} />
                <h2 className="text-2xl font-bold m-0" style={{ color: 'var(--text-dark)' }}>Skills Inventory</h2>
            </div>
            {user.skills?.length > 0 && (
                <button
                    onClick={handleClearAllSkills}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-red-100 text-red-600 border border-red-200 hover:bg-red-700 hover:border-red-700 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-600 dark:hover:border-red-600 dark:hover:text-white"
                >
                    <Trash2 size={14} /> Clear All
                </button>
            )}
        </div>

        <div className="skills-search-container mb-8">
            <div className="relative flex items-center">
                <Search className="search-icon" size={18} />
                <input type="text" className="skills-search-input" placeholder="Search toolkit..." value={skillSearchQuery} onChange={(e) => setSkillSearchQuery(e.target.value)} />
                {isCategorizingSkill && <div className="absolute right-4 flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full animate-pulse border border-indigo-200">AI Thinking...</div>}
            </div>
            {skillSearchQuery && (
                <div className="search-results-dropdown shadow-2xl">
                    {categories.flatMap(c => c.skills).filter(s => s.toLowerCase().includes(skillSearchQuery.toLowerCase())).slice(0, 6).map(s => (
                        <div key={s} className="search-result-item" onClick={() => { toggleSkill(s); setSkillSearchQuery(""); }}>
                            <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${user.skills.includes(s) ? 'bg-success' : 'bg-slate-300'}`} /><span>{s}</span></div>
                            {user.skills.includes(s) ? <Check size={16} className="text-success" /> : <Plus size={16} />}
                        </div>
                    ))}
                    {!categories.flatMap(c => c.skills).some(s => s.toLowerCase() === skillSearchQuery.toLowerCase()) && (
                        <div className="search-result-item border-t border-dashed mt-2 pt-2 text-indigo-500 font-black" onClick={() => handleAddSkillWithAi(skillSearchQuery)}>
                            <Sparkles size={16} /> Add "{skillSearchQuery}" with AI Categorization
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="panel-scroll">
            {categories.map(cat => {
                const isOpen = openCategories[cat.title];
                const activeCount = cat.skills.filter(s => user.skills.includes(s)).length;
                return (
                    <div key={cat.title} className="collapsible-category shadow-sm hover:shadow-md transition-shadow">
                        <div className="category-header" onClick={() => toggleCategory(cat.title)}>
                            <div className="category-icon-label">
                                <span className="font-extrabold text-[15px]">{cat.title}</span>
                                {activeCount > 0 && <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] uppercase font-black">{activeCount} Selected</span>}
                            </div>
                            {isOpen ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
                        </div>
                        {isOpen && (
                            <div className="category-content stagger-fade-in">
                                {cat.skills.map(s => {
                                    const active = user.skills.includes(s);
                                    return <button key={s} onClick={() => toggleSkill(s)} className={`pill-button transition-all duration-200 ${active ? 'active scale-105' : 'hover:scale-105 hover:border-indigo-500'}`}>{s} {active && <Check size={12} strokeWidth={4} />}</button>;
                                })}
                                <form onSubmit={(e) => handleAddCustomSkill(e, cat.title)} className="inline-flex m-0">
                                    <input type="text" placeholder="+ Add custom" value={newSkillsInput[cat.title] || ''} onChange={(e) => setNewSkillsInput(prev => ({ ...prev, [cat.title]: e.target.value }))} className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 dark:border-slate-700 bg-transparent text-[11px] outline-none focus:border-indigo-500 transition-all w-24 text-muted focus:text-indigo-600 focus:bg-white dark:focus:bg-slate-800" />
                                </form>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
));

const Dashboard = () => {
    const { user, updateSkills, updateTargetJob, setUser, loading } = useUser();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Categories in state for custom additions
    const [categories, setCategories] = React.useState(DEFAULT_CATEGORIES);

    const [newSkillsInput, setNewSkillsInput] = useState({});

    // Profile Enhancements State
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");
    const [isHoveringName, setIsHoveringName] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isEditingSocialLinks, setIsEditingSocialLinks] = useState(false);
    const [isSavingPhoto, setIsSavingPhoto] = useState(false);
    const socialLinksRef = useRef(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [isWelcomeFadingOut, setIsWelcomeFadingOut] = useState(false);
    const [activeFlash, setActiveFlash] = useState(null);

    // Skill Search & Categorization State
    const [skillSearchQuery, setSkillSearchQuery] = useState("");
    const [isCategorizingSkill, setIsCategorizingSkill] = useState(false);
    const [openCategories, setOpenCategories] = useState({
        "💻 Programming Languages": true,
        "🚀 Frameworks & Libraries": true
    });

    useEffect(() => {
        const hasBeenWelcomed = sessionStorage.getItem('daksh_welcomed');

        // If already shown in this session, or already showing right now, skip
        if (hasBeenWelcomed === 'true' || showWelcome) return;

        // Trigger only when user name is finally loaded
        if (user?.name) {
            console.log("Daksh.AI: Showing Welcome Screen for", user.name);
            setShowWelcome(true);
            sessionStorage.setItem('daksh_welcomed', 'true');

            // Cycle the overlay: Stay for 2s, Fade for 0.6s
            // We intentionally don't clear these for this specific one-shot UI
            // to ensure it clears even if the component re-renders during init.
            setTimeout(() => {
                setIsWelcomeFadingOut(true);
                setTimeout(() => {
                    setShowWelcome(false);
                }, 600);
            }, 2000);
        }
    }, [user.name]);

    // AI Missing Skills Logic
    const [aiMasterSkills, setAiMasterSkills] = useState(null);
    const [isAiLoadingSkills, setIsAiLoadingSkills] = useState(false);

    // Custom Jobs State
    const [customJobs, setCustomJobs] = useState(() => {
        const saved = localStorage.getItem('daksh_custom_jobs');
        return saved ? JSON.parse(saved) : [];
    });
    const [customJobInput, setCustomJobInput] = useState("");
    const allJobs = React.useMemo(() => [...jobLibrary, ...customJobs], [customJobs]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (socialLinksRef.current && !socialLinksRef.current.contains(event.target)) {
                setIsEditingSocialLinks(false);
            }
        };
        if (isEditingSocialLinks) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isEditingSocialLinks]);

    useEffect(() => {
        if (!user.targetJob) {
            setAiMasterSkills(null);
            return;
        }

        const fetchSkills = async () => {
            const jobTitle = allJobs.find(j => j.id === user.targetJob)?.title;
            if (!jobTitle) return;

            setIsAiLoadingSkills(true);
            try {
                // Fetch the master required skills and personalized missing skills
                const aiData = await getTrendingJobSkills(jobTitle, availableSkills, user.skills);
                setAiMasterSkills(aiData);
            } catch (err) {
                console.error("Failed to load AI master skills", err);
                setAiMasterSkills(null);
            } finally {
                setIsAiLoadingSkills(false);
            }
        };

        fetchSkills();
    }, [user.targetJob, user.skills?.length]);

    // ── Optimized Handlers (useCallback for stability) ────────────────────────
    const handleClearAllSkills = React.useCallback(async () => {
        haptic.medium();
        if (window.confirm("Are you sure you want to clear all your selected skills?")) {
            await updateSkills([]);
        }
    }, [updateSkills]);

    const handleAddCustomJob = React.useCallback((e) => {
        e.preventDefault();
        haptic.medium();
        const title = customJobInput.trim();
        if (!title) return;
        const newId = 'custom-' + Date.now();
        const newJob = { id: newId, title: title, category: 'Custom Job', requiredSkills: [] };

        const updated = [...customJobs, newJob];
        setCustomJobs(updated);
        localStorage.setItem('daksh_custom_jobs', JSON.stringify(updated));

        updateTargetJob(newId);
        setCustomJobInput("");
    }, [customJobInput, customJobs, updateTargetJob]);

    const toggleSkill = React.useCallback(async (skillName) => {
        haptic.light();
        if (!user.skills) return;
        const newSkills = user.skills.includes(skillName)
            ? user.skills.filter(s => s !== skillName)
            : [...user.skills, skillName];
        await updateSkills(newSkills);
    }, [user.skills, updateSkills]);

    const handleAddCustomSkill = React.useCallback((e, categoryTitle) => {
        e.preventDefault();
        haptic.light();
        const skill = newSkillsInput[categoryTitle]?.trim();
        if (!skill) return;

        setCategories(prev => prev.map(c => {
            if (c.title === categoryTitle && !c.skills.includes(skill)) {
                return { ...c, skills: [...c.skills, skill] };
            }
            return c;
        }));

        if (!user.skills.includes(skill)) {
            updateSkills([...user.skills, skill]);
        }

        setNewSkillsInput(prev => ({ ...prev, [categoryTitle]: "" }));
    }, [newSkillsInput, user.skills, updateSkills]);

    // AI Powered Skill Adding
    const handleAddSkillWithAi = React.useCallback(async (skillName, shouldScroll = true) => {
        if (!skillName || isCategorizingSkill) return;
        haptic.medium();
        setIsCategorizingSkill(true);
        if (shouldScroll) {
            setSkillSearchQuery(""); // Clear search only if scrolling to it
        }

        try {
            const categoryNames = categories.map(c => c.title.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/g, ''));
            const category = await categorizeSkill(skillName, categoryNames);

            // Map the AI response back to the full title (with emoji)
            const fullCategoryTitle = categories.find(c => c.title.includes(category))?.title || "💼 Core & Soft Skills";

            // Update user profile
            if (!user.skills.includes(skillName)) {
                await updateSkills([...user.skills, skillName]);
            }

            // Also update the local categories state so the new skill appears in the list
            setCategories(prev => prev.map(c => {
                if (c.title === fullCategoryTitle && !c.skills.includes(skillName)) {
                    return { ...c, skills: [...c.skills, skillName] };
                }
                return c;
            }));

            // Ensure category is open to show the new skill
            setOpenCategories(prev => ({ ...prev, [fullCategoryTitle]: true }));

            // Smooth scroll only if requested
            if (shouldScroll) {
                setTimeout(() => {
                    const el = document.getElementById('skills-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }

        } catch (error) {
            console.error("Failed to add skill with AI:", error);
        } finally {
            setIsCategorizingSkill(false);
        }
    }, [isCategorizingSkill, user.skills, categories, updateSkills]);

    const toggleCategory = (title) => {
        haptic.light();
        setOpenCategories(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const handleFactorClick = React.useCallback((factor) => {
        haptic.light();
        if (factor.action === 'navigate') {
            navigate(factor.target);
        } else if (factor.action === 'scroll') {
            const el = document.getElementById(factor.target);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setActiveFlash(factor.target);
                setTimeout(() => setActiveFlash(null), 1500);
            }
        }
    }, [navigate]);

    const handleBioChange = (e) => {
        setUser({ ...user, bio: e.target.value });
    };

    const handleSaveName = () => {
        haptic.medium();
        setUser({ ...user, name: editNameValue });
        setIsEditingName(false);
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToCrop(reader.result);
                setCropModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = null;
    };

    const handleCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleRemovePhoto = () => {
        haptic.medium();
        setUser({ ...user, photoURL: null });
    };

    const generateCroppedImage = () => {
        if (!imageToCrop || !croppedAreaPixels) {
            console.warn("Daksh.AI: Missing crop data. Operation aborted.");
            setCropModalOpen(false);
            return;
        }

        setIsSavingPhoto(true);
        try {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Ensure valid dimensions
                if (croppedAreaPixels.width <= 0 || croppedAreaPixels.height <= 0) {
                    throw new Error("Invalid crop dimensions");
                }

                canvas.width = croppedAreaPixels.width;
                canvas.height = croppedAreaPixels.height;

                ctx.drawImage(
                    img,
                    croppedAreaPixels.x,
                    croppedAreaPixels.y,
                    croppedAreaPixels.width,
                    croppedAreaPixels.height,
                    0,
                    0,
                    croppedAreaPixels.width,
                    croppedAreaPixels.height
                );

                const finalCanvas = document.createElement('canvas');
                const MAX_SIZE = 250; // Optimized size for Firestore and speed
                const size = Math.min(MAX_SIZE, canvas.width);
                finalCanvas.width = size;
                finalCanvas.height = size;

                finalCanvas.getContext('2d').drawImage(canvas, 0, 0, size, size);

                // Use JPEG for smaller base64 payloads
                const compressedBase64 = finalCanvas.toDataURL('image/jpeg', 0.7);

                if (compressedBase64.length > 800000) {
                    throw new Error("Image too large for Firestore sync");
                }

                setUser({ ...user, photoURL: compressedBase64 });
                setCropModalOpen(false);
                setImageToCrop(null);
                setIsSavingPhoto(false);
            };
            img.onerror = () => { throw new Error("Image failed to load"); };
            img.src = imageToCrop;
        } catch (err) {
            console.error("❌ Cropping Error:", err);
            alert("Failed to process image. Please try a different photo.");
            setCropModalOpen(false);
            setIsSavingPhoto(false);
        }
    };


    // ── Optimized Logic Memoization ──────────────────────────────────────────
    const ps = React.useMemo(() => computeProfileScore(user, aiMasterSkills, allJobs), [user, aiMasterSkills, allJobs]);

    const psColor = React.useMemo(() => ps?.total >= 80 ? '#10b981' : ps?.total >= 55 ? '#f59e0b' : '#ef4444', [ps?.total]);
    const psLabel = React.useMemo(() => ps?.total >= 80 ? '🏆 Top Tier' : ps?.total >= 55 ? '📈 Growing' : '⚡ Just Starting', [ps?.total]);

    const psSummary = React.useMemo(() => ps?.total >= 80
        ? ('🎉 Outstanding! You match ' + (ps.matchedSkills?.length || 0) + ' skills for ' + (ps.jobTitle || 'your dream role') + '.')
        : ps?.total >= 55
            ? ('Good progress! ' + (ps.missingSkills?.length > 0 ? 'Add ' + ps.missingSkills.slice(0, 2).join(', ') + ' to boost your job match.' : 'Keep filling in your profile.'))
            : 'Your profile needs more info. Complete the tips below to improve your score.', [ps]);

    const matchPercentage = React.useMemo(() => ps.jobTitle && ps.jobTitle !== 'Target Job'
        ? Math.round((ps.matchedSkills.length / (ps.matchedSkills.length + ps.missingSkills.length || 1)) * 100) || 0
        : 0, [ps]);

    const strategicSuggestions = React.useMemo(() => {
        if (aiMasterSkills?.careerInsights?.length > 0) {
            return aiMasterSkills.careerInsights;
        }
        return [
            `Focus on mastering ${ps.missingSkills[0] || 'specialized tools'} to stand out in the ${ps.jobTitle} market.`,
            `Leverage your strength in ${ps.matchedSkills[0] || 'your core skills'} to tackle complex real-world projects.`,
            `Acquiring ${ps.missingSkills[1] || 'complementary skills'} will significantly improve your strategic value.`
        ];
    }, [ps, aiMasterSkills]);

    const categorizedMissingSkills = React.useMemo(() => {
        const missing = {};
        if (user?.targetJob && ps?.missingSkills?.length > 0) {
            if (aiMasterSkills && aiMasterSkills.categorizedMaster && Object.keys(aiMasterSkills.categorizedMaster).length > 0) {
                // Guarantee consistency by filtering the AI's categorizedMaster in-memory
                Object.entries(aiMasterSkills.categorizedMaster).forEach(([cat, skills]) => {
                    const m = skills.filter(s => !user.skills.includes(s));
                    if (m.length > 0) {
                        missing[cat] = m;
                    }
                });
            } else if (aiMasterSkills && aiMasterSkills.categorizedMissing && Object.keys(aiMasterSkills.categorizedMissing).length > 0) {
                // Fallback for transition
                Object.assign(missing, aiMasterSkills.categorizedMissing);
            } else {
                // Fallback to local categorization if AI failed
                ps.missingSkills.forEach(skill => {
                    let foundCategory = "Other Needed Skills";
                    categories.forEach(cat => {
                        if (cat.skills?.includes(skill)) {
                            foundCategory = cat.title;
                        }
                    });
                    if (!missing[foundCategory]) {
                        missing[foundCategory] = [];
                    }
                    missing[foundCategory].push(skill);
                });
            }
        }
        return missing;
    }, [user.targetJob, ps.missingSkills, aiMasterSkills, categories, user.skills]);

    return (
        <>
            {/* Welcome Glass Animation - Outside perspective wrapper for fixed positioning */}
            {showWelcome && (
                <div className="welcome-overlay">
                    <div className={`welcome-glass-card ${isWelcomeFadingOut ? 'fading-out' : ''}`}>
                        <p className="welcome-title">Welcome back,</p>
                        <h1 className="welcome-user-name">{user.name || 'Student'}</h1>
                    </div>
                </div>
            )}

            <div className="dashboard-wrapper fade-in relative min-h-full perspective-container">
                <div className="bg-blob"></div>
                <div className="bg-blob-2"></div>

                <div className="flex items-center gap-2 mb-6 relative z-10">
                    <h1 className="gradient-persona-text" style={{ letterSpacing: '-0.03em' }}>
                        Your Persona
                    </h1>
                </div>

                <div className="dashboard-top-row relative z-10">

                    {/* Profile Card Enhanced */}
                    <div className="glass-card tilt-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ height: '110px', background: 'linear-gradient(135deg, var(--primary-blue), var(--accent-green))', position: 'relative' }}>
                            <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                        </div>

                        <div style={{ padding: '0 2rem 2rem 2rem', position: 'relative' }}>
                            <div style={{ marginTop: '-65px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                                    <div className="relative group" style={{ width: '130px', height: '130px' }}>
                                        <img
                                            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'Daksh.AI'}&mouth=smile&backgroundColor=e2e8f0`}
                                            alt="Profile"
                                            style={{ width: '100%', height: '100%', borderRadius: '50%', border: '4px solid var(--glass-bg)', backgroundColor: 'var(--primary-white)', objectFit: 'cover', boxShadow: 'var(--shadow-md)' }}
                                        />
                                        <div className="absolute inset-0 flex-col gap-1 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.65)', borderRadius: '50%', display: 'flex' }}>
                                            {user.photoURL && (
                                                <button
                                                    onClick={handleRemovePhoto}
                                                    className="transition-all duration-300"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#ef4444',
                                                        fontSize: '0.65rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontWeight: 'bold',
                                                        opacity: 0,
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                                                >
                                                    <Trash2 size={13} /> Remove
                                                </button>
                                            )}

                                            <button onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                                <Camera size={13} /> {user.photoURL ? 'Change' : 'Upload'}
                                            </button>

                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                    </div>

                                    {/* Social Links - Top Right Corner */}
                                    <div ref={socialLinksRef} style={{ position: 'absolute', right: '1.5rem', top: '2.2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem', zIndex: 50 }}>

                                        <div className="badge pro-badge-gold" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.2rem', background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', color: '#7a4a06', border: '1px solid #f6d365', fontWeight: '800', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                            <style>{`
                                            .pro-badge-gold {
                                                animation: shimmerPro 3s infinite linear;
                                                background-size: 200% auto !important;
                                            }
                                            @keyframes shimmerPro {
                                                0% { background-position: 0% 50%; }
                                                50% { background-position: 100% 50%; }
                                                100% { background-position: 0% 50%; }
                                            }
                                        `}</style>
                                            <Sparkles size={12} className="animate-pulse" /> Pro Member
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            {/* GitHub Icon - always shows */}
                                            {user.github ? (
                                                <a href={user.github} target="_blank" rel="noreferrer" title="View GitHub" style={{ color: '#24292e', opacity: 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                                    <Github size={22} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                                </a>
                                            ) : (
                                                <Github size={22} style={{ color: '#6e7681', opacity: 0.4 }} title="No GitHub linked" />
                                            )}

                                            {/* LinkedIn Icon - always shows */}
                                            {user.linkedin ? (
                                                <a href={user.linkedin} target="_blank" rel="noreferrer" title="View LinkedIn" style={{ color: '#0077b5', opacity: 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                                    <Linkedin size={22} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
                                                </a>
                                            ) : (
                                                <Linkedin size={22} style={{ color: '#0077b5', opacity: 0.4 }} title="No LinkedIn linked" />
                                            )}

                                            {/* Edit Pencil icon */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsEditingSocialLinks(!isEditingSocialLinks);
                                                }}
                                                style={{
                                                    background: 'white',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--primary-blue)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '7px',
                                                    borderRadius: '10px',
                                                    transition: 'all 0.2s',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'var(--primary-blue)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                                                title="Update Social Links"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>

                                        {/* Edit Modal (Popup) */}
                                        {isEditingSocialLinks && (
                                            <div className="fade-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: 'var(--primary-white)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--primary-blue)', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: '260px', animation: 'scaleUp 0.2s ease' }}>
                                                <style>{`
                                                @keyframes scaleUp {
                                                    from { transform: scale(0.95); opacity: 0; }
                                                    to { transform: scale(1); opacity: 1; }
                                                }
                                            `}</style>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Update Links</h4>
                                                    <div style={{ position: 'relative' }}>
                                                        <Github size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                        <input
                                                            type="url"
                                                            placeholder="GitHub Profile URL"
                                                            value={user.github || ''}
                                                            onChange={e => setUser({ ...user, github: e.target.value })}
                                                            style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', outline: 'none' }}
                                                        />
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <Linkedin size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#0a66c2' }} />
                                                        <input
                                                            type="url"
                                                            placeholder="LinkedIn Profile URL"
                                                            value={user.linkedin || ''}
                                                            onChange={e => setUser({ ...user, linkedin: e.target.value })}
                                                            style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', outline: 'none' }}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => setIsEditingSocialLinks(false)}
                                                        style={{ background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.2rem' }}
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>

                            <div>
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 mb-2" style={{ marginTop: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={editNameValue}
                                            onChange={(e) => setEditNameValue(e.target.value)}
                                            style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--primary-blue)', background: 'var(--bg-light)', color: 'var(--text-dark)', outline: 'none', fontSize: '1.2rem', fontWeight: 'bold', width: '200px' }}
                                            autoFocus
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                                        />
                                        <button onClick={handleSaveName} style={{ background: 'var(--primary-blue)', color: '#fff', border: 'none', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Save Name"><Check size={18} /></button>
                                        <button onClick={() => setIsEditingName(false)} style={{ background: 'var(--bg-light)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Cancel"><X size={18} /></button>
                                    </div>
                                ) : (
                                    <h2
                                        onMouseEnter={() => setIsHoveringName(true)}
                                        onMouseLeave={() => setIsHoveringName(false)}
                                        style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', width: 'fit-content', fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', cursor: 'default' }}
                                    >
                                        {user.name || 'Student'}
                                        <button
                                            onClick={() => { setEditNameValue(user.name || ''); setIsEditingName(true); }}
                                            title="Rename user"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--primary-blue)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: isHoveringName ? 1 : 0,
                                                transition: 'opacity 0.2s ease',
                                                padding: '2px',
                                            }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </h2>
                                )}
                                <p className="text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                                    <Mail size={14} style={{ color: 'var(--primary-blue)' }} /> {user.email || 'Welcome to Daksh.AI'}
                                </p>
                            </div>

                            <div className={`mt-4 ${activeFlash === 'bio-section' ? 'highlight-flash' : ''}`} id="bio-section">
                                <label className="text-xs font-bold mb-2 uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                                    Bio / About Me
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={user.bio}
                                        onChange={handleBioChange}
                                        placeholder="Tell us a little bit about your journey..."
                                        className="w-full text-sm"
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderColor: 'var(--border-color)',
                                            outline: 'none',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            color: 'var(--text-dark)',
                                            transition: 'all 0.2s',
                                            lineHeight: '1.7',
                                            border: '1px solid var(--border-color)',
                                            resize: 'none',
                                            fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                            fontSize: '0.9rem',
                                            letterSpacing: '0.01em',
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = 'var(--primary-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Profile Score Card ── */}
                    <div className="glass-card tilt-card" style={{ borderLeft: '5px solid ' + (ps.total === 100 ? '#a855f7' : psColor), padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
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
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.15)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
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
                </div> {/* End of top row */}

                <div className="flex flex-col relative z-10" style={{ gap: '2rem' }}>
                    {/* ── AI Career Accelerators ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Rocket size={18} style={{ color: 'var(--primary-blue)' }} />
                            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-dark)' }}>AI Career Accelerators</h3>
                        </div>
                        <div className="accelerator-grid">
                            <div className="accent-card" onClick={() => navigate('/interview-prep')}>
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg leading-tight">AI Mock Interview</h4>
                                        <p className="text-xs text-muted">Practice with a senior AI recruiter</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">New Beta</span>
                                    <ArrowRight size={16} className="text-blue-500" />
                                </div>
                            </div>

                            <div className="accent-card" onClick={() => navigate('/project-generator')}>
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                                        <Lightbulb size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg leading-tight">Project Blueprints</h4>
                                        <p className="text-xs text-muted">Unique ideas to fill your skill gaps</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Personalized</span>
                                    <ArrowRight size={16} className="text-amber-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <MatchAnalysisPanel
                        matchPercentage={matchPercentage}
                        ps={ps}
                        handleAddSkillWithAi={handleAddSkillWithAi}
                        navigate={navigate}
                        strategicSuggestions={strategicSuggestions}
                        user={user}
                    />
                    <DreamJobSection
                        jobLibrary={allJobs}
                        user={user}
                        updateTargetJob={updateTargetJob}
                        categorizedMissingSkills={categorizedMissingSkills}
                        handleAddSkillWithAi={handleAddSkillWithAi}
                        ps={ps}
                        isAiLoadingSkills={isAiLoadingSkills}
                        aiMasterSkills={aiMasterSkills}
                        customJobInput={customJobInput}
                        setCustomJobInput={setCustomJobInput}
                        handleAddCustomJob={handleAddCustomJob}
                    />

                    <SkillsAccordion
                        categories={categories}
                        user={user}
                        openCategories={openCategories}
                        toggleCategory={toggleCategory}
                        toggleSkill={toggleSkill}
                        skillSearchQuery={skillSearchQuery}
                        setSkillSearchQuery={setSkillSearchQuery}
                        isCategorizingSkill={isCategorizingSkill}
                        handleAddSkillWithAi={handleAddSkillWithAi}
                        newSkillsInput={newSkillsInput}
                        setNewSkillsInput={setNewSkillsInput}
                        handleAddCustomSkill={handleAddCustomSkill}
                        handleClearAllSkills={handleClearAllSkills}
                    />

                </div>
            </div>

            {/* Cropper Modal Overlay - Outside perspective wrapper */}
            {cropModalOpen && (
                <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 1000000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(15px)', padding: '1rem' }}>
                    <div style={{ position: 'relative', width: '95vw', maxWidth: '500px', maxHeight: '95vh', background: 'var(--primary-white)', borderRadius: '1.25rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
                        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-light)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <Camera size={18} className="text-primary" />
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-dark)' }}>Crop Profile</h3>
                            </div>
                            <button onClick={() => setCropModalOpen(false)} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '5px', borderRadius: '50%' }}><X size={20} /></button>
                        </div>

                        <div style={{ position: 'relative', width: '100%', height: '40vh', minHeight: '300px', background: '#111' }}>
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                            />
                        </div>

                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--primary-white)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: '40px' }}>Zoom</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    style={{ flex: 1, accentColor: 'var(--primary-blue)', cursor: 'pointer' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button onClick={() => setCropModalOpen(false)} disabled={isSavingPhoto} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '0.7rem 1.5rem', borderRadius: '99px', color: 'var(--text-dark)', fontWeight: 'bold', cursor: isSavingPhoto ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: isSavingPhoto ? 0.5 : 1 }}>Cancel</button>
                                <button onClick={generateCroppedImage} disabled={isSavingPhoto} style={{ background: 'linear-gradient(135deg, var(--primary-blue), #2563EB)', border: 'none', padding: '0.7rem 2.2rem', borderRadius: '99px', color: '#fff', fontWeight: 'bold', cursor: isSavingPhoto ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 8px 20px rgba(59,130,246,0.4)', fontSize: '0.85rem', opacity: isSavingPhoto ? 0.8 : 1 }}>
                                    {isSavingPhoto ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                    {isSavingPhoto ? 'Saving...' : 'Save Photo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
