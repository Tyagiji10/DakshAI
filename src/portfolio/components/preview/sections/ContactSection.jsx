import React, { useState } from 'react';
import { usePortfolio } from '../../../context/PortfolioContext';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { sanitizeTextColor, hexToRgb, getLuminance } from '../../../utils/colorUtils';

const ContactSection = ({ section, variant }) => {
    const { state } = usePortfolio();
    const contactData = state.sectionData[section.id] || {};
    let rawFormspreeId = contactData.formspreeId?.trim() || '';
    
    let formspreeId = rawFormspreeId;
    if (rawFormspreeId.includes('formspree.io/f/')) {
        formspreeId = rawFormspreeId.split('formspree.io/f/')[1].split(/[\\s"'/]/)[0];
    }
    
    const hasFormspree = !!formspreeId;

    const accent = state.theme.colors.accent;
    const isNeoBrutal = state.theme.id === 'neo-brutal';
    const isDesigner = variant === 'neo-designer';
    const isStartup = variant === 'glass-startup';
    const isHacker = variant === 'neo-hacker';
    const isMinimal = variant === 'glass-minimal';

    const cardBg = isNeoBrutal ? '#ffffff' : 'rgba(255, 255, 255, 0.03)';
    const cardBorder = isNeoBrutal ? '#000000' : 'rgba(255, 255, 255, 0.08)';
    const inputBg = isNeoBrutal ? '#f8fafc' : 'rgba(0, 0, 0, 0.2)';
    const inputBorder = isNeoBrutal ? '#000000' : 'rgba(255, 255, 255, 0.1)';

    // Helper to determine text color based on background luminance
    const getDynamicTextColor = (bgHex) => {
        if (!bgHex || !bgHex.startsWith('#')) return '#ffffff';
        const rgb = hexToRgb(bgHex);
        const luminance = getLuminance(...rgb);
        return luminance > 0.179 ? '#000000' : '#ffffff';
    };

    // Calculate effective backgrounds
    const baseBg = state.theme.background?.type === 'solid' 
        ? (state.theme.colors.background || '#0b0f19') 
        : (state.theme.background?.colors?.[0] || '#0b0f19');

    const effectiveCardBg = isNeoBrutal ? '#ffffff' : baseBg;
    const effectiveInputBg = isNeoBrutal ? '#f8fafc' : baseBg;

    const dynamicLabelColor = getDynamicTextColor(effectiveCardBg);
    const dynamicInputTextColor = getDynamicTextColor(effectiveInputBg);
    const dynamicPlaceholderColor = dynamicInputTextColor === '#000000' ? '#64748b' : '#94a3b8';

    const textColor = isNeoBrutal ? '#000000' : 'var(--theme-text)';
    const isExport = typeof window !== 'undefined' && window.__IS_EXPORT__;

    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formspreeId) {
            setErrorMessage('Contact form is not configured.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                setStatus('success');
                e.target.reset();
            } else {
                const data = await response.json().catch(() => ({}));
                if (data && data.errors) {
                    setErrorMessage(data.errors.map(err => err.message).join(', '));
                } else {
                    setErrorMessage('Unable to send message. Please try again later.');
                }
                setStatus('error');
            }
        } catch (error) {
            setErrorMessage('Unable to send message. Please try again later.');
            setStatus('error');
        }
    };

    return (
        <section id={section.id} className="portfolio-section" style={{ padding: 'clamp(4rem, 8cqw, 8rem) 0' }}>
            <div className="max-w-[1200px] mx-auto w-full px-6 lg:px-12 flex flex-col items-center gs_reveal">
                
                {/* Header */}
                <div style={{ width: '100%', textAlign: isMinimal || isStartup ? 'center' : 'left', marginBottom: '4rem' }}>
                    <h2 style={{
                        fontSize: isDesigner ? 'clamp(2.5rem, 5cqw, 4rem)' : 'clamp(1.6rem, 3.2cqw, 2.4rem)', 
                        fontWeight: 900, marginBottom: 16,
                        textTransform: isNeoBrutal ? 'uppercase' : 'none',
                        letterSpacing: isNeoBrutal ? '0.05em' : '0',
                        color: isHacker ? '#4ade80' : 'var(--theme-text)',
                        fontFamily: isHacker ? 'monospace' : 'inherit'
                    }}>
                        {isHacker ? '> ' : ''}{section.title}
                    </h2>
                    <div style={{ 
                        width: isDesigner ? 100 : 48, height: isDesigner ? 8 : 4, 
                        background: accent, borderRadius: 2, 
                        margin: isMinimal || isStartup ? '0 auto 24px' : '0 0 24px' 
                    }} />
                    <p style={{
                        fontSize: '1rem',
                        opacity: isNeoBrutal ? 1 : 0.7,
                        color: isHacker ? '#a3a3a3' : textColor,
                        maxWidth: 600,
                        margin: isMinimal || isStartup ? '0 auto' : '0',
                        fontFamily: isHacker ? 'monospace' : 'inherit'
                    }}>
                        Let's build something amazing together. Feel free to reach out.
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: isStartup ? 'column' : (isDesigner ? 'row-reverse' : 'row'),
                    gap: 40,
                    width: '100%',
                    flexWrap: 'wrap'
                }}>
                    
                    {/* Contact Info Cards */}
                    <div style={{ flex: 1, minWidth: 'min(100%, 300px)', display: 'flex', flexDirection: isStartup ? 'row' : 'column', gap: 20, flexWrap: 'wrap' }}>
                        {[
                            { icon: Mail, label: 'Email', value: contactData.email },
                            { icon: Phone, label: 'Phone', value: contactData.phone },
                            { icon: MapPin, label: 'Location', value: contactData.address }
                        ].filter(c => c.value).map((item, i) => (
                            <div key={i} className="gs_reveal gs_reveal_up" style={{
                                flex: isStartup ? 1 : 'none',
                                minWidth: 'min(100%, 250px)',
                                background: cardBg,
                                border: isNeoBrutal ? `3px solid ${cardBorder}` : `1px solid ${cardBorder}`,
                                padding: 24,
                                borderRadius: isNeoBrutal ? 0 : 16,
                                display: 'flex', alignItems: 'center', gap: 20,
                                boxShadow: isNeoBrutal ? `6px 6px 0 ${accent}` : 'none',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{
                                    width: 50, height: 50, borderRadius: isNeoBrutal ? 0 : 12,
                                    background: isNeoBrutal ? accent : `${accent}15`,
                                    border: isNeoBrutal ? '2px solid #000' : 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isNeoBrutal ? '#000' : accent
                                }}>
                                    <item.icon size={24} />
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isHacker ? '#4ade80' : (isNeoBrutal ? '#555' : accent), marginBottom: 4, fontFamily: isHacker ? 'monospace' : 'inherit' }}>
                                        {item.label}
                                    </h4>
                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: isHacker ? 'monospace' : 'inherit' }}>
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Form Container */}
                    {!hasFormspree ? null : (
                    <div className="gs_reveal gs_reveal_up" style={{
                        flex: isStartup ? 'none' : 2,
                        minWidth: 'min(100%, 320px)',
                        background: cardBg,
                        border: isNeoBrutal ? `4px solid ${cardBorder}` : `1px solid ${cardBorder}`,
                        padding: isDesigner ? 40 : 32,
                        borderRadius: isNeoBrutal ? 0 : 24,
                        boxShadow: isNeoBrutal && isDesigner ? `12px 12px 0 ${accent}` : (isNeoBrutal ? `8px 8px 0 ${accent}` : '0 20px 40px rgba(0,0,0,0.2)')
                    }}>
                        {status === 'success' ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                <CheckCircle size={64} color="#4ade80" style={{ margin: '0 auto 20px' }} />
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: textColor, marginBottom: 10 }}>Message Sent!</h3>
                                <p style={{ opacity: 0.7, color: textColor, marginBottom: 30 }}>I'll get back to you soon.</p>
                                <button onClick={() => setStatus('idle')} style={{
                                    padding: '12px 24px', background: 'transparent', border: `2px solid ${accent}`, color: accent,
                                    borderRadius: isNeoBrutal ? 0 : 8, fontWeight: 700, cursor: 'pointer'
                                }}>Send Another</button>
                            </div>
                        ) : (
                            <form action={`https://formspree.io/f/${formspreeId}`} method="POST" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                                
                                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 'min(100%, 200px)' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, color: dynamicLabelColor, fontFamily: isHacker ? 'monospace' : 'inherit' }}>Name</label>
                                        <input name="name" placeholder="Your Name" required style={{
                                            width: '100%', padding: 14, background: inputBg, border: `2px solid ${inputBorder}`,
                                            borderRadius: isNeoBrutal ? 0 : 8, color: dynamicInputTextColor, fontSize: '0.9rem', fontFamily: isHacker ? 'monospace' : 'inherit',
                                            '--tw-placeholder-color': dynamicPlaceholderColor
                                        }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 'min(100%, 200px)' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, color: dynamicLabelColor, fontFamily: isHacker ? 'monospace' : 'inherit' }}>Email</label>
                                        <input name="email" type="email" placeholder="hello@example.com" required style={{
                                            width: '100%', padding: 14, background: inputBg, border: `2px solid ${inputBorder}`,
                                            borderRadius: isNeoBrutal ? 0 : 8, color: dynamicInputTextColor, fontSize: '0.9rem', fontFamily: isHacker ? 'monospace' : 'inherit',
                                            '--tw-placeholder-color': dynamicPlaceholderColor
                                        }} />
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, color: dynamicLabelColor, fontFamily: isHacker ? 'monospace' : 'inherit' }}>Message</label>
                                    <textarea name="message" placeholder="How can I help you?" required rows={5} style={{
                                        width: '100%', padding: 14, background: inputBg, border: `2px solid ${inputBorder}`,
                                        borderRadius: isNeoBrutal ? 0 : 8, color: dynamicInputTextColor, fontSize: '0.9rem', resize: 'vertical', fontFamily: isHacker ? 'monospace' : 'inherit',
                                        '--tw-placeholder-color': dynamicPlaceholderColor
                                    }} />
                                </div>

                                {status === 'error' && (
                                    <div style={{ padding: 12, background: 'rgba(248,113,113,0.1)', color: '#f87171', borderRadius: 8, fontSize: '0.85rem' }}>
                                        {errorMessage}
                                    </div>
                                )}

                                <button type="submit" disabled={status === 'loading'} style={{
                                    padding: '16px 32px', background: isHacker ? '#4ade80' : accent, color: isHacker ? '#000' : '#fff',
                                    border: isNeoBrutal ? '3px solid #000' : 'none',
                                    borderRadius: isNeoBrutal ? 0 : 8, fontSize: '1rem', fontWeight: 800,
                                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                    marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    boxShadow: isNeoBrutal ? '4px 4px 0 #000' : `0 10px 20px ${accent}40`,
                                    fontFamily: isHacker ? 'monospace' : 'inherit'
                                }}>
                                    {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : <><Send size={20} /> Send Message</>}
                                </button>
                            </form>
                        )}
                    </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
