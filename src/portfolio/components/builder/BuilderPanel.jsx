import React, { useState, useRef } from 'react';
import { usePortfolio, THEME_PRESETS } from '../../context/PortfolioContext';
import { Layers, Paintbrush, Bot, User, ChevronLeft, Download, Github, Linkedin, Twitter, Globe, Upload, Check, Trash2, Link, CloudUpload, Image } from 'lucide-react';
import SectionList from './SectionList';
import AIAssistant from './AIAssistant';
import SectionEditor from './SectionEditor';
import { downloadPortfolioZip } from '../../services/export';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppTheme } from '../../hooks/useAppTheme';
import useDashboardSync from '../../hooks/useDashboardSync';

/* ── Theme card mini-previews ─────────────────────────── */
const THEME_PREVIEWS = {
    'glassmorphic': (
        <div style={{ height: '100%', background: 'linear-gradient(135deg, #0B0F19 0%, #1e1b4b 100%)', display: 'flex', flexDirection: 'column', padding: 8, gap: 4 }}>
            <div style={{ height: 8, width: '60%', borderRadius: 4, background: 'rgba(99,102,241,0.7)' }} />
            <div style={{ height: 5, width: '40%', borderRadius: 4, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />)}
            </div>
        </div>
    ),
    'neo-brutal': (
        <div style={{ height: '100%', background: '#000', display: 'flex', flexDirection: 'column', padding: 8, gap: 4 }}>
            <div style={{ height: 10, width: '70%', borderRadius: 0, background: '#facc15', border: '2px solid #fff' }} />
            <div style={{ height: 5, width: '45%', borderRadius: 0, background: '#fff' }} />
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {[1, 2].map(i => <div key={i} style={{ flex: 1, height: 18, border: '2px solid #fff', boxShadow: '3px 3px 0 #facc15' }} />)}
            </div>
        </div>
    )
};

/* ── Profile Tab ──────────────────────────────────────── */
const ProfileTab = () => {
    const { state, updatePersonalInfo, updateSocialLinks } = usePortfolio();
    const { personalInfo } = state;
    const { isDark } = useAppTheme();
    const { autoFillProfile, autoFillSocialLinks } = useDashboardSync();
    const fileRef = useRef(null);
    const [photoTab, setPhotoTab] = useState('upload');
    const [photoUrlInput, setPhotoUrlInput] = useState('');

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 1.5 * 1024 * 1024) {
            alert('Image too large. Please use an image under 1.5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => updatePersonalInfo({ avatarUrl: reader.result });
        reader.readAsDataURL(file);
    };

    return (
        <div className="editor-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pb-text-secondary)' }}>Basic Details</span>
                <button
                    onClick={async () => {
                        await autoFillProfile();
                        await autoFillSocialLinks();
                    }}
                    style={{ background: 'var(--pb-accent-alpha)', color: 'var(--pb-accent)', border: '1px solid var(--pb-accent-alpha)', padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--pb-accent-alpha)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--pb-accent-alpha)'}
                >
                    <Bot size={12} /> Auto-fill from Dashboard
                </button>
            </div>

            {/* Avatar Section */}
            <div className="input-group" style={{ marginBottom: 24 }}>
                <label style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', fontWeight: 800, color: 'var(--pb-text-secondary)', marginBottom: 12, display: 'block' }}>Profile Photo</label>

                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

                    {/* Left: Avatar Preview & Remove */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 96, height: 96, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #818cf8, #a78bfa, #34d399)',
                            padding: 3,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{
                                width: '100%', height: '100%', borderRadius: '50%',
                                background: isDark ? '#1e293b' : '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {personalInfo.avatarUrl
                                    ? <img src={personalInfo.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <User size={40} color="var(--pb-text-muted)" />
                                }
                            </div>
                        </div>

                        <button
                            onClick={() => updatePersonalInfo({ avatarUrl: '' })}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', background: 'transparent', border: '1px solid var(--pb-border)',
                                borderRadius: 8, color: 'var(--pb-text-secondary)', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--pb-text-secondary)'; e.currentTarget.style.borderColor = 'var(--pb-border)'; }}
                        >
                            <Trash2 size={12} /> Remove
                        </button>
                    </div>

                    {/* Right: Upload / URL Tabs */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

                        {/* Tab Switcher */}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => setPhotoTab('upload')}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    padding: '6px 8px', background: photoTab === 'upload' ? 'var(--pb-accent-alpha)' : 'transparent',
                                    border: `1px solid ${photoTab === 'upload' ? 'var(--pb-accent)' : 'var(--pb-border)'}`,
                                    borderRadius: 8, color: photoTab === 'upload' ? 'var(--pb-accent)' : 'var(--pb-text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
                                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                                }}
                            >
                                <Upload size={14} /> Upload
                            </button>
                            <button
                                onClick={() => setPhotoTab('url')}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    padding: '6px 8px', background: photoTab === 'url' ? 'var(--pb-accent-alpha)' : 'transparent',
                                    border: `1px solid ${photoTab === 'url' ? 'var(--pb-accent)' : 'var(--pb-border)'}`,
                                    borderRadius: 8, color: photoTab === 'url' ? 'var(--pb-accent)' : 'var(--pb-text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
                                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                                }}
                            >
                                <Link size={14} /> Photo URL
                            </button>
                        </div>

                        {/* Tab Content */}
                        {photoTab === 'upload' ? (
                            <div
                                style={{
                                    border: '1px dashed var(--pb-accent)', borderRadius: 12, padding: '16px 12px', background: 'var(--pb-accent-alpha)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                    cursor: 'pointer', position: 'relative', textAlign: 'center'
                                }}
                                onClick={() => fileRef.current?.click()}
                            >
                                <input type="file" accept="image/*" onChange={handleAvatarUpload} ref={fileRef} style={{ display: 'none' }} />
                                <CloudUpload size={20} color="var(--pb-accent)" style={{ marginBottom: 2 }} />
                                <div style={{ fontSize: '0.8rem', color: 'var(--pb-text-primary)', fontWeight: 600, lineHeight: 1.3 }}>
                                    Drop your photo here <br /><span style={{ color: 'var(--pb-accent)', fontWeight: 400, fontSize: '0.75rem' }}>or browse files</span>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--pb-text-secondary)', background: 'var(--pb-bg-input)', border: '1px solid var(--pb-border)', padding: '2px 8px', borderRadius: 20, marginTop: 2 }}>
                                    JPG or PNG · Max 1.5 MB
                                </div>
                            </div>
                        ) : (
                            <div style={{ border: '1px solid var(--pb-border)', borderRadius: 12, padding: '12px 16px', background: 'var(--pb-bg-card)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--pb-text-secondary)', marginBottom: 8, margin: '0 0 8px 0' }}>Paste a direct image URL to use as your profile photo.</p>
                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--pb-bg-input)', border: '1px solid var(--pb-border)', borderRadius: 8, padding: '0 10px', marginBottom: 10 }}>
                                    <Image size={14} color="var(--pb-text-muted)" />
                                    <input
                                        type="url"
                                        value={photoUrlInput}
                                        onChange={e => setPhotoUrlInput(e.target.value)}
                                        placeholder="https://example.com/photo.jpg"
                                        style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px', color: 'var(--pb-text-primary)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                </div>
                                <button
                                    onClick={() => { if (photoUrlInput) updatePersonalInfo({ avatarUrl: photoUrlInput }); }}
                                    style={{ width: '100%', padding: '8px', background: 'var(--pb-accent)', color: 'var(--pb-accent-text)', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--pb-accent-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--pb-accent)'}
                                >
                                    <Check size={14} /> Apply photo
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <div className="input-group">
                <label>Full Name</label>
                <input type="text" value={personalInfo.fullName || ''} onChange={e => updatePersonalInfo({ fullName: e.target.value })} placeholder="Jane Smith" />
            </div>
            <div className="input-group">
                <label>Headline / Role</label>
                <input type="text" value={personalInfo.headline || ''} onChange={e => updatePersonalInfo({ headline: e.target.value })} placeholder="Full-Stack Engineer" />
            </div>
            <div className="input-group">
                <label>Bio / About</label>
                <textarea rows={4} value={personalInfo.bio || ''} onChange={e => updatePersonalInfo({ bio: e.target.value })} placeholder="Tell your story in a few sentences..." />
            </div>

            <div className="section-divider"><span>Social Links</span></div>

            <div className="social-links-grid">
                {[
                    { key: 'github', icon: <Github size={14} />, placeholder: 'github.com/username' },
                    { key: 'linkedin', icon: <Linkedin size={14} />, placeholder: 'linkedin.com/in/username' },
                    { key: 'twitter', icon: <Twitter size={14} />, placeholder: 'twitter.com/username' },
                    { key: 'website', icon: <Globe size={14} />, placeholder: 'yourwebsite.com' },
                ].map(({ key, icon, placeholder }) => (
                    <div key={key} className="social-link-row">
                        <div className="social-link-icon">{icon}</div>
                        <input
                            type="text"
                            style={{ flex: 1, background: 'var(--pb-bg-input)', border: '1px solid var(--pb-border)', borderRadius: 8, padding: '9px 12px', color: 'var(--pb-text-primary)', fontSize: '0.82rem', outline: 'none', transition: 'var(--pb-transition)' }}
                            value={personalInfo.socialLinks?.[key] || ''}
                            onChange={e => updateSocialLinks({ [key]: e.target.value })}
                            placeholder={placeholder}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ── Design Tab ───────────────────────────────────────── */
const DesignTab = () => {
    const { state, applyThemePreset, updateThemeColors, updateTheme } = usePortfolio();
    const accent = state.theme.colors.accent;

    return (
        <div>
            {/* Info banner — clear separation */}
            <div style={{
                background: 'var(--pb-accent-alpha)',
                border: '1px solid var(--pb-accent-alpha)',
                borderRadius: 10, padding: '10px 13px',
                marginBottom: 18, display: 'flex', gap: 8, alignItems: 'flex-start'
            }}>
                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>🎨</span>
                <p style={{ fontSize: '0.72rem', lineHeight: 1.55, color: 'var(--pb-text-secondary)', margin: 0 }}>
                    These settings style your <strong style={{ color: 'var(--pb-accent)' }}>portfolio preview</strong> only.
                    The builder sidebar always follows the app's dark / light mode.
                </p>
            </div>

            <p className="view-subtitle">Portfolio Theme</p>
            <div className="theme-cards-grid">
                {Object.entries(THEME_PRESETS).map(([id, preset]) => (
                    <div
                        key={id}
                        className={`theme-card ${state.theme.id === id ? 'active' : ''}`}
                        onClick={() => applyThemePreset(id)}
                    >
                        <div className="theme-card-preview">
                            {THEME_PREVIEWS[id]}
                        </div>
                        <div className="theme-card-footer">
                            <p className="theme-card-name">{preset.name}</p>
                            <p className="theme-card-desc">{preset.description}</p>
                        </div>
                        {state.theme.id === id && <span className="active-badge"><Check size={8} style={{ display: 'inline' }} /> Active</span>}
                    </div>
                ))}
            </div>

            {state.theme.id && THEME_PRESETS[state.theme.id]?.variants && (
                <>
                    <p className="view-subtitle" style={{ marginTop: 20 }}>Theme Variant</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {THEME_PRESETS[state.theme.id].variants.map(variant => (
                            <button
                                key={variant.id}
                                style={{
                                    padding: '12px 14px', borderRadius: 8, textAlign: 'left',
                                    background: state.theme.variant === variant.id ? 'rgba(99,102,241,0.1)' : 'var(--pb-bg-input)',
                                    border: `1px solid ${state.theme.variant === variant.id ? '#818cf8' : 'var(--pb-border)'}`,
                                    color: 'var(--pb-text-primary)', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', gap: 4
                                }}
                                onClick={() => updateTheme({ variant: variant.id })}
                            >
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{variant.label}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--pb-text-secondary)' }}>{variant.desc}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}

            <p className="view-subtitle" style={{ marginTop: 20 }}>Typography</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[
                    { id: "'Inter', sans-serif", label: 'Modern Sans (Inter)' },
                    { id: "'Poppins', sans-serif", label: 'Professional (Poppins)' },
                    { id: "'Montserrat', sans-serif", label: 'Elegant (Montserrat)' }
                ].map(font => (
                    <button
                        key={font.id}
                        style={{
                            padding: '10px 14px', borderRadius: 8, textAlign: 'left',
                            background: state.theme.fontFamily === font.id ? 'rgba(99,102,241,0.1)' : 'var(--pb-bg-input)',
                            border: `1px solid ${state.theme.fontFamily === font.id ? '#818cf8' : 'var(--pb-border)'}`,
                            color: 'var(--pb-text-primary)', cursor: 'pointer', fontFamily: font.id
                        }}
                        onClick={() => updateTheme({ fontFamily: font.id })}
                    >
                        {font.label}
                    </button>
                ))}
            </div>

            <p className="view-subtitle">Background</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, background: 'var(--pb-bg-input)', padding: 16, borderRadius: 8, border: '1px solid var(--pb-border)' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: state.theme.background?.type === 'solid' ? '#818cf8' : 'var(--pb-bg)', color: state.theme.background?.type === 'solid' ? '#fff' : 'var(--pb-text-primary)', cursor: 'pointer' }}
                        onClick={() => updateTheme({ background: { ...state.theme.background, type: 'solid' } })}
                    >Solid</button>
                    <button
                        style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: state.theme.background?.type === 'gradient' ? '#818cf8' : 'var(--pb-bg)', color: state.theme.background?.type === 'gradient' ? '#fff' : 'var(--pb-text-primary)', cursor: 'pointer' }}
                        onClick={() => updateTheme({ background: { ...state.theme.background, type: 'gradient' } })}
                    >Gradient</button>
                </div>

                {state.theme.background?.type === 'solid' ? (
                    <div className="color-picker-wrap">
                        <input type="color" value={state.theme.colors.background || '#000000'} onChange={e => updateThemeColors({ background: e.target.value })} />
                        <span style={{ fontSize: '0.76rem', color: 'var(--pb-text-muted)', fontFamily: 'monospace' }}>{state.theme.colors.background}</span>
                        <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: state.theme.colors.background, border: '2px solid var(--pb-border)' }} />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--pb-text-secondary)', width: 50 }}>Color 1</span>
                            <div className="color-picker-wrap" style={{ flex: 1 }}>
                                <input type="color" value={state.theme.background?.colors?.[0] || '#0B0F19'} onChange={e => updateTheme({ background: { ...state.theme.background, colors: [e.target.value, state.theme.background?.colors?.[1] || '#1e1b4b'] } })} />
                                <span style={{ fontSize: '0.76rem', color: 'var(--pb-text-muted)', fontFamily: 'monospace' }}>{state.theme.background?.colors?.[0] || '#0B0F19'}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--pb-text-secondary)', width: 50 }}>Color 2</span>
                            <div className="color-picker-wrap" style={{ flex: 1 }}>
                                <input type="color" value={state.theme.background?.colors?.[1] || '#1e1b4b'} onChange={e => updateTheme({ background: { ...state.theme.background, colors: [state.theme.background?.colors?.[0] || '#0B0F19', e.target.value] } })} />
                                <span style={{ fontSize: '0.76rem', color: 'var(--pb-text-muted)', fontFamily: 'monospace' }}>{state.theme.background?.colors?.[1] || '#1e1b4b'}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--pb-text-secondary)', width: 50 }}>Angle</span>
                            <select
                                style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid var(--pb-border)', background: 'var(--pb-bg)', color: 'var(--pb-text-primary)' }}
                                value={state.theme.background?.direction || '135deg'}
                                onChange={e => updateTheme({ background: { ...state.theme.background, direction: e.target.value } })}
                            >
                                <option value="to bottom">Top to Bottom</option>
                                <option value="to right">Left to Right</option>
                                <option value="135deg">Diagonal (135°)</option>
                                <option value="45deg">Diagonal (45°)</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            <button onClick={() => updateTheme({ background: { type: 'gradient', direction: '135deg', colors: ['#0B0F19', '#1e1b4b'] } })} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--pb-border)', background: 'var(--pb-bg)', cursor: 'pointer', color: 'var(--pb-text-primary)' }}>Dark Blue</button>
                            <button onClick={() => updateTheme({ background: { type: 'gradient', direction: '135deg', colors: ['#111827', '#000000'] } })} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--pb-border)', background: 'var(--pb-bg)', cursor: 'pointer', color: 'var(--pb-text-primary)' }}>Midnight</button>
                            <button onClick={() => updateTheme({ background: { type: 'gradient', direction: '135deg', colors: ['#f97316', '#db2777'] } })} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--pb-border)', background: 'var(--pb-bg)', cursor: 'pointer', color: 'var(--pb-text-primary)' }}>Sunset</button>
                            <button onClick={() => updateTheme({ background: { type: 'gradient', direction: '135deg', colors: ['#047857', '#06b6d4'] } })} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--pb-border)', background: 'var(--pb-bg)', cursor: 'pointer', color: 'var(--pb-text-primary)' }}>Ocean</button>
                        </div>
                    </div>
                )}
            </div>

            <p className="view-subtitle">Portfolio Accent Color</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Preset swatches from the current theme */}
                <div className="accent-presets">
                    {(THEME_PRESETS[state.theme.id]?.accentPresets || []).map(color => (
                        <div
                            key={color}
                            className={`accent-swatch ${accent === color ? 'active' : ''}`}
                            style={{ background: color }}
                            onClick={() => updateThemeColors({ accent: color })}
                            title={color}
                        />
                    ))}
                </div>

                {/* Custom color picker */}
                <div className="color-picker-wrap">
                    <input
                        type="color"
                        value={accent}
                        onChange={e => updateThemeColors({ accent: e.target.value })}
                    />
                    <span style={{ fontSize: '0.76rem', color: 'var(--pb-text-muted)', fontFamily: 'monospace' }}>{accent}</span>
                    <div style={{
                        marginLeft: 'auto', width: 20, height: 20,
                        borderRadius: '50%', background: accent,
                        border: '2px solid var(--pb-border)', flexShrink: 0
                    }} />
                </div>

                {/* Live preview badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                    <span style={{ fontSize: '0.62rem', color: 'var(--pb-text-muted)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Changes reflect live in preview
                    </span>
                </div>
            </div>
        </div>
    );
};

/* ── Main BuilderPanel ────────────────────────────────── */
const BuilderPanel = () => {
    const { state } = usePortfolio();
    const [activeTab, setActiveTab] = useState('profile');
    const [editingSection, setEditingSection] = useState(null);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <User size={13} /> },
        { id: 'content', label: 'Content', icon: <Layers size={13} /> },
        { id: 'design', label: 'Design', icon: <Paintbrush size={13} /> },
        { id: 'ai', label: 'AI', icon: <Bot size={13} /> },
    ];

    const renderContent = () => {
        if (editingSection) {
            return (
                <div className="edit-view">
                    <button className="back-btn" onClick={() => setEditingSection(null)}>
                        <ChevronLeft size={15} /> Back to Sections
                    </button>
                    <div className="edit-header">
                        <h3>Edit {editingSection.title}</h3>
                        <p style={{ color: 'var(--pb-text-muted)', fontSize: '0.75rem' }}>Changes reflect live in the preview.</p>
                    </div>
                    <SectionEditor section={editingSection} />
                </div>
            );
        }

        switch (activeTab) {
            case 'profile': return <ProfileTab />;
            case 'content': return (
                <div>
                    <div className="view-header">
                        <p className="view-subtitle" style={{ marginBottom: 0 }}>Active Sections</p>
                    </div>
                    <SectionList onEditSection={setEditingSection} />
                </div>
            );
            case 'design': return <DesignTab />;
            case 'ai': return <AIAssistant />;
            default: return null;
        }
    };

    const isAiTab = activeTab === 'ai' && !editingSection;

    return (
        <div className="builder-panel-inner">
            <header className="builder-header">
                {!editingSection && (
                    <div className="tabs">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                className={`tab ${activeTab === t.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(t.id)}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* AI tab renders outside builder-content so it controls its own scroll + sticky input */}
            {isAiTab ? (
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <AIAssistant />
                </div>
            ) : (
                <>
                    <div className="builder-content">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={editingSection ? `edit-${editingSection.id}` : activeTab}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.15 }}
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <footer className="builder-footer">
                        <button className="export-btn" onClick={() => downloadPortfolioZip(state)}>
                            <Download size={15} /> Export Portfolio
                        </button>
                    </footer>
                </>
            )}
        </div>
    );
};

export default BuilderPanel;
