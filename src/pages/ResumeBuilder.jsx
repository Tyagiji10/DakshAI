import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { availableSkills as defaultSkills, jobLibrary } from '../lib/mockData';
import {
    FileText, Sparkles, Code, User, Briefcase, Edit3, GraduationCap,
    Award, Star, Download, ChevronDown, ChevronUp, Target,
    Zap, Upload, X, Search, Plus, AlertCircle, FileType, Loader2
} from 'lucide-react';
import {
    generateProfessionalSummary,
    parseResumeFromDocument,
    tailorResumeToJD,
    categorizeSkill
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
    const [aiPanelExpanded, setAiPanelExpanded] = useState(false);

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

            // Step 2: If JD provided, auto-tailor
            if (jd && jd.trim()) {
                setAiStatus('🎯 Tailoring resume to job description...');
                setIsTailoring(true);
                try {
                    const tailored = await tailorResumeToJD({ ...formData, ...data }, jd);
                    if (tailored?.step2) {
                        const { summary, skills, experience } = tailored.step2;

                        // Categorized skills from AI
                        const newSkills = [
                            ...(skills?.programmingLanguages || []),
                            ...(skills?.frameworksPlatforms || []),
                            ...(skills?.toolsTechnologies || []),
                            ...(skills?.conceptsCoreSkills || [])
                        ].filter(Boolean);

                        setFormData(prev => {
                            const updated = {
                                ...prev,
                                ...data,
                                summary: summary || data.summary || prev.summary,
                                experience: experience || data.experience || prev.experience,
                                selectedSkills: [...new Set([...(data.selectedSkills || []), ...newSkills])]
                            };
                            return updated;
                        });
                        setAiStatus('✅ Resume optimized for JD!');
                    }
                } catch (err) {
                    console.error("Tailoring failed:", err);
                    setAiStatus('⚠️ JD optimization skipped (AI busy). Resume extracted successfully.');
                    // Fallback to just extracted data
                    setFormData(prev => ({ ...prev, ...data }));
                } finally {
                    setIsTailoring(false);
                }
            } else {
                setFormData(prev => ({ ...prev, ...data }));
            }

            // Step 3: Auto generate resume preview
            setAiStatus('📄 Building resume...');
            setTimeout(() => {
                triggerGenerate({ ...formData, ...data });
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

    const buildResumeHTML = (fd) => {
        // Group skills for template
        const skillCats = {
            "Languages": fd.selectedSkills.filter(s => s.toLowerCase().includes('python') || s.toLowerCase().includes('java') || s.toLowerCase().includes('javascript') || s.toLowerCase().includes('typescript') || s.toLowerCase().includes(' c ') || s.toLowerCase().includes('c++') || s.toLowerCase().includes('sql')),
            "Frameworks": fd.selectedSkills.filter(s => s.toLowerCase().includes('react') || s.toLowerCase().includes('angular') || s.toLowerCase().includes('vue') || s.toLowerCase().includes('next') || s.toLowerCase().includes('django') || s.toLowerCase().includes('flask') || s.toLowerCase().includes('express') || s.toLowerCase().includes('spring')),
            "Tools": fd.selectedSkills.filter(s => s.toLowerCase().includes('aws') || s.toLowerCase().includes('azure') || s.toLowerCase().includes('gcp') || s.toLowerCase().includes('docker') || s.toLowerCase().includes('kubernetes') || s.toLowerCase().includes('git') || s.toLowerCase().includes('jenkins')),
            "Other": fd.selectedSkills.filter(s => !s.toLowerCase().includes('python') && !s.toLowerCase().includes('java') && !s.toLowerCase().includes('javascript') && !s.toLowerCase().includes('typescript') && !s.toLowerCase().includes(' c ') && !s.toLowerCase().includes('c++') && !s.toLowerCase().includes('sql') && !s.toLowerCase().includes('react') && !s.toLowerCase().includes('angular') && !s.toLowerCase().includes('vue') && !s.toLowerCase().includes('next') && !s.toLowerCase().includes('django') && !s.toLowerCase().includes('flask') && !s.toLowerCase().includes('express') && !s.toLowerCase().includes('spring') && !s.toLowerCase().includes('aws') && !s.toLowerCase().includes('azure') && !s.toLowerCase().includes('gcp') && !s.toLowerCase().includes('docker') && !s.toLowerCase().includes('kubernetes') && !s.toLowerCase().includes('git') && !s.toLowerCase().includes('jenkins'))
        };

        const skillsSection = Object.entries(skillCats)
            .filter(([_, list]) => list.length > 0)
            .map(([cat, list]) => `<strong>${cat}:</strong> ${list.join(', ')}`)
            .join(' | ');

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
            ${fd.email ? `<span>${fd.email}</span>` : ''}
            ${fd.phone ? `<span> • ${fd.phone}</span>` : ''}
            ${fd.location ? `<span> • ${fd.location}</span>` : ''}
            ${fd.linkedin ? `<span> • LinkedIn</span>` : ''}
            ${fd.github ? `<span> • GitHub</span>` : ''}
          </div>
        </header>
        ${fd.summary ? `<section><h3>Professional Summary</h3><p>${fd.summary}</p></section>` : ''}
        ${fd.selectedSkills.length > 0 ? `<section><h3>Technical Skills</h3><p>${skillsSection}</p></section>` : ''}
        ${fd.experience ? `<section><h3>Work Experience</h3><pre>${fd.experience.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</pre></section>` : ''}
        ${fd.projects ? `<section><h3>Projects</h3><pre>${fd.projects.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</pre></section>` : ''}
        ${fd.education ? `<section><h3>Education</h3><pre>${fd.education}</pre></section>` : ''}
        ${fd.certifications ? `<section><h3>Certifications</h3><pre>${fd.certifications}</pre></section>` : ''}
        ${fd.achievements ? `<section><h3>Achievements</h3><pre>${fd.achievements}</pre></section>` : ''}
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
                        {fd.email && <span style={{ color: '#000' }}>{fd.email}</span>}
                        {fd.phone && <span style={{ color: '#000' }}> • {fd.phone}</span>}
                        {fd.location && <span style={{ color: '#000' }}> • {fd.location}</span>}
                        {fd.linkedin && <span style={{ color: '#000' }}> • LinkedIn</span>}
                        {fd.github && <span style={{ color: '#000' }}> • GitHub</span>}
                    </div>
                </header>
            ),
            sections: [
                fd.summary && <RS key="sum" title="Professional Summary"><p style={{ ...preStyle, whiteSpace: 'normal', color: '#000' }}>{fd.summary}</p></RS>,
                safeSkills.length > 0 && (
                    <RS key="sk" title="Technical Skills">
                        <p style={{ ...preStyle, whiteSpace: 'normal', color: '#000' }}>
                            {(() => {
                                const cats = {
                                    "Languages": safeSkills.filter(s => s && typeof s === 'string' && (s.toLowerCase().includes('python') || s.toLowerCase().includes('java') || s.toLowerCase().includes('javascript') || s.toLowerCase().includes('typescript') || s.toLowerCase().includes(' c ') || s.toLowerCase().includes('c++') || s.toLowerCase().includes('sql'))),
                                    "Frameworks": safeSkills.filter(s => s && typeof s === 'string' && (s.toLowerCase().includes('react') || s.toLowerCase().includes('angular') || s.toLowerCase().includes('vue') || s.toLowerCase().includes('next') || s.toLowerCase().includes('django') || s.toLowerCase().includes('flask') || s.toLowerCase().includes('express') || s.toLowerCase().includes('spring'))),
                                    "Tools": safeSkills.filter(s => s && typeof s === 'string' && (s.toLowerCase().includes('aws') || s.toLowerCase().includes('azure') || s.toLowerCase().includes('gcp') || s.toLowerCase().includes('docker') || s.toLowerCase().includes('kubernetes') || s.toLowerCase().includes('git') || s.toLowerCase().includes('jenkins'))),
                                    "Other": safeSkills.filter(s => s && typeof s === 'string' && (!s.toLowerCase().includes('python') && !s.toLowerCase().includes('java') && !s.toLowerCase().includes('javascript') && !s.toLowerCase().includes('typescript') && !s.toLowerCase().includes(' c ') && !s.toLowerCase().includes('c++') && !s.toLowerCase().includes('sql') && !s.toLowerCase().includes('react') && !s.toLowerCase().includes('angular') && !s.toLowerCase().includes('vue') && !s.toLowerCase().includes('next') && !s.toLowerCase().includes('django') && !s.toLowerCase().includes('flask') && !s.toLowerCase().includes('express') && !s.toLowerCase().includes('spring') && !s.toLowerCase().includes('aws') && !s.toLowerCase().includes('azure') && !s.toLowerCase().includes('gcp') && !s.toLowerCase().includes('docker') && !s.toLowerCase().includes('kubernetes') && !s.toLowerCase().includes('git') && !s.toLowerCase().includes('jenkins')))
                                };
                                const skillElements = Object.entries(cats)
                                    .filter(([_, l]) => l.length > 0)
                                    .map(([c, l]) => <span key={c} style={{ color: '#000' }}><strong style={{ color: '#000' }}>{c}:</strong> {l.join(', ')} </span>);
                                return skillElements.length > 0 ? skillElements.reduce((prev, curr) => [prev, ' | ', curr]) : null;
                            })()}
                        </p>
                    </RS>
                ),
                safeExp && (
                    <RS key="ex" title="Work Experience">
                        <div style={{ ...preStyle, color: '#000' }}>
                            {safeExp.split('\n').map((line, i) => {
                                const clean = line.trim();
                                if (clean.startsWith('-') || clean.startsWith('•')) {
                                    return <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4pt', color: '#000' }}>
                                        <span style={{ color: '#000' }}>•</span>
                                        <span style={{ color: '#000' }} dangerouslySetInnerHTML={{ __html: clean.substring(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong style="color: #000">$1</strong>') }} />
                                    </div>;
                                }
                                return <div key={i} style={{ marginBottom: '6pt', color: '#000' }} dangerouslySetInnerHTML={{ __html: clean.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #000">$1</strong>') }} />;
                            })}
                        </div>
                    </RS>
                ),
                safeProj && (
                    <RS key="pr" title="Projects">
                        <div style={{ ...preStyle, color: '#000' }}>
                            {safeProj.split('\n').map((line, i) => {
                                const clean = line.trim();
                                if (clean.startsWith('-') || clean.startsWith('•')) {
                                    return <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4pt', color: '#000' }}>
                                        <span style={{ color: '#000' }}>•</span>
                                        <span style={{ color: '#000' }} dangerouslySetInnerHTML={{ __html: clean.substring(1).trim().replace(/\*\*(.*?)\*\*/g, '<strong style="color: #000">$1</strong>') }} />
                                    </div>;
                                }
                                return <div key={i} style={{ marginBottom: '6pt', color: '#000' }} dangerouslySetInnerHTML={{ __html: clean.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #000">$1</strong>') }} />;
                            })}
                        </div>
                    </RS>
                ),
                safeEdu && <RS key="ed" title="Education"><pre style={{ ...preStyle, color: '#000' }}>{safeEdu}</pre></RS>,
                fd.certifications && <RS key="ce" title="Certifications"><pre style={{ ...preStyle, color: '#000' }}>{fd.certifications}</pre></RS>,
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
            {/* Standardized Header (Mobile & Desktop) */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <FileText size={24} className="text-primary" />
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold m-0 text-slate-800">
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

                    {/* Manual Form Sections */}
                    <div className="glass-card p-5 flex flex-col gap-1 shadow-md" style={{ borderTop: '4px solid var(--primary-blue)' }}>
                        <SectionBlock icon={<User size={14} />} title="Header & Contact" defaultOpen>
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
                            <label style={labelStyle}>Roles, Responsibilities & Metrics</label>
                            <textarea name="experience" value={formData.experience} onChange={handleChange} style={{ ...textareaStyle, minHeight: '120px' }}
                                placeholder={"Senior Engineer | Acme Corp\n- Managed **1M+ users** with **99.9% uptime**\n- Led **React** migration reducing load by **40%**"} />
                        </SectionBlock>

                        <SectionBlock icon={<Star size={14} />} title="Projects">
                            <textarea name="projects" value={formData.projects} onChange={handleChange} style={textareaStyle} placeholder="Project Name | Tech Stack\n- Achieved **X%** growth in **Y** using **Z**" />
                        </SectionBlock>

                        <SectionBlock icon={<GraduationCap size={14} />} title="Education">
                            <textarea name="education" value={formData.education} onChange={handleChange} style={{ ...textareaStyle, minHeight: '60px' }} placeholder="B.Tech Computer Science | XYZ University | 2024" />
                        </SectionBlock>

                        <SectionBlock icon={<Award size={14} />} title="Certifications">
                            <textarea name="certifications" value={formData.certifications} onChange={handleChange} style={{ ...textareaStyle, minHeight: '60px' }} placeholder="AWS Certified Architect | 2023" />
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
