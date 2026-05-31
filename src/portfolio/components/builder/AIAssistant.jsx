import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Zap, RefreshCw, Check, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolio } from '../../context/PortfolioContext';
import { useUser } from '../../../context/UserContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { chatWithAI, buildDashboardPayload } from '../../services/ai';

const QUICK_CHIPS = [
    { emoji: '🔄', label: 'Sync Dashboard', prompt: 'Sync my profile information from my Daksh.AI dashboard to the portfolio.' },
    { emoji: '✍️', label: 'Improve Bio', prompt: 'Rewrite my bio to sound more professional and impactful.' },
    { emoji: '🎨', label: 'Suggest Theme', prompt: 'Based on my role and skills, which theme would look best for my portfolio?' },
    { emoji: '🚀', label: 'Add Project', prompt: 'Suggest an impressive project idea I should add to my portfolio based on my skills.' },
    { emoji: '🛠️', label: 'Optimize Skills', prompt: 'Review my current skills and suggest what I should add or remove for my target role.' },
];

const TypingDots = () => (
    <div className="typing-dots">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
    </div>
);

const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const AIAssistant = () => {
    const { state, aiMessages, setAiMessages, updatePersonalInfo, updateSectionData, updateTheme, bulkUpdatePortfolio } = usePortfolio();
    const { user: dashboardUser } = useUser();
    const { isDark } = useAppTheme();
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [aiMessages, isThinking]);

    const executeAction = (action) => {
        switch (action.type) {
            case 'UPDATE_PERSONAL_INFO': updatePersonalInfo(action.data); break;
            case 'UPDATE_SECTION_DATA': updateSectionData(action.sectionId, action.data); break;
            case 'ADD_PROJECT': {
                const current = state.sectionData['sec-projects'] || [];
                updateSectionData('sec-projects', [...current, { ...action.data, id: Date.now() }]);
                break;
            }
            case 'REMOVE_PROJECT': {
                const filtered = (state.sectionData['sec-projects'] || []).filter(p => p.id !== action.projectId);
                updateSectionData('sec-projects', filtered);
                break;
            }
            case 'UPDATE_THEME': updateTheme(action.data); break;
            case 'BULK_UPDATE': bulkUpdatePortfolio(action.data); break;
            default: console.warn('Unknown AI action:', action.type);
        }
    };

    const handleApprove = (msgIndex, actionIndex) => {
        const newMessages = [...aiMessages];
        const action = newMessages[msgIndex].actions[actionIndex];
        action.status = 'approved';
        executeAction(action);
        setAiMessages(newMessages);
    };

    const handleReject = (msgIndex, actionIndex) => {
        const newMessages = [...aiMessages];
        newMessages[msgIndex].actions[actionIndex].status = 'rejected';
        setAiMessages(newMessages);
    };

    const sendMessage = async (text) => {
        if (!text.trim() || isThinking) return;
        const userMsg = { role: 'user', content: text, timestamp: Date.now() };
        setAiMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
            const payload = buildDashboardPayload(dashboardUser);
            const rawResponse = await chatWithAI(text, state, payload);
            let parsed;
            try { parsed = JSON.parse(rawResponse); }
            catch { parsed = { message: rawResponse, actions: [] }; }

            const { message, actions } = parsed;
            const processedActions = (actions || []).map(action => {
                if (!action.requireApproval) { executeAction(action); return { ...action, status: 'approved' }; }
                return { ...action, status: 'pending' };
            });

            setAiMessages(prev => [...prev, {
                role: 'bot', content: message,
                actions: processedActions, timestamp: Date.now()
            }]);
        } catch (error) {
            setAiMessages(prev => [...prev, {
                role: 'bot',
                content: `I ran into an error: "${error.message}". Please check your API key or try again.`,
                timestamp: Date.now()
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="ai-assistant-wrap">
            {/* Header */}
            <div style={{
                padding: '9px 14px',
                borderBottom: '1px solid var(--pb-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--pb-bg-card)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.68rem', fontWeight: 800, color: 'var(--pb-accent)' }}>
                    <Sparkles size={12} /> AI CO-PILOT
                </div>
                <button
                    onClick={() => { if (window.confirm('Clear chat history?')) setAiMessages([{ role: 'bot', content: "Chat cleared. I'm ready to help!", timestamp: Date.now() }]); }}
                    style={{ background: 'none', border: 'none', color: 'var(--pb-text-muted)', fontSize: '0.62rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}
                >
                    <RefreshCw size={9} /> CLEAR
                </button>
            </div>

            {/* Messages — flex: 1 + min-height: 0 enables proper overflow scroll */}
            <div className="chat-messages" ref={scrollRef}>
                {aiMessages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`message-bubble ${msg.role === 'bot' ? 'bot-msg' : 'user-msg'}`}
                    >
                        <div style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: '50%',
                                background: msg.role === 'bot' ? 'var(--pb-accent-alpha)' : (isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.1)'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, color: msg.role === 'bot' ? 'var(--pb-accent)' : (isDark ? '#c7d2fe' : '#4338ca')
                            }}>
                                {msg.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                                        : 'var(--pb-bg-card)',
                                    border: msg.role === 'user' ? 'none' : '1px solid var(--pb-border-card)',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                                    padding: '10px 13px',
                                    fontSize: '0.83rem', lineHeight: 1.6,
                                    color: msg.role === 'user' ? '#fff' : 'var(--pb-text-primary)',
                                    wordBreak: 'break-word',
                                }}>
                                    {msg.content}
                                </div>
                                {msg.timestamp && (
                                    <div style={{ fontSize: '0.6rem', color: 'var(--pb-text-muted)', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                        {formatTime(msg.timestamp)}
                                    </div>
                                )}

                                {/* Action cards */}
                                {msg.actions?.map((action, ai) => (
                                    <motion.div key={ai} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            marginTop: 10,
                                            background: 'var(--pb-accent-alpha)',
                                            border: '1px solid var(--pb-accent-alpha)',
                                            borderRadius: 12, padding: '12px 14px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--pb-accent)' }}>
                                                <Zap size={10} /> Suggested Change
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--pb-text-primary)', marginBottom: 8 }}>
                                            {action.type.replace(/_/g, ' ')}
                                        </p>
                                        {action.status === 'pending' ? (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleApprove(i, ai)} style={{ flex: 1, padding: '7px', borderRadius: 8, background: '#4f46e5', border: 'none', color: '#fff', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                                    <Check size={10} /> Approve
                                                </button>
                                                <button onClick={() => handleReject(i, ai)} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--pb-text-secondary)', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                                    <X size={10} /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 800, padding: '6px', borderRadius: 8, background: action.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: action.status === 'approved' ? '#10b981' : '#ef4444' }}>
                                                {action.status === 'approved' ? '✓ Applied' : '✕ Rejected'}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isThinking && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--pb-accent-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pb-accent)', flexShrink: 0 }}>
                            <Bot size={14} />
                        </div>
                        <div style={{ background: 'var(--pb-bg-card)', border: '1px solid var(--pb-border-card)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px' }}>
                            <TypingDots />
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Chips — sticky bottom, flex-shrink: 0 */}
            <div className="quick-chips" style={{ flexShrink: 0 }}>
                {QUICK_CHIPS.map(chip => (
                    <button key={chip.label} className="quick-chip" onClick={() => sendMessage(chip.prompt)} disabled={isThinking}>
                        {chip.emoji} {chip.label}
                    </button>
                ))}
            </div>

            {/* Input box — sticky bottom, flex-shrink: 0 */}
            <div style={{
                padding: '10px 12px 13px',
                background: 'var(--pb-bg-sidebar)',
                borderTop: '1px solid var(--pb-border)',
                flexShrink: 0,
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--pb-bg-input)',
                    border: '1px solid var(--pb-border)',
                    borderRadius: 14, padding: '6px 6px 6px 13px',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                        placeholder="Ask AI anything about your portfolio..."
                        style={{
                            flex: 1, background: 'transparent', border: 'none',
                            outline: 'none', fontSize: '0.83rem',
                            color: 'var(--pb-text-primary)', padding: '4px 0',
                        }}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isThinking}
                        style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: input.trim() && !isThinking ? '#4f46e5' : 'var(--pb-bg-card)',
                            border: 'none',
                            cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: input.trim() && !isThinking ? '#fff' : 'var(--pb-text-muted)',
                            flexShrink: 0, transition: 'all 0.2s',
                        }}
                    >
                        <Send size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
