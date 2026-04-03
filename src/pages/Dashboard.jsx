import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { availableSkills, jobLibrary } from '../lib/mockData';
import { getTrendingJobSkills } from '../lib/ai';
import { Check, Target, User, Sparkles, Camera, Mail, FileText, UploadCloud, AlertCircle, Loader2, Trash2, TrendingUp, Shield, Zap, Star, ArrowRight, Edit2, X, Github, Linkedin, ExternalLink } from 'lucide-react';
import Cropper from 'react-easy-crop';


// ─── Profile Score Engine ────────────────────────────────────────────────────
function computeProfileScore(user, aiMasterSkills = null) {
    if (!user) return { total: 0, factors: [], matchedSkills: [], missingSkills: [], jobTitle: null };

    const job = jobLibrary.find(j => j.id === user.targetJob);
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
        const required = job.requiredSkills || [];

        // Use AI Master skills if locally available
        if (aiMasterSkills && Array.isArray(aiMasterSkills)) {
            matchedSkills = aiMasterSkills.filter(s => userSkillsList.includes(s));
            missingSkills = aiMasterSkills.filter(s => !userSkillsList.includes(s));
            skillScore = aiMasterSkills.length > 0 ? Math.round((matchedSkills.length / aiMasterSkills.length) * 35) : 0;
        } else {
            // Fallback while loading
            matchedSkills = required.filter(s => userSkillsList.includes(s));
            missingSkills = required.filter(s => !userSkillsList.includes(s));
            skillScore = required.length > 0 ? Math.round((matchedSkills.length / required.length) * 35) : 0;
        }
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
function ScoreRing({ score, size = 120, stroke = 10 }) {
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
    const isFull = score === 100;
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
}

const Dashboard = () => {
    const { user, t, updateSkills, updateTargetJob, setUser, loading } = useUser();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Prevent crashing if user data isn't loaded yet
    if (loading || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin mb-4" size={48} style={{ color: 'var(--primary-blue)' }} />
                <p className="font-bold text-lg animate-pulse">Syncing your persona...</p>
            </div>
        );
    }

    const [categories, setCategories] = useState([
        { title: "💻 Programming Languages", skills: ["Python", "Java", "C", "C++", "C#", "JavaScript", "TypeScript", "HTML & CSS", "Go", "Rust", "Swift", "Kotlin", "Ruby", "Haskell", "Lisp", "Scheme", "F#", "OCaml", "Erlang", "Elixir", "Bash", "PowerShell", "Perl", "Lua", "PHP", "SQL", "R", "MATLAB", "SAS", "Verilog", "VHDL", "Julia", "Elm", "Crystal", "Nim"] },
        { title: "🚀 Frameworks", skills: ["React", "Angular", "Vue.js", "Svelte", "Next.js", "Django", "Flask", "Spring Boot", "ASP.NET Core", "React Native", "Flutter", "SwiftUI", "Jetpack Compose", "Xamarin", "Express.js", "FastAPI", "NestJS", "Ruby on Rails", "Node.js", "Tailwind CSS", "Redux", "Bootstrap"] },
        { title: "📚 Libraries", skills: ["Lodash", "D3.js", "Chart.js", "Axios", "NumPy", "Pandas", "Matplotlib", "Seaborn", "Requests", "Guava", "Apache Commons", "Hibernate", "Boost", "OpenCV", "Eigen", "TensorFlow", "PyTorch", "Scikit-learn", "Keras"] },
        { title: "☁️ Data & Cloud", skills: ["MySQL", "PostgreSQL", "MongoDB", "Oracle", "Redis", "Cassandra", "Neo4j", "NoSQL", "Hadoop", "Spark", "Kafka", "Flink", "AWS", "Azure", "GCP", "IBM Cloud", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions"] },
        { title: "⚙️ Engineering & Tools", skills: ["Git", "GitHub", "Version Control", "VS Code", "Postman", "npm", "Yarn", "Webpack", "Vite", "Babel", "Jupyter Notebook", "AutoCAD", "SolidWorks", "Simulink", "Excel", "Tableau", "PowerBI", "SAP", "ERP Systems", "SPSS", "LaTeX", "EndNote", "NVivo"] },
        { title: "🎨 Design & Product", skills: ["Figma", "Sketch", "Adobe XD", "InVision", "Balsamiq", "Miro", "Jira", "Trello", "Asana", "Notion", "Slack", "Teams", "Confluence", "Graphic Design", "UI Design", "UX Research", "Wireframing", "Prototyping", "Adobe CC", "Unity", "Product Management"] },
        { title: "📈 Marketing & Growth", skills: ["SEMrush", "Ahrefs", "Moz", "Google Analytics", "Mixpanel", "Amplitude", "Hootsuite", "Buffer", "Sprout Social", "Mailchimp", "HubSpot", "SendGrid", "Google Ads", "Facebook Ads", "LinkedIn Ads", "Salesforce", "Marketing", "Sales", "SEO", "Content Writing", "Social Media Management", "Email Marketing"] },
        { title: "💼 Core & Soft Skills", skills: ["Algorithms", "Data Structures", "System Design", "Networking", "Security", "Cloud Architecture", "Cybersecurity", "Software Engineering", "Machine Learning", "Testing & Debugging", "APIs", "REST/GraphQL", "Responsive Design", "Web Performance Optimization", "Communication", "Leadership", "Collaboration", "Critical Thinking", "Problem Solving", "Adaptability", "Teamwork", "Innovation", "Agile", "Scrum", "Agile/Scrum", "Stakeholder Management", "Strategic Management", "Business Analytics", "Financial Modeling", "Operations Management", "Brand Management", "Market Research", "Negotiation", "Decision-Making", "Data Analysis", "Statistics", "Research Methodology", "Academic Writing", "Presentation Skills", "Biotechnology", "Physics", "Chemistry", "Mathematics", "CAD/CAM", "Embedded Systems", "AI/ML", "Data Science"] }
    ]);

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
            const jobTitle = jobLibrary.find(j => j.id === user.targetJob)?.title;
            if (!jobTitle) return;

            setIsAiLoadingSkills(true);
            try {
                // Fetch the master required skills array globally from Firestore Cache or Gemini
                const masterSkills = await getTrendingJobSkills(jobTitle, availableSkills);
                setAiMasterSkills(masterSkills);
            } catch (err) {
                console.error("Failed to load AI master skills", err);
                setAiMasterSkills(null);
            } finally {
                setIsAiLoadingSkills(false);
            }
        };

        fetchSkills();
    }, [user.targetJob]);

    const handleAddCustomSkill = (e, categoryTitle) => {
        e.preventDefault();
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
    };

    const handleFactorClick = (factor) => {
        if (factor.action === 'navigate') {
            navigate(factor.target);
        } else if (factor.action === 'scroll') {
            const el = document.getElementById(factor.target);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Brief highlight flash
                el.style.transition = 'box-shadow 0.3s';
                el.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.5)';
                setTimeout(() => { el.style.boxShadow = ''; }, 1400);
            }
        }
    };

    const toggleSkill = (skill) => {
        if (user.skills.includes(skill)) {
            updateSkills(user.skills.filter(s => s !== skill));
        } else {
            updateSkills([...user.skills, skill]);
        }
    };

    const handleBioChange = (e) => {
        setUser({ ...user, bio: e.target.value });
    };

    const handleSaveName = () => {
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


    const ps = computeProfileScore(user, aiMasterSkills);
    const psColor = ps?.total >= 80 ? '#10b981' : ps?.total >= 55 ? '#f59e0b' : '#ef4444';
    const psLabel = ps?.total >= 80 ? '🏆 Top Tier' : ps?.total >= 55 ? '📈 Growing' : '⚡ Just Starting';
    const psSummary = ps?.total >= 80
        ? ('🎉 Outstanding! You match ' + (ps.matchedSkills?.length || 0) + ' skills for ' + (ps.jobTitle || 'your dream role') + '.')
        : ps?.total >= 55
            ? ('Good progress! ' + (ps.missingSkills?.length > 0 ? 'Add ' + ps.missingSkills.slice(0, 2).join(', ') + ' to boost your job match.' : 'Keep filling in your profile.'))
            : 'Your profile needs more info. Complete the tips below to improve your score.';

    const categorizedMissingSkills = {};
    if (user?.targetJob && ps?.missingSkills?.length > 0) {
        ps.missingSkills.forEach(skill => {
            let foundCategory = "Other Needed Skills";
            categories.forEach(cat => {
                if (cat.skills?.includes(skill)) {
                    foundCategory = cat.title;
                }
            });
            if (!categorizedMissingSkills[foundCategory]) {
                categorizedMissingSkills[foundCategory] = [];
            }
            categorizedMissingSkills[foundCategory].push(skill);
        });
    }

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

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                .dashboard-wrapper {
                    position: relative;
                    min-height: 100%;
                    overflow: hidden;
                    padding-bottom: 2rem;
                }
                .bg-blob {
                    position: absolute;
                    top: -150px;
                    right: -100px;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 60%);
                    border-radius: 50%;
                    z-index: 0;
                    pointer-events: none;
                }
                .bg-blob-2 {
                    position: absolute;
                    bottom: -150px;
                    left: -150px;
                    width: 700px;
                    height: 700px;
                    background: radial-gradient(circle, rgba(16, 185, 129, 0.20) 0%, transparent 65%);
                    border-radius: 50%;
                    z-index: 0;
                    pointer-events: none;
                }
                .glass-card {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
                    border-radius: 16px;
                    position: relative;
                    z-index: 1;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
                }
                .glass-card:hover {
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
                    transform: translateY(-2px);
                }
                .job-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                    max-height: 450px;
                    overflow-y: auto;
                    padding: 0.5rem;
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary-blue) transparent;
                }
                .job-grid::-webkit-scrollbar {
                    width: 8px;
                }
                .job-grid::-webkit-scrollbar-thumb {
                    background-color: var(--primary-blue);
                    border-radius: 10px;
                    opacity: 0.3;
                }
                .job-card {
                    background: var(--primary-white);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 1.25rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                }
                .job-card:hover {
                    transform: translateY(-4px) translateZ(10px) scale(1.02);
                    box-shadow: 0 12px 25px rgba(16, 185, 129, 0.15), 0 6px 6px rgba(0,0,0,0.05);
                    border-color: var(--accent-green);
                }
                .job-card.selected {
                    background: linear-gradient(135deg, var(--accent-green) 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                    border: none;
                    transform: translateY(-2px) scale(1.02);
                }
                .job-card.selected .text-muted {
                    color: rgba(255, 255, 255, 0.8) !important;
                }
                .job-card.selected .job-title {
                    color: white !important;
                }
                .pill-button {
                    padding: 0.5rem 1rem;
                    border-radius: 99px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    cursor: pointer;
                    border: 1px solid var(--border-color);
                    background: var(--primary-white);
                    color: var(--text-dark);
                    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
                }
                .pill-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                    border-color: var(--primary-blue);
                }
                .pill-button.active {
                    background: var(--primary-blue);
                    color: white;
                    border-color: var(--primary-blue);
                }
                /* ── Score 100% rainbow progress bar ── */
                @keyframes rainbowShift {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .rainbow-bar {
                    background: linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ec4899, #ef4444);
                    background-size: 300% 300%;
                    animation: rainbowShift 2s ease infinite;
                }
                /* ── Confetti particles ── */
                @keyframes confettiFall {
                    0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
                }
                .confetti-particle {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    border-radius: 2px;
                    animation: confettiFall 1.4s ease-out forwards;
                    pointer-events: none;
                    z-index: 10;
                }
                @keyframes welcomeScaleUp {
                    from { transform: scale(0.85); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes welcomeScaleDown {
                    from { transform: scale(1); opacity: 1; }
                    to { transform: scale(1.05); opacity: 0; }
                }
                .welcome-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(25px) saturate(160%);
                    -webkit-backdrop-filter: blur(25px) saturate(160%);
                    pointer-events: none;
                    transition: opacity 0.5s ease;
                }
                .welcome-glass-card {
                    padding: 4rem 6rem;
                    border-radius: 40px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    text-align: center;
                    animation: welcomeScaleUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .welcome-glass-card.fading-out {
                    animation: welcomeScaleDown 0.5s ease forwards;
                }
                .welcome-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--primary-blue);
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    opacity: 0.8;
                }
                .welcome-user-name {
                    font-size: 5rem;
                    font-weight: 900;
                    margin: 0.5rem 0 0;
                    background: linear-gradient(135deg, #1A237E, #10B981);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.04em;
                }
            `}</style>

             <div className="flex items-center gap-2 mb-6 relative z-10">
                <h1 className="gradient-persona-text" style={{ letterSpacing: '-0.03em' }}>
                    {t('Your Persona', 'आपकी पहचान')}
                </h1>
            </div>

            <div className="flex flex-col relative z-10" style={{ gap: '2rem' }}>

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
                                                        onChange={e => setUser({...user, github: e.target.value})}
                                                        style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', outline: 'none' }}
                                                    />
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <Linkedin size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#0a66c2' }} />
                                                    <input 
                                                        type="url" 
                                                        placeholder="LinkedIn Profile URL" 
                                                        value={user.linkedin || ''} 
                                                        onChange={e => setUser({...user, linkedin: e.target.value})}
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

                        <div className="mt-4" id="bio-section">
                            <label className="text-xs font-bold mb-2 uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                                {t('Bio / About Me', 'परिचय')}
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

                    {user.targetJob && (
                        <div style={{ marginTop: '1rem', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '1rem', position: 'relative' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Sparkles size={15} style={{ color: '#6366f1' }} />
                                AI Suggested Skills for {ps.jobTitle}
                            </h4>

                            {isAiLoadingSkills ? (
                                <div className="flex flex-col items-center justify-center py-4" style={{ color: 'var(--text-muted)' }}>
                                    <Loader2 size={24} className="animate-spin mb-2" style={{ color: '#6366f1' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Analyzing industry trends...</span>
                                </div>
                            ) : ps.missingSkills.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    {Object.entries(categorizedMissingSkills).map(([catTitle, skills]) => (
                                        <div key={catTitle}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>{catTitle}</span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {skills.map(skill => (
                                                    <span
                                                        key={skill}
                                                        onClick={() => toggleSkill(skill)}
                                                        style={{ fontSize: '0.75rem', fontWeight: '500', background: 'var(--primary-white)', border: '1px dashed #cbd5e1', padding: '0.3rem 0.7rem', borderRadius: '99px', color: 'var(--text-dark)', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(99,102,241,0.1)' }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = 'var(--text-dark)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                                                        title="Click to add to your skills"
                                                    >
                                                        <span style={{ color: '#6366f1' }}>+</span> {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-2" style={{ color: 'var(--text-muted)' }}>
                                    <Check size={20} className="mb-2" style={{ color: '#10b981' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Your skills match industry standards perfectly!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {/* Dream Job 3D Card Area */}
                <div className="glass-card" id="dreamjob-section" style={{ borderLeft: '6px solid var(--accent-green)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="text-success" size={24} />
                        <h2 className="text-2xl font-bold m-0" style={{ color: 'var(--text-dark)' }}>{t('Dream Job', 'सपनों की नौकरी')}</h2>
                    </div>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                        {t('Select your target role from these top careers. We will match your skills instantly.', 'इन शीर्ष करियरों में से अपनी लक्षित भूमिका चुनें।')}
                    </p>

                    <div className="panel-scroll">
                        <div className="job-grid">
                            {jobLibrary.map(job => (
                                <div
                                    key={job.id}
                                    onClick={() => updateTargetJob(job.id)}
                                    className={`job-card ${user.targetJob === job.id ? 'selected' : ''}`}
                                >
                                    <div>
                                        <div className="job-title font-bold text-md mb-1" style={{ color: 'var(--text-dark)' }}>{job.title}</div>
                                        <div className="text-xs text-muted" style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{job.category}</div>
                                    </div>
                                    {user.targetJob === job.id ? (
                                        <div className="bg-white rounded-full p-1 text-success flex items-center justify-center shadow-sm">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                    ) : (
                                        <Target size={20} color="var(--text-muted)" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Current Skills Card */}
                <div className="glass-card" id="skills-section">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold m-0" style={{ color: 'var(--text-dark)' }}>{t('Current Skills', 'वर्तमान कौशल')}</h2>
                        </div>
                        {user.skills && user.skills.length > 0 && (
                            <button
                                onClick={() => updateSkills([])}
                                style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '8px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
                                title="Remove all selected skills"
                            >
                                <Trash2 size={13} strokeWidth={2.5} /> {t('Clear All', 'सभी हटाएं')}
                            </button>
                        )}
                    </div>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                        {t('Tap to toggle skills across your profile. Categorized to help you find them faster.', 'कौशल टॉगल करने के लिए टैप करें। यह श्रेणियों में विभाजित है।')}
                    </p>

                    <div className="panel-scroll">
                        {categories.map(category => (
                            <div key={category.title}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem', paddingBottom: '0.75rem', borderBottom: '3px solid var(--text-dark)' }}>
                                    <h3 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-dark)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>{category.title}</h3>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
                                    {category.skills.map(skill => {
                                        const isActive = user.skills.includes(skill);
                                        return (
                                            <button
                                                key={skill}
                                                onClick={() => toggleSkill(skill)}
                                                className={`pill-button ${isActive ? 'active' : ''}`}
                                            >
                                                {skill} {isActive && <Check size={14} strokeWidth={3} />}
                                            </button>
                                        );
                                    })}
                                    <form onSubmit={(e) => handleAddCustomSkill(e, category.title)} style={{ display: 'inline-flex', margin: 0 }}>
                                        <input
                                            type="text"
                                            placeholder={`+ Add skill`}
                                            value={newSkillsInput[category.title] || ''}
                                            onChange={(e) => setNewSkillsInput(prev => ({ ...prev, [category.title]: e.target.value }))}
                                            style={{ padding: '0.35rem 0.8rem', borderRadius: '99px', border: '1px dashed var(--border-color)', fontSize: '0.8rem', background: 'transparent', color: 'var(--text-dark)', outline: 'none', width: '110px', transition: 'all 0.2s' }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--primary-blue)'; e.target.style.background = 'var(--primary-white)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.background = 'transparent'; }}
                                        />
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

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
