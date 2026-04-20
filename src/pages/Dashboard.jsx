import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { useUser } from '../context/UserContext';
import { auth } from '../lib/firebase';
import { haptic } from '../lib/haptics';
import { availableSkills, jobLibrary } from '../lib/mockData';
import { getTrendingJobSkills, categorizeSkill } from '../lib/ai';
import {
    Check, Target, Sparkles, Camera, Loader2, Trash2, TrendingUp, ArrowRight, X,
    Plus, Search, ChevronDown, ChevronUp, AlertCircle, Zap, Shield, Star, Rocket, Lightbulb
} from 'lucide-react';
import Cropper from 'react-easy-crop';

// Dashbaord Sub-components
import ScoreRing from '../components/dashboard/ScoreRing';
import CareerAccelerators from '../components/dashboard/CareerAccelerators';
import ProfileScoreCard from '../components/dashboard/ProfileScoreCard';
import PersonaCard from '../components/dashboard/PersonaCard';


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
                <div className="analyzer-card h-full relative">
                    <div className="flex justify-between items-center mb-3 border-b border-indigo-500/10 pb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 " style={{ color: 'var(--text-muted)' }}>
                            <Check size={14} className="text-success" /> Acquired Skills
                        </h4>
                    </div>
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
                                        className={`skill-tag-mini acquired ${isMatched ? 'golden shadow-sm' : 'opacity-40 grayscale'} transition-all flex items-center gap-1.5 group/tag relative`}
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

const DreamJobSection = memo(({ jobLibrary, user, updateTargetJob, onClearProfile, categorizedMissingSkills, handleAddSkillWithAi, ps, isAiLoadingSkills, aiMasterSkills, customJobInput, setCustomJobInput, handleAddCustomJob }) => (
    <div className="glass-card panel-animate stagger-2 relative z-10" id="dreamjob-section" style={{ borderLeft: '6px solid var(--accent-green)' }}>
        <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
                <Rocket className="text-success" size={24} />
                <h2 className="text-2xl font-bold m-0" style={{ color: 'var(--text-dark)' }}>AI Career Blueprint</h2>
            </div>
            {user.targetJob && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onClearProfile(); }}
                    className="action-remove-btn"
                    title="Reset Career Path"
                >
                    <Trash2 size={12} /> Clear Profile
                </button>
            )}
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
                    className="clear-all-btn"
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
                                    return (
                                        <button 
                                            key={s} 
                                            onClick={() => toggleSkill(s)} 
                                            className={`pill-button transition-all duration-200 ${active ? 'active scale-105' : 'hover:scale-105 hover:border-indigo-500'} group/pill relative`}
                                        >
                                            {s} 
                                            {active && (
                                                <X 
                                                    size={12} 
                                                    strokeWidth={3} 
                                                    className="ml-1 x-remove-icon" 
                                                    onClick={(e) => { e.stopPropagation(); toggleSkill(s); }}
                                                />
                                            )}
                                        </button>
                                    );
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
    const [activeFlash, setActiveFlash] = useState(null);

    // Skill Search & Categorization State
    const [skillSearchQuery, setSkillSearchQuery] = useState("");
    const [isCategorizingSkill, setIsCategorizingSkill] = useState(false);
    const [openCategories, setOpenCategories] = useState({
        "💻 Programming Languages": true,
        "🚀 Frameworks & Libraries": true
    });



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
            <div className="dashboard-wrapper relative min-h-full perspective-container">
                <div className="bg-blob"></div>
                <div className="bg-blob-2"></div>

                <div className="flex items-center gap-2 mb-6 relative z-10">
                    <h1 className="gradient-persona-text" style={{ letterSpacing: '-0.03em' }}>
                        Your Persona
                    </h1>
                </div>

                <div className="dashboard-top-row relative z-10">
                    <PersonaCard
                        user={user}
                        auth={auth}
                        fileInputRef={fileInputRef}
                        handlePhotoUpload={handlePhotoUpload}
                        handleRemovePhoto={handleRemovePhoto}
                        isEditingSocialLinks={isEditingSocialLinks}
                        setIsEditingSocialLinks={setIsEditingSocialLinks}
                        socialLinksRef={socialLinksRef}
                        setUser={setUser}
                        isEditingName={isEditingName}
                        setIsEditingName={setIsEditingName}
                        editNameValue={editNameValue}
                        setEditNameValue={setEditNameValue}
                        handleSaveName={handleSaveName}
                        isHoveringName={isHoveringName}
                        setIsHoveringName={setIsHoveringName}
                        activeFlash={activeFlash}
                        handleBioChange={handleBioChange}
                    />

                    <ProfileScoreCard
                        ps={ps}
                        psColor={ps.psColor}
                        psLabel={ps.psLabel}
                        psSummary={ps.psSummary}
                        handleFactorClick={handleFactorClick}
                    />
                </div>

                <div className="flex flex-col relative z-10" style={{ gap: '2rem' }}>
                    <CareerAccelerators navigate={navigate} />

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
                        onClearProfile={() => {
                            updateTargetJob('');
                            setAiMasterSkills(null);
                        }}
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
