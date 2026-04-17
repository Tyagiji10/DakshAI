import React, { useMemo, useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { jobLibrary, resourceLibrary } from '../lib/mockData';
import { PlayCircle, Award, Sparkles, Loader2 } from 'lucide-react';
import { getTrendingJobSkills } from '../lib/ai';

const LearningPath = () => {
    const { user } = useUser();
    
    // Support for Custom Jobs
    const customJobs = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('daksh_custom_jobs') || '[]'); } catch { return []; }
    }, []);
    const allJobs = useMemo(() => [...jobLibrary, ...customJobs], [customJobs]);
    const targetJobInfo = allJobs.find(j => j.id === user.targetJob);

    // AI States
    const [aiMasterSkills, setAiMasterSkills] = useState(null);
    const [isAiLoadingSkills, setIsAiLoadingSkills] = useState(false);

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

    // Compute missing skills by syncing with AI generated master list
    const missingSkills = useMemo(() => {
        let masterList = [];
        if (aiMasterSkills?.categorizedMaster) {
            masterList = Object.values(aiMasterSkills.categorizedMaster).flat();
        }
        
        if (!masterList || masterList.length === 0) {
            masterList = targetJobInfo?.requiredSkills || [];
        }
        
        return masterList.filter(skill => !user.skills.includes(skill));
    }, [user.skills, targetJobInfo, aiMasterSkills]);

    // For each missing skill, get up to 3 micro-courses
    const recommendedPaths = useMemo(() => {
        return missingSkills.map(skill => {
            // Find matching resources, slice top 3
            let resources = resourceLibrary.filter(r => r.skill === skill).slice(0, 3);

            // Auto fallback if skill has no mock courses
            if (resources.length === 0) {
                resources = [{
                    title: `Top 10 ${skill} Tutorials (Full Course)`,
                    type: 'Video Series',
                    duration: 'Self-paced'
                }];
            }
            return { skill, resources };
        });
    }, [missingSkills]);

    // Generate AI Career Suggestions based on job category and skills
    const careerAdvice = useMemo(() => {
        if (!targetJobInfo) return null;

        const adviceList = [];

        if (missingSkills.length === 0) {
            adviceList.push("You have a perfect skill match! Focus heavily on algorithmic interview prep and behavioral soft skills.");
            adviceList.push(`Start applying immediately. Relentlessly tailor your resume specifically for ${targetJobInfo.title} roles.`);
        } else {
            adviceList.push(`You are missing ${missingSkills.length} critical skills. Prioritize mastering ${missingSkills[0]} first as it carries the highest hiring metric weight.`);
        }

        if (targetJobInfo.category === "Software Engineering") {
            adviceList.push("Deploy a live, working project (not just localhost) and link your GitHub repository directly on your resume.");
            adviceList.push("Practice LeetCode or HackerRank algorithmic problems daily to clear preliminary technical screening rounds safely.");
        } else if (targetJobInfo.category === "Data Science") {
            adviceList.push("Create a Kaggle profile or participate in open datasets to showcase your aggressive analytical thinking patterns.");
            adviceList.push("Ensure you have a visual data portfolio (like a Tableau Public dashboard or Jupyter notebook) dynamically linked.");
        } else if (targetJobInfo.category === "Marketing") {
            adviceList.push("Quantify your past marketing impacts (e.g., 'Increased engagement by 40%'). Data-driven marketers stand out severely.");
            adviceList.push("Build a digital marketing portfolio showcasing live ad campaigns, verified SEO growth trackers, or content strategy.");
        } else if (targetJobInfo.category === "Design") {
            adviceList.push("Your Behance or Dribbble visual portfolio is vastly more important than a text resume. Keep it ruthlessly updated.");
            adviceList.push("Include wireframe case studies that explain your UX reasoning pipelines, not just final glossy UI mockups.");
        } else {
            adviceList.push("Aggressive Networking is key. Reach out proactively to current employees on LinkedIn for informational interviews.");
        }

        return adviceList;
    }, [targetJobInfo, missingSkills]);

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h1 className="text-2xl font-extrabold m-0" style={{ color: 'var(--text-dark)' }}>Smart Learning Path</h1>
                <p className="text-muted text-sm border-l-2 pl-2 mt-2" style={{ borderLeftColor: 'var(--primary-blue)' }}>
                    Target: <strong style={{ color: 'var(--primary-blue)' }}>{targetJobInfo?.title || 'None Selected'}</strong>
                </p>
            </div>

            {careerAdvice && (
                <div className="glass-card mb-6 p-5" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--primary-blue)' }}>
                        <Sparkles size={18} /> Daksh.AI Interview Suggestions
                    </h3>
                    <ul className="text-sm space-y-2 m-0 pl-0 list-none mt-2">
                        {careerAdvice.map((advice, idx) => (
                            <li key={idx} className="flex items-start gap-2 mb-2" style={{ color: 'var(--text-dark)' }}>
                                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" style={{ marginTop: '0.35rem' }}></span>
                                <span className="opacity-90">{advice}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {isAiLoadingSkills ? (
                <div className="card text-center py-12">
                    <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-xl mb-2 font-bold" style={{ color: 'var(--text-dark)' }}>Analyzing AI Blueprint...</h2>
                    <p className="text-sm text-muted">Syncing with Daksh.AI Skill Gap matrix to build your curriculum.</p>
                </div>
            ) : missingSkills.length === 0 ? (
                <div className="card text-center py-8">
                    <Award size={64} className="text-success mx-auto mb-4" />
                    <h2 className="text-xl mb-2">You are fully equipped!</h2>
                    <p className="text-muted">
                        You have all the required skills for this role. Time to build your portfolio.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col" style={{ gap: '2.5rem' }}>
                    <p className="text-md font-medium">
                        Based on your skill gap, here are micro-courses curated for you:
                    </p>

                    {recommendedPaths.map(path => (
                        <div key={path.skill} className="card p-0 overflow-hidden" style={{ borderLeft: '4px solid var(--primary-blue)' }}>
                            <div className="bg-light p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                <h3 className="text-danger flex items-center gap-2 m-0 text-lg">
                                    <span className="badge danger">{path.skill}</span>
                                </h3>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                {path.resources.map((res, idx) => (
                                    <a
                                        key={idx}
                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(res.title + ' in hindi or english tutorial')}&sp=CAM%3D`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex justify-between items-center p-3 border rounded transition hover:shadow-md"
                                        style={{ textDecoration: 'none', color: 'inherit', borderColor: 'var(--border-color)', backgroundColor: 'var(--primary-white)' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <PlayCircle className="text-primary" />
                                            <div>
                                                <div className="font-bold text-sm md-text-base">{res.title}</div>
                                                <div className="text-xs text-muted flex items-center gap-1 mt-1">
                                                    <span className="badge">{res.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-muted">
                                            {res.duration}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LearningPath;
