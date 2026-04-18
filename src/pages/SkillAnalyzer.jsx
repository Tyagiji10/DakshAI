import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { jobLibrary } from '../lib/mockData';
import { AlertCircle, CheckCircle, BrainCircuit, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SkillAnalyzer = () => {
    const { user } = useUser();
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null);

    const targetJobInfo = jobLibrary.find(j => j.id === user.targetJob);

    useEffect(() => {
        if (targetJobInfo && !results && !analyzing) {
            analyzeGap();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetJobInfo, user.skills]);

    const careerAdvice = React.useMemo(() => {
        if (!targetJobInfo) return null;
        const missing = targetJobInfo.requiredSkills.filter(skill => !user.skills.includes(skill));

        const adviceList = [];

        if (missing.length === 0) {
            adviceList.push("You have a perfect skill match! Focus heavily on algorithmic interview prep and behavioral soft skills.");
            adviceList.push(`Start applying immediately. Relentlessly tailor your resume specifically for ${targetJobInfo.title} roles.`);
        } else {
            adviceList.push(`You are missing ${missing.length} critical skills. Prioritize mastering ${missing[0]} first as it carries the highest hiring metric weight.`);
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
    }, [targetJobInfo, user.skills]);

    const analyzeGap = () => {
        setAnalyzing(true);
        setResults(null);

        // Mock API call to LLM
        setTimeout(() => {
            const required = targetJobInfo.requiredSkills || [];
            const userSkills = user.skills || [];

            const acquired = required.filter(skill => userSkills.includes(skill));
            const missing = required.filter(skill => !userSkills.includes(skill));
            const matchPercentage = Math.round((acquired.length / required.length) * 100) || 0;

            setResults({
                acquired,
                missing,
                matchPercentage,
                message: matchPercentage > 80
                    ? 'You are highly qualified for this role!'
                    : 'You have some gaps to fill. Our Learning Path can help.'
            });
            setAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="fade-in">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl">AI Skill Gap Analyzer</h1>
                    <p className="text-muted text-sm">
                        Comparing your skills for: 
                        <strong>{targetJobInfo?.title}</strong>
                    </p>
                </div>
            </div>

            {!results && (
                <div className="card mb-4 text-center fade-in">
                    <BrainCircuit size={48} className="text-primary mb-2 mx-auto" style={{ margin: '0 auto 1rem' }} />
                    <p className="mb-4">
                        Our AI will analyze real-time industry requirements and compare them with your current portfolio.
                    </p>
                    <button
                        onClick={analyzeGap}
                        disabled={analyzing}
                        className="btn btn-primary px-6"
                    >
                        {analyzing ? 'Auto-Analyzing Details...' : 'Analyze Gap'}
                    </button>
                </div>
            )}

            {results && (
                <div className="fade-in">
                    <div className="card text-center mb-4">
                        <h2 className="text-2xl mb-2">{results.matchPercentage}% Match</h2>
                        <p className="text-muted">{results.message}</p>

                        {/* Progress Bar */}
                        <div className="w-full bg-light rounded mt-4" style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%',
                                    width: `${results.matchPercentage}%`,
                                    backgroundColor: results.matchPercentage > 70 ? 'var(--accent-green)' : 'var(--primary-blue)',
                                    transition: 'width 1s ease-in-out'
                                }}
                            />
                        </div>
                    </div>

                    {/* AI Suggestions Card */}
                    {careerAdvice && (
                        <div className="glass-card mb-4 p-5" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--primary-blue)' }}>
                                ✨ Daksh.AI Strategic Suggestions
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

                    <div className="flex flex-col gap-4">
                        {/* Acquired Skills */}
                        <div className="card">
                            <h3 className="text-lg flex items-center gap-2 text-success">
                                <CheckCircle size={20} /> Acquired Skills
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {results.acquired.length > 0 ? results.acquired.map(skill => (
                                    <span key={skill} className="badge success">
                                        {skill}
                                    </span>
                                )) : <span className="text-sm text-muted">None for this specific role yet.</span>}
                            </div>
                        </div>

                        {/* Missing Skills */}
                        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            <h3 className="text-lg flex items-center gap-2 text-danger">
                                <AlertCircle size={20} /> Missing Skills
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {results.missing.length > 0 ? results.missing.map(skill => (
                                    <span key={skill} className="badge danger">
                                        {skill}
                                    </span>
                                )) : <span className="text-sm text-muted text-success">You have all the required skills!</span>}
                            </div>
                        </div>

                        {results.missing.length > 0 && (
                            <div className="text-center mt-4">
                                <Link to="/learning" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                                    View Smart Learning Path <ArrowRight size={18} />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillAnalyzer;
