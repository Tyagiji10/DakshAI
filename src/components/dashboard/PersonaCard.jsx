import { Camera, Trash2, Github, Linkedin, Edit2, Check, X, Mail, Sparkles } from 'lucide-react';
import { useTilt } from '../../hooks/useTilt';

const PersonaCard = React.memo(({
    user,
    auth,
    fileInputRef,
    handlePhotoUpload,
    handleRemovePhoto,
    isEditingSocialLinks,
    setIsEditingSocialLinks,
    socialLinksRef,
    setUser,
    isEditingName,
    setIsEditingName,
    editNameValue,
    setEditNameValue,
    handleSaveName,
    isHoveringName,
    setIsHoveringName,
    activeFlash,
    handleBioChange
}) => {
    const tiltRef = useTilt();

    return (
        <div ref={tiltRef} className="glass-card tilt-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: '110px', background: 'linear-gradient(135deg, var(--primary-blue), var(--accent-green))', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
            </div>

            <div className="persona-content-wrapper">
                <div style={{ marginTop: '-65px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                        <div className="relative group" style={{ width: 'var(--profile-img-size, 130px)', height: 'var(--profile-img-size, 130px)' }}>
                            <img
                                src={user.photoURL || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Crect width='24' height='24' fill='%23f1f5f9'/%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E`}
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

                        {/* Social Links */}
                        <div ref={socialLinksRef} className="persona-social-links">
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
                                {user.github ? (
                                    <a href={user.github} target="_blank" rel="noreferrer" title="View GitHub" style={{ color: '#24292e', opacity: 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                        <Github size={22} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                    </a>
                                ) : (
                                    <Github size={22} style={{ color: '#6e7681', opacity: 0.4 }} title="No GitHub linked" />
                                )}

                                {user.linkedin ? (
                                    <a href={user.linkedin} target="_blank" rel="noreferrer" title="View LinkedIn" style={{ color: '#0077b5', opacity: 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                        <Linkedin size={22} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
                                    </a>
                                ) : (
                                    <Linkedin size={22} style={{ color: '#0077b5', opacity: 0.4 }} title="No LinkedIn linked" />
                                )}

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

                            {isEditingSocialLinks && (
                                <div className="fade-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: 'var(--primary-white)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--primary-blue)', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: '260px', animation: 'scaleUp 0.2s ease', zIndex: 100 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Update Links</h4>
                                        <div style={{ position: 'relative' }}>
                                            <Github size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input
                                                type="url"
                                                placeholder="GitHub Profile URL"
                                                value={user.github || ''}
                                                onChange={e => setUser({ ...user, github: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <Linkedin size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#0a66c2' }} />
                                            <input
                                                type="url"
                                                placeholder="LinkedIn Profile URL"
                                                value={user.linkedin || ''}
                                                onChange={e => setUser({ ...user, linkedin: e.target.value })}
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
                        <Mail size={14} style={{ color: 'var(--primary-blue)' }} /> {user.email || auth.currentUser?.email || 'Welcome to Daksh.AI'}
                    </p>
                </div>

                <div className={`mt-4 ${activeFlash === 'bio-section' ? 'highlight-flash' : ''}`} id="bio-section">
                    <label className="text-xs font-bold mb-2 uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                        Bio / About Me
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
    );
});

export default PersonaCard;
