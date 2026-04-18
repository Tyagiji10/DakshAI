import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { conductInterviewStep, getInterviewQuestionBank } from '../lib/ai';
import { MessageSquare, Send, Loader2, Award, Zap, AlertCircle, RefreshCcw, Clock, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { haptic } from '../lib/haptics';
import './InterviewPrep.css';

const InterviewPrep = () => {
    const { user } = useUser();
    const [status, setStatus] = useState('welcome');
    const [difficulty, setDifficulty] = useState('Medium');
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [scorecard, setScorecard] = useState(null);
    const [questionBank, setQuestionBank] = useState([]);
    const [timeLeft, setTimeLeft] = useState(30 * 60);

    // Voice & TTS state
    const [isMuted, setIsMuted] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceMode, setVoiceMode] = useState(false); // full auto-turn-based voice mode
    const [interviewLang, setInterviewLang] = useState('en');

    const timerRef = useRef(null);
    const chatEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const accumulatedTranscriptRef = useRef(''); // used to prevent mobile STT duplicate streams
    const silenceTimerRef = useRef(null);  // auto-send after user silence
    const synthRef = useRef(window.speechSynthesis);
    const voiceModeRef = useRef(false);    // ref so callbacks always read latest value
    const messagesRef = useRef([]);        // always holds latest messages to avoid stale closure

    // ── Scroll to bottom ───────────────────────────────────────────────────────
    const scrollToBottom = () => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (status === 'in-progress') scrollToBottom();
        messagesRef.current = messages; // keep ref in sync with state
    }, [messages, loading, status]);

    // ── 30-min countdown timer ─────────────────────────────────────────────────
    useEffect(() => {
        if (status === 'in-progress') {
            setTimeLeft(30 * 60);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setStatus('end');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [status]);

    // ── Cleanup speech on unmount ──────────────────────────────────────────────
    useEffect(() => {
        return () => {
            synthRef.current?.cancel();
            recognitionRef.current?.stop();
            clearTimeout(silenceTimerRef.current);
        };
    }, []);

    // Keep voiceModeRef in sync with voiceMode state (so closures inside STT can read it)
    useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

    // ── Voice Discovery ────────────────────────────────────────────────────────
    useEffect(() => {
        const updateVoices = () => {
            const available = synthRef.current?.getVoices() || [];
            if (available.length > 0) setVoices(available);
        };
        updateVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const timerColor = timeLeft <= 300 ? '#ef4444' : timeLeft <= 600 ? '#f59e0b' : '#10b981';

    // ── Text-to-Speech ─────────────────────────────────────────────────────────
    // ── Interview Logic ────────────────────────────────────────────────────────
    const handleAutoSend = useCallback(async (text) => {
        if (!text?.trim() || loading) return;
        synthRef.current?.cancel();
        setInputValue('');
        const userMsg = { role: 'user', content: text };
        const latestMessages = messagesRef.current;
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        try {
            const history = [...latestMessages, userMsg];
            const response = await conductInterviewStep(history, user.targetJob || 'Software Developer', difficulty, questionBank);
            
            if (response.language) {
                setInterviewLang(response.language);
            }

            if (response.isEnd) {
                setScorecard(response.scorecard);
                setStatus('end');
                setMessages(prev => [...prev, { role: 'ai', content: 'Interview complete. Reviewing your performance...' }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: response.question || 'Interesting. Could you elaborate?' }]);
            }
        } catch (err) {
            console.error('Chat Error:', err);
            setMessages(prev => [...prev, { role: 'ai', content: 'Connection lost. Please check your internet or retry.' }]);
        } finally {
            setLoading(false);
        }
    }, [user, difficulty, questionBank, loading]);

    const handleSendWithText = useCallback(async (text) => {
        if (!text?.trim() || loading) return;
        synthRef.current?.cancel();

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setLoading(true);

        try {
            const history = [...messagesRef.current, userMsg];
            const response = await conductInterviewStep(history, user.targetJob || 'Software Developer', difficulty, questionBank);
            
            if (response.language) {
                setInterviewLang(response.language);
            }

            if (response.isEnd) {
                setScorecard(response.scorecard);
                setStatus('end');
                setMessages(prev => [...prev, { role: 'ai', content: 'Interview complete. Reviewing your performance...' }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: response.question || 'Interesting. Could you elaborate?' }]);
            }
        } catch (err) {
            console.error('Chat Error:', err);
            setMessages(prev => [...prev, { role: 'ai', content: 'Connection lost. Please check your internet or retry.' }]);
        } finally {
            setLoading(false);
        }
    }, [user, difficulty, questionBank, loading]);


    // ── STT Logic ──────────────────────────────────────────────────────────────
    const startListeningForUser = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        recognitionRef.current?.stop();
        clearTimeout(silenceTimerRef.current);
        accumulatedTranscriptRef.current = '';

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = interviewLang === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onresult = (event) => {
            let interim = '';
            let newlyFinalized = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) newlyFinalized += t;
                else interim += t;
            }

            if (newlyFinalized) accumulatedTranscriptRef.current += newlyFinalized;
            
            const currentFullText = accumulatedTranscriptRef.current + interim;
            setInputValue(currentFullText);

            clearTimeout(silenceTimerRef.current);
            if (accumulatedTranscriptRef.current.trim()) {
                silenceTimerRef.current = setTimeout(() => {
                    recognition.stop();
                    setIsListening(false);
                    const answer = accumulatedTranscriptRef.current.trim();
                    if (answer) {
                        setInputValue('');
                        handleAutoSend(answer);
                    }
                }, 2000);
            }
        };

        recognition.onerror = (e) => {
            console.error('STT error:', e.error);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        setInputValue('');
    }, [interviewLang, handleAutoSend]);

    // ── TTS Logic ──────────────────────────────────────────────────────────────
    const speak = useCallback((text) => {
        if (isMuted || !text || !synthRef.current) return;

        recognitionRef.current?.stop();
        clearTimeout(silenceTimerRef.current);
        setIsListening(false);

        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Target Male voices precisely (using the populated voices state)
        const isHindiText = interviewLang === 'hi';
        
        const maleVoice = voices.find(v => {
            const lowName = v.name.toLowerCase();
            const isIndianOrHindi = v.lang.includes('IN') || v.lang.includes('hi');
            const hasMaleKeyword = lowName.includes('male') || lowName.includes('rishi') || lowName.includes('hemant') || lowName.includes('david') || lowName.includes('google uk english male');
            
            if (isHindiText) {
                return (v.lang.startsWith('hi') || lowName.includes('hindi')) && hasMaleKeyword;
            }
            return isIndianOrHindi && hasMaleKeyword;
        }) || voices.find(v => {
            // Fallback 1: Any Hindi voice if text is Hindi
            if (isHindiText) return v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi');
            // Fallback 2: Any Indian English voice
            return v.lang.includes('IN');
        });

        if (maleVoice) {
            utterance.voice = maleVoice;
            utterance.lang = maleVoice.lang;
        } else {
            // Final fallback: Set correct lang code so browser might auto-pick
            utterance.lang = isHindiText ? 'hi-IN' : 'en-IN';
        }

        utterance.rate = 1.0;
        // Deepen pitch if we think the voice might be female to simulate a male tone
        const name = maleVoice?.name.toLowerCase() || "";
        const isExplicitlyMale = name.includes('male') || name.includes('rishi') || name.includes('hemant');
        utterance.pitch = isExplicitlyMale ? 1.0 : 0.85; 

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (voiceModeRef.current) {
                setTimeout(() => startListeningForUser(), 400);
            }
        };
        utterance.onerror = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    }, [isMuted, interviewLang, voices, startListeningForUser]);

    // Speak whenever a new AI message arrives
    useEffect(() => {
        if (status !== 'in-progress') return;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.role === 'ai') speak(lastMsg.content);
    }, [messages, speak, status]);

    const toggleMute = () => {
        haptic.light();
        if (!isMuted) synthRef.current?.cancel();
        setIsMuted(prev => !prev);
        setIsSpeaking(false);
    };

    const toggleVoiceMode = () => {
        haptic.light();
        const next = !voiceMode;
        setVoiceMode(next);
        voiceModeRef.current = next;
        if (!next) {
            recognitionRef.current?.stop();
            clearTimeout(silenceTimerRef.current);
            setIsListening(false);
        }
    };

    const toggleVoiceManual = () => {
        haptic.medium();
        if (isListening) {
            recognitionRef.current?.stop();
            clearTimeout(silenceTimerRef.current);
            setIsListening(false);
        } else {
            if (!voiceModeRef.current) {
                setVoiceMode(true);
                voiceModeRef.current = true;
            }
            startListeningForUser();
        }
    };

    const startInterview = async () => {
        if (!user || !user.targetJob) return;
        haptic.medium();
        setStatus('in-progress');
        setLoading(true);
        try {
            const bank = await getInterviewQuestionBank(user.targetJob || 'Software Developer', difficulty);
            setQuestionBank(bank);
            const initialMsg = {
                role: 'user',
                content: `Hi, I am ready for the ${difficulty} level interview for the ${user.targetJob || 'Software Developer'} role.`
            };
            const response = await conductInterviewStep([initialMsg], user.targetJob || 'Software Developer', difficulty, bank);
            if (response.language) {
                setInterviewLang(response.language);
            }
            setMessages([{ role: 'ai', content: response.question || bank[0] || 'Hello! Tell me about yourself?' }]);
        } catch (err) {
            console.error('Interview Start Error:', err);
            setMessages([{ role: 'ai', content: `Error: ${err.message || 'The AI recruiter is currently unavailable.'}` }]);
            haptic.error();
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        haptic.light();
        handleSendWithText(inputValue);
    };

    // ── Render: Welcome ────────────────────────────────────────────────────────
    const renderWelcome = () => (
        <div className="flex flex-col items-center justify-center text-center py-10 max-w-2xl mx-auto">
            <div className="pulse-avatar mb-8">
                <MessageSquare size={30} />
            </div>
            <h1 className="text-4xl font-black mb-4 w-full text-center" style={{ color: 'var(--text-dark)', textAlign: 'center', width: '100%', display: 'block' }}>
                AI Mock Interview
            </h1>
            <p className="text-lg w-full text-center" style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '3.5rem', textAlign: 'center', width: '100%', display: 'block' }}>
                Hone your skills with a realistic, role-specific interview conducted by our AI recruiter. Receive instant feedback and scoring.
            </p>

            <div className="glass-card w-full p-8" style={{ background: 'var(--primary-white)', marginBottom: '3rem', borderRadius: '24px', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                <h3 className="font-black uppercase mb-8"
                    style={{
                        color: 'var(--primary-blue)',
                        textAlign: 'center',
                        display: 'block',
                        width: '100%',
                        fontSize: '1.3rem',
                        letterSpacing: '0.15em',
                        animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}>
                    Select Difficulty
                </h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {['Easy', 'Medium', 'Hard'].map(d => {
                        const styleTheme = {
                            Easy: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.6)', text: '#2563eb', shade: '#1d4ed8', shadow: 'rgba(59, 130, 246, 0.25)' },
                            Medium: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.6)', text: '#059669', shade: '#047857', shadow: 'rgba(16, 185, 129, 0.25)' },
                            Hard: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.6)', text: '#dc2626', shade: '#b91c1c', shadow: 'rgba(239, 68, 68, 0.25)' }
                        }[d];
                        return (
                            <button
                                key={d}
                                onClick={() => {
                                    haptic.light();
                                    setDifficulty(d);
                                }}
                                style={{
                                    padding: '14px 36px',
                                    borderRadius: '16px',
                                    fontSize: '1.05rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backgroundColor: difficulty === d ? styleTheme.bg : 'rgba(255, 255, 255, 0.5)',
                                    backdropFilter: 'blur(8px)',
                                    color: difficulty === d ? styleTheme.text : '#64748b',
                                    border: difficulty === d ? `2px solid ${styleTheme.border}` : '1px solid rgba(226, 232, 240, 0.8)',
                                    borderBottom: difficulty === d ? `6px solid ${styleTheme.shade}` : '6px solid #94a3b8',
                                    boxShadow: difficulty === d ? `0 10px 25px ${styleTheme.shadow}` : '0 4px 6px rgba(0,0,0,0.02)',
                                    transform: 'translateY(0)',
                                    outline: 'none'
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(4px)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {d}
                            </button>
                        );
                    })}
                </div>
            </div>

            {(user && user.targetJob) ? (
                <div style={{ marginTop: '2rem' }}>
                    <button className="frosted-btn text-lg py-4 px-12" onClick={startInterview}>
                        <Zap size={22} fill="currentColor" />
                        Start Interview
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
                    <AlertCircle size={20} />
                    <span className="font-bold">Please select a Target Job on Dashboard to begin</span>
                </div>
            )}
        </div>
    );

    // ── Render: Interview ──────────────────────────────────────────────────────
    const renderInterview = () => (
        <div className="interview-grid">
            <div className="chat-window" style={{ minHeight: '500px' }}>

                {/* Chat Header */}
                <div className="chat-header">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600" style={{ position: 'relative' }}>
                            <Zap size={18} />
                            {isSpeaking && (
                                <span style={{
                                    position: 'absolute', inset: -3,
                                    borderRadius: '50%',
                                    border: '2px solid #6366f1',
                                    animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite'
                                }} />
                            )}
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500">Recruiter Persona</div>
                            <div className="text-sm font-black dark:text-white">Daksh.AI Senior Lead</div>
                        </div>
                    </div>

                    {/* Mute Toggle */}
                    <button
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
                        style={{
                            background: isMuted ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.08)',
                            border: `1px solid ${isMuted ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.2)'}`,
                            borderRadius: '10px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            color: isMuted ? '#ef4444' : '#6366f1',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        {isMuted ? 'Muted' : 'AI Voice'}
                    </button>
                </div>

                {/* Messages */}
                <div className="chat-messages" style={{ overflowY: 'auto', flex: 1 }}>
                    {messages.map((m, i) => (
                        <div key={i} className={`msg ${m.role === 'ai' ? 'msg-ai' : 'msg-user'}`}>
                            {m.content}
                        </div>
                    ))}
                    {loading && (
                        <div className="msg msg-ai flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Thinking...
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area — Text + Voice */}
                <div className="chat-input-area">

                    {/* Voice Mode Toggle bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {isListening ? '🎤 Listening for your answer...' : isSpeaking ? '🔊 AI is speaking...' : 'Your turn to answer'}
                        </span>
                        <button
                            onClick={toggleVoiceMode}
                            title={voiceMode ? 'Disable auto voice conversation' : 'Enable full voice conversation mode'}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '4px 10px', borderRadius: '99px', cursor: 'pointer',
                                fontSize: '0.68rem', fontWeight: '800',
                                background: voiceMode ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(100,116,139,0.08)',
                                color: voiceMode ? 'white' : 'var(--text-muted)',
                                border: voiceMode ? 'none' : '1px solid rgba(100,116,139,0.2)',
                                transition: 'all 0.25s',
                                boxShadow: voiceMode ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
                            }}
                        >
                            {voiceMode ? <Mic size={11} /> : <MicOff size={11} />}
                            {voiceMode ? 'Voice Mode ON' : 'Voice Mode OFF'}
                        </button>
                    </div>

                    <div className="input-container" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder={isListening ? '🎤 Listening... speak your answer' : 'Type your answer or use the mic...'}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={loading || isListening}
                            style={isListening ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' } : {}}
                        />

                        {/* Mic Button (manual one-shot voice) */}
                        <button
                            onClick={toggleVoiceManual}
                            disabled={loading || isSpeaking}
                            title={isListening ? 'Stop listening' : 'Speak your answer once'}
                            style={{
                                background: isListening
                                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none', borderRadius: '12px', padding: '10px 14px',
                                color: 'white', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', gap: '6px', fontSize: '0.78rem',
                                fontWeight: '700', flexShrink: 0,
                                boxShadow: isListening ? '0 0 16px rgba(239,68,68,0.4)' : '0 4px 12px rgba(99,102,241,0.3)',
                                animation: isListening ? 'pulse 1s ease-in-out infinite' : 'none',
                                opacity: isSpeaking ? 0.4 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            {isListening ? 'Stop' : 'Mic'}
                        </button>

                        {/* Send Button */}
                        <button
                            style={{ backgroundColor: '#6366f1', color: 'white', borderRadius: '12px', padding: '10px 14px', border: 'none', cursor: 'pointer' }}
                            onClick={handleSend}
                            disabled={loading || !inputValue.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </div>

                    {/* Voice status hint */}
                    {isListening && (
                        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.7rem', fontWeight: '700', color: '#ef4444', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
                            LIVE — Speak clearly. Click "Stop" when done.
                        </div>
                    )}
                </div>
            </div>

            {/* Side Panel */}
            <div className="side-panel">
                {/* Timer */}
                <div className="stat-card" style={{ marginBottom: '1rem', border: `2px solid ${timerColor}22` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Clock size={16} style={{ color: timerColor }} />
                        <div style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: timerColor }}>Time Remaining</div>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '900', color: timerColor, textAlign: 'center', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                        {formatTime(timeLeft)}
                    </div>
                    <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '99px', marginTop: '0.75rem', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(timeLeft / (30 * 60)) * 100}%`, background: timerColor, borderRadius: '99px', transition: 'width 1s linear, background 0.5s' }} />
                    </div>
                </div>

                {/* Questions Progress */}
                <div className="stat-card">
                    <div className="text-3xl font-black mb-1">{messages.filter(m => m.role === 'user').length} / 20</div>
                    <div className="text-xs text-muted mb-4 uppercase font-bold">Questions Answered</div>
                    <div className="score-progress">
                        <div className="score-bar" style={{ width: `${(messages.filter(m => m.role === 'user').length / 20) * 100}%` }}></div>
                    </div>
                </div>

                {/* Voice Mode Status */}
                <div className="stat-card" style={{ marginTop: '1rem', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Input Mode
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{
                            flex: 1, textAlign: 'center', padding: '0.4rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700',
                            background: !isListening ? 'rgba(99,102,241,0.1)' : 'transparent',
                            color: !isListening ? '#6366f1' : 'var(--text-muted)',
                            border: !isListening ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent'
                        }}>⌨️ Text</div>
                        <div style={{
                            flex: 1, textAlign: 'center', padding: '0.4rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700',
                            background: isListening ? 'rgba(239,68,68,0.1)' : 'transparent',
                            color: isListening ? '#ef4444' : 'var(--text-muted)',
                            border: isListening ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent'
                        }}>🎤 Voice</div>
                    </div>
                </div>

                <button className="flex items-center justify-center gap-2 p-3 text-xs font-bold text-red-500 mt-auto hover:bg-red-50 rounded-lg" onClick={() => setStatus('welcome')}>
                    <RefreshCcw size={14} /> End Session
                </button>
            </div>
        </div>
    );

    // ── Render: End ────────────────────────────────────────────────────────────
    const renderEnd = () => (
        <div className="report-card animate-scaleUp">
            <Award size={64} style={{ color: '#f59e0b', margin: '0 auto 1.5rem' }} />
            <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text-dark)' }}>
                Interview Report Card
            </h2>
            <p className="text-muted mb-8">Role: {user.targetJob?.replace('job-', '').replace('-', ' ') || 'Candidate'}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 text-left">
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="text-xs font-bold text-blue-600 uppercase mb-2">Technical Score</div>
                    <div className="text-3xl font-black text-blue-700">{scorecard?.technical || 0}%</div>
                </div>
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="text-xs font-bold text-emerald-600 uppercase mb-2">Comm. Score</div>
                    <div className="text-3xl font-black text-emerald-700">{scorecard?.communication || 0}%</div>
                </div>
            </div>

            <div className="text-left mb-10">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <AlertCircle size={16} /> Coaching Feedback
                </h4>
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-sm leading-relaxed text-left">
                    {scorecard?.feedback || "Great performance! You've demonstrated solid technical understanding and clear communication. Keep practicing these mock sessions to further sharpen your edge."}
                </div>
            </div>

            <button className="frosted-btn w-full py-4 justify-center" onClick={() => { synthRef.current?.cancel(); setStatus('welcome'); }}>
                <RefreshCcw size={20} />
                Try Again
            </button>
        </div>
    );

    return (
        <div className="interview-container">
            {status === 'welcome' && renderWelcome()}
            {status === 'in-progress' && renderInterview()}
            {status === 'end' && renderEnd()}
        </div>
    );
};

export default InterviewPrep;
