import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { jobLibrary } from '../lib/mockData';
import {
    Link as LinkIcon, Github, Monitor, Plus, Trash2, Video, Briefcase,
    Award, Sparkles, Globe, User, Mail, Phone, FileText, Code,
    ExternalLink, ChevronDown, ChevronUp, Wand2, CheckCircle, Star,
    Zap
} from 'lucide-react';
import { generatePortfolioBio, generateSEOTags } from '../lib/gemini';

// ─── Tiny collapsible block ───────────────────────────────────────────────────
const Block = ({ icon, title, badge, defaultOpen = false, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', marginBottom: '0.6rem' }}>
            <button type="button" onClick={() => setOpen(o => !o)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: 'var(--bg-light)', border: 'none', cursor: 'pointer', color: 'var(--primary-blue)', fontWeight: '700', fontSize: '0.88rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {icon}{title}
                    {badge && <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: '99px', padding: '1px 7px', fontWeight: '700' }}>{badge}</span>}
                </span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {open && <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>{children}</div>}
        </div>
    );
};

// ─── Portfolio HTML generator ─────────────────────────────────────────────────
function generatePortfolioHTML(user, pd) {
    const skillChips = (pd.skills.length ? pd.skills : user.skills || [])
        .map(s => `<span class="chip">${s}</span>`).join('');

    const projectCards = pd.projects.filter(p => p.title).map(p => `
<div class="card">
  <h3>${p.title}</h3>
  <p>${p.desc || ''}</p>
  ${p.tech ? `<div class="tags">${p.tech.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('')}</div>` : ''}
  <div class="card-links">
    ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" rel="noopener">🌐 Live Demo</a>` : ''}
    ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" rel="noopener">⚙ GitHub</a>` : ''}
  </div>
</div>`).join('');

    const expItems = pd.experience.filter(e => e.role).map(e => `
<div class="exp-item">
  <div class="exp-head"><strong>${e.role}</strong> <span>@ ${e.company || ''}</span></div>
  <div class="exp-date">${e.duration || ''}</div>
  <p>${e.desc || ''}</p>
</div>`).join('');

    const certItems = pd.certifications.filter(Boolean).map(c => `<li>${c}</li>`).join('');
    const achievItems = pd.achievements.filter(Boolean).map(a => `<li>${a}</li>`).join('');

    const contactLinks = [
        pd.email || user.email ? `<a href="mailto:${pd.email || user.email}">📧 ${pd.email || user.email}</a>` : '',
        pd.phone ? `<a href="tel:${pd.phone}">📞 ${pd.phone}</a>` : '',
        pd.github ? `<a href="${pd.github}" target="_blank" rel="noopener">⚙ GitHub</a>` : '',
        pd.linkedin ? `<a href="${pd.linkedin}" target="_blank" rel="noopener">💼 LinkedIn</a>` : '',
        pd.website ? `<a href="${pd.website}" target="_blank" rel="noopener">🌐 Portfolio</a>` : '',
    ].filter(Boolean).join('');

    const accentColor = pd.accentColor || '#6366f1';
    const darkAccent = pd.accentColor ? pd.accentColor + 'cc' : '#4f46e5';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${pd.seo?.title || pd.name || user.name || 'Portfolio'} | Portfolio</title>
<meta name="description" content="${pd.seo?.description || `Professional portfolio of ${pd.name || user.name}`}">
<meta name="keywords" content="${pd.seo?.keywords || ''}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
:root{--accent:${accentColor};--dark-accent:${darkAccent};}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#0f0f14;color:#e2e8f0;scroll-behavior:smooth}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:1rem 6%;background:rgba(15,15,20,0.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.06)}
.logo{font-weight:800;font-size:1.2rem;color:#fff;letter-spacing:-0.03em}
.logo span{color:var(--accent)}
.nav-links a{margin-left:1.8rem;font-size:0.85rem;font-weight:600;color:#94a3b8;transition:color .2s}
.nav-links a:hover{color:#fff;text-decoration:none}

/* HERO */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:7rem 6% 4rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 40%,${accentColor}22 0%,transparent 70%);pointer-events:none}
.avatar{width:110px;height:110px;border-radius:50%;border:3px solid var(--accent);margin-bottom:1.5rem;object-fit:cover;box-shadow:0 0 30px ${accentColor}55}
.hero h1{font-size:clamp(2.2rem,5vw,3.8rem);font-weight:800;letter-spacing:-0.03em;color:#fff;line-height:1.1;margin-bottom:.6rem}
.hero h1 span{background:linear-gradient(135deg,var(--accent),#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero .headline{font-size:1.1rem;font-weight:500;color:#94a3b8;margin-bottom:1.5rem}
.hero p.bio{max-width:620px;font-size:0.95rem;color:#64748b;line-height:1.7;margin-bottom:2.5rem}
.hero-ctas{display:flex;gap:.8rem;flex-wrap:wrap;justify-content:center}
.btn{padding:.7rem 1.6rem;border-radius:8px;font-weight:700;font-size:.88rem;cursor:pointer;border:none;transition:transform .15s,box-shadow .15s}
.btn:hover{transform:translateY(-2px)}
.btn-primary{background:var(--accent);color:#fff;box-shadow:0 4px 18px ${accentColor}44}
.btn-outline{background:transparent;color:#e2e8f0;border:1.5px solid rgba(255,255,255,0.2)}
.btn-outline:hover{border-color:var(--accent);color:var(--accent)}

/* SECTIONS */
section{padding:5rem 6%}
.section-label{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:.5rem}
.section-title{font-size:clamp(1.6rem,3vw,2.2rem);font-weight:800;color:#f1f5f9;margin-bottom:.5rem}
.section-sub{color:#64748b;font-size:.95rem;margin-bottom:2.5rem}
.divider{width:48px;height:3px;background:linear-gradient(90deg,var(--accent),transparent);border-radius:3px;margin-bottom:2rem}

/* CHIPS */
.chips{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem}
.chip{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:.35rem .8rem;font-size:.8rem;color:#cbd5e1;font-weight:500}

/* CARDS (projects) */
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.5rem;transition:border-color .2s,transform .2s}
.card:hover{border-color:var(--accent);transform:translateY(-4px)}
.card h3{font-size:1.05rem;font-weight:700;color:#f1f5f9;margin-bottom:.5rem}
.card p{font-size:.85rem;color:#64748b;line-height:1.65;margin-bottom:.85rem}
.tags{display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.85rem}
.tag{background:${accentColor}18;color:var(--accent);border-radius:5px;padding:.2rem .6rem;font-size:.73rem;font-weight:600}
.card-links{display:flex;gap:.7rem}
.card-links a{font-size:.8rem;font-weight:600;padding:.3rem .7rem;border-radius:6px;background:rgba(255,255,255,0.06);color:#cbd5e1;transition:background .2s}
.card-links a:hover{background:var(--accent);color:#fff;text-decoration:none}

/* EXPERIENCE */
.exp-list{display:flex;flex-direction:column;gap:1.5rem}
.exp-item{border-left:2px solid var(--accent);padding-left:1.2rem}
.exp-head{font-size:.98rem;font-weight:700;color:#f1f5f9;margin-bottom:.2rem}
.exp-head span{font-weight:500;color:var(--accent)}
.exp-date{font-size:.78rem;color:#64748b;margin-bottom:.45rem}
.exp-item p{font-size:.85rem;color:#94a3b8;line-height:1.65}

/* CERTS & ACHIEVEMENTS */
.list-section ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:.55rem}
.list-section li{font-size:.9rem;color:#cbd5e1;padding-left:1.3rem;position:relative;line-height:1.55}
.list-section li::before{content:'▸';position:absolute;left:0;color:var(--accent)}

/* CONTACT */
#contact{background:rgba(255,255,255,0.02)}
.contact-links{display:flex;flex-wrap:wrap;gap:.85rem;margin-top:1.5rem}
.contact-links a{display:flex;align-items:center;gap:.4rem;padding:.6rem 1.2rem;border-radius:9px;border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;font-size:.85rem;font-weight:600;transition:all .2s}
.contact-links a:hover{background:var(--accent);border-color:var(--accent);color:#fff;text-decoration:none}

/* FOOTER */
footer{text-align:center;padding:2rem;font-size:.78rem;color:#334155;border-top:1px solid rgba(255,255,255,0.05)}
footer span{color:var(--accent)}

@media(max-width:640px){
  nav .nav-links{display:none}
  .hero h1{font-size:2rem}
  section{padding:3.5rem 5%}
}
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="logo">${(pd.name || user.name || 'Dev').split(' ')[0]}<span>.</span></div>
  <div class="nav-links">
    <a href="#about">About</a>
    ${skillChips ? '<a href="#skills">Skills</a>' : ''}
    ${projectCards ? '<a href="#projects">Projects</a>' : ''}
    ${expItems ? '<a href="#experience">Experience</a>' : ''}
    <a href="#contact">Contact</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero" id="about">
  ${pd.avatar ? `<img src="${pd.avatar}" alt="${pd.name || user.name}" class="avatar"/>` : ''}
  <h1>Hi, I'm <span>${pd.name || user.name || 'Developer'}</span></h1>
  ${pd.headline ? `<p class="headline">${pd.headline}</p>` : ''}
  ${pd.bio || user.bio ? `<p class="bio">${pd.bio || user.bio}</p>` : ''}
  <div class="hero-ctas">
    <a href="#contact" class="btn btn-primary">Get in Touch</a>
    ${pd.github ? `<a href="${pd.github}" target="_blank" class="btn btn-outline">View GitHub</a>` : ''}
    ${pd.resumeUrl ? `<a href="${pd.resumeUrl}" target="_blank" class="btn btn-outline">Download Resume</a>` : ''}
  </div>
</section>

${skillChips ? `
<!-- SKILLS -->
<section id="skills" style="background:rgba(255,255,255,0.02)">
  <div class="section-label">What I know</div>
  <div class="section-title">Skills &amp; Technologies</div>
  <div class="divider"></div>
  <div class="chips">${skillChips}</div>
</section>` : ''}

${projectCards ? `
<!-- PROJECTS -->
<section id="projects">
  <div class="section-label">What I've built</div>
  <div class="section-title">Featured Projects</div>
  <div class="divider"></div>
  <div class="cards">${projectCards}</div>
</section>` : ''}

${expItems ? `
<!-- EXPERIENCE -->
<section id="experience" style="background:rgba(255,255,255,0.02)">
  <div class="section-label">Where I've worked</div>
  <div class="section-title">Work Experience</div>
  <div class="divider"></div>
  <div class="exp-list">${expItems}</div>
</section>` : ''}

${certItems || achievItems ? `
<!-- CERTS & ACHIEVEMENTS -->
<section>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;flex-wrap:wrap">
    ${certItems ? `<div class="list-section">
      <div class="section-label">Verified</div>
      <div class="section-title" style="font-size:1.4rem">Certifications</div>
      <div class="divider"></div>
      <ul>${certItems}</ul>
    </div>` : ''}
    ${achievItems ? `<div class="list-section">
      <div class="section-label">Recognition</div>
      <div class="section-title" style="font-size:1.4rem">Achievements</div>
      <div class="divider"></div>
      <ul>${achievItems}</ul>
    </div>` : ''}
  </div>
</section>` : ''}

<!-- CONTACT -->
<section id="contact">
  <div class="section-label">Let's connect</div>
  <div class="section-title">Get In Touch</div>
  <div class="divider"></div>
  <p style="color:#64748b;font-size:.95rem;max-width:480px">
    ${pd.contactNote || "I'm always open to interesting conversations, collaborations, and new opportunities."}
  </p>
  <div class="contact-links">${contactLinks}</div>
</section>

<footer>
  Built with <span>♥</span> by ${pd.name || user.name || 'Developer'} · Powered by Daksh.AI
</footer>

<script>
// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const t=document.querySelector(a.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'})}
  });
});
// Fade-in on scroll
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.style.opacity=1;e.target.style.transform='translateY(0)'}})},{threshold:.1});
document.querySelectorAll('section').forEach(s=>{s.style.opacity=0;s.style.transform='translateY(20px)';s.style.transition='opacity .6s ease,transform .6s ease';obs.observe(s)});
</script>
</body>
</html>`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Portfolio = () => {
    const { user, updatePortfolio, t } = useUser();
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkType, setNewLinkType] = useState('GitHub');
    const [showGenerator, setShowGenerator] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenBio, setIsGenBio] = useState(false);
    const [generatedHTML, setGeneratedHTML] = useState(null);

    // ── Portfolio details form state ──────────────────────────────────────────
    const [pd, setPd] = useState({
        name: user.name || '',
        headline: '',
        bio: user.bio || '',
        email: user.email || '',
        phone: '',
        github: '',
        linkedin: '',
        website: '',
        resumeUrl: '',
        avatar: '',
        accentColor: '#6366f1',
        contactNote: '',
        skills: user.skills || [],
        projects: [
            { title: '', desc: '', tech: '', liveUrl: '', githubUrl: '' },
            { title: '', desc: '', tech: '', liveUrl: '', githubUrl: '' },
        ],
        experience: [{ role: '', company: '', duration: '', desc: '' }],
        certifications: [''],
        achievements: [''],
        seo: null,
    });

    const handlePd = (field, val) => setPd(prev => ({ ...prev, [field]: val }));

    // project helpers
    const updateProject = (i, field, val) => {
        const arr = [...pd.projects];
        arr[i] = { ...arr[i], [field]: val };
        setPd(prev => ({ ...prev, projects: arr }));
    };
    const addProject = () => setPd(prev => ({ ...prev, projects: [...prev.projects, { title: '', desc: '', tech: '', liveUrl: '', githubUrl: '' }] }));
    const removeProject = (i) => setPd(prev => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }));

    // experience helpers
    const updateExp = (i, field, val) => {
        const arr = [...pd.experience];
        arr[i] = { ...arr[i], [field]: val };
        setPd(prev => ({ ...prev, experience: arr }));
    };
    const addExp = () => setPd(prev => ({ ...prev, experience: [...prev.experience, { role: '', company: '', duration: '', desc: '' }] }));
    const removeExp = (i) => setPd(prev => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== i) }));

    // cert / achievement helpers
    const updateList = (key, i, val) => {
        const arr = [...pd[key]]; arr[i] = val;
        setPd(prev => ({ ...prev, [key]: arr }));
    };
    const addListItem = (key) => setPd(prev => ({ ...prev, [key]: [...prev[key], ''] }));
    const removeListItem = (key, i) => setPd(prev => ({ ...prev, [key]: prev[key].filter((_, idx) => idx !== i) }));

    // toggle skill
    const toggleSkill = (skill) => {
        setPd(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    // ── Existing add-link logic ───────────────────────────────────────────────
    const getIconForType = (type) => {
        switch (type) {
            case 'GitHub': return <Github size={20} />;
            case 'Figma': return <Monitor size={20} />;
            case 'Video': return <Video size={20} />;
            default: return <LinkIcon size={20} />;
        }
    };
    const handleAddLink = (e) => {
        e.preventDefault();
        if (!newLinkUrl.trim()) return;
        updatePortfolio([...user.portfolioLinks, { id: Date.now(), title: newLinkType, url: newLinkUrl }]);
        setNewLinkUrl('');
    };
    const handleRemoveLink = (id) => updatePortfolio(user.portfolioLinks.filter(l => l.id !== id));

    // ── AI Bio Generation ────────────────────────────────────────────────────
    const handleGenBio = async () => {
        if (!pd.name && !pd.headline && pd.skills.length === 0) return;
        setIsGenBio(true);
        try {
            const bio = await generatePortfolioBio(pd);
            setPd(prev => ({ ...prev, bio }));
        } catch (error) {
            console.error("AI Bio failed:", error);
        } finally {
            setIsGenBio(false);
        }
    };

    // ── Generate portfolio ────────────────────────────────────────────────────
    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratedHTML(null);
        try {
            const seo = await generateSEOTags(pd);
            const updatedPd = { ...pd, seo };
            setPd(updatedPd);
            setGeneratedHTML(generatePortfolioHTML(user, updatedPd));
        } catch (error) {
            console.error("AI Generation failed:", error);
            setGeneratedHTML(generatePortfolioHTML(user, pd));
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Download ──────────────────────────────────────────────────────────────
    const handleDownload = () => {
        if (!generatedHTML) return;
        const blob = new Blob([generatedHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(pd.name || user.name || 'portfolio').toLowerCase().replace(/\s+/g, '-')}-portfolio.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Open preview ──────────────────────────────────────────────────────────
    const handlePreview = () => {
        if (!generatedHTML) return;
        const win = window.open('', '_blank');
        win.document.write(generatedHTML);
        win.document.close();
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    const inp = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '0.85rem', outline: 'none' };
    const lbl = { fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block' };
    const ta = { ...inp, minHeight: '72px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' };
    const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' };

    // available skills from user.skills + extras from pd
    const allSkills = [
        'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express', 'Python', 'Django',
        'FastAPI', 'TypeScript', 'JavaScript', 'Java', 'C++', 'Go', 'Rust',
        'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs',
        'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'CI/CD',
        'Figma', 'TailwindCSS', 'Machine Learning', 'Data Science', 'Flutter',
        ...(user.skills || [])
    ].filter((v, i, a) => a.indexOf(v) === i);

    return (
        <div className="fade-in max-w-6xl mx-auto">

            {/* ── Page Header ── */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                    <Briefcase className="text-primary" size={26} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold m-0" style={{ color: 'var(--text-dark)', letterSpacing: '-0.02em' }}>
                        {t('Proof-of-Work Portfolio', 'प्रमाणित कार्य पोर्टफोलियो')}
                    </h1>
                    <p className="text-muted text-sm mt-1">
                        {t('Manage your project links or generate a stunning personal portfolio website.', 'अपने प्रोजेक्ट लिंक प्रबंधित करें या एक पोर्टफोलियो वेबसाइट बनाएं।')}
                    </p>
                </div>
            </div>

            {/* ── Tab Toggle ── */}
            <div className="flex gap-0 mb-6 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)', width: 'fit-content' }}>
                {[
                    { label: 'Project Links', icon: <LinkIcon size={15} />, active: !showGenerator },
                    { label: '✨ Generate Portfolio', icon: <Globe size={15} />, active: showGenerator }
                ].map(({ label, icon, active }) => (
                    <button key={label} onClick={() => setShowGenerator(label.includes('Generate'))}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.6rem 1.2rem', border: 'none', cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: '700',
                            background: active ? 'var(--primary-blue)' : 'var(--bg-light)',
                            color: active ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s'
                        }}>
                        {icon}{label}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                TAB 1 — Project Links (existing feature, slightly polished)
            ══════════════════════════════════════════════════════════════ */}
            {!showGenerator && (
                <div>
                    {/* Add Link Form */}
                    <div className="glass-card mb-6 p-6" style={{ border: '1px solid rgba(59,130,246,0.15)', borderRadius: '16px' }}>
                        <h2 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--primary-blue)' }}>
                            <Monitor size={20} /> {t('Add Project Link', 'प्रोजेक्ट लिंक जोड़ें')}
                        </h2>
                        <form onSubmit={handleAddLink} className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="w-full md:w-1/4">
                                <select value={newLinkType} onChange={e => setNewLinkType(e.target.value)}
                                    style={{ ...inp, padding: '0.875rem 1rem', cursor: 'pointer' }}>
                                    <option value="GitHub">GitHub Repo</option>
                                    <option value="Figma">Figma Design</option>
                                    <option value="Video">Video (YouTube/Loom)</option>
                                    <option value="Website">Live Website</option>
                                </select>
                            </div>
                            <div className="w-full md:flex-1">
                                <input type="url" placeholder="https://..." value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
                                    style={{ ...inp, padding: '0.875rem 1.25rem' }} required />
                            </div>
                            <button type="submit" style={{ padding: '0.875rem 2rem', background: 'var(--primary-blue)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(26,35,126,0.2)' }}>
                                <Plus size={18} /> {t('Add', 'जोड़ें')}
                            </button>
                        </form>
                    </div>

                    {/* Link List */}
                    <div className="glass-card p-6" style={{ borderTop: '4px solid var(--accent-green)', borderRadius: '16px' }}>
                        <h2 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text-dark)' }}>
                            <Award size={20} className="text-success" /> {t('Your Projects', 'आपके प्रोजेक्ट्स')}
                        </h2>
                        {user.portfolioLinks.length === 0 ? (
                            <div className="text-center p-10 border-2 rounded-xl border-dashed flex flex-col items-center justify-center" style={{ borderColor: 'var(--border-color)' }}>
                                <LinkIcon size={32} color="var(--primary-blue)" opacity={0.5} className="mb-3" />
                                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-dark)' }}>No Projects Yet</h3>
                                <p className="text-sm text-muted" style={{ maxWidth: '240px' }}>{t('Add your first portfolio link above to stand out!', 'ऊपर अपना पहला लिंक जोड़ें।')}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {user.portfolioLinks.map(link => (
                                    <div key={link.id} className="flex items-center justify-between p-5 border rounded-xl group relative overflow-hidden"
                                        style={{ borderColor: 'var(--border-color)', background: 'var(--primary-white)' }}>
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--primary-blue)' }}>{getIconForType(link.title)}</div>
                                            <div>
                                                <h3 className="m-0 font-bold" style={{ color: 'var(--text-dark)' }}>{link.title}</h3>
                                                <a href={link.url} target="_blank" rel="noreferrer" className="text-sm" style={{ color: 'var(--text-muted)' }}
                                                    onMouseOver={e => e.target.style.color = 'var(--primary-blue)'}
                                                    onMouseOut={e => e.target.style.color = 'var(--text-muted)'}>
                                                    {link.url.length > 55 ? link.url.substring(0, 55) + '…' : link.url}
                                                </a>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveLink(link.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}
                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 2 — Generate Portfolio
            ══════════════════════════════════════════════════════════════ */}
            {showGenerator && (
                <div style={{ display: 'grid', gridTemplateColumns: generatedHTML ? '1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

                    {/* ── LEFT: Form ── */}
                    <div className="glass-card p-5 shadow-md" style={{ borderTop: '4px solid #6366f1', borderRadius: '12px' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Wand2 size={18} style={{ color: '#6366f1' }} />
                            <h2 className="text-lg font-bold m-0" style={{ color: '#6366f1' }}>Portfolio Details</h2>
                        </div>
                        <p className="text-sm text-muted mb-4">Fields marked with your account data are pre-filled. Add more info to enrich your site.</p>

                        {/* 1. Personal Info */}
                        <Block icon={<User size={13} />} title="Personal Info" defaultOpen>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                                <div><label style={lbl}>Full Name</label><input style={inp} value={pd.name} onChange={e => handlePd('name', e.target.value)} placeholder="Jane Smith" /></div>
                                <div><label style={lbl}>Headline / Tagline</label><input style={inp} value={pd.headline} onChange={e => handlePd('headline', e.target.value)} placeholder="Full Stack Developer" /></div>
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                    <label style={lbl}>Bio / About</label>
                                    <button 
                                        onClick={handleGenBio}
                                        disabled={isGenBio || (!pd.name && !pd.headline)}
                                        style={{ 
                                            background: 'none', border: 'none', color: '#6366f1', fontSize: '0.7rem', 
                                            fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' 
                                        }}
                                    >
                                        {isGenBio ? 'Generating...' : <><Zap size={10} /> Generate with AI</>}
                                    </button>
                                </div>
                                <textarea style={ta} value={pd.bio} onChange={e => handlePd('bio', e.target.value)} placeholder="A short paragraph about yourself..." />
                            </div>
                            <div style={g2}>
                                <div><label style={lbl}>Accent Color</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="color" value={pd.accentColor} onChange={e => handlePd('accentColor', e.target.value)} style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', padding: '2px' }} />
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pd.accentColor}</span>
                                    </div>
                                </div>
                                <div><label style={lbl}>Avatar URL (optional)</label><input style={inp} value={pd.avatar} onChange={e => handlePd('avatar', e.target.value)} placeholder="https://..." /></div>
                            </div>
                        </Block>

                        {/* 2. Contact */}
                        <Block icon={<Mail size={13} />} title="Contact & Links">
                            <div style={g2}>
                                <div><label style={lbl}>Email</label><input type="email" style={inp} value={pd.email} onChange={e => handlePd('email', e.target.value)} placeholder="you@example.com" /></div>
                                <div><label style={lbl}>Phone</label><input type="tel" style={inp} value={pd.phone} onChange={e => handlePd('phone', e.target.value)} placeholder="+91 ..." /></div>
                            </div>
                            <div style={g2}>
                                <div><label style={lbl}>GitHub URL</label><input style={inp} value={pd.github} onChange={e => handlePd('github', e.target.value)} placeholder="https://github.com/..." /></div>
                                <div><label style={lbl}>LinkedIn URL</label><input style={inp} value={pd.linkedin} onChange={e => handlePd('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
                            </div>
                            <div style={g2}>
                                <div><label style={lbl}>Website</label><input style={inp} value={pd.website} onChange={e => handlePd('website', e.target.value)} placeholder="https://yoursite.com" /></div>
                                <div><label style={lbl}>Resume URL (optional)</label><input style={inp} value={pd.resumeUrl} onChange={e => handlePd('resumeUrl', e.target.value)} placeholder="https://drive.google.com/..." /></div>
                            </div>
                            <div><label style={lbl}>Contact Note (optional)</label><input style={inp} value={pd.contactNote} onChange={e => handlePd('contactNote', e.target.value)} placeholder="I'm open to freelance & full-time opportunities" /></div>
                        </Block>

                        {/* 3. Skills */}
                        <Block icon={<Code size={13} />} title="Skills" badge={pd.skills.length > 0 ? `${pd.skills.length} selected` : ''}>
                            <label style={lbl}>Click to toggle (pre-filled from your account)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '160px', overflowY: 'auto', padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-light)', border: '1px solid var(--border-color)' }}>
                                {allSkills.map(skill => (
                                    <span key={skill} onClick={() => toggleSkill(skill)}
                                        className={`badge cursor-pointer transition-all ${pd.skills.includes(skill) ? 'success' : 'opacity-55'}`}
                                        style={{ padding: '0.28rem 0.6rem', fontSize: '0.73rem', userSelect: 'none' }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </Block>

                        {/* 4. Projects */}
                        <Block icon={<Star size={13} />} title="Projects" badge={`${pd.projects.filter(p => p.title).length} added`} defaultOpen>
                            {pd.projects.map((p, i) => (
                                <div key={i} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Project {i + 1}</span>
                                        {pd.projects.length > 1 && <button onClick={() => removeProject(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}><Trash2 size={13} /></button>}
                                    </div>
                                    <input style={inp} placeholder="Project Title *" value={p.title} onChange={e => updateProject(i, 'title', e.target.value)} />
                                    <textarea style={{ ...ta, minHeight: '55px' }} placeholder="Short description..." value={p.desc} onChange={e => updateProject(i, 'desc', e.target.value)} />
                                    <input style={inp} placeholder="Tech Stack (comma-separated): React, Node.js, MongoDB" value={p.tech} onChange={e => updateProject(i, 'tech', e.target.value)} />
                                    <div style={g2}>
                                        <input style={inp} placeholder="Live URL" value={p.liveUrl} onChange={e => updateProject(i, 'liveUrl', e.target.value)} />
                                        <input style={inp} placeholder="GitHub URL" value={p.githubUrl} onChange={e => updateProject(i, 'githubUrl', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            <button onClick={addProject} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px dashed var(--border-color)', background: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', width: 'fit-content' }}>
                                <Plus size={13} /> Add Project
                            </button>
                        </Block>

                        {/* 5. Experience */}
                        <Block icon={<Briefcase size={13} />} title="Work Experience">
                            {pd.experience.map((e, i) => (
                                <div key={i} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Experience {i + 1}</span>
                                        {pd.experience.length > 1 && <button onClick={() => removeExp(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}><Trash2 size={13} /></button>}
                                    </div>
                                    <div style={g2}>
                                        <input style={inp} placeholder="Role / Title *" value={e.role} onChange={ev => updateExp(i, 'role', ev.target.value)} />
                                        <input style={inp} placeholder="Company Name" value={e.company} onChange={ev => updateExp(i, 'company', ev.target.value)} />
                                    </div>
                                    <input style={inp} placeholder="Duration: Jan 2022 – Present" value={e.duration} onChange={ev => updateExp(i, 'duration', ev.target.value)} />
                                    <textarea style={{ ...ta, minHeight: '55px' }} placeholder="Key responsibilities & achievements..." value={e.desc} onChange={ev => updateExp(i, 'desc', ev.target.value)} />
                                </div>
                            ))}
                            <button onClick={addExp} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px dashed var(--border-color)', background: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', width: 'fit-content' }}>
                                <Plus size={13} /> Add Experience
                            </button>
                        </Block>

                        {/* 6. Certifications */}
                        <Block icon={<Award size={13} />} title="Certifications">
                            {pd.certifications.map((c, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <input style={{ ...inp, flex: 1 }} placeholder={`Certification ${i + 1}`} value={c} onChange={e => updateList('certifications', i, e.target.value)} />
                                    {pd.certifications.length > 1 && <button onClick={() => removeListItem('certifications', i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>}
                                </div>
                            ))}
                            <button onClick={() => addListItem('certifications')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px dashed var(--border-color)', background: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', width: 'fit-content' }}>
                                <Plus size={13} /> Add Certification
                            </button>
                        </Block>

                        {/* 7. Achievements */}
                        <Block icon={<CheckCircle size={13} />} title="Achievements">
                            {pd.achievements.map((a, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <input style={{ ...inp, flex: 1 }} placeholder={`Achievement ${i + 1}`} value={a} onChange={e => updateList('achievements', i, e.target.value)} />
                                    {pd.achievements.length > 1 && <button onClick={() => removeListItem('achievements', i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>}
                                </div>
                            ))}
                            <button onClick={() => addListItem('achievements')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', borderRadius: '7px', border: '1px dashed var(--border-color)', background: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', width: 'fit-content' }}>
                                <Plus size={13} /> Add Achievement
                            </button>
                        </Block>

                        {/* Generate Button */}
                        <button onClick={handleGenerate} disabled={isGenerating}
                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.9rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 4px 18px rgba(99,102,241,0.4)', transition: 'transform 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            {isGenerating
                                ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Building Portfolio...</>
                                : <><Sparkles size={18} /> Generate My Portfolio</>}
                        </button>
                    </div>

                    {/* ── RIGHT: Preview + Actions ── */}
                    {generatedHTML && (
                        <div style={{ position: 'sticky', top: '5.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {/* Action Buttons */}
                            <div className="glass-card p-4" style={{ borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                                    <h3 style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-dark)' }}>Portfolio Generated!</h3>
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Your portfolio site is ready. Preview it or download the HTML file to deploy anywhere.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.2rem' }}>
                                    <button onClick={handlePreview} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '0.82rem', fontWeight: '700', boxShadow: '0 2px 10px rgba(99,102,241,0.3)' }}>
                                        <ExternalLink size={13} /> Open Preview
                                    </button>
                                    <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '0.82rem', fontWeight: '700', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }}>
                                        <FileText size={13} /> Download HTML
                                    </button>
                                </div>
                                <button onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem', borderRadius: '8px', border: '1px dashed var(--border-color)', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600' }}>
                                    <Sparkles size={12} /> Regenerate
                                </button>
                            </div>

                            {/* Iframe Preview */}
                            <div className="glass-card" style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
                                <div style={{ padding: '0.6rem 1rem', background: 'var(--bg-light)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '5px' }}>{['#ef4444', '#fbbf24', '#10b981'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}</div>
                                    <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{(pd.name || user.name || 'portfolio').toLowerCase().replace(/\s+/g, '-')}-portfolio.html</span>
                                </div>
                                <iframe
                                    srcDoc={generatedHTML}
                                    style={{ width: '100%', height: '520px', border: 'none', display: 'block' }}
                                    title="Portfolio Preview"
                                    sandbox="allow-same-origin allow-scripts"
                                />
                            </div>
                        </div>
                    )}

                    {/* Empty state when no HTML yet */}
                    {!generatedHTML && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '360px', border: '2px dashed var(--border-color)', borderRadius: '16px', opacity: 0.5, textAlign: 'center', padding: '2rem' }}>
                            <Globe size={56} style={{ marginBottom: '1rem', color: '#6366f1' }} />
                            <h3 style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.4rem' }}>Your Portfolio Awaits</h3>
                            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', maxWidth: '240px' }}>Fill in your details on the left and click<br /><strong>Generate My Portfolio</strong></p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Portfolio;
