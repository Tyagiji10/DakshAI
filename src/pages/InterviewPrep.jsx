import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { conductInterviewStep, getInterviewQuestionBank, getRecommendedInterviewTypes } from '../lib/ai';
import {
    AlertCircle, RefreshCcw, Clock, Mic, MicOff, MessageSquare,
    Volume2, VolumeX, BrainCircuit, ChevronRight, Trophy, TrendingUp, Zap, Award, Search, Plus, ShieldCheck, Target, BarChart2, Sparkles, FileText, Lightbulb, Briefcase, FolderPlus, User, Code, Star, Layers, BookOpen, Edit3, CheckCircle, Pencil, ArrowRight, Users, HelpCircle
} from 'lucide-react';
import { haptic } from '../lib/haptics';
import { useNavigate, Link } from 'react-router-dom';
import './InterviewPrep.css';

const BACKEND_URL = 'http://localhost:5001';

const ROLES = [
    'Software Developer',
    'Full Stack Developer',
    'Data Scientist',
    'AI/ML Engineer',
    'Cybersecurity Analyst',
    'Cloud Engineer',
    'DevOps Engineer',
    'Mobile App Developer',
    'UI/UX Designer',
    'Database Administrator (DBA)',
    'Network Engineer',
    'Embedded Systems Engineer',
    'VLSI Design Engineer',
    'PCB Design Engineer',
    'Telecom Engineer',
    'Mechanical Design Engineer',
    'Production Engineer',
    'Quality Assurance Engineer',
    'Maintenance Engineer',
    'Supply Chain Analyst',
    'Business Analyst',
    'Marketing Manager',
    'Human Resources (HR) Manager',
    'Financial Analyst',
    'Chartered Accountant (CA)'
];

const INTERVIEW_TYPES = [
    { id: 'behavioral', title: 'Behavioral', description: 'Soft skills, past experiences', icon: 'Users' },
    { id: 'technical', title: 'Technical / Coding', description: 'Coding, data structures', icon: 'Code' },
    { id: 'system_design', title: 'System Design', description: 'Architecture, scalability', icon: 'Layers' },
    { id: 'case_study', title: 'Case Study', description: 'Business case analysis', icon: 'BookOpen' },
    { id: 'leadership', title: 'Leadership', description: 'Leadership & management', icon: 'Users' },
    { id: 'product_thinking', title: 'Product Thinking', description: 'Product sense & strategy', icon: 'Lightbulb' }
];

const EXPERIENCE_LEVELS = [
    { id: 'fresher', label: 'Fresher', sub: '0-1 Year' },
    { id: 'mid', label: 'Mid-Level', sub: '1-5 Years' },
    { id: 'senior', label: 'Senior', sub: '5+ Years' }
];



const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const DURATIONS = ['30 min', '60 min', '90 min'];


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
const AIRecruiter = React.memo(({ isSpeaking, isListening, mousePos = { x: 0, y: 0 } }) => (
    <div className="ai-recruiter-wrapper">
        <div className="recruiter-blob blob-1" />
        <div className="recruiter-blob blob-2" />
        <div className="recruiter-blob blob-3" />

        {/* AIRecruiter Avatar 3D-Style */}
        <div className={`recruiter-avatar ${isSpeaking ? 'speaking' : ''}`}>
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" className="recruiter-animated-svg">
                <defs>
                    <linearGradient id="robotHeadGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#e2e8f0" />
                    </linearGradient>
                    <linearGradient id="visorGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <filter id="glow2" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                <circle cx="100" cy="100" r="85" stroke="#38bdf8" strokeWidth="2" strokeDasharray="20 10 40 10"
                    className={`bot-ring ${isListening ? 'listening-ring' : ''}`} opacity="0.3" />

                <g className={`bot-head-group ${isSpeaking ? 'bot-bounce' : 'bot-float'}`}>
                    {/* Body top peeking from bottom */}
                    <rect x="65" y="150" width="70" height="50" rx="20" fill="#e2e8f0" />

                    {/* Head */}
                    <rect x="35" y="50" width="130" height="100" rx="50" fill="url(#robotHeadGrad2)" />

                    {/* Headphones */}
                    <rect x="25" y="80" width="20" height="50" rx="10" fill="#3b82f6" />
                    <circle cx="20" cy="105" r="15" fill="#4f46e5" />
                    <circle cx="20" cy="105" r="6" fill="#38bdf8" filter="url(#glow2)" />

                    <rect x="155" y="80" width="20" height="50" rx="10" fill="#3b82f6" />
                    <circle cx="180" cy="105" r="15" fill="#4f46e5" />
                    <circle cx="180" cy="105" r="6" fill="#38bdf8" filter="url(#glow2)" />

                    {/* Visor */}
                    <rect x="45" y="70" width="110" height="65" rx="30" fill="url(#visorGrad2)" />

                    {/* Eyes */}
                    <g className={`hero-robot-eyes ${isListening ? 'bot-eyes-listen' : 'bot-eyes-blink'}`}>
                        {/* Eye Backgrounds */}
                        <ellipse cx="75" cy="95" rx="10" ry="14" fill={isSpeaking ? "#fbbf24" : "#38bdf8"} filter="url(#glow2)" />
                        <ellipse cx="125" cy="95" rx="10" ry="14" fill={isSpeaking ? "#fbbf24" : "#38bdf8"} filter="url(#glow2)" />

                        {/* Black Pupils tracking cursor */}
                        <g style={{ transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)`, transition: 'transform 0.1s ease-out' }}>
                            <ellipse cx="75" cy="95" rx="4" ry="6" fill="#0f172a" />
                            <ellipse cx="125" cy="95" rx="4" ry="6" fill="#0f172a" />
                        </g>
                    </g>

                    {/* Speaking Soundwave or Smile */}
                    {isSpeaking ? (
                        <g className="bot-soundwave" transform="translate(15, 5)">
                            <rect x="70" y="115" width="4" height="6" rx="2" fill="#fbbf24" filter="url(#glow2)" />
                            <rect x="80" y="113" width="4" height="10" rx="2" fill="#fbbf24" filter="url(#glow2)" />
                            <rect x="90" y="111" width="4" height="14" rx="2" fill="#fbbf24" filter="url(#glow2)" />
                            <rect x="100" y="109" width="4" height="18" rx="2" fill="#fbbf24" filter="url(#glow2)" />
                            <rect x="110" y="111" width="4" height="14" rx="2" fill="#fbbf24" filter="url(#glow2)" />
                            <rect x="120" y="113" width="4" height="10" rx="2" fill="#fbbf24" filter="url(#glow2)" />
                            <rect x="130" y="115" width="4" height="6" rx="2" fill="#fbbf24" filter="url(#glow2)" />
                        </g>
                    ) : (
                        <path d="M 90 115 Q 100 125 110 115" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#glow2)" />
                    )}
                </g>
            </svg>
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

    // Dynamic Interview Types State
    const [availableInterviewTypes, setAvailableInterviewTypes] = useState(INTERVIEW_TYPES);
    const [isTypesLoading, setIsTypesLoading] = useState(false);

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

    // ── AI Dynamic Interview Types Fetcher ──
    useEffect(() => {
        const fetchTypes = async () => {
            const roleToUse = roleInput.trim() || user?.targetJob || 'Software Developer';
            setIsTypesLoading(true);
            try {
                const aiSuggestions = await getRecommendedInterviewTypes(roleToUse, experienceLevel);
                
                // Map AI suggestions back to full UI objects
                const mappedTypes = aiSuggestions.map(sug => {
                    const baseType = INTERVIEW_TYPES.find(t => t.id === sug.id);
                    return baseType ? { ...baseType, recommended: sug.recommended } : null;
                }).filter(Boolean);
                
                setAvailableInterviewTypes(mappedTypes);
                
                // If currently selected type is no longer available, select the recommended or first
                setInterviewType(prev => {
                    if (!mappedTypes.find(t => t.id === prev)) {
                        const rec = mappedTypes.find(t => t.recommended);
                        return rec ? rec.id : mappedTypes[0].id;
                    }
                    return prev;
                });
            } catch (err) {
                console.error('Failed to fetch interview types:', err);
                setAvailableInterviewTypes(INTERVIEW_TYPES);
            } finally {
                setIsTypesLoading(false);
            }
        };

        // Debounce to prevent multiple rapid API calls during typing/initialization
        const timeoutId = setTimeout(() => {
            fetchTypes();
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [roleInput, experienceLevel, user?.targetJob]);

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
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 15;
            const y = (e.clientY / window.innerHeight - 0.5) * 15;
            setMousePos({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
    const recognitionRef = useRef(null);

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

        // Instant UI feedback & lock to prevent double-firing
        isListeningRef.current = true;
        setIsListening(true);

        // Use backendOk state (checked on mount/TTS) instead of a fresh probe
        // This ensures synchronous execution for window.SpeechRecognition fallback!
        const supportsBackend = backendOk !== false;

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
                    isListeningRef.current = false;
                    setLoading(true);
                    isLoadingRef.current = true;
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
                        isLoadingRef.current = false;
                    }
                };

                mediaRecorderRef.current = recorder;
                recorder.start(200); // collect data every 200ms
                // Auto-stop after 5 seconds of silence
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioCtx.createAnalyser();
                const micSource = audioCtx.createMediaStreamSource(stream);
                micSource.connect(analyser);
                analyser.fftSize = 256;
                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                let silenceTimer = null;
                const resetSilence = () => {
                    clearTimeout(silenceTimer);
                    silenceTimer = setTimeout(() => {
                        if (mediaRecorderRef.current?.state === 'recording') {
                            mediaRecorderRef.current.stop();
                        }
                    }, 5000); // 5 seconds of silence
                };

                const checkAudio = () => {
                    if (mediaRecorderRef.current?.state !== 'recording') return;
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    if (avg > 15) resetSilence(); // Reset timer if sound detected
                    requestAnimationFrame(checkAudio);
                };
                resetSilence();
                checkAudio();

            } catch (e) {
                console.error('Mic access denied:', e);
                setIsListening(false);
                isListeningRef.current = false;
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
            rec.onerror = () => { setIsListening(false); isListeningRef.current = false; };
            rec.onend = () => { setIsListening(false); isListeningRef.current = false; };
            recognitionRef.current = rec;
            rec.start();
        }
    }, [backendOk, loading, isSpeaking, isListening]);

    const stopListening = useCallback(() => {
        setIsListening(false);
        isListeningRef.current = false;

        if (mediaRecorderRef.current?.state === 'recording') {
            // Instantly lock UI to prevent rapid double clicks before async onstop fires
            setLoading(true);
            isLoadingRef.current = true;
            mediaRecorderRef.current.stop();
        } else if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
            recognitionRef.current = null;
        }
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
        if (user?.targetJob && ROLES.includes(user.targetJob)) setRoleInput(user.targetJob);
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
        const flatRoles = ROLES;
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
        const questionsEst = duration === '30 min' ? '~10' : duration === '60 min' ? '~20' : duration === '90 min' ? '~30' : '~10';

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
                                    {/* Detailed 3D-like Robot SVG Illustration */}
                                    <svg viewBox="0 0 400 300" width="100%" height="240" fill="none" xmlns="http://www.w3.org/2000/svg" className="animated-ai-hero" style={{ maxWidth: '400px' }}>
                                        <defs>
                                            <linearGradient id="robotBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ffffff" />
                                                <stop offset="100%" stopColor="#94a3b8" />
                                            </linearGradient>
                                            <linearGradient id="robotHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ffffff" />
                                                <stop offset="100%" stopColor="#e2e8f0" />
                                            </linearGradient>
                                            <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#0f172a" />
                                                <stop offset="100%" stopColor="#1e293b" />
                                            </linearGradient>
                                            <linearGradient id="laptopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#312e81" />
                                                <stop offset="100%" stopColor="#1e1b4b" />
                                            </linearGradient>
                                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="4" result="blur" />
                                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                            </filter>
                                        </defs>

                                        {/* Floor Concentric Rings */}
                                        <g className="hero-floor-rings" opacity="0.4">
                                            <ellipse cx="200" cy="270" rx="160" ry="30" stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.1" />
                                            <ellipse cx="200" cy="270" rx="120" ry="22" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.3" />
                                            <ellipse cx="200" cy="270" rx="80" ry="15" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.5" />
                                            <ellipse cx="200" cy="270" rx="40" ry="8" stroke="#38bdf8" strokeWidth="3" fill="none" opacity="0.8" />
                                        </g>

                                        {/* Floating Elements (Background) */}
                                        <g className="hero-float-slow bubble-1">
                                            {/* Chat Bubble Left */}
                                            <path d="M 40 70 Q 40 50 60 50 L 100 50 Q 120 50 120 70 L 120 90 Q 120 110 100 110 L 80 110 L 60 130 L 60 110 Q 40 110 40 90 Z" fill="#3b82f6" opacity="0.9" filter="url(#glow)" />
                                            <rect x="55" y="65" width="50" height="4" rx="2" fill="#fff" />
                                            <rect x="55" y="75" width="35" height="4" rx="2" fill="#fff" />
                                            <rect x="55" y="85" width="45" height="4" rx="2" fill="#fff" />
                                        </g>

                                        <g className="hero-float-med bubble-2" transform="translate(250, 40)">
                                            {/* Chart Box Right */}
                                            <rect x="0" y="0" width="110" height="70" rx="8" fill="#1e1b4b" opacity="0.8" stroke="#4f46e5" strokeWidth="2" />
                                            <rect x="15" y="45" width="10" height="15" rx="3" fill="#38bdf8" />
                                            <rect x="35" y="30" width="10" height="30" rx="3" fill="#60a5fa" />
                                            <rect x="55" y="20" width="10" height="40" rx="3" fill="#818cf8" />
                                            <rect x="75" y="40" width="10" height="20" rx="3" fill="#38bdf8" />
                                            <rect x="95" y="25" width="10" height="35" rx="3" fill="#6366f1" />
                                            <circle cx="95" cy="15" r="4" fill="#38bdf8" filter="url(#glow)" />
                                        </g>

                                        {/* Main Robot Assembly (Floats slightly) */}
                                        <g className="hero-floating-bot">
                                            {/* Shadow on floor */}
                                            <ellipse cx="200" cy="270" rx="50" ry="10" fill="#38bdf8" opacity="0.15" className="hero-shadow" />

                                            {/* Body */}
                                            <rect x="160" y="160" width="80" height="90" rx="30" fill="url(#robotBodyGrad)" />
                                            <circle cx="200" cy="195" r="14" fill="#0f172a" />
                                            <circle cx="200" cy="195" r="10" stroke="#38bdf8" strokeWidth="2" fill="none" filter="url(#glow)" />

                                            {/* Arms */}
                                            <path d="M 165 180 Q 130 200 150 250" stroke="url(#robotBodyGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />
                                            <path d="M 235 180 Q 270 200 250 250" stroke="url(#robotBodyGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />

                                            {/* Head */}
                                            <g className="hero-robot-head">
                                                <rect x="135" y="60" width="130" height="100" rx="50" fill="url(#robotHeadGrad)" />

                                                {/* Headphones */}
                                                <rect x="125" y="90" width="20" height="50" rx="10" fill="#3b82f6" />
                                                <circle cx="120" cy="115" r="15" fill="#4f46e5" />
                                                <circle cx="120" cy="115" r="6" fill="#38bdf8" filter="url(#glow)" />

                                                <rect x="255" y="90" width="20" height="50" rx="10" fill="#3b82f6" />
                                                <circle cx="280" cy="115" r="15" fill="#4f46e5" />
                                                <circle cx="280" cy="115" r="6" fill="#38bdf8" filter="url(#glow)" />

                                                {/* Visor */}
                                                <rect x="145" y="80" width="110" height="65" rx="30" fill="url(#visorGrad)" />

                                                {/* Eyes */}
                                                <g className="hero-eyes">
                                                    {/* Eye Backgrounds */}
                                                    <ellipse cx="175" cy="105" rx="10" ry="14" fill="#38bdf8" filter="url(#glow)" />
                                                    <ellipse cx="225" cy="105" rx="10" ry="14" fill="#38bdf8" filter="url(#glow)" />

                                                    {/* Black Pupils tracking cursor */}
                                                    <g style={{ transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)`, transition: 'transform 0.1s ease-out' }}>
                                                        <ellipse cx="175" cy="105" rx="4" ry="6" fill="#0f172a" />
                                                        <ellipse cx="225" cy="105" rx="4" ry="6" fill="#0f172a" />
                                                    </g>
                                                </g>

                                                {/* Smile */}
                                                <path d="M 190 125 Q 200 135 210 125" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#glow)" />
                                            </g>
                                        </g>

                                        {/* Laptop Foreground */}
                                        <g className="hero-laptop" transform="translate(0, 5)">
                                            <polygon points="120,280 280,280 260,290 140,290" fill="#0f172a" />
                                            <polygon points="135,280 265,280 245,180 155,180" fill="url(#laptopGrad)" stroke="#334155" strokeWidth="2" strokeLinejoin="round" />
                                            {/* Glowing Star Logo */}
                                            <path d="M 200 210 Q 200 230 185 230 Q 200 230 200 250 Q 200 230 215 230 Q 200 230 200 210 Z" fill="#38bdf8" filter="url(#glow)" />
                                        </g>

                                        <g className="hero-float-fast bubble-1" transform="translate(240, 160)">
                                            {/* Question Box Right */}
                                            <rect x="0" y="0" width="140" height="60" rx="8" fill="#312e81" opacity="0.9" stroke="#6366f1" strokeWidth="1.5" />
                                            <text x="15" y="25" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="Inter, sans-serif">Question</text>
                                            <rect x="15" y="35" width="80" height="4" rx="2" fill="#818cf8" />
                                            <rect x="15" y="45" width="60" height="4" rx="2" fill="#818cf8" />
                                            <circle cx="115" cy="30" r="12" fill="#3b82f6" filter="url(#glow)" />
                                            <text x="111" y="35" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="Inter, sans-serif">?</text>
                                        </g>

                                        {/* Sparkles */}
                                        <g fill="#38bdf8" filter="url(#glow)">
                                            <circle cx="170" cy="30" r="2" className="hero-sparkle-1 bubble-1" />
                                            <circle cx="180" cy="40" r="1.5" className="hero-sparkle-2 bubble-2" />
                                            <circle cx="230" cy="50" r="2.5" className="hero-sparkle-1 bubble-1" />
                                        </g>
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
                                <div className="ai-summary-icon" style={{ color: '#38bdf8' }}><Briefcase size={16} /></div>
                                <div className="ai-summary-info">
                                    <span className="ai-summary-label">Role</span>
                                    <span className="ai-summary-value">{roleInput || 'Not selected'}</span>
                                </div>
                                <Pencil size={14} className="ai-summary-edit" />
                            </div>
                            <div className="ai-summary-row">
                                <div className="ai-summary-icon" style={{ color: '#a78bfa' }}><BarChart2 size={16} /></div>
                                <div className="ai-summary-info">
                                    <span className="ai-summary-label">Experience</span>
                                    <span className="ai-summary-value">{expLabel ? `${expLabel.label} (${expLabel.sub})` : 'Mid-Level'}</span>
                                </div>
                                <Pencil size={14} className="ai-summary-edit" />
                            </div>
                            <div className="ai-summary-row">
                                <div className="ai-summary-icon" style={{ color: '#38bdf8' }}><Code size={16} /></div>
                                <div className="ai-summary-info">
                                    <span className="ai-summary-label">Type</span>
                                    <span className="ai-summary-value">{typeLabel}</span>
                                </div>
                                <Pencil size={14} className="ai-summary-edit" />
                            </div>
                            <div className="ai-summary-row">
                                <div className="ai-summary-icon" style={{ color: '#f472b6' }}><BarChart2 size={16} /></div>
                                <div className="ai-summary-info">
                                    <span className="ai-summary-label">Difficulty</span>
                                    <span className="ai-summary-value">{difficulty}</span>
                                </div>
                                <Pencil size={14} className="ai-summary-edit" />
                            </div>
                            <div className="ai-summary-row">
                                <div className="ai-summary-icon" style={{ color: '#34d399' }}><Clock size={16} /></div>
                                <div className="ai-summary-info">
                                    <span className="ai-summary-label">Duration</span>
                                    <span className="ai-summary-value">{duration.replace(' min', ' Minutes')}</span>
                                </div>
                                <Pencil size={14} className="ai-summary-edit" />
                            </div>
                            <div className="ai-summary-row">
                                <div className="ai-summary-icon" style={{ color: '#fbbf24' }}><HelpCircle size={16} /></div>
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
                                <div className="ai-step-num" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>1</div>
                                <div className="ai-step-icon" style={{ background: 'rgba(56,189,248,0.1)' }}><FileText size={18} color="#38bdf8" /></div>
                                <div className="ai-step-text">
                                    <strong>Set up your session</strong>
                                    <span>Select your role, interview type, difficulty, experience and duration.</span>
                                </div>
                            </div>
                            <div className="ai-step">
                                <div className="ai-step-num" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>2</div>
                                <div className="ai-step-icon" style={{ background: 'rgba(52,211,153,0.1)' }}><MessageSquare size={18} color="#34d399" /></div>
                                <div className="ai-step-text">
                                    <strong>AI conducts interview</strong>
                                    <span>Answer role-specific questions in real-time with our AI.</span>
                                </div>
                            </div>
                            <div className="ai-step">
                                <div className="ai-step-num" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>3</div>
                                <div className="ai-step-icon" style={{ background: 'rgba(167,139,250,0.1)' }}><BarChart2 size={18} color="#a78bfa" /></div>
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
                            <h4 className="ai-card-title" style={{ marginTop: '0.5rem' }}><BarChart2 size={16} /> Experience Level</h4>
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

                {/* ═══════════ DESKTOP SPLIT LAYOUT ═══════════ */}
                <div className="ai-desktop-split">
                    {/* ═══════════ ROW 3: INTERVIEW TYPE ═══════════ */}
                    <div className="ai-row-3 ai-glass">
                    <h3 className="ai-card-title"><Sparkles size={16} /> Interview Type</h3>
                    
                    {isTypesLoading ? (
                        <div className="ai-type-loading" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ai-text-dim)' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: '1rem' }}>
                                {[0, 0.15, 0.3].map((d, i) => (
                                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: `bounce 1s ease-in-out ${d}s infinite` }} />
                                ))}
                            </div>
                            <span style={{ fontSize: '0.9rem' }}>Analyzing role for optimal interview types...</span>
                        </div>
                    ) : (
                        <div className="ai-type-horizontal" style={{ flex: 1, alignContent: 'flex-start' }}>
                            {availableInterviewTypes.map(type => (
                                <button
                                    key={type.id}
                                    className={`ai-type-card-h ${interviewType === type.id ? 'active' : ''}`}
                                    onClick={() => setInterviewType(type.id)}
                                    style={{ position: 'relative' }}
                                >
                                    {type.recommended && (
                                        <div style={{ 
                                            position: 'absolute', top: '-10px', right: '-10px', 
                                            background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                                            color: '#fff', fontSize: '0.65rem', padding: '3px 8px', 
                                            borderRadius: '12px', fontWeight: '800', 
                                            display: 'flex', alignItems: 'center', gap: '3px', 
                                            boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)',
                                            zIndex: 5
                                        }}>
                                            <Star size={10} fill="currentColor" /> Recommended
                                        </div>
                                    )}
                                    <div className="ai-type-icon-h">
                                        {typeIcons[type.id]}
                                    </div>
                                    <strong>{type.title}</strong>
                                    <span>{type.description}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ═══════════ ROW 4 & TIPS: MOBILE SPLIT LAYOUT ═══════════ */}
                <div className="ai-mobile-split">
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
                                        {diff}
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
                                        {dur}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ═══════════ TIPS (MOBILE ONLY) ═══════════ */}
                    <div className="ai-tips-mobile ai-glass">
                        <h3 className="ai-card-title"><Sparkles size={16} color="#fbbf24" /> Tips for a great interview</h3>
                        <div className="ai-tips-list">
                            <div className="ai-tip"><CheckCircle size={16} color="#34d399" /> Speak clearly and confidently</div>
                            <div className="ai-tip"><CheckCircle size={16} color="#34d399" /> Take your time to think</div>
                            <div className="ai-tip"><CheckCircle size={16} color="#34d399" /> Be honest and specific</div>
                            <div className="ai-tip"><CheckCircle size={16} color="#34d399" /> Ask for clarification if needed</div>
                        </div>
                    </div>
                </div>
                {/* ═══════════ END DESKTOP SPLIT LAYOUT ═══════════ */}
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
                <div className="interviewer-label">
                    YOUR INTERVIEWER
                </div>
                <div className="interviewer-name">
                    DAKSH-AI
                </div>
                <div className="interviewer-role">
                    Senior Talent Acquisition Lead
                </div>

                <AIRecruiter isSpeaking={isSpeaking} isListening={isListening} mousePos={mousePos} />

                {/* Difficulty badge */}
                <div className="interviewer-difficulty" style={{
                    background: difficulty === 'Easy' ? 'rgba(59,130,246,0.2)' : difficulty === 'Hard' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                    color: difficulty === 'Easy' ? '#93c5fd' : difficulty === 'Hard' ? '#fca5a5' : '#6ee7b7'
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
                    <div className="mic-btn-wrapper">
                        <button
                            onPointerDown={(e) => {
                                e.preventDefault();
                                if (loading || (isSpeaking && !isListening)) return;
                                isListening ? stopListening() : startListening();
                            }}
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
        <div className={`ai-mock-page ${status === 'in-progress' ? 'interview-active' : ''}`}>
            <div className="ai-mock-container">
                {status === 'welcome' && renderWelcome()}
                {status === 'in-progress' && renderInterview()}
                {status === 'end' && renderEnd()}
            </div>
        </div>
    );
};

export default InterviewPrep;
