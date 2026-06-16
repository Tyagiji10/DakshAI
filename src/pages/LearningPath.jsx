import React, { useMemo, useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { jobLibrary } from '../lib/mockData';
import { 
    PlayCircle, Award, Sparkles, Loader2, 
    ChevronRight, X, Check, BookOpen, Code, RefreshCw 
} from 'lucide-react';
import { getTrendingJobSkills, generateDetailedSkillSyllabus, generateSkillQuiz } from '../lib/ai';
import { haptic } from '../lib/haptics';
import './LearningPath.css';

const LearningPath = () => {
    const { user, updateSkills } = useUser();
    
    // Support for Custom Jobs
    const customJobs = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('daksh_custom_jobs') || '[]'); } catch { return []; }
    }, []);
    const allJobs = useMemo(() => [...jobLibrary, ...customJobs], [customJobs]);
    const targetJobInfo = allJobs.find(j => j.id === user.targetJob);

    // AI States
    const [aiMasterSkills, setAiMasterSkills] = useState(null);
    const [isAiLoadingSkills, setIsAiLoadingSkills] = useState(false);

    // Drawer States (Syllabus)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDrawerClosing, setIsDrawerClosing] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [isSyllabusLoading, setIsSyllabusLoading] = useState(false);
    const [activeSyllabus, setActiveSyllabus] = useState(null);

    // Quiz States (Assessment)
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [isQuizLoading, setIsQuizLoading] = useState(false);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizStep, setQuizStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [quizScore, setQuizScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        if (!targetJobInfo) return;
        let isActive = true;
        
        async function fetchAI() {
            setIsAiLoadingSkills(true);
            try {
                const data = await getTrendingJobSkills(targetJobInfo.title, [], user.skills);
                if (isActive && data) setAiMasterSkills(data);
            } catch (err) {
                console.error("Daksh.AI Learning Path Error:", err);
            } finally {
                if (isActive) setIsAiLoadingSkills(false);
            }
        }
        fetchAI();
        
        return () => { isActive = false; };
    }, [targetJobInfo?.title, user.skills]);

    // Compute all skills & status
    const totalSkills = useMemo(() => {
        let masterList = [];
        if (aiMasterSkills?.categorizedMaster) {
            masterList = Object.values(aiMasterSkills.categorizedMaster).flat();
        }
        if (!masterList || masterList.length === 0) {
            masterList = targetJobInfo?.requiredSkills || [];
        }
        return masterList;
    }, [targetJobInfo, aiMasterSkills]);

    const matchedSkillsCount = useMemo(() => {
        return totalSkills.filter(s => user.skills.includes(s)).length;
    }, [totalSkills, user.skills]);

    const readinessScore = useMemo(() => {
        return totalSkills.length ? Math.round((matchedSkillsCount / totalSkills.length) * 100) : 0;
    }, [matchedSkillsCount, totalSkills.length]);

    // Categorized Roadmap computation
    const categorizedRoadmap = useMemo(() => {
        if (aiMasterSkills?.categorizedMaster) {
            return Object.entries(aiMasterSkills.categorizedMaster)
                .filter(([, list]) => list.length > 0)
                .map(([cat, list]) => ({
                    category: cat,
                    skills: list.map(skill => ({
                        name: skill,
                        completed: user.skills.includes(skill)
                    }))
                }));
        }
        const fallbackList = targetJobInfo?.requiredSkills || [];
        return [
            {
                category: "Core Job Requirements",
                skills: fallbackList.map(skill => ({
                    name: skill,
                    completed: user.skills.includes(skill)
                }))
            }
        ];
    }, [aiMasterSkills, targetJobInfo, user.skills]);

    // Interactive Drawer Handles
    const openSyllabusDrawer = async (skillName) => {
        haptic.light();
        setSelectedSkill(skillName);
        setIsDrawerOpen(true);
        setIsSyllabusLoading(true);
        setActiveSyllabus(null);

        try {
            const syllabus = await generateDetailedSkillSyllabus(targetJobInfo?.title || user.targetJob, skillName);
            setActiveSyllabus(syllabus);
        } catch (err) {
            console.error("Failed to load syllabus:", err);
        } finally {
            setIsSyllabusLoading(false);
        }
    };

    const closeSyllabusDrawer = () => {
        haptic.light();
        setIsDrawerClosing(true);
        setTimeout(() => {
            setIsDrawerOpen(false);
            setIsDrawerClosing(false);
            setActiveSyllabus(null);
            setSelectedSkill(null);
        }, 250);
    };

    // MCQ Assessment Handles
    const startAssessment = async (skillName) => {
        haptic.medium();
        // Close syllabus drawer first (or keep background)
        setIsDrawerOpen(false);
        
        setIsQuizOpen(true);
        setIsQuizLoading(true);
        setQuizStep(0);
        setSelectedOption(null);
        setQuizScore(0);
        setQuizCompleted(false);
        setShowExplanation(false);

        try {
            const quiz = await generateSkillQuiz(targetJobInfo?.title || user.targetJob, skillName, 'mid');
            setActiveQuiz(quiz);
        } catch (err) {
            console.error("Failed to load quiz:", err);
        } finally {
            setIsQuizLoading(false);
        }
    };

    const handleOptionSelect = (optionIdx) => {
        if (showExplanation) return; // Prevent double clicks
        haptic.light();
        setSelectedOption(optionIdx);
        setShowExplanation(true);

        const correctIdx = activeQuiz.questions[quizStep].correctOptionIndex;
        if (optionIdx === correctIdx) {
            setQuizScore(s => s + 1);
        }
    };

    const handleNextQuestion = () => {
        haptic.light();
        if (quizStep < activeQuiz.questions.length - 1) {
            setQuizStep(s => s + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            setQuizCompleted(true);
        }
    };

    const handleAddSkillToProfile = () => {
        haptic.medium();
        if (selectedSkill && !user.skills.includes(selectedSkill)) {
            const updated = [...user.skills, selectedSkill];
            updateSkills(updated);
            
            // Persist locally in user profile
            const profileRaw = localStorage.getItem('dakshai-user-profile');
            if (profileRaw) {
                try {
                    const profile = JSON.parse(profileRaw);
                    profile.skills = updated;
                    localStorage.setItem('dakshai-user-profile', JSON.stringify(profile));
                } catch (_) {}
            }
            alert(`🎉 Skill "${selectedSkill}" has been successfully added to your profile!`);
        }
        setIsQuizOpen(false);
        setSelectedSkill(null);
    };

    const closeQuiz = () => {
        haptic.light();
        setIsQuizOpen(false);
        setActiveQuiz(null);
        setSelectedSkill(null);
    };

    // Career advice text
    const careerAdvice = useMemo(() => {
        if (!targetJobInfo) return null;
        const missingCount = totalSkills.length - matchedSkillsCount;
        const adviceList = [];

        if (missingCount === 0) {
            adviceList.push("Perfect hiring match! Focus strictly on architectural questions and live mock interview sessions.");
            adviceList.push(`Start tracking opportunities immediately. Build targeted portfolio models for ${targetJobInfo.title}.`);
        } else {
            const firstMissing = totalSkills.find(s => !user.skills.includes(s));
            adviceList.push(`You have a skill gap of ${missingCount} items. Prioritize mastering "${firstMissing}" next to lock core compliance.`);
        }

        if (targetJobInfo.category === "Software Engineering") {
            adviceList.push("Deploy clean, live APIs or fullstack codebases. Host on Vercel/Render and link repo URLs on your resume.");
        } else if (targetJobInfo.category === "Data Science") {
            adviceList.push("Establish interactive Jupyter Notebook visual projects. Include visual metrics dashboards in public links.");
        } else if (targetJobInfo.category === "Design") {
            adviceList.push("Focus on detailed wireframe reasoning processes. Showcase complete user research maps, not just glossy mockups.");
        } else {
            adviceList.push("Proactively reach out for informational hiring reviews. Practice scenario-based questions inside Interview Prep.");
        }

        return adviceList;
    }, [targetJobInfo, totalSkills, matchedSkillsCount, user.skills]);

    return (
        <div className="learning-path-container">
            {/* Header section */}
            <div className="learning-header-panel">
                <div>
                    <h1 className="text-3xl font-extrabold m-0" style={{ color: 'var(--text-dark)' }}>Smart Learning Path</h1>
                    <p className="text-muted text-sm mt-2">
                        Targeting career profile: <strong style={{ color: 'var(--primary-blue)' }}>{targetJobInfo?.title || 'None Selected'}</strong>
                    </p>
                </div>
            </div>

            {/* Empty State */}
            {(!user.targetJob || user.skills.length === 0) ? (
                <div className="glass-card py-16 flex flex-col items-center justify-center text-center" style={{ border: '2px dashed var(--border-color)', background: 'transparent' }}>
                    <Sparkles size={68} className="text-muted opacity-20 mb-5" />
                    <h2 className="text-2xl mb-3 font-bold" style={{ color: 'var(--text-dark)' }}>Setup Your Dashboard Profile</h2>
                    <p className="text-muted max-w-md px-4" style={{ lineHeight: '1.6' }}>
                        Choose your target career path and add your active skill sets on the dashboard to build your automated roadmap.
                    </p>
                </div>
            ) : isAiLoadingSkills ? (
                <div className="glass-card text-center py-16">
                    <Loader2 size={44} className="animate-spin text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-xl mb-2 font-bold" style={{ color: 'var(--text-dark)' }}>Constructing Skill Roadmaps...</h2>
                    <p className="text-sm text-muted">Analyzing job constraints and compiling micro-syllabus databases.</p>
                </div>
            ) : (
                <div className="learning-content-layout">
                    {/* Top Stats and Gauge Bar */}
                    <div className="progress-dashboard-row mb-8">
                        <div className="glass-card readiness-gauge-card">
                            <div className="readiness-gauge-container">
                                <svg width="100" height="100" viewBox="0 0 100 100" className="readiness-gauge">
                                    <circle cx="50" cy="50" r="42" className="gauge-bg" />
                                    <circle cx="50" cy="50" r="42" className="gauge-fill" style={{
                                        strokeDasharray: 264,
                                        strokeDashoffset: 264 - (264 * readinessScore) / 100
                                    }} />
                                    <text x="50" y="55" textAnchor="middle" className="gauge-text">{readinessScore}%</text>
                                </svg>
                                <div className="readiness-details">
                                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider m-0">Hiring Match Readiness</h4>
                                    <h2 className="text-xl font-extrabold m-0 mt-1" style={{ color: 'var(--text-dark)' }}>{matchedSkillsCount} / {totalSkills.length} Skills</h2>
                                    <p className="text-xs text-muted m-0 mt-1">Acquire remaining skills to pass ATS screenings.</p>
                                </div>
                            </div>
                        </div>

                        {/* Interview Advice Card */}
                        <div className="glass-card advice-panel-card">
                            <h3 className="text-sm font-extrabold uppercase tracking-wider mb-3 flex items-center gap-1" style={{ color: 'var(--primary-blue)' }}>
                                <Sparkles size={14} /> Daksh.AI Profile Feedback
                            </h3>
                            <ul className="advice-tips-list">
                                {careerAdvice.map((advice, idx) => (
                                    <li key={idx}>
                                        <div className="tip-bullet" />
                                        <span>{advice}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Sequential Visual Roadmap */}
                    <div className="roadmap-section">
                        <h2 className="section-title">Visual Skill Roadmap</h2>
                        <p className="text-xs text-muted mb-6">Click on any skill card below to view its 10-day structured syllabus, reference docs, and practice tests.</p>
                        
                        <div className="roadmap-category-list">
                            {categorizedRoadmap.map((cat, catIdx) => (
                                <div key={cat.category} className="roadmap-category-group">
                                    <div className="category-header">
                                        <span className="cat-badge">{catIdx + 1}</span>
                                        <h3 className="category-title">{cat.category}</h3>
                                    </div>
                                    <div className="roadmap-nodes-container">
                                        {cat.skills.map((skill, skillIdx) => {
                                            const isCompleted = skill.completed;
                                            return (
                                                <div 
                                                    key={skill.name} 
                                                    className={`roadmap-node-card ${isCompleted ? 'completed' : 'pending'}`}
                                                    onClick={() => openSyllabusDrawer(skill.name)}
                                                >
                                                    <div className="node-status-ring">
                                                        {isCompleted ? <Check size={14} /> : <span className="node-number">{skillIdx + 1}</span>}
                                                    </div>
                                                    <div className="node-details">
                                                        <div className="node-name">{skill.name}</div>
                                                        <div className="node-status-text">{isCompleted ? 'Mastered' : 'Learn skill'}</div>
                                                    </div>
                                                    <ChevronRight size={16} className="node-arrow" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SYLLABUS DRAWER OUTLINE */}
            {isDrawerOpen && selectedSkill && (
                <div className={`syllabus-drawer-overlay ${isDrawerClosing ? 'closing' : ''}`} onClick={closeSyllabusDrawer}>
                    <div className="syllabus-drawer-content" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <div>
                                <span className="drawer-badge">Target Syllabus</span>
                                <h2 className="drawer-title">{selectedSkill}</h2>
                            </div>
                            <button className="drawer-close-btn" onClick={closeSyllabusDrawer}><X size={20} /></button>
                        </div>

                        <div className="drawer-body">
                            {isSyllabusLoading ? (
                                <div className="drawer-loading-container">
                                    <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                                    <p className="text-sm text-muted">Architecting learning curriculum...</p>
                                </div>
                            ) : activeSyllabus ? (
                                <div className="syllabus-data-container">
                                    <h3 className="section-subtitle">10-Day Learning Plan</h3>
                                    <div className="syllabus-phases-list">
                                        {(activeSyllabus.learningTimeline || []).map((phase, idx) => (
                                            <div key={idx} className="phase-card">
                                                <div className="phase-badge">{phase.phase}</div>
                                                <div className="phase-topics-list mt-3">
                                                    {(phase.topics || []).map((topic, tIdx) => (
                                                        <div key={tIdx} className="phase-topic-item">
                                                            <div className="topic-dot" />
                                                            <span className="text-sm">{topic}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="phase-outcome mt-3 pt-2 border-t border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                                                    <strong>Outcome:</strong> {phase.outcome}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <h3 className="section-subtitle mt-8">Recommended Reference Docs</h3>
                                    <div className="resources-grid">
                                        <a 
                                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedSkill + ' tutorial hindi India')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="resource-link-card"
                                        >
                                            <PlayCircle size={18} className="text-red-500 flex-shrink-0" />
                                            <div>
                                                <div className="resource-link-title">Watch Video Course</div>
                                                <div className="resource-link-desc">Free courses on YouTube</div>
                                            </div>
                                        </a>

                                        {(activeSyllabus.bestDocs || []).map((doc, dIdx) => (
                                            <a 
                                                key={dIdx}
                                                href={doc.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="resource-link-card"
                                            >
                                                <BookOpen size={18} className="text-blue-500 flex-shrink-0" />
                                                <div>
                                                    <div className="resource-link-title">{doc.title}</div>
                                                    <div className="resource-link-desc">Official reference site</div>
                                                </div>
                                            </a>
                                        ))}

                                        {(activeSyllabus.practicePlatforms || []).map((plat, pIdx) => (
                                            <a 
                                                key={pIdx}
                                                href={plat.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="resource-link-card"
                                            >
                                                <Code size={18} className="text-indigo-500 flex-shrink-0" />
                                                <div>
                                                    <div className="resource-link-title">{plat.name}</div>
                                                    <div className="resource-link-desc">Interactive practice exercises</div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>

                                    {!user.skills.includes(selectedSkill) && (
                                        <button className="assess-btn mt-8" onClick={() => startAssessment(selectedSkill)}>
                                            <Award size={18} /> Test My Knowledge (MCQ Quiz)
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted">Failed to load syllabus. Please try again.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* QUIZ ASSESSMENT MODAL */}
            {isQuizOpen && activeQuiz && (
                <div className="quiz-modal-overlay" onClick={closeQuiz}>
                    <div className="quiz-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="quiz-header">
                            <div>
                                <span className="quiz-badge">Hiring Assessment</span>
                                <h2 className="quiz-title">{selectedSkill} Assessment</h2>
                            </div>
                            {!quizCompleted && (
                                <span className="quiz-progress">
                                    Question {quizStep + 1} of {activeQuiz.questions.length}
                                </span>
                            )}
                            <button className="quiz-close-btn" onClick={closeQuiz}><X size={20} /></button>
                        </div>

                        <div className="quiz-body">
                            {isQuizLoading ? (
                                <div className="quiz-loading-container">
                                    <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                                    <p className="text-sm text-muted">Generating quiz questions...</p>
                                </div>
                            ) : !quizCompleted ? (
                                <div className="quiz-question-container">
                                    <div className="quiz-progress-bar">
                                        <div className="progress-fill" style={{ width: `${((quizStep) / activeQuiz.questions.length) * 100}%` }} />
                                    </div>
                                    
                                    <h3 className="question-text mb-5">{activeQuiz.questions[quizStep].questionText}</h3>
                                    
                                    <div className="options-list">
                                        {activeQuiz.questions[quizStep].options.map((opt, oIdx) => {
                                            const isSelected = selectedOption === oIdx;
                                            const isCorrect = activeQuiz.questions[quizStep].correctOptionIndex === oIdx;
                                            let optionClass = '';
                                            if (showExplanation) {
                                                if (isCorrect) optionClass = 'correct';
                                                else if (isSelected) optionClass = 'wrong';
                                            } else if (isSelected) {
                                                optionClass = 'selected';
                                            }

                                            return (
                                                <button 
                                                    key={oIdx}
                                                    disabled={showExplanation}
                                                    className={`option-btn ${optionClass}`}
                                                    onClick={() => handleOptionSelect(oIdx)}
                                                >
                                                    <span className="option-label">{String.fromCharCode(65 + oIdx)}</span>
                                                    <span className="option-text">{opt}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {showExplanation && (
                                        <div className="quiz-explanation-box mt-6">
                                            <div className="explanation-title mb-2">
                                                {selectedOption === activeQuiz.questions[quizStep].correctOptionIndex ? '🎉 Correct Answer!' : '❌ Incorrect'}
                                            </div>
                                            <p className="explanation-text text-sm text-muted mb-4">{activeQuiz.questions[quizStep].explanation}</p>
                                            <button className="quiz-next-btn" onClick={handleNextQuestion}>
                                                {quizStep < activeQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="quiz-result-container text-center py-6">
                                    <Award size={64} className="text-emerald-500 mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
                                    <h3 className="text-lg text-muted mb-6">Your Score: {quizScore} / {activeQuiz.questions.length}</h3>
                                    
                                    {quizScore === activeQuiz.questions.length ? (
                                        <div className="passed-badge-section">
                                            <div className="passed-banner mb-3">Perfect Score! 🌟</div>
                                            <p className="text-sm text-muted max-w-sm mx-auto mb-6">You demonstrated full proficiency in {selectedSkill}. You can now lock this on your profile.</p>
                                            <button className="assess-btn success w-full" onClick={handleAddSkillToProfile}>
                                                Add {selectedSkill} to My Profile
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm text-muted max-w-sm mx-auto mb-6">You need to answer all questions correctly to add this skill. Review the learning plan and try again!</p>
                                            <div className="flex gap-2">
                                                <button className="assess-btn secondary w-full" onClick={() => startAssessment(selectedSkill)}>
                                                    Try Again
                                                </button>
                                                <button className="assess-btn secondary w-full" onClick={closeQuiz} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-dark)' }}>
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningPath;
