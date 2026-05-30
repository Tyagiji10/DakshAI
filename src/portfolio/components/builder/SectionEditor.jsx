import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { Plus, Trash2, X, Sparkles, Github, ExternalLink } from 'lucide-react';
import { generateBio, suggestSkills } from '../../services/ai';
import useDashboardSync from '../../hooks/useDashboardSync';
/* ── Chip Tag Input ───────────────────────────────────── */
const ChipInput = ({ chips = [], onChange, placeholder = 'Type & press Enter...' }) => {
    const [inputVal, setInputVal] = useState('');

    const addChip = () => {
        const val = inputVal.trim();
        if (!val || chips.includes(val)) { setInputVal(''); return; }
        onChange([...chips, val]);
        setInputVal('');
    };

    const removeChip = (chip) => onChange(chips.filter(c => c !== chip));

    return (
        <div className="chip-input-wrap" onClick={e => e.currentTarget.querySelector('input')?.focus()}>
            {chips.map(chip => (
                <span key={chip} className="skill-chip">
                    {chip}
                    <button type="button" onClick={() => removeChip(chip)}><X size={10} /></button>
                </span>
            ))}
            <input
                className="chip-text-input"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChip(); }
                    if (e.key === 'Backspace' && !inputVal && chips.length) removeChip(chips[chips.length - 1]);
                }}
                placeholder={chips.length === 0 ? placeholder : ''}
            />
        </div>
    );
};

/* ── AI Button ────────────────────────────────────────── */
const AIBtn = ({ onClick, loading, label = 'AI Generate' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={loading}
        style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none',
            color: loading ? '#475569' : '#818cf8',
            fontSize: '0.7rem', fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
            padding: '2px 0', transition: 'color 0.2s'
        }}
    >
        <Sparkles size={11} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Generating...' : label}
    </button>
);

/* ── Hero Editor ──────────────────────────────────────── */
const HeroEditor = () => {
    const { state, updatePersonalInfo } = usePortfolio();
    const { personalInfo } = state;
    const [genBio, setGenBio] = useState(false);

    const handleGenerateBio = async () => {
        setGenBio(true);
        try {
            const skills = state.sectionData['sec-skills']?.technical || [];
            const bio = await generateBio(personalInfo.fullName, skills, personalInfo.headline || 'creating impactful digital experiences');
            updatePersonalInfo({ bio });
        } catch (e) { console.error(e); }
        finally { setGenBio(false); }
    };

    return (
        <div className="editor-form">
            <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Bio / About</label>
                    <AIBtn onClick={handleGenerateBio} loading={genBio} />
                </div>
                <textarea rows={5} value={personalInfo.bio || ''} onChange={e => updatePersonalInfo({ bio: e.target.value })} placeholder="Tell your story..." />
            </div>
            <p style={{ fontSize: '0.7rem', color: '#475569' }}>
                💡 Edit your name, headline, photo and social links in the <strong style={{ color: '#818cf8' }}>Profile</strong> tab.
            </p>
        </div>
    );
};

/* ── Skills Editor ────────────────────────────────────── */
const SkillsEditor = ({ section }) => {
    const { state, updateSectionData } = usePortfolio();
    const data = state.sectionData[section.id] || { technical: [], tools: [] };
    const [loading, setLoading] = useState(false);

    const handleAISuggest = async () => {
        const role = state.personalInfo.headline || 'Software Engineer';
        setLoading(true);
        try {
            const suggested = await suggestSkills(role);
            const merged = [...new Set([...(data.technical || []), ...suggested])];
            updateSectionData(section.id, { ...data, technical: merged });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="editor-form">
            <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Technical Skills</label>
                    <AIBtn onClick={handleAISuggest} loading={loading} label="AI Suggest" />
                </div>
                <ChipInput
                    chips={data.technical || []}
                    onChange={chips => updateSectionData(section.id, { ...data, technical: chips })}
                    placeholder="React, Python, Node.js... (Enter to add)"
                />
            </div>
            <div className="input-group">
                <label>Tools & Platforms</label>
                <ChipInput
                    chips={data.tools || []}
                    onChange={chips => updateSectionData(section.id, { ...data, tools: chips })}
                    placeholder="Figma, Git, Docker... (Enter to add)"
                />
            </div>
        </div>
    );
};

/* ── Projects Editor ──────────────────────────────────── */
const ProjectsEditor = ({ section }) => {
    const { state, updateSectionData } = usePortfolio();
    const projects = state.sectionData[section.id] || [];
    const { autoFillProjects, isSyncing } = useDashboardSync();

    const update = (id, updates) =>
        updateSectionData(section.id, projects.map(p => p.id === id ? { ...p, ...updates } : p));
    const add = () =>
        updateSectionData(section.id, [...projects, { id: Date.now(), title: 'New Project', description: '', technologies: [], link: '', github: '', image: '' }]);
    const remove = (id) =>
        updateSectionData(section.id, projects.filter(p => p.id !== id));

    return (
        <div className="editor-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Projects ({projects.length})</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="add-project-btn" onClick={autoFillProjects} disabled={isSyncing} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.2)' }}><Sparkles size={12} /> {isSyncing ? 'Filling...' : 'Auto Fill'}</button>
                    <button className="add-project-btn" onClick={add}><Plus size={12} /> Add Project</button>
                </div>
            </div>
            {projects.map(project => (
                <div key={project.id} className="project-edit-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <input
                            className="project-title-input"
                            value={project.title}
                            onChange={e => update(project.id, { title: e.target.value })}
                            placeholder="Project Name"
                        />
                        <button className="delete-btn" onClick={() => remove(project.id)}><Trash2 size={13} /></button>
                    </div>
                    <textarea
                        className="project-desc-input"
                        rows={2}
                        value={project.description}
                        onChange={e => update(project.id, { description: e.target.value })}
                        placeholder="Brief description of what you built..."
                    />
                    <div className="input-group" style={{ marginTop: 4 }}>
                        <label>Technologies</label>
                        <ChipInput
                            chips={project.technologies || []}
                            onChange={chips => update(project.id, { technologies: chips })}
                            placeholder="React, Node.js..."
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div className="input-group">
                            <label><ExternalLink size={10} style={{ display: 'inline', marginRight: 3 }} />Live URL</label>
                            <input type="url" value={project.link || ''} onChange={e => update(project.id, { link: e.target.value })} placeholder="https://..." style={{ fontSize: '0.78rem' }} />
                        </div>
                        <div className="input-group">
                            <label><Github size={10} style={{ display: 'inline', marginRight: 3 }} />GitHub</label>
                            <input type="url" value={project.github || ''} onChange={e => update(project.id, { github: e.target.value })} placeholder="github.com/..." style={{ fontSize: '0.78rem' }} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Cover Image URL (optional)</label>
                        <input type="url" value={project.image || ''} onChange={e => update(project.id, { image: e.target.value })} placeholder="https://..." style={{ fontSize: '0.78rem' }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ── Experience Editor ────────────────────────────────── */
const ExperienceEditor = ({ section }) => {
    const { state, updateSectionData } = usePortfolio();
    const experiences = state.sectionData[section.id] || [];

    const update = (id, updates) =>
        updateSectionData(section.id, experiences.map(e => e.id === id ? { ...e, ...updates } : e));
    const add = () =>
        updateSectionData(section.id, [...experiences, { id: Date.now(), role: 'New Role', company: 'Company Name', location: '', duration: '2024 - Present', description: '• Describe your impact here...' }]);
    const remove = (id) =>
        updateSectionData(section.id, experiences.filter(e => e.id !== id));

    return (
        <div className="editor-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Roles ({experiences.length})</label>
                <button className="add-project-btn" onClick={add}><Plus size={12} /> Add Role</button>
            </div>
            {experiences.map(exp => (
                <div key={exp.id} className="project-edit-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <input className="project-title-input" value={exp.role} onChange={e => update(exp.id, { role: e.target.value })} placeholder="Software Engineer" />
                        <button className="delete-btn" onClick={() => remove(exp.id)}><Trash2 size={13} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                        <div className="input-group">
                            <label>Company</label>
                            <input value={exp.company} onChange={e => update(exp.id, { company: e.target.value })} placeholder="Google" style={{ fontSize: '0.8rem' }} />
                        </div>
                        <div className="input-group">
                            <label>Duration</label>
                            <input value={exp.duration} onChange={e => update(exp.id, { duration: e.target.value })} placeholder="2022 - Present" style={{ fontSize: '0.8rem' }} />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginTop: 8 }}>
                        <label>Location (optional)</label>
                        <input value={exp.location || ''} onChange={e => update(exp.id, { location: e.target.value })} placeholder="Remote / Bengaluru, India" style={{ fontSize: '0.8rem' }} />
                    </div>
                    <div className="input-group" style={{ marginTop: 8 }}>
                        <label>Description (use • for bullets)</label>
                        <textarea rows={4} value={exp.description} onChange={e => update(exp.id, { description: e.target.value })} placeholder="• Led a team of 5 engineers..." style={{ fontSize: '0.8rem' }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ── Education Editor ─────────────────────────────────── */
const EducationEditor = ({ section }) => {
    const { state, updateSectionData } = usePortfolio();
    const items = state.sectionData[section.id] || [];

    const update = (id, updates) =>
        updateSectionData(section.id, items.map(e => e.id === id ? { ...e, ...updates } : e));
    const add = () =>
        updateSectionData(section.id, [...items, { id: Date.now(), institution: 'University Name', degree: 'Bachelor of Science', year: '2020 - 2024', gpa: '' }]);
    const remove = (id) =>
        updateSectionData(section.id, items.filter(e => e.id !== id));

    return (
        <div className="editor-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Education ({items.length})</label>
                <button className="add-project-btn" onClick={add}><Plus size={12} /> Add</button>
            </div>
            {items.map(ed => (
                <div key={ed.id} className="project-edit-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <input className="project-title-input" value={ed.institution} onChange={e => update(ed.id, { institution: e.target.value })} placeholder="University Name" />
                        <button className="delete-btn" onClick={() => remove(ed.id)}><Trash2 size={13} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                        <div className="input-group">
                            <label>Degree</label>
                            <input value={ed.degree} onChange={e => update(ed.id, { degree: e.target.value })} placeholder="B.Tech CS" style={{ fontSize: '0.8rem' }} />
                        </div>
                        <div className="input-group">
                            <label>Years</label>
                            <input value={ed.year} onChange={e => update(ed.id, { year: e.target.value })} placeholder="2020 - 2024" style={{ fontSize: '0.8rem' }} />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginTop: 8 }}>
                        <label>GPA / Score (optional)</label>
                        <input value={ed.gpa || ''} onChange={e => update(ed.id, { gpa: e.target.value })} placeholder="9.2 / 10" style={{ fontSize: '0.8rem' }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ── Certifications Editor ────────────────────────────── */
const CertificationsEditor = ({ section }) => {
    const { state, updateSectionData } = usePortfolio();
    const items = state.sectionData[section.id] || [];

    const update = (id, updates) =>
        updateSectionData(section.id, items.map(e => e.id === id ? { ...e, ...updates } : e));
    const add = () =>
        updateSectionData(section.id, [...items, { id: Date.now(), title: 'Certification Name', issuer: 'Issuing Organization', date: '2023', credentialUrl: '' }]);
    const remove = (id) =>
        updateSectionData(section.id, items.filter(e => e.id !== id));

    return (
        <div className="editor-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Certifications ({items.length})</label>
                <button className="add-project-btn" onClick={add}><Plus size={12} /> Add</button>
            </div>
            {items.map(cert => (
                <div key={cert.id} className="project-edit-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <input className="project-title-input" value={cert.title} onChange={e => update(cert.id, { title: e.target.value })} placeholder="AWS Certified Solutions Architect" />
                        <button className="delete-btn" onClick={() => remove(cert.id)}><Trash2 size={13} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                        <div className="input-group">
                            <label>Issuer</label>
                            <input value={cert.issuer} onChange={e => update(cert.id, { issuer: e.target.value })} placeholder="Amazon Web Services" style={{ fontSize: '0.8rem' }} />
                        </div>
                        <div className="input-group">
                            <label>Date</label>
                            <input value={cert.date} onChange={e => update(cert.id, { date: e.target.value })} placeholder="Aug 2023" style={{ fontSize: '0.8rem' }} />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginTop: 8 }}>
                        <label>Credential URL (optional)</label>
                        <input type="url" value={cert.credentialUrl || ''} onChange={e => update(cert.id, { credentialUrl: e.target.value })} placeholder="https://..." style={{ fontSize: '0.8rem' }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ── Contact Editor ───────────────────────────────────── */
const ContactEditor = ({ section }) => {
    const { state, updateSectionData } = usePortfolio();
    const data = state.sectionData[section.id] || {};

    const set = (field, val) => updateSectionData(section.id, { ...data, [field]: val });

    const hasFormspree = !!(data.formspreeId && data.formspreeId.trim());

    return (
        <div className="editor-form">
            {/* ── Contact Form Settings (Formspree) ──────── */}
            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasFormspree ? '#22c55e' : '#f59e0b', flexShrink: 0 }} />
                    <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Contact Form Settings</label>
                </div>
                <div className="input-group" style={{ marginBottom: 8 }}>
                    <label>Formspree Form ID</label>
                    <input
                        type="text"
                        value={data.formspreeId || ''}
                        onChange={e => set('formspreeId', e.target.value.trim())}
                        placeholder="e.g., xvgpqabc"
                        style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}
                    />
                </div>
                <p style={{ fontSize: '0.65rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                    {hasFormspree ? (
                        <span style={{ color: '#22c55e' }}>✓ Contact form is active — messages will be delivered to your email.</span>
                    ) : (
                        <>
                            ⚠️ No Form ID set — contact form will be <strong>hidden</strong> on your website.
                            <br />
                            <span style={{ marginTop: 4, display: 'inline-block' }}>
                                1. Create a free account at <strong style={{ color: '#818cf8' }}>formspree.io</strong><br />
                                2. Create a new form → Copy the Form ID<br />
                                3. Paste it above to enable the contact form
                            </span>
                        </>
                    )}
                </p>
            </div>

            {/* ── Contact Info Fields ──────────────────── */}
            <div className="input-group"><label>Email Address</label>
                <input type="email" value={data.email || ''} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="input-group"><label>Phone</label>
                <input type="tel" value={data.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="input-group"><label>Location</label>
                <input type="text" value={data.address || ''} onChange={e => set('address', e.target.value)} placeholder="Bengaluru, India" />
            </div>
            <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: 4 }}>
                💡 Social links are set in the <strong style={{ color: '#818cf8' }}>Profile</strong> tab.
            </p>
        </div>
    );
};

/* ── Main SectionEditor ───────────────────────────────── */
const SectionEditor = ({ section }) => {
    switch (section.type) {
        case 'hero': return <HeroEditor />;
        case 'skills': return <SkillsEditor section={section} />;
        case 'projects': return <ProjectsEditor section={section} />;
        case 'experience': return <ExperienceEditor section={section} />;
        case 'education': return <EducationEditor section={section} />;
        case 'certifications': return <CertificationsEditor section={section} />;
        case 'contact': return <ContactEditor section={section} />;
        default: return (
            <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>Editor for "{section.type}" coming soon.</p>
            </div>
        );
    }
};

export default SectionEditor;
