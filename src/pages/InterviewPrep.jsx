import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { conductInterviewStep, getInterviewQuestionBank } from '../lib/ai';
import {
    AlertCircle, RefreshCcw, Clock, Mic, MicOff, MessageSquare,
    Volume2, VolumeX, BrainCircuit, ChevronRight, Trophy, TrendingUp, Zap, Award, Search, Plus, ShieldCheck, Target, BarChart2, Sparkles, FileText, Lightbulb, Briefcase, FolderPlus, User, Code, Star, Layers, BookOpen, Edit3, CheckCircle, Pencil, ArrowRight, Users, HelpCircle
} from 'lucide-react';
import { haptic } from '../lib/haptics';
import { useNavigate, Link } from 'react-router-dom';
import './InterviewPrep.css';

const BACKEND_URL = 'http://localhost:5001';

const ROLES = [
  { group: 'Engineering', options: ['Frontend Engineer', 'Backend Engineer', 'Fullstack Engineer', 'Mobile Engineer'] },
  { group: 'Design', options: ['Product Designer', 'UX Researcher', 'UI Designer'] },
  { group: 'Product', options: ['Product Manager', 'Technical PM', 'Scrum Master'] },
  { group: 'Data', options: ['Data Scientist', 'Data Engineer', 'Machine Learning Engineer'] }
];

const INTERVIEW_TYPES = [
  { id: 'behavioral', title: 'Behavioral', description: 'Soft skills, past experiences', icon: 'Users' },
  { id: 'technical', title: 'Technical / Coding', description: 'Coding, data structures', icon: 'Code' },
  { id: 'system_design', title: 'System Design', description: 'Architecture, scalability', icon: 'Layers' },
  { id: 'case_study', title: 'Case Study', description: 'Business case analysis', icon: 'BookOpen' },
  { id: 'leadership', title: 'Leadership', description: 'Leadership & management', icon: 'Users' },
  { id: 'product_thinking', title: 'Product Thinking', description: 'Product sense & strategy', icon: 'Lightbulb' },
  { id: 'custom', title: 'Custom', description: 'Create your own interview', icon: 'Edit' }
];

const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher', sub: '0-1 Year' },
  { id: 'mid', label: 'Mid-Level', sub: '1-5 Years' },
  { id: 'senior', label: 'Senior', sub: '5+ Years' },
  { id: 'lead', label: 'Lead / Architect', sub: '10+ Years' }
];



const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];
const DURATIONS = ['15 min', '30 min', '45 min', '60 min', '90 min', 'Custom'];


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
                        fontSize="9" fontWeight="700" fill="var(--ai-text-dim)" fontFamily="Inter, sans-serif">
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
    const [interviewType, setInterviewType] = useState('technical');
    const [duration, setDuration] = useState('30 min');
    const [roleInput, setRoleInput] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('mid');
    
    // Custom Role Search & Select State
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [roleSearchTerm, setRoleSearchTerm] = useState('');
    const [customRoles, setCustomRoles] = useState([]);
    const [customRoleInput, setCustomRoleInput] = useState('');
    const [isAddingCustomRole, setIsAddingCustomRole] = useState(false);
    const roleDropdownRef = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem('daksh_saved_custom_roles');
        if (saved) setCustomRoles(JSON.parse(saved));
        
        const handleClickOutside = (event) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
                setIsRoleDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddCustomRole = () => {
        if (!customRoleInput.trim()) return;
        const newRoles = [customRoleInput.trim(), ...customRoles];
        setCustomRoles(newRoles);
        localStorage.setItem('daksh_saved_custom_roles', JSON.stringify(newRoles));
        setRoleInput(customRoleInput.trim());
        setCustomRoleInput('');
        setIsAddingCustomRole(false);
        setIsRoleDropdownOpen(false);
    };

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scorecard, setScorecard] = useState(null);
    const [questionBank, setQuestionBank] = useState([]);
    const [timeLeft, setTimeLeft] = useState(30 * 60);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [backendOk, setBackendOk] = useState(null); // null=checking, true/false

    const typeRefs = useRef([]);
    const diffRefs = useRef([]);
    const durRefs = useRef([]);
    
    const handleTypeKeyDown = (e, index) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = (index + 1) % INTERVIEW_TYPES.length;
            typeRefs.current[next]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = (index - 1 + INTERVIEW_TYPES.length) % INTERVIEW_TYPES.length;
            typeRefs.current[prev]?.focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setInterviewType(INTERVIEW_TYPES[index].id);
        }
    };

    const handleRadioKeyDown = (e, index, options, setOption, refsArray) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = (index + 1) % options.length;
            setOption(options[next].id || options[next]);
            refsArray.current[next]?.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = (index - 1 + options.length) % options.length;
            setOption(options[prev].id || options[prev]);
            refsArray.current[prev]?.focus();
        }
    };


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
    const isSubmittingRef = useRef(false);

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
            rec.continuous = false; // Set to false to prevent double fire on mobile
            rec.interimResults = false;
            rec.lang = 'en-IN';
            rec.onresult = (e) => {
                const results = e.results;
                const latestResult = results[results.length - 1];
                if (latestResult.isFinal) {
                    const raw = latestResult[0].transcript || '';
                    const cleaned = cleanTranscript(raw);
                    if (cleaned && !isSubmittingRef.current) {
                        if (isKillPhrase(cleaned)) setStatus('end');
                        else if (handleAutoSendRef.current) handleAutoSendRef.current(cleaned);
                    }
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
        if (!text?.trim() || loading || isSubmittingRef.current) return;
        isSubmittingRef.current = true;
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
            isSubmittingRef.current = false;
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
            setTimeLeft(parseInt(duration) * 60);
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
        if (user?.targetJob && ROLES.flatMap(r => r.options).includes(user.targetJob)) setRoleInput(user.targetJob);
        fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) })
            .then(r => r.ok ? setBackendOk(true) : setBackendOk(false))
            .catch(() => setBackendOk(false));
    }, [user?.targetJob]);

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
        const baseRole = roleInput.trim() || user?.targetJob || 'Software Developer';
        const typeLabel = INTERVIEW_TYPES.find(t => t.id === interviewType)?.title || 'Technical';
        
        // Enriched role string ensures the AI receives complete context without breaking backend signatures
        const enrichedRole = `${baseRole} - ${typeLabel} Focus`;
        const actualDuration = parseInt(duration) || 30;

        window.scrollTo({ top: 0, behavior: 'smooth' }); // Pin screen to top
        haptic.medium();
        setStatus('in-progress');
        setLoading(true);
        try {
            const bank = await getInterviewQuestionBank(enrichedRole, difficulty);
            setQuestionBank(bank);
            const initMsg = {
                role: 'user',
                content: `Hi, I am ready for the ${difficulty} level ${typeLabel} interview for the ${baseRole} role. We have ${actualDuration} minutes.`
            };
            const response = await conductInterviewStep([initMsg], enrichedRole, difficulty, bank);
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
    // RENDER: WELCOME (Premium Overhaul)
    // ────────────────────────────────────────────────────────────────────────────
    const renderWelcome = () => {
        const isFormValid = roleInput !== '' && interviewType !== '';
        
        // Filter roles based on search term
        const flatRoles = ROLES.flatMap(g => g.options);
        const allRoles = [...new Set([...customRoles, ...flatRoles])];
        const filteredRoles = allRoles.filter(r => r.toLowerCase().includes(roleSearchTerm.toLowerCase()));

        // Icon mapping for interview types
        const typeIcons = {
            behavioral: <Users size={26} />,
            technical: <Code size={26} />,
            system_design: <Layers size={26} />,
            case_study: <BookOpen size={26} />,
            leadership: <Users size={26} />,
            product_thinking: <Lightbulb size={26} />,
            custom: <Edit3 size={26} />
        };

        // Get experience label
        const expLabel = EXPERIENCE_LEVELS.find(e => e.id === experienceLevel);
        const typeLabel = INTERVIEW_TYPES.find(t => t.id === interviewType)?.title || '';
        const questionsEst = duration === '15 min' ? '~5' : duration === '30 min' ? '~10' : duration === '45 min' ? '~15' : duration === '60 min' ? '~20' : duration === '90 min' ? '~30' : '~10';

        return (
            <>
                {/* ═══════════ ROW 1: HERO + SUMMARY ═══════════ */}
                    <div className="ai-row-1">
                        {/* ── HERO CARD ── */}
                        <div className="ai-hero-card ai-glass">
                            <div className="ai-hero-inner">
                                <div className="ai-hero-text">
                                    <h1 className="ai-hero-title">
                                        <span className="ai-gradient-text">AI Mock</span> Interview
                                    </h1>
                                    <p className="ai-hero-subtitle">
                                        Practice and perfect your interview skills with AI-powered personalized interviews and instant feedback.
                                    </p>
                                    <div className="ai-hero-badges">
                                        <div className="ai-hero-badge"><Target size={14} /> Personalized Experience</div>
                                        <div className="ai-hero-badge"><BarChart2 size={14} /> AI-Powered Feedback</div>
                                        <div className="ai-hero-badge"><Mic size={14} /> Real Interview Simulation</div>
                                    </div>
                                </div>
                                <div className="ai-hero-illustration">
                                    <div className="ai-robot-scene">
                                        <div className="ai-robot-glow" />
                                        <svg viewBox="0 0 180 180" width="160" height="160" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            {/* Robot body */}
                                            <rect x="50" y="80" width="80" height="60" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
                                            {/* Laptop */}
                                            <rect x="30" y="130" width="120" height="8" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1"/>
                                            <rect x="55" y="90" width="70" height="40" rx="4" fill="#0ea5e9" opacity="0.2"/>
                                            <rect x="60" y="96" width="40" height="3" rx="1.5" fill="#38bdf8" opacity="0.6"/>
                                            <rect x="60" y="103" width="55" height="3" rx="1.5" fill="#38bdf8" opacity="0.4"/>
                                            <rect x="60" y="110" width="30" height="3" rx="1.5" fill="#38bdf8" opacity="0.3"/>
                                            {/* Robot head */}
                                            <rect x="60" y="30" width="60" height="50" rx="16" fill="#38bdf8"/>
                                            <rect x="60" y="30" width="60" height="50" rx="16" fill="url(#robotGrad)"/>
                                            {/* Eyes */}
                                            <circle cx="78" cy="55" r="6" fill="white"/>
                                            <circle cx="102" cy="55" r="6" fill="white"/>
                                            <circle cx="78" cy="55" r="3" fill="#0f172a"/>
                                            <circle cx="102" cy="55" r="3" fill="#0f172a"/>
                                            <circle cx="79" cy="53.5" r="1.2" fill="white"/>
                                            <circle cx="103" cy="53.5" r="1.2" fill="white"/>
                                            {/* Antenna */}
                                            <line x1="90" y1="30" x2="90" y2="18" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
                                            <circle cx="90" cy="15" r="4" fill="#38bdf8"/>
                                            <circle cx="90" cy="15" r="2" fill="white" opacity="0.8"/>
                                            {/* Arms */}
                                            <rect x="35" y="88" width="18" height="8" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
                                            <rect x="127" y="88" width="18" height="8" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
                                            {/* Mouth */}
                                            <path d="M82 66 Q90 72 98 66" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
                                            {/* Ears */}
                                            <rect x="54" y="45" width="6" height="15" rx="3" fill="#0ea5e9"/>
                                            <rect x="120" y="45" width="6" height="15" rx="3" fill="#0ea5e9"/>
                                            {/* Question bubble */}
                                            <rect x="130" y="20" width="42" height="24" rx="8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
                                            <text x="137" y="37" fill="white" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">Question</text>
                                            <defs>
                                                <linearGradient id="robotGrad" x1="60" y1="30" x2="120" y2="80">
                                                    <stop offset="0%" stopColor="#38bdf8"/>
                                                    <stop offset="100%" stopColor="#6366f1"/>
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── INTERVIEW SUMMARY SIDEBAR ── */}
                        <div className="ai-summary-sidebar ai-glass">
                            <h3 className="ai-summary-title"><Sparkles size={18} /> Interview Summary</h3>
                            <div className="ai-summary-rows">
                                <div className="ai-summary-row">
                                    <div className="ai-summary-icon" style={{color: '#38bdf8'}}><Briefcase size={16} /></div>
                                    <div className="ai-summary-info">
                                        <span className="ai-summary-label">Role</span>
                                        <span className="ai-summary-value">{roleInput || 'Not selected'}</span>
                                    </div>
                                    <Pencil size={14} className="ai-summary-edit" />
                                </div>
                                <div className="ai-summary-row">
                                    <div className="ai-summary-icon" style={{color: '#a78bfa'}}><BarChart2 size={16} /></div>
                                    <div className="ai-summary-info">
                                        <span className="ai-summary-label">Experience</span>
                                        <span className="ai-summary-value">{expLabel ? `${expLabel.label} (${expLabel.sub})` : 'Mid-Level'}</span>
                                    </div>
                                    <Pencil size={14} className="ai-summary-edit" />
                                </div>
                                <div className="ai-summary-row">
                                    <div className="ai-summary-icon" style={{color: '#38bdf8'}}><Code size={16} /></div>
                                    <div className="ai-summary-info">
                                        <span className="ai-summary-label">Type</span>
                                        <span className="ai-summary-value">{typeLabel}</span>
                                    </div>
                                    <Pencil size={14} className="ai-summary-edit" />
                                </div>
                                <div className="ai-summary-row">
                                    <div className="ai-summary-icon" style={{color: '#f472b6'}}><BarChart2 size={16} /></div>
                                    <div className="ai-summary-info">
                                        <span className="ai-summary-label">Difficulty</span>
                                        <span className="ai-summary-value">{difficulty}</span>
                                    </div>
                                    <Pencil size={14} className="ai-summary-edit" />
                                </div>
                                <div className="ai-summary-row">
                                    <div className="ai-summary-icon" style={{color: '#34d399'}}><Clock size={16} /></div>
                                    <div className="ai-summary-info">
                                        <span className="ai-summary-label">Duration</span>
                                        <span className="ai-summary-value">{duration === 'Custom' ? 'Custom' : duration.replace(' min', ' Minutes')}</span>
                                    </div>
                                    <Pencil size={14} className="ai-summary-edit" />
                                </div>
                                <div className="ai-summary-row">
                                    <div className="ai-summary-icon" style={{color: '#fbbf24'}}><HelpCircle size={16} /></div>
                                    <div className="ai-summary-info">
                                        <span className="ai-summary-label">Questions (Est.)</span>
                                        <span className="ai-summary-value">{questionsEst} Questions</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════ ROW 2: HOW IT WORKS + TARGET ROLE + TIPS ═══════════ */}
                    <div className="ai-row-2">
                        {/* ── HOW IT WORKS ── */}
                        <div className="ai-how-card ai-glass">
                            <h3 className="ai-card-title"><Sparkles size={16} /> How it works</h3>
                            <div className="ai-steps">
                                <div className="ai-step">
                                    <div className="ai-step-num" style={{background: 'rgba(56,189,248,0.15)', color:'#38bdf8'}}>1</div>
                                    <div className="ai-step-icon" style={{background:'rgba(56,189,248,0.1)'}}><FileText size={18} color="#38bdf8" /></div>
                                    <div className="ai-step-text">
                                        <strong>Set up your session</strong>
                                        <span>Select your role, interview type, difficulty, experience and duration.</span>
                                    </div>
                                </div>
                                <div className="ai-step">
                                    <div className="ai-step-num" style={{background: 'rgba(52,211,153,0.15)', color:'#34d399'}}>2</div>
                                    <div className="ai-step-icon" style={{background:'rgba(52,211,153,0.1)'}}><MessageSquare size={18} color="#34d399" /></div>
                                    <div className="ai-step-text">
                                        <strong>AI conducts interview</strong>
                                        <span>Answer role-specific questions in real-time with our AI.</span>
                                    </div>
                                </div>
                                <div className="ai-step">
                                    <div className="ai-step-num" style={{background: 'rgba(167,139,250,0.15)', color:'#a78bfa'}}>3</div>
                                    <div className="ai-step-icon" style={{background:'rgba(167,139,250,0.1)'}}><BarChart2 size={18} color="#a78bfa" /></div>
                                    <div className="ai-step-text">
                                        <strong>Get feedback & improve</strong>
                                        <span>Receive detailed analysis, score and personalized suggestions.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── TARGET ROLE ── */}
                        <div className="ai-role-card ai-glass">
                            <h3 className="ai-card-title"><Target size={16} /> Target Role</h3>
                            
                            <div className="ai-select-container" ref={roleDropdownRef}>
                                <div className="ai-role-search-wrap">
                                    <Search size={16} className="ai-role-search-icon" />
                                    <input 
                                        type="text" 
                                        placeholder="Search or select a role..." 
                                        className="ai-role-search-input"
                                        value={isRoleDropdownOpen ? roleSearchTerm : roleInput}
                                        onChange={(e) => { setRoleSearchTerm(e.target.value); if (!isRoleDropdownOpen) setIsRoleDropdownOpen(true); }}
                                        onFocus={() => setIsRoleDropdownOpen(true)}
                                    />
                                    <button className="ai-role-search-btn" onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}>
                                        <Search size={14} />
                                    </button>
                                </div>
                                
                                {isRoleDropdownOpen && (
                                    <div className="ai-select-dropdown">
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {filteredRoles.map(role => (
                                                <div 
                                                    key={role} 
                                                    className={`ai-select-option ${roleInput === role ? 'selected' : ''}`}
                                                    onClick={() => { setRoleInput(role); setIsRoleDropdownOpen(false); setRoleSearchTerm(''); }}
                                                >
                                                    {role}
                                                </div>
                                            ))}
                                            {filteredRoles.length === 0 && !isAddingCustomRole && (
                                                <div style={{ padding: '1rem', color: 'var(--ai-text-dim)', textAlign: 'center', fontSize: '0.9rem' }}>
                                                    No roles found.
                                                </div>
                                            )}
                                        </div>

                                        {!isAddingCustomRole ? (
                                            <button className="ai-add-role-btn" onClick={() => setIsAddingCustomRole(true)}>
                                                <Plus size={16} /> Add Custom Role
                                            </button>
                                        ) : (
                                            <div className="ai-custom-role-input">
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter role title..." 
                                                    value={customRoleInput}
                                                    onChange={e => setCustomRoleInput(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddCustomRole()}
                                                />
                                                <button onClick={handleAddCustomRole}>Add</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>



                            {/* Experience Level */}
                            <div className="ai-exp-section">
                                <h4 className="ai-card-title" style={{marginTop:'0.5rem'}}><BarChart2 size={16} /> Experience Level</h4>
                                <div className="ai-exp-grid">
                                    {EXPERIENCE_LEVELS.map(lvl => (
                                        <button 
                                            key={lvl.id} 
                                            className={`ai-exp-btn ${experienceLevel === lvl.id ? 'active' : ''}`}
                                            onClick={() => setExperienceLevel(lvl.id)}
                                        >
                                            <strong>{lvl.label}</strong>
                                            <span>{lvl.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── TIPS ── */}
                        <div className="ai-tips-card ai-glass">
                            <h3 className="ai-card-title"><Sparkles size={16} color="#fbbf24" /> Tips for a great interview</h3>
                            <div className="ai-tips-list">
                                <div className="ai-tip"><CheckCircle size={16} color="#34d399" /> Speak clearly and confidently</div>
                                <div className="ai-tip"><CheckCircle size={16} color="#34d399" /> Take your time to think</div>
                                <div className="ai-tip"><CheckCircle size={16} color="#34d399" /> Be honest and specific</div>
                                <div className="ai-tip"><CheckCircle size={16} color="#34d399" /> Ask for clarification if needed</div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════ ROW 3: INTERVIEW TYPE ═══════════ */}
                    <div className="ai-row-3 ai-glass">
                        <h3 className="ai-card-title"><Sparkles size={16} /> Interview Type</h3>
                        <div className="ai-type-horizontal">
                            {INTERVIEW_TYPES.map(type => (
                                <button 
                                    key={type.id}
                                    className={`ai-type-card-h ${interviewType === type.id ? 'active' : ''}`}
                                    onClick={() => setInterviewType(type.id)}
                                >
                                    <div className="ai-type-icon-h">
                                        {typeIcons[type.id]}
                                    </div>
                                    <strong>{type.title}</strong>
                                    <span>{type.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ═══════════ ROW 4: DIFFICULTY + DURATION ═══════════ */}
                    <div className="ai-row-4">
                        <div className="ai-diff-card ai-glass">
                            <h3 className="ai-card-title"><BarChart2 size={16} /> Difficulty Level</h3>
                            <div className="ai-segmented-control">
                                {DIFFICULTIES.map(diff => (
                                    <button 
                                        key={diff}
                                        className={`ai-segment-btn ${difficulty === diff ? 'active' : ''}`}
                                        onClick={() => setDifficulty(diff)}
                                    >
                                        {diff} {diff === 'Expert' && '🔥'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="ai-dur-card ai-glass">
                            <h3 className="ai-card-title"><Clock size={16} /> Duration</h3>
                            <div className="ai-segmented-control">
                                {DURATIONS.map(dur => (
                                    <button 
                                        key={dur}
                                        className={`ai-segment-btn ${duration === dur ? 'active' : ''}`}
                                        onClick={() => setDuration(dur)}
                                    >
                                        {dur} {dur === 'Custom' && <Pencil size={12} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ═══════════ ROW 5: START BUTTON ═══════════ */}
                    <button 
                        className="ai-start-btn" 
                        disabled={!isFormValid || loading}
                        onClick={startInterview}
                        style={{ gap: '0.5rem' }}
                    >
                        <Sparkles size={20} />
                        <span>{loading ? 'Initializing...' : 'Start Interview'}</span>
                        <ArrowRight size={20} style={{ position: 'absolute', right: '1.5rem' }} />
                    </button>
                    
                    <div className="ai-privacy">
                        <ShieldCheck size={16} /> Your interview sessions are private and used only for personalized feedback and performance analysis.
                    </div>
                    
                    <footer className="app-footer" style={{ background: 'transparent', borderTop: 'none', padding: '2rem 0 0 0', marginTop: 'auto' }}>
                        <div>&copy; {new Date().getFullYear()} Daksh.AI by Shaurya. All rights reserved.</div>
                        <div className="footer-links">
                            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                            <span className="dot">•</span>
                            <Link to="/terms" className="footer-link">Terms & Conditions</Link>
                        </div>
                    </footer>
            </>
        );
    };

    // ────────────────────────────────────────────────────────────────────────────
    // RENDER: IN-PROGRESS (Two-Panel Layout)
    // ────────────────────────────────────────────────────────────────────────────
    const renderInterview = () => (
        <div className="interview-dual-panel">

            {/* ── LEFT: AI Recruiter ── */}
            <div className="recruiter-panel">
                <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--ai-text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                    YOUR INTERVIEWER
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--ai-text-main)', marginBottom: '0.25rem' }}>
                    DAKSH-AI
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ai-text-dim)', marginBottom: '1.5rem' }}>
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
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--ai-text-main)' }}>Interview Session</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ai-text-dim)' }}>
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
                                <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--ai-primary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
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
                            <span style={{ fontSize: '0.8rem', color: 'var(--ai-text-dim)' }}>Thinking...</span>
                        </div>
                    )}
                </div>

                {/* Voice Control Footer */}
                <div className="voice-control-bar">
                    <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: '700', color: 'var(--ai-text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
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
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--ai-text-main)', margin: 0 }}>
                        Interview Report Card
                    </h2>
                </div>
                <p style={{ color: 'var(--ai-text-dim)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
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
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--ai-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Overall AI Score</div>
                </div>

                {/* Radar Chart */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--ai-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
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
                                {strengths.map(s => <div key={s} style={{ fontSize: '0.8rem', color: 'var(--ai-text-main)', padding: '2px 0' }}>• {s}</div>)}
                            </div>
                        )}
                        {improvements.length > 0 && (
                            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'left' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', marginBottom: '0.5rem' }}>📈 Improve</div>
                                {improvements.map(s => <div key={s} style={{ fontSize: '0.8rem', color: 'var(--ai-text-main)', padding: '2px 0' }}>• {s}</div>)}
                            </div>
                        )}
                    </div>
                )}

                {/* Coaching feedback */}
                {sc.feedback && (
                    <div style={{
                        padding: '1.25rem', borderRadius: '14px', marginBottom: '1.5rem',
                        background: 'var(--ai-card-bg)', border: '1px solid var(--ai-card-border)',
                        color: 'var(--ai-text-dim)', fontSize: '0.88rem', lineHeight: '1.65', textAlign: 'left'
                    }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingUp size={13} /> AI Coaching Feedback
                        </div>
                        {sc.feedback}
                    </div>
                )}

                <button className="ai-start-btn" style={{ marginTop: '1.5rem' }}
                    onClick={() => { window.speechSynthesis?.cancel(); currentAudioRef.current?.pause(); setStatus('welcome'); setMessages([]); setScorecard(null); }}>
                    <RefreshCcw size={20} style={{ marginRight: '8px' }} /> Try Another Interview
                </button>
            </div>
        );
    };

    return (
        <div className="ai-mock-page">
            <div className="ai-mock-container">
                {status === 'welcome' && renderWelcome()}
                {status === 'in-progress' && renderInterview()}
                {status === 'end' && renderEnd()}
            </div>
        </div>
    );
};

export default InterviewPrep;
