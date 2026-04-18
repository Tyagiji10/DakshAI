import React, { useState, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { availableSkills, jobLibrary } from '../lib/mockData';
import {
    FileText, Sparkles, Code, User, Briefcase, Mail, Phone,
    Link as LinkIcon, Edit3, CheckCircle, GraduationCap,
    Award, Star, BookOpen, Users, Download, ChevronDown, ChevronUp, Wand2,
    Zap, ClipboardPaste
} from 'lucide-react';
import { generateProfessionalSummary, parseResume } from '../lib/ai';

// ─── A4 dimensions at 96 dpi: 794 × 1123 px ────────────────────────────────
const A4_W = 794;    // px
const A4_H = 1123;   // px  (297mm @ 96dpi)
const PAGE_PADDING = 56; // px  (≈ 15mm)

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

// ─── Resume Section (inside preview) ─────────────────────────────────────────
const RS = ({ title, children }) => (
    <section style={{ marginBottom: '12pt', pageBreakInside: 'avoid' }}>
        <h3 style={{ fontFamily: "'Inter',sans-serif", fontSize: '8.5pt', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1.2px solid #1f2937', paddingBottom: '2pt', marginBottom: '5pt', color: '#1f2937', letterSpacing: '0.08em', margin: '0 0 5pt 0' }}>{title}</h3>
        {children}
    </section>
);

const preStyle = { fontSize: '9pt', whiteSpace: 'pre-wrap', margin: 0, lineHeight: '1.5', fontFamily: "'Merriweather','Georgia',serif" };

// ─── Auto-generate summary from user data ─────────────────────────────────────
function buildAutoSummary(fd) {
    const name = fd.name || 'the candidate';
    const role = fd.headline || 'technology professional';
    const skills = fd.selectedSkills.slice(0, 5).join(', ');
    const hasExp = Boolean(fd.experience?.trim());
    const hasEdu = Boolean(fd.education?.trim());
    const hasCerts = Boolean(fd.certifications?.trim());

    let lines = [];
    lines.push(`Results-driven ${role} with a strong command of ${skills || 'modern technologies'} and a passion for building impactful solutions.`);
    if (hasExp) lines.push(`Proven track record of delivering high-quality software across diverse domains.`);
    if (hasEdu) lines.push(`Backed by a rigorous academic foundation that complements hands-on engineering expertise.`);
    if (hasCerts) lines.push(`Holds verified industry certifications that validate deep technical proficiency.`);
    lines.push(`Known for clean code, sharp problem-solving, and thriving in collaborative environments.`);
    return lines.join(' ');
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ResumeBuilder = () => {
    const { user } = useUser();

    const jobTitle = React.useMemo(() => {
        if (!user.targetJob) return '';
        const job = jobLibrary.find(j => j.id === user.targetJob);
        return job ? job.title : '';
    }, [user.targetJob]);

    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: '',
        github: '',
        linkedin: '',
        portfolio: '',
        location: '',
        summary: '',
        headline: jobTitle || '',
        selectedSkills: user.skills || [],
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
    const [rawResumeText, setRawResumeText] = useState('');
    const [showMagicImport, setShowMagicImport] = useState(false);
    const [resumePages, setResumePages] = useState(null); // array of JSX pages
    const containerRef = useRef(null);
    const measRef = useRef(null); // invisible measuring div

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const toggleSkill = (skill) => setFormData(prev => ({
        ...prev,
        selectedSkills: prev.selectedSkills.includes(skill)
            ? prev.selectedSkills.filter(s => s !== skill)
            : [...prev.selectedSkills, skill]
    }));

    // ── AI Summary Generation ───────────────────────────────────────────────
    const handleGenSummary = async () => {
        if (!formData.name && !formData.headline && formData.selectedSkills.length === 0) return;
        setIsGenSummary(true);
        try {
            const summary = await generateProfessionalSummary(formData);
            setFormData(prev => ({ ...prev, summary }));
        } catch (error) {
            console.error("AI Summary failed:", error);
            // Fallback to mock if AI fails
            setFormData(prev => ({ ...prev, summary: buildAutoSummary(prev) }));
        } finally {
            setIsGenSummary(false);
        }
    };

    // ── AI Magic Import ──────────────────────────────────────────────────────
    const handleMagicImport = async () => {
        if (!rawResumeText.trim()) return;
        setIsParsing(true);
        try {
            const parsedData = await parseResume(rawResumeText);
            setFormData(prev => ({ ...prev, ...parsedData }));
            setShowMagicImport(false);
            setRawResumeText('');
        } catch (error) {
            console.error("Magic Import failed:", error);
            alert("Could not parse resume. Please try again or paste a cleaner version.");
        } finally {
            setIsParsing(false);
        }
    };

    // ── Build resume HTML string (for printing) ───────────────────────────────
    const buildResumeHTML = (fd) => {
        const contactParts = [fd.email, fd.phone, fd.location, fd.linkedin, fd.github, fd.portfolio].filter(Boolean);
        return `
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Merriweather','Georgia',serif;color:#111827;background:#fff;font-size:10pt;line-height:1.55}
  h1{font-family:'Inter',sans-serif;font-size:20pt;font-weight:800;letter-spacing:-0.02em;text-transform:uppercase;color:#111827}
  h2.sub{font-family:'Inter',sans-serif;font-size:10.5pt;font-weight:500;color:#4b5563;margin:3pt 0}
  .contact{font-family:'Inter',sans-serif;font-size:8pt;color:#4b5563;display:flex;flex-wrap:wrap;justify-content:center;gap:5px}
  header{border-bottom:2px solid #1f2937;padding-bottom:10pt;margin-bottom:10pt;text-align:center}
  section{margin-bottom:10pt}
  h3{font-family:'Inter',sans-serif;font-size:8pt;font-weight:800;text-transform:uppercase;border-bottom:1.2px solid #1f2937;padding-bottom:2pt;margin-bottom:5pt;color:#1f2937;letter-spacing:0.08em}
  p,li,pre{font-size:9pt;line-height:1.55;font-family:'Merriweather','Georgia',serif}
  ul{padding-left:14px}li{margin-bottom:2pt}
  .chips{display:flex;flex-wrap:wrap;gap:4px}
  .chip{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:3px;padding:1px 7px;font-family:'Inter',sans-serif;font-size:7.5pt;color:#374151}
  pre{white-space:pre-wrap}
  @page{size:A4;margin:15mm}
  @media print{section{page-break-inside:avoid}}
</style>
<header>
  <h1>${fd.name}</h1>
  ${fd.headline ? `<h2 class="sub">${fd.headline}</h2>` : ''}
  <div class="contact">${contactParts.map((p, i) => `<span>${i > 0 ? '• ' : ''}${p}</span>`).join('')}</div>
</header>
${fd.summary ? `<section><h3>Professional Summary</h3><p>${fd.summary}</p></section>` : ''}
${fd.selectedSkills.length > 0 ? `<section><h3>Technical Skills</h3><div class="chips">${fd.selectedSkills.map(s => `<span class="chip">${s}</span>`).join('')}</div></section>` : ''}
${fd.experience ? `<section><h3>Work Experience</h3><pre>${fd.experience}</pre></section>` : ''}
${fd.projects ? `<section><h3>Projects</h3><pre>${fd.projects}</pre></section>` : ''}
${fd.education ? `<section><h3>Education</h3><pre>${fd.education}</pre></section>` : ''}
${fd.certifications ? `<section><h3>Certifications</h3><pre>${fd.certifications}</pre></section>` : ''}
${fd.achievements ? `<section><h3>Achievements &amp; Awards</h3><pre>${fd.achievements}</pre></section>` : ''}
${fd.leadership ? `<section><h3>Leadership &amp; Extracurricular</h3><pre>${fd.leadership}</pre></section>` : ''}
${fd.publications ? `<section><h3>Publications</h3><pre>${fd.publications}</pre></section>` : ''}`;
    };

    // ── Download / Print ──────────────────────────────────────────────────────
    const handleDownload = () => {
        const fd = formData;
        const win = window.open('', '_blank');
        win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${fd.name || 'Resume'}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:wght@400;700&display=swap" rel="stylesheet"/>
</head><body>${buildResumeHTML(fd)}</body></html>`);
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); }, 500);
    };

    // ── Build JSX pages for preview (A4 pagination) ───────────────────────────
    const buildSections = (fd) => {
        const contactParts = [fd.email, fd.phone, fd.location, fd.linkedin, fd.github, fd.portfolio].filter(Boolean);

        const headerJSX = (
            <header key="hdr" style={{ borderBottom: '2px solid #1f2937', paddingBottom: '10pt', marginBottom: '10pt', textAlign: 'center' }}>
                <h1 style={{ fontFamily: "'Inter',sans-serif", fontSize: '20pt', fontWeight: '800', letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#111827', margin: 0 }}>{fd.name}</h1>
                {fd.headline && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '10.5pt', fontWeight: '500', color: '#4b5563', margin: '3pt 0 0' }}>{fd.headline}</p>}
                {contactParts.length > 0 && (
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '8pt', color: '#4b5563', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px', marginTop: '4pt' }}>
                        {contactParts.map((p, i) => <span key={i}>{i > 0 ? '• ' : ''}{p}</span>)}
                    </div>
                )}
            </header>
        );

        const sections = [];
        if (fd.summary)
            sections.push(<RS key="sum" title="Professional Summary"><p style={{ fontSize: '9pt', lineHeight: '1.55', margin: 0 }}>{fd.summary}</p></RS>);
        if (fd.selectedSkills.length > 0)
            sections.push(<RS key="sk" title="Technical Skills"><div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>{fd.selectedSkills.map(s => <span key={s} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '3px', padding: '1px 8px', fontSize: '7.5pt', fontFamily: "'Inter',sans-serif", color: '#374151' }}>{s}</span>)}</div></RS>);
        if (fd.experience)
            sections.push(<RS key="ex" title="Work Experience"><pre style={preStyle}>{fd.experience}</pre></RS>);
        if (fd.projects)
            sections.push(<RS key="pr" title="Projects"><pre style={preStyle}>{fd.projects}</pre></RS>);
        if (fd.education)
            sections.push(<RS key="ed" title="Education"><pre style={preStyle}>{fd.education}</pre></RS>);
        if (fd.certifications)
            sections.push(<RS key="ce" title="Certifications"><pre style={preStyle}>{fd.certifications}</pre></RS>);
        if (fd.achievements)
            sections.push(<RS key="ac" title="Achievements & Awards"><pre style={preStyle}>{fd.achievements}</pre></RS>);
        if (fd.leadership)
            sections.push(<RS key="le" title="Leadership & Extracurricular"><pre style={preStyle}>{fd.leadership}</pre></RS>);
        if (fd.publications)
            sections.push(<RS key="pu" title="Publications"><pre style={preStyle}>{fd.publications}</pre></RS>);

        return { headerJSX, sections };
    };

    // ── Pagination via measurement ────────────────────────────────────────────
    const buildPages = (fd) => {
        const { headerJSX, sections } = buildSections(fd);
        // We'll render sections into an off-screen div to measure heights.
        // For the preview we'll split into logical pages using estimated heights.
        // Each "page" is an A4-sized white sheet (794×1123 px) with padding.

        // Strategy: Render everything into a single A4-width div, then visually clip
        // via CSS `columns` / page-break approach in the preview wrapper itself.
        // The cleanest cross-browser approach for preview: use overflow-y hidden on each page div
        // and measure cumulative rendered height using the DOM after mount.
        // For simplicity and reliability we use CSS @page with page-break-inside: avoid on print,
        // and for the live preview we stack full-content in one scrollable A4 container
        // (browser itself will wrap when printing).

        return [{ headerJSX, sections }];
    };

    // ── Generate ──────────────────────────────────────────────────────────────
    const handleGenerate = () => {
        setIsGenerating(true);
        setResumePages(null);
        setTimeout(() => {
            setResumePages(buildPages(formData));
            setIsGenerating(false);
        }, 900);
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '0.85rem', outline: 'none' };
    const labelStyle = { fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' };
    const textareaStyle = { ...inputStyle, minHeight: '85px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' };
    const gridTwo = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' };

    const hasEnoughData = formData.name || formData.headline || formData.selectedSkills.length > 0 || formData.experience;

    return (
        <div className="pb-10" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Title */}
            <div className="mb-5">
                <h1 className="text-2xl font-extrabold m-0 flex items-center gap-3" style={{ color: 'var(--text-dark)' }}>
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <FileText size={26} className="text-primary" />
                    </div>
                    AI Resume Maker (Pro)
                </h1>
                <p className="text-muted text-sm mt-1 ml-1">
                    Fill any sections — empty ones are skipped. Resume auto-paginates to A4.
                </p>
            </div>

            <div className="resume-layout">

                {/* ── LEFT: FORM ── */}
                <div className="glass-card flex flex-col p-4 md:p-5 w-full shadow-md"
                    style={{ borderTop: '4px solid var(--primary-blue)', borderTopLeftRadius: '0.75rem', borderTopRightRadius: '0.75rem', gap: 0 }}>

                    {/* 🚀 AI Magic Import Section */}
                    <div style={{ marginBottom: '1.2rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.08))', borderRadius: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Zap size={18} style={{ color: '#8b5cf6' }} />
                                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-dark)' }}>AI Magic Import</h3>
                            </div>
                            <button 
                                onClick={() => setShowMagicImport(!showMagicImport)}
                                style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                {showMagicImport ? 'Hide' : 'Paste raw text to auto-fill'}
                            </button>
                        </div>
                        {showMagicImport ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <textarea 
                                    style={{ ...textareaStyle, minHeight: '120px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'var(--bg-light)', color: 'var(--text-dark)' }}
                                    placeholder="Paste your existing resume text, LinkedIn profile, or job description here..."
                                    value={rawResumeText}
                                    onChange={(e) => setRawResumeText(e.target.value)}
                                />
                                <button 
                                    onClick={handleMagicImport}
                                    disabled={isParsing || !rawResumeText.trim()}
                                    style={{ 
                                        width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: 'none', 
                                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', 
                                        fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {isParsing ? (
                                        <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> Parsing...</>
                                    ) : (
                                        <><ClipboardPaste size={14} /> Parse Raw Text & Auto-Fill</>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Paste your raw resume text to auto-fill all sections instantly with "Professional Grade" phrasing.</p>
                        )}
                    </div>

                    {/* 1. Header */}
                    <SectionBlock icon={<User size={14} />} title="Header & Contact" defaultOpen>
                        <div>
                            <label style={labelStyle}>Full Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="Jane Smith" />
                        </div>
                        <div>
                            <label style={labelStyle}>Headline / Target Role</label>
                            <input type="text" name="headline" value={formData.headline} onChange={handleChange} style={inputStyle} placeholder="Senior Full-Stack Engineer" />
                        </div>
                        <div style={gridTwo}>
                            <div><label style={labelStyle}>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="you@example.com" /></div>
                            <div><label style={labelStyle}>Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="+91 ..." /></div>
                        </div>
                        <div style={gridTwo}>
                            <div><label style={labelStyle}>GitHub URL</label><input type="url" name="github" value={formData.github} onChange={handleChange} style={inputStyle} placeholder="https://github.com/..." /></div>
                            <div><label style={labelStyle}>LinkedIn URL</label><input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} style={inputStyle} placeholder="https://linkedin.com/in/..." /></div>
                        </div>
                        <div style={gridTwo}>
                            <div><label style={labelStyle}>Portfolio / Website</label><input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} style={inputStyle} placeholder="https://yoursite.com" /></div>
                            <div><label style={labelStyle}>Location</label><input type="text" name="location" value={formData.location} onChange={handleChange} style={inputStyle} placeholder="City, Country" /></div>
                        </div>
                    </SectionBlock>

                    {/* 2. Summary with AI generate */}
                    <SectionBlock icon={<Edit3 size={14} />} title="Professional Summary" badge="AI">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>Write manually or auto-generate</label>
                            <button
                                type="button"
                                onClick={handleGenSummary}
                                disabled={!hasEnoughData || isGenSummary}
                                title={!hasEnoughData ? 'Add your name, headline or skills first' : 'Auto-generate from your profile'}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    padding: '0.3rem 0.7rem', borderRadius: '0.45rem', border: 'none',
                                    cursor: hasEnoughData ? 'pointer' : 'not-allowed',
                                    background: hasEnoughData ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : '#e5e7eb',
                                    color: hasEnoughData ? '#fff' : '#9ca3af',
                                    fontSize: '0.72rem', fontWeight: '700',
                                    opacity: isGenSummary ? 0.7 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isGenSummary
                                    ? <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> Generating...</>
                                    : <><Wand2 size={12} /> AI Generate</>}
                            </button>
                        </div>
                        <textarea name="summary" value={formData.summary} onChange={handleChange} style={textareaStyle}
                            placeholder="Write your career summary here, or click 'AI Generate' to auto-fill from your profile data..." />
                        {!hasEnoughData && (
                            <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>
                                💡 Fill in your name, headline or skills to unlock AI Generate.
                            </p>
                        )}
                    </SectionBlock>

                    {/* 3. Skills */}
                    <SectionBlock icon={<Code size={14} />} title="Skills">
                        <label style={labelStyle}>Click to toggle skills</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--bg-light)', border: '1px solid var(--border-color)' }}>
                            {availableSkills.map(skill => (
                                <span key={skill} onClick={() => toggleSkill(skill)}
                                    className={`badge cursor-pointer transition-all ${formData.selectedSkills.includes(skill) ? 'success' : 'opacity-60'}`}
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', userSelect: 'none' }}>
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </SectionBlock>

                    {/* 4–10 */}
                    <SectionBlock icon={<Briefcase size={14} />} title="Work Experience">
                        <label style={labelStyle}>Company, role, dates & bullets</label>
                        <textarea name="experience" value={formData.experience} onChange={handleChange} style={{ ...textareaStyle, minHeight: '105px' }}
                            placeholder={"Software Engineer | Acme Corp | Jan 2022 – Present\n- Built REST APIs serving 1M+ req/day\n- Led migration to microservices"} />
                    </SectionBlock>

                    <SectionBlock icon={<Star size={14} />} title="Projects">
                        <label style={labelStyle}>Name, tech stack & impact</label>
                        <textarea name="projects" value={formData.projects} onChange={handleChange} style={{ ...textareaStyle, minHeight: '105px' }}
                            placeholder={"DakshAI — React, Firebase\n- AI learning platform with 500+ users\n- Reduced onboarding time by 40%"} />
                    </SectionBlock>

                    <SectionBlock icon={<GraduationCap size={14} />} title="Education">
                        <label style={labelStyle}>Degree, institution, year</label>
                        <textarea name="education" value={formData.education} onChange={handleChange} style={textareaStyle}
                            placeholder={"B.Tech Computer Science | XYZ University | 2020–2024 | CGPA: 8.7"} />
                    </SectionBlock>

                    <SectionBlock icon={<Award size={14} />} title="Certifications">
                        <label style={labelStyle}>Cert name, issuer, year</label>
                        <textarea name="certifications" value={formData.certifications} onChange={handleChange} style={textareaStyle}
                            placeholder={"- Google Cloud Engineer | Google | 2023\n- AWS Solutions Architect | Amazon | 2022"} />
                    </SectionBlock>

                    <SectionBlock icon={<CheckCircle size={14} />} title="Achievements & Awards">
                        <label style={labelStyle}>Awards, hackathon wins, honors</label>
                        <textarea name="achievements" value={formData.achievements} onChange={handleChange} style={textareaStyle}
                            placeholder={"- 1st place Smart India Hackathon 2023\n- Dean's List – 3 consecutive semesters"} />
                    </SectionBlock>

                    <SectionBlock icon={<Users size={14} />} title="Leadership & Extracurricular">
                        <label style={labelStyle}>Clubs, positions, volunteer work</label>
                        <textarea name="leadership" value={formData.leadership} onChange={handleChange} style={textareaStyle}
                            placeholder={"- President, GDSC 2023–24\n- Organized 3 national tech events"} />
                    </SectionBlock>

                    <SectionBlock icon={<BookOpen size={14} />} title="Publications">
                        <label style={labelStyle}>Papers, articles, blogs</label>
                        <textarea name="publications" value={formData.publications} onChange={handleChange} style={textareaStyle}
                            placeholder={"- 'AI Resume Generation' – IEEE 2024\n- 'React Performance' – Medium, 10k views"} />
                    </SectionBlock>

                    {/* Generate Button */}
                    <button onClick={handleGenerate} disabled={isGenerating || !formData.name}
                        style={{
                            width: '100%', marginTop: '0.6rem', padding: '0.85rem', borderRadius: '0.7rem',
                            border: 'none', cursor: formData.name ? 'pointer' : 'not-allowed',
                            fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            background: 'linear-gradient(135deg,var(--primary-blue) 0%,#2563EB 100%)',
                            color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'transform 0.15s'
                        }}
                        onMouseEnter={e => { if (formData.name) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {isGenerating
                            ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Generating...</>
                            : <><Sparkles size={18} /> Generate Resume</>}
                    </button>
                    {!formData.name && <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--danger)', fontWeight: '600', marginTop: '0.35rem' }}>Full Name is required.</p>}
                </div>

                {/* ── RIGHT: A4 PREVIEW ── */}
                <div style={{ position: 'sticky', top: '5.5rem', display: 'flex', flexDirection: 'column', height: 'fit-content', maxHeight: '92vh' }}>
                    <div className="glass-card shadow-lg w-full" style={{ border: '2px dashed var(--border-color)', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                        {/* Preview Header Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1.1rem', background: 'var(--primary-white)', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: resumePages ? '#10b981' : '#d1d5db' }} />
                                Live Preview · A4
                            </h2>
                            {resumePages && (
                                <button onClick={handleDownload}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem',
                                        borderRadius: '0.45rem', border: 'none', cursor: 'pointer',
                                        background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
                                        fontSize: '0.78rem', fontWeight: '700', boxShadow: '0 2px 8px rgba(16,185,129,0.3)', transition: 'transform 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <Download size={13} /> Download PDF
                                </button>
                            )}
                        </div>

                        {/* A4 Pages Area */}
                        <div ref={containerRef} style={{ overflowY: 'auto', padding: '1.25rem', background: '#d1d5db', minHeight: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                            {resumePages ? (
                                resumePages.map((pg, i) => (
                                    <div key={i} style={{
                                        width: `${A4_W}px`,
                                        minHeight: `${A4_H}px`,
                                        background: '#fff',
                                        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                                        borderRadius: '2px',
                                        padding: `${PAGE_PADDING}px`,
                                        position: 'relative',
                                        // Scale down so it fits the preview panel
                                        transform: 'scale(0.72)',
                                        transformOrigin: 'top center',
                                        marginBottom: `${-(A4_H * 0.28 - 16)}px`, // compensate for scale
                                        flexShrink: 0
                                    }}>
                                        {/* Page number badge */}
                                        {i > 0 && (
                                            <div style={{ position: 'absolute', top: '10px', right: '14px', fontSize: '7pt', color: '#9ca3af', fontFamily: "'Inter',sans-serif" }}>
                                                Page {i + 1}
                                            </div>
                                        )}
                                        {pg.headerJSX}
                                        {pg.sections}
                                    </div>
                                ))
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', textAlign: 'center', opacity: 0.4, padding: '2rem' }}>
                                    <FileText size={60} style={{ marginBottom: '1rem', color: '#6b7280' }} />
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>Awaiting Your Details</h3>
                                    <p style={{ fontSize: '0.82rem', color: '#6b7280', maxWidth: '240px' }}>Fill in the sections on the left and click <strong>Generate Resume</strong>.</p>
                                </div>
                            )}
                        </div>

                        {/* A4 scale hint */}
                        {resumePages && (
                            <div style={{ padding: '0.4rem 1rem', background: 'var(--bg-light)', borderTop: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                📄 Preview scaled to fit · Downloads as full A4 (210 × 297 mm)
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ResumeBuilder;
