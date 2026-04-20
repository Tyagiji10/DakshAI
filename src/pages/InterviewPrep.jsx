import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { conductInterviewStep, getInterviewQuestionBank } from '../lib/ai';
import {
    AlertCircle, RefreshCcw, Clock, Mic, MicOff,
    Volume2, VolumeX, BrainCircuit, ChevronRight, Trophy, TrendingUp, Zap, Award
} from 'lucide-react';
import { haptic } from '../lib/haptics';
import { useNavigate } from 'react-router-dom';
import './InterviewPrep.css';

const BACKEND_URL = 'http://localhost:5001';

// ── Utility: clean repeated words from STT transcript ─────────────────────────
function cleanTranscript(text) {
    if (!text) return '';
    // Remove 3+ consecutive repeated words: "hello hello hello" → "hello"
    let cleaned = text.replace(/\b(\w+)(\s+\1){2,}/gi, '$1');
    // Remove 2x consecutive repeated words: "hello hello" → "hello"
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');
    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned.trim();
}

// ── Utility: detect kill phrases / abuse ──────────────────────────────────────
const KILL_PHRASES = [
    'cancel interview', 'end interview', 'close interview', 'stop interview',
    'exit interview', 'i want to stop', 'i want to cancel', 'i want to close',
    'terminate interview', 'quit interview'
];
const ABUSE_WORDS = ['fuck', 'shit', 'bastard', 'bitch', 'asshole', 'motherfucker', 'cunt', 'dick'];

const FAREWELL_PHRASES = [
    { text: "Best of luck for your future! See you soon.", lang: "en" },
    { text: "Interview samapt hua. Agli baar milte hain! All the best.", lang: "hi" },
    { text: "The interview has ended. I hope to see you again soon!", lang: "en" },
    { text: "Take care and keep practicing! Goodbye.", lang: "en" }
];

function isKillPhrase(text) {
    const lower = text.toLowerCase();
    return KILL_PHRASES.some(p => lower.includes(p)) || ABUSE_WORDS.some(w => lower.includes(w));
}

// ── Animated SVG AI Recruiter Avatar ─────────────────────────────────────────
const AIRecruiter = React.memo(({ isSpeaking, isListening }) => (
    <div className="ai-recruiter-wrapper">
        {/* Animated background blobs */}
        <div className="recruiter-blob blob-1" />
        <div className="recruiter-blob blob-2" />
        <div className="recruiter-blob blob-3" />

        {/* Avatar SVG */}
        <div className={`recruiter-avatar ${isSpeaking ? 'speaking' : ''}`}>
            <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" width="160" height="180">
                {/* Body / suit */}
                <ellipse cx="100" cy="185" rx="65" ry="45" fill="#1e293b" />
                <rect x="70" y="140" width="60" height="60" rx="10" fill="#1e293b" />
                {/* Tie */}
                <polygon points="100,145 93,165 100,175 107,165" fill="#6366f1" />
                <polygon points="100,135 95,148 100,145 105,148" fill="#4f46e5" />
                {/* Shirt collar */}
                <polygon points="88,138 100,152 112,138 105,133 95,133" fill="white" opacity="0.9" />
                {/* Neck */}
                <rect x="90" y="108" width="20" height="25" rx="6" fill="#fbbf24" opacity="0.85" />
                {/* Head */}
                <ellipse cx="100" cy="95" rx="38" ry="42" fill="#fbbf24" opacity="0.85" />
                {/* Hair */}
                <ellipse cx="100" cy="57" rx="38" ry="18" fill="#1e293b" />
                <rect x="62" y="57" width="76" height="15" fill="#1e293b" />
                {/* Eyes — blink animation via CSS (stares intently when listening) */}
                <g className={`recruiter-eyes ${isListening ? 'listening' : ''}`}>
                    <ellipse cx="85" cy={isListening ? "90" : "92"} rx={isListening ? "10" : "8"} ry={isListening ? "11" : "9"} fill="white" />
                    <ellipse cx="115" cy={isListening ? "90" : "92"} rx={isListening ? "10" : "8"} ry={isListening ? "11" : "9"} fill="white" />
                    <circle cx={isListening ? "85" : "87"} cy={isListening ? "90" : "93"} r={isListening ? "6" : "5"} fill="#1e293b" />
                    <circle cx={isListening ? "115" : "117"} cy={isListening ? "90" : "93"} r={isListening ? "6" : "5"} fill="#1e293b" />
                    <circle cx={isListening ? "87" : "89"} cy={isListening ? "88" : "91"} r="2" fill="white" />
                    <circle cx={isListening ? "117" : "119"} cy={isListening ? "88" : "91"} r="2" fill="white" />
                </g>
                {/* Eyebrows */}
                <path d="M76 80 Q85 75 94 80" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M106 80 Q115 75 124 80" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Mouth — changes with speaking */}
                {isSpeaking ? (
                    <ellipse cx="100" cy="113" rx="10" ry="6" fill="#ef4444" opacity="0.9" />
                ) : (
                    <path d="M88 113 Q100 122 112 113" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                )}
                {/* Ears */}
                <ellipse cx="62" cy="95" rx="7" ry="10" fill="#e9a840" opacity="0.8" />
                <ellipse cx="138" cy="95" rx="7" ry="10" fill="#e9a840" opacity="0.8" />
                {/* Sound waves when speaking */}
                {isSpeaking && (
                    <g className="sound-waves">
                        <path d="M149 88 Q158 95 149 102" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                        <path d="M155 82 Q168 95 155 108" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
                        <path d="M161 76 Q178 95 161 114" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
                    </g>
                )}
            </svg>

            {/* Speaking / listening ring */}
            {(isSpeaking || isListening) && (
                <div className={`avatar-ring ${isSpeaking ? 'ring-speaking' : 'ring-listening'}`} />
            )}
        </div>

        {/* Status badge */}
        <div className={`recruiter-status ${isSpeaking ? 'status-speaking' : isListening ? 'status-listening' : 'status-idle'}`}>
            {isSpeaking ? '🔊 Speaking...' : isListening ? '🎤 Listening...' : '👁️ Evaluating'}
        </div>
    </div>
));

// ── SVG Radar Chart ───────────────────────────────────────────────────────────
const RadarChart = React.memo(({ scores }) => {
    const labels = ['Communication', 'Technical', 'Problem-Solving', 'Confidence', 'Task Perf.', 'Overall'];
    const values = [
        Math.min(5, Math.max(1, scores?.communication || 3)),
        Math.min(5, Math.max(1, scores?.technical || 3)),
        Math.min(5, Math.max(1, scores?.problemSolving || 3)),
        Math.min(5, Math.max(1, scores?.confidence || 3)),
        Math.min(5, Math.max(1, scores?.taskPerformance || 3)),
        Math.min(5, Math.max(1, scores?.overall || 3)),
    ];
    const cx = 150, cy = 150, R = 100, n = labels.length;
    const angle = (i) => (i * 2 * Math.PI) / n - Math.PI / 2;
    const pt = (i, r) => `${cx + r * Math.cos(angle(i))},${cy + r * Math.sin(angle(i))}`;

    return (
        <svg viewBox="0 0 300 300" width="100%" style={{ maxWidth: '320px', margin: '0 auto', display: 'block' }}>
            {/* Grid rings */}
            {[1, 2, 3, 4, 5].map(lvl => (
                <polygon key={lvl}
                    points={Array.from({ length: n }, (_, i) => pt(i, (R / 5) * lvl)).join(' ')}
                    fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
            ))}
            {/* Axis lines */}
            {labels.map((_, i) => (
                <line key={i} x1={cx} y1={cy}
                    x2={cx + R * Math.cos(angle(i))} y2={cy + R * Math.sin(angle(i))}
                    stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
            ))}
            {/* Score polygon */}
            <polygon
                points={values.map((v, i) => pt(i, (R / 5) * v)).join(' ')}
                fill="rgba(99,102,241,0.25)" stroke="#6366f1" strokeWidth="2.5" />
            {/* Score dots */}
            {values.map((v, i) => (
                <circle key={i}
                    cx={cx + (R / 5) * v * Math.cos(angle(i))}
                    cy={cy + (R / 5) * v * Math.sin(angle(i))}
                    r="5" fill="#6366f1" stroke="white" strokeWidth="2" />
            ))}
            {/* Labels */}
            {labels.map((lbl, i) => {
                const lx = cx + (R + 22) * Math.cos(angle(i));
                const ly = cy + (R + 22) * Math.sin(angle(i));
                return (
                    <text key={i} x={lx} y={ly}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize="9" fontWeight="700" fill="#64748b" fontFamily="Inter, sans-serif">
                        {lbl}
                    </text>
                );
            })}
        </svg>
    );
});

// ── Score Badge ───────────────────────────────────────────────────────────────
const ScoreBadge = ({ label, score, color }) => (
    <div style={{
        padding: '1rem', borderRadius: '12px',
        background: `${color}15`, border: `1px solid ${color}30`,
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '0.65rem', fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map(s => (
                <div key={s} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: s <= score ? color : `${color}25`,
                    transition: 'background 0.3s'
                }} />
            ))}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: '900', color, marginTop: '0.25rem' }}>{score}/5</div>
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const InterviewPrep = () => {
    const { user } = useUser();
    const navigate = useNavigate();

    const [status, setStatus] = useState('welcome');
    const [difficulty, setDifficulty] = useState('Medium');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scorecard, setScorecard] = useState(null);
    const [questionBank, setQuestionBank] = useState([]);
    const [timeLeft, setTimeLeft] = useState(30 * 60);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [backendOk, setBackendOk] = useState(null); // null=checking, true/false

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const currentAudioRef = useRef(null);
    const chatContainerRef = useRef(null);
    const messagesRef = useRef([]);
    const timerRef = useRef(null);
    const statusRef = useRef('welcome');
    const handleAutoSendRef = useRef(null);
    const isSpeakingRef = useRef(false);
    const isListeningRef = useRef(false);
    const isLoadingRef = useRef(false);

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    const timerColor = timeLeft <= 300 ? '#ef4444' : timeLeft <= 600 ? '#f59e0b' : '#10b981';

    // ── TTS (backend XTTS-v2 or browser fallback) ─────────────────────────────
    const speakWithBrowser = useCallback((text, onDone, passedLang = null) => {
        const synth = window.speechSynthesis;
        synth.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = passedLang === 'hi' ? 'hi-IN' : 'en-IN';
        utt.rate = 1.0;
        utt.pitch = 0.9;
        utt.onstart = () => setIsSpeaking(true);
        utt.onend = () => { setIsSpeaking(false); onDone && onDone(); };
        utt.onerror = () => { setIsSpeaking(false); onDone && onDone(); };
        synth.speak(utt);
    }, []);

    const speak = useCallback(async (text, onDone, passedLang = null) => {
        if (isMuted || !text?.trim()) { onDone && onDone(); return; }
        currentAudioRef.current?.pause();
        currentAudioRef.current = null;
        setIsSpeaking(true);

        const detectedLang = passedLang || (text.match(/[अ-ह]/) ? 'hi' : 'en'); 

        // 🚀 Native-First Priority: We probe the server on every call to maximize native usage
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200); // Fast 1.2s probe

            const res = await fetch(`${BACKEND_URL}/speak`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: text.slice(0, 600), 
                    language: detectedLang, 
                    speaker: 'Abrahan Mack' 
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error('Native offline');
            
            setBackendOk(true);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            currentAudioRef.current = audio;
            audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); onDone && onDone(); };
            audio.onerror = () => { setIsSpeaking(false); speakWithBrowser(text, onDone, detectedLang); };
            audio.play();
        } catch (err) {
            console.log("Native TTS probe failed, using browser fallback.");
            setBackendOk(false);
            setIsSpeaking(false);
            speakWithBrowser(text, onDone, detectedLang);
        }
    }, [isMuted, BACKEND_URL, speakWithBrowser]);

    // ── STT (backend Whisper or browser fallback) ─────────────────────────────
    const startListening = useCallback(async () => {
        // Use refs for the check to avoid stale closure issues during auto-trigger
        if (isLoadingRef.current || isSpeakingRef.current || isListeningRef.current) return;

        // Dynamic Native Probe for STT
        let supportsBackend = false;
        try {
            const probe = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(1000) });
            if (probe.ok) supportsBackend = true;
        } catch (e) {
            supportsBackend = false;
        }

        if (supportsBackend) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                });
                audioChunksRef.current = [];
                setBackendOk(true);

                const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                recorder.onstop = async () => {
                    stream.getTracks().forEach(t => t.stop());
                    setIsListening(false);
                    setLoading(true);
                    try {
                        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                        const fd = new FormData();
                        fd.append('audio', blob, 'recording.webm');
                        const res = await fetch(`${BACKEND_URL}/transcribe`, { method: 'POST', body: fd });
                        const data = await res.json();
                        const cleaned = cleanTranscript(data.transcript || '');
                        if (cleaned) {
                            if (isKillPhrase(cleaned)) {
                                setStatus('end');
                            } else {
                                if (handleAutoSendRef.current) await handleAutoSendRef.current(cleaned);
                            }
                        }
                    } catch (e) {
                        console.error('Transcription error:', e);
                    } finally {
                        setLoading(false);
                    }
                };

                mediaRecorderRef.current = recorder;
                recorder.start(200); // collect data every 200ms
                setIsListening(true);

                // Auto-stop after 90 seconds max silence protection (increased from 15s)
                setTimeout(() => {
                    if (mediaRecorderRef.current?.state === 'recording') {
                        mediaRecorderRef.current.stop();
                    }
                }, 90000);

            } catch (e) {
                console.error('Mic access denied:', e);
                alert('Microphone access was denied. Please allow mic access and try again.');
            }
        } else {
            // Browser Web Speech API fallback
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) return;
            const rec = new SR();
            rec.continuous = true; // Enabled persistent listening
            rec.interimResults = false;
            rec.lang = 'en-IN';
            rec.onresult = (e) => {
                const raw = e.results[0]?.[0]?.transcript || '';
                const cleaned = cleanTranscript(raw);
                if (cleaned) {
                    if (isKillPhrase(cleaned)) setStatus('end');
                    else if (handleAutoSendRef.current) handleAutoSendRef.current(cleaned);
                }
            };
            rec.onerror = () => setIsListening(false);
            rec.onend = () => setIsListening(false);
            rec.start();
            setIsListening(true);
        }
    }, [backendOk, loading, isSpeaking, isListening]);

    const stopListening = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsListening(false);
    }, []);

    const speakFarewell = useCallback(() => {
        const item = FAREWELL_PHRASES[Math.floor(Math.random() * FAREWELL_PHRASES.length)];
        // Use browser synthesis directly here so it persists slightly during navigation
        const synth = window.speechSynthesis;
        synth.cancel();
        const utt = new SpeechSynthesisUtterance(item.text);
        utt.lang = item.lang === 'hi' ? 'hi-IN' : 'en-IN';
        utt.rate = 1.05;
        synth.speak(utt);
    }, []);

    // ── AI response handler ───────────────────────────────────────────────────
    const handleAutoSend = useCallback(async (text) => {
        if (!text?.trim() || loading) return;
        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        try {
            const history = [...messagesRef.current, userMsg];
            const response = await conductInterviewStep(
                history, user.targetJob || 'Software Developer', difficulty, questionBank
            );
            if (response.isEnd) {
                setScorecard(response.scorecard);
                setStatus('end');
                setMessages(prev => [...prev, { role: 'ai', content: 'Interview complete. Generating your report...' }]);
            } else {
                const aiReply = response.question || 'Interesting. Could you elaborate?';
                setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
                // Speak the AI reply, then auto-start mic
                speak(aiReply, () => {
                    if (statusRef.current === 'in-progress') {
                        setTimeout(() => startListening(), 100); // Shorter latency for snappier response
                    }
                }, response.language);
            }
        } catch (err) {
            const errMsg = 'Connection lost. Please check your internet or retry.';
            setMessages(prev => [...prev, { role: 'ai', content: errMsg }]);
            speak(errMsg);
        } finally {
            setLoading(false);
        }
    }, [loading, user, difficulty, questionBank, speak, startListening]);

    // ── Lifecycle & Side Effects (Moved here to ensure callbacks are initialized) ──

    // Keep refs in sync to prevent stale state issues in callbacks
    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { handleAutoSendRef.current = handleAutoSend; }, [handleAutoSend]);
    useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
    useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
    useEffect(() => { isLoadingRef.current = loading; }, [loading]);

    // Safely scroll chat to bottom without dragging the entire page down
    useEffect(() => {
        if (status === 'in-progress' && chatContainerRef.current) {
            const el = chatContainerRef.current;
            requestAnimationFrame(() => {
                el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
            });
        }
    }, [messages, loading, status]);

    // 30-min timer
    useEffect(() => {
        if (status === 'in-progress') {
            setTimeLeft(30 * 60);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) { 
                        clearInterval(timerRef.current);
                        // Force AI to generate the scorecard
                        if (handleAutoSendRef.current) handleAutoSendRef.current("SYSTEM: The interview time is up. Immediately conclude the interview, set isEnd to true, and generate the final scorecard.");
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

    // Check backend health on mount
    useEffect(() => {
        fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) })
            .then(r => r.ok ? setBackendOk(true) : setBackendOk(false))
            .catch(() => setBackendOk(false));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis?.cancel(); // Cancel any current interview question
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
            currentAudioRef.current?.pause();

            // If we are leaving during an active interview, say goodbye instantly
            if (statusRef.current === 'in-progress') {
                const item = FAREWELL_PHRASES[0]; 
                const utt = new SpeechSynthesisUtterance(item.text);
                utt.lang = 'en-IN';
                utt.rate = 1.1;
                window.speechSynthesis?.speak(utt);
            }
        };
    }, []);

    // ── Start interview ───────────────────────────────────────────────────────
    const startInterview = async () => {
        if (!user?.targetJob) return;
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Pin screen to top
        haptic.medium();
        setStatus('in-progress');
        setLoading(true);
        try {
            const bank = await getInterviewQuestionBank(user.targetJob || 'Software Developer', difficulty);
            setQuestionBank(bank);
            const initMsg = {
                role: 'user',
                content: `Hi, I am ready for the ${difficulty} level interview for the ${user.targetJob || 'Software Developer'} role.`
            };
            const response = await conductInterviewStep([initMsg], user.targetJob || 'Software Developer', difficulty, bank);
            const firstQ = response.question || bank[0] || 'Hello! Tell me about yourself.';
            setMessages([{ role: 'ai', content: firstQ }]);
            speak(firstQ, () => setTimeout(() => startListening(), 200));
        } catch (err) {
            const errMsg = `Error: ${err.message || 'AI recruiter is currently unavailable.'}`;
            setMessages([{ role: 'ai', content: errMsg }]);
            haptic.error();
        } finally {
            setLoading(false);
        }
    };

    const toggleMute = () => {
        haptic.light();
        setIsMuted(prev => {
            if (!prev) { currentAudioRef.current?.pause(); window.speechSynthesis?.cancel(); setIsSpeaking(false); }
            return !prev;
        });
    };

    // ────────────────────────────────────────────────────────────────────────────
    // RENDER: WELCOME
    // ────────────────────────────────────────────────────────────────────────────
    const renderWelcome = () => (
        <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-6">
            <div className="pulse-avatar mb-6">
                <BrainCircuit size={28} />
            </div>
            <h1 className="text-4xl font-black mb-3" style={{ color: 'var(--text-dark)' }}>
                AI Mock Interview
            </h1>
            <p className="text-lg mb-8" style={{ color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '520px' }}>
                Face a live AI recruiter. Voice-only interview. Get a detailed scorecard.
            </p>

            {/* No job selected — redirect card */}
            {!user?.targetJob && (
                <div style={{
                    width: '100%', padding: '1.5rem', borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(99,102,241,0.08))',
                    border: '1.5px solid rgba(239,68,68,0.25)', marginBottom: '2rem'
                }}>
                    <AlertCircle size={32} style={{ color: '#ef4444', marginBottom: '0.75rem' }} />
                    <h3 style={{ fontWeight: '800', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                        No Target Job Selected
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                        The AI recruiter needs a job role to tailor your interview questions. Set one now!
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '0.7rem 1.6rem', borderRadius: '12px', border: 'none',
                            cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                            boxShadow: '0 4px 18px rgba(99,102,241,0.35)'
                        }}
                    >
                        <ChevronRight size={16} /> Go to Skill Blueprint
                    </button>
                </div>
            )}

            {/* Difficulty Selector */}
            <div className="glass-card w-full p-6 mb-6" style={{ borderRadius: '20px' }}>
                <h3 className="font-black uppercase mb-6" style={{
                    color: 'var(--primary-blue)', fontSize: '1rem',
                    letterSpacing: '0.12em', textAlign: 'center'
                }}>
                    Select Difficulty
                </h3>
                <div className="difficulty-grid">
                    {[
                        { key: 'Easy', emoji: '🟢', desc: 'Basics & fundamentals' },
                        { key: 'Medium', emoji: '🟡', desc: 'Real job-ready questions' },
                        { key: 'Hard', emoji: '🔴', desc: 'Senior-level deep dives' },
                    ].map(({ key, emoji, desc }) => {
                        const themes = {
                            Easy: { active: '#2563eb', border: 'rgba(59,130,246,0.5)', glow: 'rgba(59,130,246,0.2)' },
                            Medium: { active: '#059669', border: 'rgba(16,185,129,0.5)', glow: 'rgba(16,185,129,0.2)' },
                            Hard: { active: '#dc2626', border: 'rgba(239,68,68,0.5)', glow: 'rgba(239,68,68,0.2)' },
                        };
                        const t = themes[key];
                        const active = difficulty === key;
                        return (
                            <button key={key}
                                onClick={() => { haptic.light(); setDifficulty(key); }}
                                className={`difficulty-btn ${active ? 'active' : ''}`}
                                style={{
                                    borderColor: active ? t.border : 'transparent',
                                    boxShadow: active ? `0 0 0 3px ${t.glow}, 0 8px 24px ${t.glow}` : '0 2px 8px rgba(0,0,0,0.04)',
                                    background: active ? `${t.glow}` : 'var(--bg-light)',
                                }}
                            >
                                <span className="diff-emoji">{emoji}</span>
                                <span className="diff-label" style={{ color: active ? t.active : 'var(--text-dark)' }}>{key}</span>
                                <span className="diff-desc" style={{ color: active ? t.active : 'var(--text-muted)' }}>{desc}</span>
                                {active && <div className="active-dot" style={{ background: t.active }} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Backend status indicator removed as requested */}

            {user?.targetJob && (
                <button className="frosted-btn text-lg py-4 px-12" onClick={startInterview}
                    disabled={!user?.targetJob} style={{ marginTop: '1.5rem' }}>
                    <Zap size={22} fill="currentColor" />
                    Begin Interview
                </button>
            )}
        </div>
    );

    // ────────────────────────────────────────────────────────────────────────────
    // RENDER: IN-PROGRESS (Two-Panel Layout)
    // ────────────────────────────────────────────────────────────────────────────
    const renderInterview = () => (
        <div className="interview-dual-panel">

            {/* ── LEFT: AI Recruiter ── */}
            <div className="recruiter-panel">
                <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                    YOUR INTERVIEWER
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff', marginBottom: '0.25rem' }}>
                    DAKSH-AI
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
                    Senior Talent Acquisition Lead
                </div>

                <AIRecruiter isSpeaking={isSpeaking} isListening={isListening} />

                {/* Difficulty badge */}
                <div style={{
                    marginTop: 'auto', padding: '0.4rem 1rem',
                    borderRadius: '99px', fontSize: '0.7rem', fontWeight: '800',
                    background: difficulty === 'Easy' ? 'rgba(59,130,246,0.2)' : difficulty === 'Hard' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                    color: difficulty === 'Easy' ? '#93c5fd' : difficulty === 'Hard' ? '#fca5a5' : '#6ee7b7',
                    border: '1px solid rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                    {difficulty} Mode
                </div>
            </div>

            {/* ── RIGHT: Chat + Controls ── */}
            <div className="chat-panel">

                {/* Header */}
                <div className="chat-panel-header">
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-dark)' }}>Interview Session</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {messages.filter(m => m.role === 'user').length} answers • {formatTime(timeLeft)} left
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Timer */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '4px 12px', borderRadius: '99px',
                            background: `${timerColor}15`, border: `1px solid ${timerColor}40`,
                            color: timerColor, fontSize: '0.78rem', fontWeight: '800', fontFamily: 'monospace'
                        }}>
                            <Clock size={12} /> {formatTime(timeLeft)}
                        </div>

                        {/* Mute */}
                        <button onClick={toggleMute}
                            style={{
                                background: isMuted ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.08)',
                                border: `1px solid ${isMuted ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.2)'}`,
                                borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '5px',
                                fontSize: '0.7rem', fontWeight: '700',
                                color: isMuted ? '#ef4444' : '#6366f1', transition: 'all 0.2s'
                            }}>
                            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                            {isMuted ? 'Muted' : 'Voice'}
                        </button>

                        {/* End session */}
                        <button onClick={() => { speakFarewell(); setStatus('welcome'); }}
                            style={{
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '5px',
                                fontSize: '0.7rem', fontWeight: '700', color: '#ef4444'
                            }}>
                            <RefreshCcw size={12} /> End
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="chat-messages-panel" ref={chatContainerRef}>
                    {messages.map((m, i) => (
                        <div key={i} className={`msg ${m.role === 'ai' ? 'msg-ai' : 'msg-user'}`}>
                            {m.role === 'ai' && (
                                <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#6366f1', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                    Recruiter
                                </div>
                            )}
                            {m.content}
                        </div>
                    ))}
                    {loading && (
                        <div className="msg msg-ai flex items-center gap-2">
                            <div style={{ display: 'flex', gap: 4 }}>
                                {[0, 0.15, 0.3].map((d, i) => (
                                    <div key={i} style={{
                                        width: 6, height: 6, borderRadius: '50%', background: '#6366f1',
                                        animation: `bounce 1s ease-in-out ${d}s infinite`
                                    }} />
                                ))}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thinking...</span>
                        </div>
                    )}
                </div>

                {/* Voice Control Footer */}
                <div className="voice-control-bar">
                    <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {isListening ? '🎤 Recording — tap to send' : isSpeaking ? '🔊 AI is speaking...' : loading ? '⏳ Processing...' : 'Tap mic to answer'}
                    </div>

                    {/* Large Mic Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0.75rem 0' }}>
                        <button
                            onClick={isListening ? stopListening : startListening}
                            disabled={loading || (isSpeaking && !isListening)}
                            className={`mic-btn ${isListening ? 'mic-active' : ''}`}
                        >
                            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                        </button>
                    </div>

                    {/* Progress bar removed as requested (now time-based) */}
                </div>
            </div>
        </div>
    );

    // ────────────────────────────────────────────────────────────────────────────
    // RENDER: END — Enhanced Report Card with Radar Chart
    // ────────────────────────────────────────────────────────────────────────────
    const renderEnd = () => {
        const sc = scorecard || {};
        const params = [
            { key: 'communication', label: 'Communication', color: '#3b82f6' },
            { key: 'technical', label: 'Technical', color: '#8b5cf6' },
            { key: 'problemSolving', label: 'Problem-Solving', color: '#f59e0b' },
            { key: 'confidence', label: 'Confidence', color: '#10b981' },
            { key: 'taskPerformance', label: 'Task Performance', color: '#ef4444' },
            { key: 'overall', label: 'Overall AI Score', color: '#6366f1' },
        ];
        const overall = sc.overall || Math.round(
            params.slice(0, 5).reduce((acc, p) => acc + (sc[p.key] || 3), 0) / 5
        );
        const strengths = params.filter(p => (sc[p.key] || 3) >= 4).map(p => p.label);
        const improvements = params.filter(p => (sc[p.key] || 3) <= 2).map(p => p.label);

        return (
            <div className="report-card animate-scaleUp">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                    <Trophy size={36} style={{ color: '#f59e0b' }} />
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-dark)', margin: 0 }}>
                        Interview Report Card
                    </h2>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Role: <strong>{user?.targetJob?.replace(/job-|-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Candidate'}</strong> · Difficulty: <strong>{difficulty}</strong>
                </p>

                {/* Overall banner */}
                <div style={{
                    padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem',
                    background: overall >= 4 ? 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(99,102,241,0.1))' :
                        overall >= 3 ? 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(99,102,241,0.1))' :
                            'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(99,102,241,0.1))',
                    border: '1px solid rgba(99,102,241,0.2)'
                }}>
                    <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#6366f1' }}>{overall}/5</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Overall AI Score</div>
                </div>

                {/* Radar Chart */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                        Performance Radar
                    </div>
                    <RadarChart scores={sc} />
                </div>

                {/* Score grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {params.map(p => (
                        <ScoreBadge key={p.key} label={p.label} score={sc[p.key] || 3} color={p.color} />
                    ))}
                </div>

                {/* Strengths & Improvements */}
                {(strengths.length > 0 || improvements.length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        {strengths.length > 0 && (
                            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'left' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '0.5rem' }}>💪 Strengths</div>
                                {strengths.map(s => <div key={s} style={{ fontSize: '0.8rem', color: 'var(--text-dark)', padding: '2px 0' }}>• {s}</div>)}
                            </div>
                        )}
                        {improvements.length > 0 && (
                            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'left' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', marginBottom: '0.5rem' }}>📈 Improve</div>
                                {improvements.map(s => <div key={s} style={{ fontSize: '0.8rem', color: 'var(--text-dark)', padding: '2px 0' }}>• {s}</div>)}
                            </div>
                        )}
                    </div>
                )}

                {/* Coaching feedback */}
                {sc.feedback && (
                    <div style={{
                        padding: '1.25rem', borderRadius: '14px', marginBottom: '1.5rem',
                        background: 'var(--bg-light)', border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.65', textAlign: 'left'
                    }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingUp size={13} /> AI Coaching Feedback
                        </div>
                        {sc.feedback}
                    </div>
                )}

                <button className="frosted-btn w-full py-4 justify-center"
                    onClick={() => { window.speechSynthesis?.cancel(); currentAudioRef.current?.pause(); setStatus('welcome'); setMessages([]); setScorecard(null); }}>
                    <RefreshCcw size={20} /> Try Another Interview
                </button>
            </div>
        );
    };

    return (
        <div className="interview-container">
            {status === 'welcome' && renderWelcome()}
            {status === 'in-progress' && renderInterview()}
            {status === 'end' && renderEnd()}
        </div>
    );
};

export default InterviewPrep;
