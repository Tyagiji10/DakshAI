import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAppTheme } from '../portfolio/hooks/useAppTheme';
import { useUser } from '../context/UserContext';
import { availableSkills as defaultSkills, jobLibrary } from '../lib/mockData';
import {
    FileText, Sparkles, Code, User, Briefcase, Edit3, GraduationCap,
    Award, Star, Download, ChevronDown, ChevronUp, Target,
    Zap, Upload, X, Search, Plus, AlertCircle, FileType, Loader2,
    CheckCircle2, Gauge, RefreshCw, BarChart, Trash2
} from 'lucide-react';
import {
    generateProfessionalSummary,
    parseResumeFromDocument,
    tailorResumeToJD,
    categorizeSkill,
    analyzeResumeAgainstJD
} from '../lib/ai';


// ─── A4 dimensions at 96 dpi: 794 × 1123 px ────────────────────────────────
const A4_W = 794;
const A4_H = 1123;
const PAGE_PADDING = 56;

// ─── Collapsible Section Block ────────────────────────────────────────────────
const SectionBlock = ({ icon, title, badge, defaultOpen = false, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '0.6rem' }}>
            <button type="button" onClick={() => setOpen(o => !o)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-light)', border: 'none', cursor: 'pointer', color: 'var(--primary-blue)', fontWeight: '700', fontSize: '0.88rem', gap: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {icon}
                    {title}
                    {badge && <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.15)', color: '#059669', borderRadius: '99px', padding: '1px 7px', fontWeight: '700' }}>{badge}</span>}
                </span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {open && <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>{children}</div>}
        </div>
    );
};

// ─── ATS Friendly Resume Section ─────────────────────────────────────────
const RS = ({ title, children }) => (
    <section style={{ marginBottom: '12pt', pageBreakInside: 'avoid' }}>
        <h3 style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: '10pt',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            borderBottom: '1px solid #000',
            paddingBottom: '2pt',
            marginBottom: '6pt',
            color: '#000',
            letterSpacing: '0.03em'
        }}>{title}</h3>
        {children}
    </section>
);

const preStyle = {
    fontSize: '9.5pt',
    whiteSpace: 'pre-wrap',
    margin: 0,
    lineHeight: '1.5',
    fontFamily: "Arial, Helvetica, sans-serif",
    color: '#000'
};

const ResumeBuilder = () => {
    const { user } = useUser();
    const { isDark } = useAppTheme();
    const [builderMode] = useState('ai'); // AI mode only as per user request
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        github: '',
        linkedin: '',
        portfolio: '',
        location: '',
        summary: '',
        headline: '',
        selectedSkills: user?.skills || [],
        experience: '',
        projects: '',
        education: '',
        certifications: '',
        achievements: '',
        leadership: '',
        publications: '',
    });

    
    // --- STRUCTURED FORM STATE ---
        const [expItems, setExpItems] = useState([{ id: Date.now() + Math.random(), company: '', role: '', type: 'Full-time', start: '', end: '', current: false, location: '', description: '' }]);
    const [projItems, setProjItems] = useState([{ id: Date.now() + Math.random(), title: '', tech: '', type: 'Personal', start: '', end: '', ongoing: false, url: '', demo: '', description: '' }]);
    const [eduItems, setEduItems] = useState([{ id: Date.now() + Math.random(), institution: '', degree: '', field: '', start: '', end: '', current: false, grade: '', achievements: '' }]);
    const [certItems, setCertItems] = useState([{ id: Date.now() + Math.random(), name: '', org: '', issue: '', expiry: '', noExpiry: false, credentialId: '', url: '' }]);

        const parseList = (text, type) => {
        let parsed = [];
        if (text) {
            parsed = text.split(/\n\s*\n/).filter(Boolean).map(block => {
                const lines = block.split('\n').filter(Boolean);
                let headerL = '', headerR = '', subheader = '', desc = '';
                lines.forEach(line => {
                    const clean = line.trim();
                    if (clean.includes('|') && clean.includes('**')) {
                        const [left, right] = clean.split('|').map(s => s.trim());
                        headerL = left.replace(/\*\*/g, '');
                        headerR = right || '';
                    } else if (clean.startsWith('**') && clean.endsWith('**') && !headerL) {
                        headerL = clean.replace(/\*\*/g, '');
                    } else if (headerL && !subheader && !clean.startsWith('•') && !clean.startsWith('-')) {
                        subheader = clean;
                    } else {
                        desc += (desc ? '\n' : '') + clean;
                    }
                });
                desc = desc.replace(/^[•\-]\s*/gm, '');

                if (type === 'exp') {
                    const dates = headerR.split('-');
                    return {
                        id: Date.now() + Math.random(),
                        company: headerL.split('-')[0]?.trim() || headerL,
                        role: headerL.split('-')[1]?.trim() || subheader.split('|')[0]?.trim() || '',
                        type: 'Full-time',
                        start: dates[0]?.trim() || '',
                        end: dates[1]?.trim().toLowerCase() === 'present' ? '' : (dates[1]?.trim() || ''),
                        current: dates[1]?.trim().toLowerCase() === 'present',
                        location: subheader.split('|')[1]?.trim() || '',
                        description: desc
                    };
                }
                if (type === 'proj') {
                    const dates = headerR.split('-');
                    return {
                        id: Date.now() + Math.random(),
                        title: headerL,
                        tech: subheader.split('|')[0]?.trim() || '',
                        type: subheader.split('|')[1]?.trim() || 'Personal',
                        start: dates[0]?.trim() || '',
                        end: dates[1]?.trim().toLowerCase() === 'present' ? '' : (dates[1]?.trim() || ''),
                        ongoing: dates[1]?.trim().toLowerCase() === 'present',
                        url: '',
                        demo: '',
                        description: desc
                    };
                }
                if (type === 'edu') {
                    const dates = headerR.split('-');
                    return {
                        id: Date.now() + Math.random(),
                        institution: headerL,
                        degree: subheader.split('|')[0]?.trim() || '',
                        field: '',
                        start: dates[0]?.trim() || '',
                        end: dates[1]?.trim().toLowerCase() === 'present' ? '' : (dates[1]?.trim() || ''),
                        current: dates[1]?.trim().toLowerCase() === 'present',
                        grade: subheader.split('|')[1]?.trim() || '',
                        achievements: desc
                    };
                }
                if (type === 'cert') {
                    return {
                        id: Date.now() + Math.random(),
                        name: headerL,
                        org: subheader,
                        issue: headerR,
                        expiry: '',
                        noExpiry: false,
                        credentialId: '',
                        url: ''
                    };
                }
            });
        }
        
        if (parsed.length === 0) {
            if (type === 'exp') parsed.push({ id: Date.now() + Math.random(), company: '', role: '', type: 'Full-time', start: '', end: '', current: false, location: '', description: '' });
            if (type === 'proj') parsed.push({ id: Date.now() + Math.random(), title: '', tech: '', type: 'Personal', start: '', end: '', ongoing: false, url: '', demo: '', description: '' });
            if (type === 'edu') parsed.push({ id: Date.now() + Math.random(), institution: '', degree: '', field: '', start: '', end: '', current: false, grade: '', achievements: '' });
            if (type === 'cert') parsed.push({ id: Date.now() + Math.random(), name: '', org: '', issue: '', expiry: '', noExpiry: false, credentialId: '', url: '' });
        }
        return parsed;
    };

        const compileList = (items, type) => {
        return items.filter(item => {
            if (type === 'exp') return item.company || item.role || item.description;
            if (type === 'proj') return item.title || item.tech || item.description;
            if (type === 'edu') return item.institution || item.degree || item.achievements;
            if (type === 'cert') return item.name || item.org;
            return false;
        }).map(item => {
            if (type === 'exp') {
                const left = `**${item.company}${item.role ? ` - ${item.role}` : ''}**`;
                const right = item.start ? `${item.start} - ${item.current ? 'Present' : item.end}` : '';
                const sub = [item.type, item.location].filter(Boolean).join(' | ');
                const desc = item.description ? item.description.split('\n').map(l => `• ${l}`).join('\n') : '';
                return `${left}${right ? ` | ${right}` : ''}${sub ? `\n${sub}` : ''}${desc ? `\n${desc}` : ''}`;
            }
            if (type === 'proj') {
                const left = `**${item.title}**`;
                const right = item.start ? `${item.start} - ${item.ongoing ? 'Present' : item.end}` : '';
                const sub = [item.tech, item.type].filter(Boolean).join(' | ');
                const desc = item.description ? item.description.split('\n').map(l => `• ${l}`).join('\n') : '';
                const links = [item.url ? `GitHub: ${item.url}` : '', item.demo ? `Live: ${item.demo}` : ''].filter(Boolean).join(' | ');
                return `${left}${right ? ` | ${right}` : ''}${sub ? `\n${sub}` : ''}${desc ? `\n${desc}` : ''}${links ? `\n${links}` : ''}`;
            }
            if (type === 'edu') {
                const left = `**${item.institution}**`;
                const right = item.start ? `${item.start} - ${item.current ? 'Present' : item.end}` : '';
                const sub = [item.degree, item.field].filter(Boolean).join(' in ') + (item.grade ? ` | ${item.grade}` : '');
                const desc = item.achievements ? item.achievements.split('\n').map(l => `• ${l}`).join('\n') : '';
                return `${left}${right ? ` | ${right}` : ''}${sub ? `\n${sub}` : ''}${desc ? `\n${desc}` : ''}`;
            }
            if (type === 'cert') {
                const left = `**${item.name}**`;
                const right = item.issue ? item.issue : '';
                const sub = item.org;
                const links = item.url ? `URL: ${item.url}` : '';
                return `${left}${right ? ` | ${right}` : ''}${sub ? `\n${sub}` : ''}${links ? `\n${links}` : ''}`;
            }
        }).join('\n\n');
    };

    // State Sync Effects
    useEffect(() => {
        if (formData.experience !== undefined && formData.experience !== compileList(expItems, 'exp')) {
            setExpItems(parseList(formData.experience, 'exp'));
        }
    }, [formData.experience]);
    useEffect(() => {
        if (formData.projects !== undefined && formData.projects !== compileList(projItems, 'proj')) {
            setProjItems(parseList(formData.projects, 'proj'));
        }
    }, [formData.projects]);
    useEffect(() => {
        if (formData.education !== undefined && formData.education !== compileList(eduItems, 'edu')) {
            setEduItems(parseList(formData.education, 'edu'));
        }
    }, [formData.education]);
    useEffect(() => {
        if (formData.certifications !== undefined && formData.certifications !== compileList(certItems, 'cert')) {
            setCertItems(parseList(formData.certifications, 'cert'));
        }
    }, [formData.certifications]);

    // Add and Remove Handlers
    const addExpItem = () => {
        const next = [...expItems, { id: Date.now(), company: '', role: '', type: 'Full-time', start: '', end: '', current: false, location: '', description: '' }];
        setExpItems(next);
        setFormData(fd => ({ ...fd, experience: compileList(next, 'exp') }));
    };
    const removeExpItem = (id) => {
        const next = expItems.filter(i => i.id !== id);
        setExpItems(next);
        setFormData(fd => ({ ...fd, experience: compileList(next, 'exp') }));
    };
    const updateExp = (id, field, value) => {
        const next = expItems.map(item => item.id === id ? { ...item, [field]: value } : item);
        setExpItems(next);
        setFormData(fd => ({ ...fd, experience: compileList(next, 'exp') }));
    };

    const addProjItem = () => {
        const next = [...projItems, { id: Date.now(), title: '', tech: '', type: 'Personal', start: '', end: '', ongoing: false, url: '', demo: '', description: '' }];
        setProjItems(next);
        setFormData(fd => ({ ...fd, projects: compileList(next, 'proj') }));
    };
    const removeProjItem = (id) => {
        const next = projItems.filter(i => i.id !== id);
        setProjItems(next);
        setFormData(fd => ({ ...fd, projects: compileList(next, 'proj') }));
    };
    const updateProj = (id, field, value) => {
        const next = projItems.map(item => item.id === id ? { ...item, [field]: value } : item);
        setProjItems(next);
        setFormData(fd => ({ ...fd, projects: compileList(next, 'proj') }));
    };

    const addEduItem = () => {
        const next = [...eduItems, { id: Date.now(), institution: '', degree: '', field: '', start: '', end: '', current: false, grade: '', achievements: '' }];
        setEduItems(next);
        setFormData(fd => ({ ...fd, education: compileList(next, 'edu') }));
    };
    const removeEduItem = (id) => {
        const next = eduItems.filter(i => i.id !== id);
        setEduItems(next);
        setFormData(fd => ({ ...fd, education: compileList(next, 'edu') }));
    };
    const updateEdu = (id, field, value) => {
        const next = eduItems.map(item => item.id === id ? { ...item, [field]: value } : item);
        setEduItems(next);
        setFormData(fd => ({ ...fd, education: compileList(next, 'edu') }));
    };

    const addCertItem = () => {
        const next = [...certItems, { id: Date.now(), name: '', org: '', issue: '', expiry: '', noExpiry: false, credentialId: '', url: '' }];
        setCertItems(next);
        setFormData(fd => ({ ...fd, certifications: compileList(next, 'cert') }));
    };
    const removeCertItem = (id) => {
        const next = certItems.filter(i => i.id !== id);
        setCertItems(next);
        setFormData(fd => ({ ...fd, certifications: compileList(next, 'cert') }));
    };
    const updateCert = (id, field, value) => {
        const next = certItems.map(item => item.id === id ? { ...item, [field]: value } : item);
        setCertItems(next);
        setFormData(fd => ({ ...fd, certifications: compileList(next, 'cert') }));
    };
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenSummary, setIsGenSummary] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isTailoring, setIsTailoring] = useState(false);
    const [rawResumeText, setRawResumeText] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [skillSearch, setSkillSearch] = useState('');
    const [customSkills, setCustomSkills] = useState([]);
    const [jdText, setJdText] = useState('');
    const [resumePages, setResumePages] = useState(null);
    const [error, setError] = useState('');
    const [aiPanelExpanded, setAiPanelExpanded] = useState(false); // default to collapsed

    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Combine default and custom skills
    const allAvailableSkills = useMemo(() => {
        const combined = [...defaultSkills, ...customSkills];
        return Array.from(new Set(combined)).sort();
    }, [customSkills]);

    const filteredSkills = useMemo(() => {
        if (!skillSearch) return allAvailableSkills.slice(0, 30);
        return allAvailableSkills.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()));
    }, [allAvailableSkills, skillSearch]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const toggleSkill = (skill) => setFormData(prev => ({
        ...prev,
        selectedSkills: prev.selectedSkills.includes(skill)
            ? prev.selectedSkills.filter(s => s !== skill)
            : [...prev.selectedSkills, skill]
    }));

    const handleAddCustomSkill = async () => {
        if (!skillSearch.trim()) return;
        const newSkill = skillSearch.trim();
        if (!allAvailableSkills.includes(newSkill)) {
            setCustomSkills(prev => [...prev, newSkill]);
            setFormData(prev => ({ ...prev, selectedSkills: [...prev.selectedSkills, newSkill] }));
            setSkillSearch('');
        }
    };

    const [aiStatus, setAiStatus] = useState(''); // status message for AI pipeline

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('File size exceeds 5MB limit.');
            return;
        }
        setUploadedFile(file);
        setError('');
    };

    // ── Unified Auto AI Pipeline ─────────────────────────────────────────────
    // When user provides resume (file/text) + JD → auto extract → tailor → fill → generate
    const runAIPipeline = async (file, text, jd) => {
        if (!file && !text.trim()) return;
        setIsParsing(true);
        setError('');
        setAiStatus('🔍 Extracting resume details...');
        try {
                        // Step 1: Extract resume data
            let data;
            if (file) {
                data = await parseResumeFromDocument(file);
            } else {
                const { parseResume } = await import('../lib/ai');
                data = await parseResume(text);
            }

            setAiStatus('✅ Details extracted!');

            // Convert structured AI arrays to Markdown for legacy formData structure
            const processedData = {
                ...data,
                experience: Array.isArray(data.experience) ? compileList(data.experience, 'exp') : data.experience,
                projects: Array.isArray(data.projects) ? compileList(data.projects, 'proj') : data.projects,
                education: Array.isArray(data.education) ? compileList(data.education, 'edu') : data.education,
                certifications: Array.isArray(data.certifications) ? compileList(data.certifications, 'cert') : data.certifications
            };

            // Update UI Array States directly
            if (Array.isArray(data.experience) && data.experience.length > 0) setExpItems(data.experience);
            if (Array.isArray(data.projects) && data.projects.length > 0) setProjItems(data.projects);
            if (Array.isArray(data.education) && data.education.length > 0) setEduItems(data.education);
            if (Array.isArray(data.certifications) && data.certifications.length > 0) setCertItems(data.certifications);

            // Phase 12: Confidence Checks
            if (data.confidenceScores) {
                const weakFields = Object.entries(data.confidenceScores)
                    .filter(([k, v]) => v < 80)
                    .map(([k]) => k);
                if (weakFields.length > 0) {
                    // Slight delay to ensure UI mounts before alerting
                    setTimeout(() => {
                        alert(`AI Confidence Warning: Double-check the following extracted fields:\n${weakFields.join(', ')}`);
                    }, 800);
                }
            }

            // Step 2: If JD provided, run analysis (DO NOT auto-tailor)
            if (jd && jd.trim()) {
                setAiStatus('🧠 Analyzing Resume against JD...');
                setIsAnalyzing(true);
                try {
                    const analysis = await analyzeResumeAgainstJD({ ...formData, ...processedData }, jd);
                    setAnalysisResult(analysis);
                    setAiStatus('✅ Intelligence Report Ready!');
                } catch (err) {
                    console.error("Analysis failed:", err);
                    setAiStatus('⚠️ JD match analysis skipped (AI busy). Resume extracted successfully.');
                } finally {
                    setIsAnalyzing(false);
                }
                setFormData(prev => ({ ...prev, ...processedData }));
            } else {
                setAnalysisResult(null);
                setFormData(prev => ({ ...prev, ...processedData }));
            }

            // Step 3: Auto generate resume preview
            setAiStatus('📄 Building resume...');
            setTimeout(() => {
                triggerGenerate({ ...formData, ...processedData });
                setAiStatus('');
            }, 600);

        } catch (err) {
            console.error("Pipeline failed:", err);
            setError("Could not process resume. Try pasting the text instead.");
            setAiStatus('');
        } finally {
            setIsParsing(false);
        }
    };

    // Auto-trigger: when both resume input + JD are available in AI mode
    const aiProcessTimeoutRef = useRef(null);
    useEffect(() => {
        if (builderMode !== 'ai') return;
        const hasInput = uploadedFile || rawResumeText.trim();
        const hasJD = jdText.trim();
        if (!hasInput) return;

        // Debounce: wait 1.5s after last change before auto-running
        if (aiProcessTimeoutRef.current) clearTimeout(aiProcessTimeoutRef.current);
        aiProcessTimeoutRef.current = setTimeout(() => {
            if (!isParsing && !isTailoring) {
                runAIPipeline(uploadedFile, rawResumeText, jdText);
            }
        }, hasJD ? 2000 : 1500);

        return () => { if (aiProcessTimeoutRef.current) clearTimeout(aiProcessTimeoutRef.current); };
    }, [uploadedFile, rawResumeText, jdText, builderMode]);

    const handleOptimizeResume = async () => {
        if (!jdText.trim()) return;
        setIsTailoring(true);
        setAiStatus('🎯 Optimizing Resume for Job Description...');
        try {
            const tailored = await tailorResumeToJD(formData, jdText);
            if (tailored?.step2) {
                const { summary, skills, experience } = tailored.step2;
                const newSkills = [
                    ...(skills?.programmingLanguages || []),
                    ...(skills?.frameworksPlatforms || []),
                    ...(skills?.toolsTechnologies || []),
                    ...(skills?.conceptsCoreSkills || [])
                ].filter(Boolean);

                const updatedFormData = {
                    ...formData,
                    summary: summary || formData.summary,
                    experience: experience || formData.experience,
                    selectedSkills: [...new Set([...(formData.selectedSkills || []), ...newSkills])]
                };
                
                setFormData(updatedFormData);
                
                // Re-run analysis after optimization
                setAiStatus('🔄 Re-calculating Match Score...');
                setIsAnalyzing(true);
                const analysis = await analyzeResumeAgainstJD(updatedFormData, jdText);
                setAnalysisResult(analysis);
                
                setAiStatus('✅ Resume Optimization Complete!');
                setTimeout(() => {
                    triggerGenerate(updatedFormData);
                    setAiStatus('');
                }, 600);
            }
        } catch (err) {
            console.error("Tailoring failed:", err);
            setError("Optimization failed due to AI load. Please try again.");
            setAiStatus('');
        } finally {
            setIsTailoring(false);
            setIsAnalyzing(false);
        }
    };

    // Helper to apply tailored content (kept for internal use)
    const applyTailoredContent = (tailorResult) => {
        if (!tailorResult?.step2) return;
        const { summary, skills, experience } = tailorResult.step2;
        const newSkills = [
            ...(skills?.programmingLanguages || []),
            ...(skills?.frameworksPlatforms || []),
            ...(skills?.toolsTechnologies || []),
            ...(skills?.conceptsCoreSkills || [])
        ].filter(Boolean);
        setFormData(prev => ({
            ...prev,
            summary,
            experience,
            selectedSkills: [...new Set([...prev.selectedSkills, ...newSkills])]
        }));
    };

    const handleGenSummary = async () => {
        if (formData.selectedSkills.length === 0) return;
        setIsGenSummary(true);
        try {
            const summary = await generateProfessionalSummary(formData);
            setFormData(prev => ({ ...prev, summary }));
        } catch (error) {
            console.error("AI Summary failed:", error);
        } finally {
            setIsGenSummary(false);
        }
    };

    const handleDownload = () => {
        const win = window.open('', '_blank');
        win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${formData.name || 'Resume'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet"/>
        </head><body>${buildResumeHTML(formData)}</body></html>`);
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); }, 500);
    };

    const categorizeSkills = (skillsArray) => {
        const categories = {
            "Languages": [],
            "Frameworks": [],
            "Databases": [],
            "Cloud & DevOps": [],
            "Tools & Other": []
        };
        const dict = {
            lang: ['python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'sql', 'php'],
            frame: ['react', 'angular', 'vue', 'next', 'django', 'flask', 'spring', 'express', 'node', 'tailwind', 'bootstrap', 'dotnet', 'svelte'],
            db: ['mysql', 'postgres', 'mongodb', 'redis', 'oracle', 'sql server', 'sqlite', 'cassandra', 'dynamodb'],
            cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'github actions', 'terraform', 'ci/cd', 'linux']
        };

        skillsArray.forEach(skill => {
            const s = skill.toLowerCase();
            if (dict.lang.some(k => s.includes(k) || s === k)) categories["Languages"].push(skill);
            else if (dict.frame.some(k => s.includes(k) || s === k)) categories["Frameworks"].push(skill);
            else if (dict.db.some(k => s.includes(k) || s === k)) categories["Databases"].push(skill);
            else if (dict.cloud.some(k => s.includes(k) || s === k)) categories["Cloud & DevOps"].push(skill);
            else categories["Tools & Other"].push(skill);
        });
        return Object.entries(categories).filter(([_, list]) => list.length > 0);
    };

    const formatLinks = (text) => {
        if (!text) return '';
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
        return text.replace(urlRegex, (url) => {
            let href = url;
            if (!href.startsWith('http')) href = 'https://' + href;
            let label = 'Open Link';
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.includes('github.com')) label = 'GitHub';
            else if (lowerUrl.includes('linkedin.com')) label = 'LinkedIn';
            else if (lowerUrl.includes('portfolio') || lowerUrl.includes('vercel.app') || lowerUrl.includes('netlify.app')) label = 'Portfolio';
            else if (lowerUrl.includes('cert') || lowerUrl.includes('credential') || lowerUrl.includes('verify') || lowerUrl.includes('badge')) label = 'View Certificate';
            else if (lowerUrl.includes('demo') || lowerUrl.includes('live')) label = 'Live Demo';
            else label = 'Project Link';
            return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #000; text-decoration: underline; font-weight: 500;">${label}</a>`;
        });
    };

    const formatStructuredContent = (text, isHtmlExport = false) => {
        if (!text) return null;
        const blocks = text.split(/\n\s*\n/).filter(Boolean); 
        
        return blocks.map((block, idx) => {
            const lines = block.split('\n').filter(Boolean);
            let header = null;
            let subheader = null;
            let items = []; 
            
            lines.forEach(line => {
                const clean = line.trim();
                if (clean.includes('|') && clean.includes('**')) {
                    const [left, right] = clean.split('|').map(s => s.trim());
                    header = { left: left.replace(/\*\*/g, ''), right: right || '' };
                } else if (clean.startsWith('**') && clean.endsWith('**') && !header) {
                     header = { left: clean.replace(/\*\*/g, ''), right: '' };
                } else if (clean.startsWith('•') || clean.startsWith('-') || /^[0-9]+\./.test(clean)) {
                    items.push({ type: 'bullet', text: clean.replace(/^[•\-0-9.]+\s*/, '') });
                } else if (/^(Developed|Improved|Implemented|Designed|Created|Led|Managed|Built|Reduced|Increased|Achieved|Spearheaded|Architected|Delivered|Integrated)/i.test(clean)) {
                    items.push({ type: 'bullet', text: clean });
                } else if (header && !subheader && items.length === 0) {
                    subheader = clean;
                } else {
                    items.push({ type: 'paragraph', text: clean });
                }
            });

            const renderText = (str) => {
                let html = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return formatLinks(html);
            };

            if (isHtmlExport) {
                let html = '<div class="item" style="margin-bottom: 8pt; page-break-inside: avoid;">';
                if (header) {
                    html += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2pt;">
                                <strong style="font-size: 10pt; color: #000;">${header.left}</strong>
                                <span style="font-size: 9pt; color: #000; font-weight: 600;">${header.right}</span>
                             </div>`;
                }
                if (subheader) {
                    html += `<div style="font-size: 9.5pt; font-style: italic; margin-bottom: 3pt; color: #000;">${subheader}</div>`;
                }
                let inList = false;
                items.forEach(item => {
                    if (item.type === 'bullet') {
                        if (!inList) { html += `<ul style="padding-left: 14pt; margin: 0 0 3pt 0; color: #000;">`; inList = true; }
                        html += `<li style="font-size: 9.5pt; margin-bottom: 2pt; line-height: 1.4;">${renderText(item.text)}</li>`;
                    } else {
                        if (inList) { html += `</ul>`; inList = false; }
                        html += `<div style="font-size: 9.5pt; margin-bottom: 3pt; line-height: 1.4;">${renderText(item.text)}</div>`;
                    }
                });
                if (inList) html += `</ul>`;
                html += '</div>';
                return html;
            } else {
                return (
                    <div key={idx} style={{ marginBottom: '8pt', color: '#000', pageBreakInside: 'avoid' }}>
                        {header && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2pt' }}>
                                <strong style={{ fontSize: '10pt', color: '#000' }}>{header.left}</strong>
                                <span style={{ fontSize: '9pt', color: '#000', fontWeight: 600 }}>{header.right}</span>
                            </div>
                        )}
                        {subheader && (
                            <div style={{ fontSize: '9.5pt', fontStyle: 'italic', marginBottom: '3pt', color: '#000' }}>{subheader}</div>
                        )}
                        {(() => {
                            let uiElements = [];
                            let currentList = [];
                            const flushList = () => {
                                if (currentList.length > 0) {
                                    uiElements.push(
                                        <ul key={`ul-${uiElements.length}`} style={{ paddingLeft: '14pt', margin: '0 0 3pt 0' }}>
                                            {currentList.map((li, i) => (
                                                <li key={i} style={{ fontSize: '9.5pt', marginBottom: '2pt', lineHeight: 1.4, color: '#000' }} dangerouslySetInnerHTML={{ __html: renderText(li) }} />
                                            ))}
                                        </ul>
                                    );
                                    currentList = [];
                                }
                            };
                            items.forEach((item, i) => {
                                if (item.type === 'bullet') {
                                    currentList.push(item.text);
                                } else {
                                    flushList();
                                    uiElements.push(<div key={`p-${i}`} style={{ fontSize: '9.5pt', marginBottom: '3pt', lineHeight: 1.4, color: '#000' }} dangerouslySetInnerHTML={{ __html: renderText(item.text) }} />);
                                }
                            });
                            flushList();
                            return uiElements;
                        })()}
                    </div>
                );
            }
        });
    };

    const renderSkillsHtml = (fd) => {
        if (!fd.selectedSkills?.length) return '';
        const categorized = categorizeSkills(fd.selectedSkills);
        let html = `<div style="margin-bottom: 12pt;">`;
        categorized.forEach(([cat, list]) => {
            html += `
                <div style="display: flex; margin-bottom: 4pt;">
                    <strong style="width: 120px; flex-shrink: 0; font-size: 9.5pt; color: #000;">${cat}</strong>
                    <span style="width: 15px; flex-shrink: 0; font-size: 9.5pt; color: #000;">:</span>
                    <span style="font-size: 9.5pt; color: #000;">${list.join(', ')}</span>
                </div>
            `;
        });
        html += `</div>`;
        return html;
    };

    const buildResumeHTML = (fd) => {
        return `
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:Arial, Helvetica, sans-serif;color:#000;background:#fff;font-size:10pt;line-height:1.4}
          h1{font-family:Arial, Helvetica, sans-serif;font-size:18pt;font-weight:bold;text-transform:uppercase;margin-bottom:2pt;text-align:center;color:#000}
          .sub{font-family:Arial, Helvetica, sans-serif;font-size:10pt;font-weight:bold;text-align:center;margin-bottom:4pt;color:rgb(92, 88, 88);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .contact{font-family:Arial, Helvetica, sans-serif;font-size:9pt;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:12pt;color:#000}
          header{margin-bottom:12pt}
          section{margin-bottom:12pt}
          h3{font-family:Arial, Helvetica, sans-serif;font-size:10pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:2pt;margin-bottom:6pt;letter-spacing:0.03em;color:#000}
          p,li,pre{font-size:9.5pt;line-height:1.5;color:#000}
          .contact a{color:#000;text-decoration:none}
          pre{white-space:pre-wrap;font-family:inherit}
          strong{font-weight:bold}
          @page{size:A4;margin:15mm}
        </style>
        <header>
          <h1>${fd.name}</h1>
          ${fd.headline ? `<div class="sub" style="color: rgb(92, 88, 88); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${fd.headline}</div>` : ''}
          <div class="contact">
            ${fd.email ? `<span><a href="mailto:${fd.email}">${fd.email}</a></span>` : ''}
            ${fd.phone ? `<span> • <a href="tel:${fd.phone}">${fd.phone}</a></span>` : ''}
            ${fd.location ? `<span> • ${fd.location}</span>` : ''}
            ${fd.linkedin ? `<span> • <a href="${fd.linkedin.startsWith('http') ? fd.linkedin : 'https://' + fd.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a></span>` : ''}
            ${fd.github ? `<span> • <a href="${fd.github.startsWith('http') ? fd.github : 'https://' + fd.github}" target="_blank" rel="noopener noreferrer">GitHub</a></span>` : ''}
            ${fd.portfolio ? `<span> • <a href="${fd.portfolio.startsWith('http') ? fd.portfolio : 'https://' + fd.portfolio}" target="_blank" rel="noopener noreferrer">Portfolio</a></span>` : ''}
          </div>
        </header>
        ${fd.summary ? `<section><h3>Professional Summary</h3><p>${fd.summary}</p></section>` : ''}
        ${fd.selectedSkills.length > 0 ? `<section><h3>Technical Skills</h3>${renderSkillsHtml(fd)}</section>` : ''}
        ${fd.experience ? `<section><h3>Work Experience</h3>${formatStructuredContent(fd.experience, true)}</section>` : ''}
        ${fd.projects ? `<section><h3>Projects</h3>${formatStructuredContent(fd.projects, true)}</section>` : ''}
        ${fd.education ? `<section><h3>Education</h3>${formatStructuredContent(fd.education, true)}</section>` : ''}
        ${fd.certifications ? `<section><h3>Certifications</h3>${formatStructuredContent(fd.certifications, true)}</section>` : ''}
        ${fd.achievements ? `<section><h3>Achievements</h3>${formatStructuredContent(fd.achievements, true)}</section>` : ''}
        ${fd.leadership ? `<section><h3>Leadership</h3><pre>${fd.leadership}</pre></section>` : ''}`;
    };

    // Shared resume page builder - used by both manual and auto pipeline
    const buildPages = (fd) => {
        if (!fd) return [];
        
        // Ensure data exists and is in correct format
        const safeSkills = Array.isArray(fd.selectedSkills) ? fd.selectedSkills : [];
        const safeName = fd.name || 'Your Name';
        const safeHeadline = fd.headline || '';
        const safeExp = fd.experience || '';
        const safeProj = fd.projects || '';
        const safeEdu = fd.education || '';
        
        return [{
            header: (
                <header style={{ marginBottom: '12pt', textAlign: 'center', color: '#000' }}>
                    <h1 style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 2pt 0' }}>{safeName}</h1>
                    {safeHeadline && <div className="resume-headline" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: '10pt', fontWeight: 'bold', marginBottom: '4pt', color: 'rgb(92, 88, 88)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{safeHeadline}</div>}
                    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: '9pt', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', color: '#000' }}>
                        {fd.email && <span><a href={`mailto:${fd.email}`} style={{ color: '#000', textDecoration: 'none' }}>{fd.email}</a></span>}
                        {fd.phone && <span> • <a href={`tel:${fd.phone}`} style={{ color: '#000', textDecoration: 'none' }}>{fd.phone}</a></span>}
                        {fd.location && <span style={{ color: '#000' }}> • {fd.location}</span>}
                        {fd.linkedin && <span> • <a href={fd.linkedin.startsWith('http') ? fd.linkedin : 'https://' + fd.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'none' }}>LinkedIn</a></span>}
                        {fd.github && <span> • <a href={fd.github.startsWith('http') ? fd.github : 'https://' + fd.github} target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'none' }}>GitHub</a></span>}
                        {fd.portfolio && <span> • <a href={fd.portfolio.startsWith('http') ? fd.portfolio : 'https://' + fd.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'none' }}>Portfolio</a></span>}
                    </div>
                </header>
            ),
            sections: [
                fd.summary && <RS key="sum" title="Professional Summary"><p style={{ ...preStyle, whiteSpace: 'normal', color: '#000' }}>{fd.summary}</p></RS>,
                safeSkills.length > 0 && (
                    <RS key="sk" title="Technical Skills">
                        <div style={{ marginBottom: '12pt', color: '#000' }}>
                            {categorizeSkills(safeSkills).map(([cat, list], i) => (
                                <div key={i} style={{ display: 'flex', marginBottom: '4pt' }}>
                                    <strong style={{ width: '120px', flexShrink: 0, fontSize: '9.5pt', color: '#000' }}>{cat}</strong>
                                    <span style={{ width: '15px', flexShrink: 0, fontSize: '9.5pt', color: '#000' }}>:</span>
                                    <span style={{ fontSize: '9.5pt', color: '#000' }}>{list.join(', ')}</span>
                                </div>
                            ))}
                        </div>
                    </RS>
                ),
                safeExp && (
                    <RS key="ex" title="Work Experience">
                        {formatStructuredContent(safeExp, false)}
                    </RS>
                ),
                safeProj && (
                    <RS key="pr" title="Projects">
                        {formatStructuredContent(safeProj, false)}
                    </RS>
                ),
                safeEdu && (
                    <RS key="ed" title="Education">
                        {formatStructuredContent(safeEdu, false)}
                    </RS>
                ),
                fd.certifications && (
                    <RS key="ce" title="Certifications">
                        {formatStructuredContent(fd.certifications, false)}
                    </RS>
                ),
                fd.achievements && (
                    <RS key="ach" title="Achievements">
                        {formatStructuredContent(fd.achievements, false)}
                    </RS>
                ),
                fd.leadership && (
                    <RS key="lead" title="Leadership">
                        {formatStructuredContent(fd.leadership, false)}
                    </RS>
                )
            ].filter(Boolean)
        }];
    };

    // Called by auto pipeline with custom data
    const triggerGenerate = (fd) => {
        setIsGenerating(true);
        setResumePages(null);
        setTimeout(() => {
            try {
                setResumePages(buildPages(fd));
            } catch (err) {
                console.error("Resume generation failed:", err);
                setError("Failed to generate resume. Please check your data.");
            } finally {
                setIsGenerating(false);
            }
        }, 400);
    };

    // Called by the manual "Build" button
    const handleGenerate = () => {
        setIsGenerating(true);
        setResumePages(null);
        setTimeout(() => {
            try {
                setResumePages(buildPages(formData));
            } catch (err) {
                console.error("Resume generation failed:", err);
                setError("Failed to generate resume. Please check your data.");
            } finally {
                setIsGenerating(false);
            }
        }, 800);
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    const inputStyle = { width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '0.88rem', outline: 'none' };
    const labelStyle = { fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' };
    const textareaStyle = { ...inputStyle, minHeight: '90px', resize: 'vertical', lineHeight: '1.6' };

    return (
        <div className="pb-20 resume-page-wrapper">
            <style>{`
                @media (max-width: 768px) {
                    .force-mobile-gap { padding-top: 10px !important; margin-top: 0px !important; }
                    .resume-header-mobile { text-align: center !important; }
                    .resume-header-mobile .flex { justify-content: center !important; }
                    .resume-header-mobile p { margin-left: 0 !important; }
                }
            `}</style>
            {/* Standardized Header (Mobile & Desktop) */}
            <div className="mb-8 force-mobile-gap resume-header-mobile">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <FileText size={24} className="text-primary" />
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold m-0" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                        AI Resume Maker (Pro)
                    </h1>
                </div>
                <p className="text-muted text-[0.7rem] md:text-sm ml-11 md:ml-12 max-w-md md:max-w-none">
                    Fill any sections — empty ones are skipped. Resume auto-paginates to A4.
                </p>
            </div>

            <div className="resume-layout">
                {/* ── LEFT COLUMN ── */}
                <div className="flex flex-col gap-6">

                    {/* AI Resume Builder Panel */}
                    <div className="glass-card p-6 border-2 border-dashed" style={{ borderColor: '#8b5cf6', background: 'rgba(139, 92, 246, 0.03)' }}>
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setAiPanelExpanded(!aiPanelExpanded)}
                        >
                            <div className="flex items-center gap-3">
                                <Zap size={22} style={{ color: '#8b5cf6' }} />
                                <h2 className="text-lg font-bold m-0" style={{ color: 'var(--text-dark)' }}>AI Smart Builder</h2>
                            </div>
                            <div>
                                {aiPanelExpanded ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
                            </div>
                        </div>

                        <div className={`${!aiPanelExpanded ? 'hidden' : 'block'} mt-4`}>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5' }}>
                                Upload your resume or paste text, add a Job Description, and the AI will automatically extract, optimize, and generate your resume.
                            </p>

                            <div
                                onClick={() => fileInputRef.current.click()}
                                style={{ border: '2px dashed rgba(139, 92, 246, 0.3)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: 'var(--primary-white)', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept=".pdf,.docx,.jpg,.jpeg" />
                                <Upload size={36} style={{ color: '#8b5cf6', marginBottom: '0.75rem', opacity: 0.6 }} />
                                <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem' }}>Click to upload or drag & drop</h3>
                                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Supports PDF, DOCX, JPEG (Max 5MB)</p>
                            </div>

                            {uploadedFile && (
                                <div style={{ marginTop: '1rem', padding: '0.7rem 1rem', borderRadius: '0.75rem', background: 'var(--bg-light)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="flex items-center gap-3">
                                        <FileType size={20} className="text-primary" />
                                        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{uploadedFile.name}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({(uploadedFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                                    </div>
                                    <button onClick={() => setUploadedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><X size={18} /></button>
                                </div>
                            )}

                            <div style={{ margin: '1.2rem 0', textAlign: 'center', position: 'relative' }}>
                                <span style={{ padding: '0 1rem', background: 'rgba(139, 92, 246, 0.03)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>OR PASTE TEXT</span>
                                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-color)', zIndex: -1 }}></div>
                            </div>

                            <textarea value={rawResumeText} onChange={(e) => setRawResumeText(e.target.value)} placeholder="Paste raw resume text or LinkedIn profile content here..." style={{ ...textareaStyle, minHeight: '120px' }} />

                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Target size={18} style={{ color: '#10b981' }} />
                                    <label style={{ ...labelStyle, marginBottom: 0, color: '#10b981' }}>Job Description (Optional - for ATS optimization)</label>
                                </div>
                                <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="Paste the target job description to auto-optimize your resume..." style={{ ...textareaStyle, minHeight: '100px' }} />
                            </div>

                            {(isParsing || isTailoring || aiStatus) && (
                                <div style={{ marginTop: '1.2rem', padding: '1rem 1.2rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.08))', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {(isParsing || isTailoring) && <Loader2 size={20} className="animate-spin" style={{ color: '#8b5cf6' }} />}
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-dark)' }}>{aiStatus || 'Processing...'}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ATS & JD Intelligence Dashboard */}
                    {analysisResult && (
                        <div className="glass-card p-6 shadow-lg border-2" style={{ borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.03)' }}>
                            <div className="flex items-center gap-3 mb-5">
                                <BarChart size={24} style={{ color: '#10b981' }} />
                                <h2 className="text-xl font-bold m-0 text-slate-800">ATS & JD Match Report</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-xl text-center" style={{ background: 'var(--primary-white)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <div className="text-3xl font-extrabold" style={{ color: analysisResult.atsScore >= 75 ? '#10b981' : analysisResult.atsScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                                        {analysisResult.atsScore}%
                                    </div>
                                    <div className="text-xs font-bold text-muted uppercase mt-1">ATS Score</div>
                                </div>
                                <div className="p-4 rounded-xl text-center" style={{ background: 'var(--primary-white)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <div className="text-3xl font-extrabold" style={{ color: analysisResult.matchScore >= 75 ? '#10b981' : analysisResult.matchScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                                        {analysisResult.matchScore}%
                                    </div>
                                    <div className="text-xs font-bold text-muted uppercase mt-1">JD Match Score</div>
                                </div>
                            </div>

                            {analysisResult.missingInformation?.length > 0 && (
                                <div className="mb-4 p-4 rounded-xl bg-red-50/50 border border-red-100">
                                    <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2"><AlertCircle size={16}/> Missing Information</h4>
                                    <ul className="list-disc pl-5 m-0 text-sm text-red-600">
                                        {analysisResult.missingInformation.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            )}

                            {analysisResult.missingSkills?.length > 0 && (
                                <div className="mb-4 p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                                    <h4 className="text-sm font-bold text-orange-700 mb-2 flex items-center gap-2"><Target size={16}/> Missing JD Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResult.missingSkills.map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-bold">{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analysisResult.suggestedImprovements?.length > 0 && (
                                <div className="mb-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                                    <h4 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2"><Sparkles size={16}/> Suggested Improvements</h4>
                                    <ul className="space-y-2 m-0 text-sm text-blue-800">
                                        {analysisResult.suggestedImprovements.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckCircle2 size={14} className="mt-1 flex-shrink-0 text-blue-500"/>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={handleOptimizeResume}
                                disabled={isTailoring || isAnalyzing}
                                className="w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', opacity: (isTailoring || isAnalyzing) ? 0.7 : 1 }}
                            >
                                {isTailoring ? <><Loader2 className="animate-spin" size={20}/> Optimizing...</> : <><Sparkles size={20}/> ✨ Optimize Resume for This Job</>}
                            </button>
                        </div>
                    )}

                    {/* Manual Form Sections */}
                    <div className="glass-card p-5 flex flex-col gap-1 shadow-md" style={{ borderTop: '4px solid var(--primary-blue)' }}>
                        <SectionBlock icon={<User size={14} />} title="Header & Contact">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div>
                                    <label style={labelStyle}>Full Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="Jane Smith" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Headline</label>
                                    <input type="text" name="headline" value={formData.headline} onChange={handleChange} style={inputStyle} placeholder="Senior Product Engineer" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div><label style={labelStyle}>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="you@example.com" /></div>
                                <div><label style={labelStyle}>Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="+91 ..." /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div><label style={labelStyle}>LinkedIn</label><input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} style={inputStyle} placeholder="https://linkedin.com/..." /></div>
                                <div><label style={labelStyle}>GitHub</label><input type="url" name="github" value={formData.github} onChange={handleChange} style={inputStyle} placeholder="https://github.com/..." /></div>
                            </div>
                            <div><label style={labelStyle}>Location</label><input type="text" name="location" value={formData.location} onChange={handleChange} style={inputStyle} placeholder="City, Country" /></div>
                        </SectionBlock>

                        <SectionBlock icon={<Edit3 size={14} />} title="Professional Summary" badge="AI">
                            <div className="flex justify-between items-center mb-2">
                                <label style={{ ...labelStyle, marginBottom: 0 }}>Career Highlights</label>
                                <button onClick={handleGenSummary} disabled={isGenSummary} style={{
                                    border: 'none', background: 'none', color: '#6366f1', fontSize: '0.72rem',
                                    fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    {isGenSummary ? <Loader2 size={12} className="animate-spin" /> : <><Sparkles size={12} /> AI Generate</>}
                                </button>
                            </div>
                            <textarea name="summary" value={formData.summary} onChange={handleChange} style={textareaStyle} placeholder="Briefly describe your career achievements..." />
                        </SectionBlock>

                        <SectionBlock icon={<Code size={14} />} title="Skills & Technologies">
                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-3 text-muted" />
                                <input
                                    type="text"
                                    value={skillSearch}
                                    onChange={(e) => setSkillSearch(e.target.value)}
                                    placeholder="Search skills or add new..."
                                    style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                                />
                                {skillSearch && !allAvailableSkills.some(s => s.toLowerCase() === skillSearch.toLowerCase()) && (
                                    <button
                                        onClick={handleAddCustomSkill}
                                        className="absolute right-2 top-2 p-1.5 rounded-lg bg-primary text-white hover:opacity-90 transition-all"
                                    >
                                        <Plus size={14} />
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--bg-light)', border: '1px solid var(--border-color)' }}>
                                {["Languages", "Frameworks", "Tools", "Other"].map(cat => {
                                    const skillsInCat = cat === "Languages" ? filteredSkills.filter(s => s.toLowerCase().includes('python') || s.toLowerCase().includes('java') || s.toLowerCase().includes('javascript') || s.toLowerCase().includes('typescript') || s.toLowerCase().includes(' c ') || s.toLowerCase().includes('c++') || s.toLowerCase().includes('sql'))
                                        : cat === "Frameworks" ? filteredSkills.filter(s => s.toLowerCase().includes('react') || s.toLowerCase().includes('angular') || s.toLowerCase().includes('vue') || s.toLowerCase().includes('next') || s.toLowerCase().includes('django') || s.toLowerCase().includes('flask') || s.toLowerCase().includes('express') || s.toLowerCase().includes('spring'))
                                            : cat === "Tools" ? filteredSkills.filter(s => s.toLowerCase().includes('aws') || s.toLowerCase().includes('azure') || s.toLowerCase().includes('gcp') || s.toLowerCase().includes('docker') || s.toLowerCase().includes('kubernetes') || s.toLowerCase().includes('git') || s.toLowerCase().includes('jenkins'))
                                                : filteredSkills.filter(s => !s.toLowerCase().includes('python') && !s.toLowerCase().includes('java') && !s.toLowerCase().includes('javascript') && !s.toLowerCase().includes('typescript') && !s.toLowerCase().includes(' c ') && !s.toLowerCase().includes('c++') && !s.toLowerCase().includes('sql') && !s.toLowerCase().includes('react') && !s.toLowerCase().includes('angular') && !s.toLowerCase().includes('vue') && !s.toLowerCase().includes('next') && !s.toLowerCase().includes('django') && !s.toLowerCase().includes('flask') && !s.toLowerCase().includes('express') && !s.toLowerCase().includes('spring') && !s.toLowerCase().includes('aws') && !s.toLowerCase().includes('azure') && !s.toLowerCase().includes('gcp') && !s.toLowerCase().includes('docker') && !s.toLowerCase().includes('kubernetes') && !s.toLowerCase().includes('git') && !s.toLowerCase().includes('jenkins'));

                                    if (skillsInCat.length === 0) return null;

                                    return (
                                        <div key={cat} style={{ paddingBottom: '0.5rem', borderBottom: cat !== "Other" ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {cat}
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {skillsInCat.map(skill => (
                                                    <span
                                                        key={skill}
                                                        onClick={() => toggleSkill(skill)}
                                                        className={`badge cursor-pointer transition-all ${formData.selectedSkills.includes(skill) ? 'success' : 'opacity-60'}`}
                                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontWeight: '700' }}
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </SectionBlock>

                        <SectionBlock icon={<Briefcase size={14} />} title="Work Experience">
                            {expItems.map((item) => (
                                <div key={item.id} className="p-4 rounded-xl mb-4 relative" style={{ background: 'var(--primary-white)', border: '1px solid var(--border-color)' }}>
                                    <button onClick={() => removeExpItem(item.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-1"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Company Name</label><input type="text" style={inputStyle} value={item.company} onChange={(e)=>updateExp(item.id, 'company', e.target.value)} placeholder="e.g. Google" /></div>
                                        <div><label style={labelStyle}>Job Title / Role</label><input type="text" style={inputStyle} value={item.role} onChange={(e)=>updateExp(item.id, 'role', e.target.value)} placeholder="e.g. Software Engineer Intern" /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Employment Type</label>
                                            <select style={inputStyle} value={item.type} onChange={(e)=>updateExp(item.id, 'type', e.target.value)}>
                                                <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Internship">Internship</option><option value="Freelance">Freelance</option><option value="Contract">Contract</option>
                                            </select>
                                        </div>
                                        <div><label style={labelStyle}>Location</label><input type="text" style={inputStyle} value={item.location} onChange={(e)=>updateExp(item.id, 'location', e.target.value)} placeholder="e.g. Bangalore, India (Remote)" /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Start Date</label><input type="text" style={inputStyle} value={item.start} onChange={(e)=>updateExp(item.id, 'start', e.target.value)} placeholder="MMM YYYY" /></div>
                                        <div>
                                            <label style={labelStyle}>End Date</label>
                                            <input type="text" style={{...inputStyle, opacity: item.current ? 0.5 : 1}} disabled={item.current} value={item.current ? 'Present' : item.end} onChange={(e)=>updateExp(item.id, 'end', e.target.value)} placeholder="MMM YYYY" />
                                            <label className="flex items-center gap-2 mt-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider cursor-pointer">
                                                <input type="checkbox" checked={item.current} onChange={(e)=>updateExp(item.id, 'current', e.target.checked)} className="rounded text-primary focus:ring-primary"/>
                                                Currently working here
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Description (Markdown / Bullets supported)</label>
                                        <textarea style={{...textareaStyle, minHeight: '100px'}} value={item.description} onChange={(e)=>updateExp(item.id, 'description', e.target.value)} placeholder="Describe your responsibilities, achievements, and impact..."/>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addExpItem} className="w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all hover:bg-indigo-50" style={{ borderColor: 'var(--primary-blue)', color: 'var(--primary-blue)', background: 'transparent' }}><Plus size={16}/> Add Work Experience</button>
                        </SectionBlock>

                        <SectionBlock icon={<Star size={14} />} title="Projects">
                            {projItems.map((item) => (
                                <div key={item.id} className="p-4 rounded-xl mb-4 relative" style={{ background: 'var(--primary-white)', border: '1px solid var(--border-color)' }}>
                                    <button onClick={() => removeProjItem(item.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-1"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-1 gap-3 mb-3">
                                        <div><label style={labelStyle}>Project Title</label><input type="text" style={inputStyle} value={item.title} onChange={(e)=>updateProj(item.id, 'title', e.target.value)} placeholder="e.g. E-Commerce Platform" /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Tech Stack Used (comma separated)</label><input type="text" style={inputStyle} value={item.tech} onChange={(e)=>updateProj(item.id, 'tech', e.target.value)} placeholder="e.g. React, Node.js, MongoDB" /></div>
                                        <div><label style={labelStyle}>Project Type</label>
                                            <select style={inputStyle} value={item.type} onChange={(e)=>updateProj(item.id, 'type', e.target.value)}>
                                                <option value="Personal">Personal</option><option value="Academic">Academic</option><option value="Open Source">Open Source</option><option value="Professional">Professional</option><option value="Freelance">Freelance</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Start Date</label><input type="text" style={inputStyle} value={item.start} onChange={(e)=>updateProj(item.id, 'start', e.target.value)} placeholder="MMM YYYY" /></div>
                                        <div>
                                            <label style={labelStyle}>End Date</label>
                                            <input type="text" style={{...inputStyle, opacity: item.ongoing ? 0.5 : 1}} disabled={item.ongoing} value={item.ongoing ? 'Ongoing' : item.end} onChange={(e)=>updateProj(item.id, 'end', e.target.value)} placeholder="MMM YYYY" />
                                            <label className="flex items-center gap-2 mt-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider cursor-pointer">
                                                <input type="checkbox" checked={item.ongoing} onChange={(e)=>updateProj(item.id, 'ongoing', e.target.checked)} className="rounded text-primary focus:ring-primary"/>
                                                Ongoing
                                            </label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Project URL (GitHub etc.)</label><input type="text" style={inputStyle} value={item.url} onChange={(e)=>updateProj(item.id, 'url', e.target.value)} placeholder="https://github.com/your-project" /></div>
                                        <div><label style={labelStyle}>Live Demo URL</label><input type="text" style={inputStyle} value={item.demo} onChange={(e)=>updateProj(item.id, 'demo', e.target.value)} placeholder="https://yourproject.com" /></div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Description (Markdown / Bullets supported)</label>
                                        <textarea style={{...textareaStyle, minHeight: '100px'}} value={item.description} onChange={(e)=>updateProj(item.id, 'description', e.target.value)} placeholder="Explain the problem solved, your role, and key outcomes..."/>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addProjItem} className="w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all hover:bg-indigo-50" style={{ borderColor: 'var(--primary-blue)', color: 'var(--primary-blue)', background: 'transparent' }}><Plus size={16}/> Add Project</button>
                        </SectionBlock>

                        <SectionBlock icon={<GraduationCap size={14} />} title="Education">
                            {eduItems.map((item) => (
                                <div key={item.id} className="p-4 rounded-xl mb-4 relative" style={{ background: 'var(--primary-white)', border: '1px solid var(--border-color)' }}>
                                    <button onClick={() => removeEduItem(item.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-1"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Institution Name</label><input type="text" style={inputStyle} value={item.institution} onChange={(e)=>updateEdu(item.id, 'institution', e.target.value)} placeholder="e.g. Delhi Technological University" /></div>
                                        <div><label style={labelStyle}>Degree / Qualification</label><input type="text" style={inputStyle} value={item.degree} onChange={(e)=>updateEdu(item.id, 'degree', e.target.value)} placeholder="e.g. B.Tech in Computer Science" /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Field of Study</label><input type="text" style={inputStyle} value={item.field} onChange={(e)=>updateEdu(item.id, 'field', e.target.value)} placeholder="e.g. Computer Science & Engineering" /></div>
                                        <div><label style={labelStyle}>Grade / CGPA / Percentage</label><input type="text" style={inputStyle} value={item.grade} onChange={(e)=>updateEdu(item.id, 'grade', e.target.value)} placeholder="e.g. 8.5 CGPA" /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Start Year</label>
                                            <select style={inputStyle} value={item.start} onChange={(e)=>updateEdu(item.id, 'start', e.target.value)}>
                                                <option value="">Select Year</option>
                                                {Array.from({length: 31}, (_, i) => 2000 + i).map(year => <option key={year} value={year}>{year}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>End Year</label>
                                            <select style={{...inputStyle, opacity: item.current ? 0.5 : 1}} disabled={item.current} value={item.current ? '' : item.end} onChange={(e)=>updateEdu(item.id, 'end', e.target.value)}>
                                                <option value="">Select Year</option>
                                                {Array.from({length: 31}, (_, i) => 2000 + i).map(year => <option key={year} value={year}>{year}</option>)}
                                            </select>
                                            <label className="flex items-center gap-2 mt-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider cursor-pointer">
                                                <input type="checkbox" checked={item.current} onChange={(e)=>updateEdu(item.id, 'current', e.target.checked)} className="rounded text-primary focus:ring-primary"/>
                                                Currently studying here
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Activities & Achievements</label>
                                        <textarea style={{...textareaStyle, minHeight: '80px'}} value={item.achievements} onChange={(e)=>updateEdu(item.id, 'achievements', e.target.value)} placeholder="e.g. Won hackathon, Class Representative..."/>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addEduItem} className="w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all hover:bg-indigo-50" style={{ borderColor: 'var(--primary-blue)', color: 'var(--primary-blue)', background: 'transparent' }}><Plus size={16}/> Add Education</button>
                        </SectionBlock>

                        <SectionBlock icon={<Award size={14} />} title="Certifications">
                            {certItems.map((item) => (
                                <div key={item.id} className="p-4 rounded-xl mb-4 relative" style={{ background: 'var(--primary-white)', border: '1px solid var(--border-color)' }}>
                                    <button onClick={() => removeCertItem(item.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-1"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Certification Name</label><input type="text" style={inputStyle} value={item.name} onChange={(e)=>updateCert(item.id, 'name', e.target.value)} placeholder="e.g. AWS Certified Solutions Architect" /></div>
                                        <div><label style={labelStyle}>Issuing Organization</label><input type="text" style={inputStyle} value={item.org} onChange={(e)=>updateCert(item.id, 'org', e.target.value)} placeholder="e.g. Amazon Web Services" /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Issue Date</label><input type="text" style={inputStyle} value={item.issue} onChange={(e)=>updateCert(item.id, 'issue', e.target.value)} placeholder="MMM YYYY" /></div>
                                        <div>
                                            <label style={labelStyle}>Expiry Date</label>
                                            <input type="text" style={{...inputStyle, opacity: item.noExpiry ? 0.5 : 1}} disabled={item.noExpiry} value={item.noExpiry ? 'No Expiry' : item.expiry} onChange={(e)=>updateCert(item.id, 'expiry', e.target.value)} placeholder="MMM YYYY" />
                                            <label className="flex items-center gap-2 mt-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider cursor-pointer">
                                                <input type="checkbox" checked={item.noExpiry} onChange={(e)=>updateCert(item.id, 'noExpiry', e.target.checked)} className="rounded text-primary focus:ring-primary"/>
                                                No Expiry
                                            </label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div><label style={labelStyle}>Credential ID</label><input type="text" style={inputStyle} value={item.credentialId} onChange={(e)=>updateCert(item.id, 'credentialId', e.target.value)} placeholder="e.g. ABC123XYZ" /></div>
                                        <div><label style={labelStyle}>Credential URL</label><input type="text" style={inputStyle} value={item.url} onChange={(e)=>updateCert(item.id, 'url', e.target.value)} placeholder="https://www.credly.com/your-badge" /></div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addCertItem} className="w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all hover:bg-indigo-50" style={{ borderColor: 'var(--primary-blue)', color: 'var(--primary-blue)', background: 'transparent' }}><Plus size={16}/> Add Certification</button>
                        </SectionBlock>

                        <button onClick={handleGenerate} disabled={isGenerating || !formData.name}
                            style={{
                                width: '100%', marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem',
                                border: 'none', cursor: formData.name ? 'pointer' : 'not-allowed',
                                fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                background: 'linear-gradient(135deg, var(--primary-blue), #4338ca)',
                                color: '#fff', boxShadow: '0 4px 14px rgba(67,56,202,0.3)', transition: 'transform 0.1s'
                            }}
                        >
                            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <><Sparkles size={20} /> Build Final Resume</>}
                        </button>
                    </div>


                </div>

                {/* ── RIGHT COLUMN: PREVIEW ── */}
                <div style={{ position: 'sticky', top: '5.5rem', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                    <div className="glass-card shadow-lg w-full overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-3 px-5 bg-white border-b">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: resumePages ? '#10b981' : '#cbd5e1' }} />
                                    <span className="text-sm font-bold text-primary">Live Preview</span>
                                </div>
                            </div>
                            {resumePages && (
                                <button onClick={handleDownload} className="btn-success btn" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                                    <Download size={14} /> Export PDF
                                </button>
                            )}
                        </div>

                        <div className="bg-slate-200 p-8 overflow-auto max-h-[85vh] flex justify-center">
                            {resumePages ? (
                                resumePages.map((pg, i) => (
                                    <div key={i} className="resume-text-black" style={{
                                        width: `${A4_W}px`, minHeight: `${A4_H}px`, background: '#fff',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: `${PAGE_PADDING}px`,
                                        transform: 'scale(0.85)', transformOrigin: 'top center',
                                        marginBottom: `${-(A4_H * 0.15)}px`
                                    }}>
                                        {pg.header}
                                        {pg.sections}
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[500px] opacity-40">
                                    <FileText size={80} className="mb-4 text-slate-400" />
                                    <h3 className="text-lg font-bold">Resume Preview</h3>
                                    <p className="text-sm text-center max-w-[250px]">Fill your details and click Build to see your ATS-friendly resume.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div style={{
                    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    background: '#fee2e2', color: '#dc2626', padding: '1rem 2rem', borderRadius: '1rem',
                    boxShadow: '0 10px 30px rgba(220,38,38,0.2)', border: '1px solid #fecaca',
                    display: 'flex', alignItems: 'center', gap: '0.8rem', zIndex: 10000
                }}>
                    <AlertCircle size={20} />
                    <span style={{ fontWeight: '700' }}>{error}</span>
                    <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', marginLeft: '1rem' }}>
                        <X size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResumeBuilder;
