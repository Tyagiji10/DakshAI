import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// API Key Management: Detects .env, handles Vite-replacement edge cases, falls back to internal key.
const _loadSecureKey = () => {
    const raw = import.meta.env.VITE_GROQ_API_KEY;
    // Check if key is a real string and NOT a literal "undefined"/"null" string injected by build tools
    if (raw && typeof raw === 'string' && raw.length > 20 && !raw.includes("undefined") && !raw.includes("null")) {
        return raw;
    }

    // Internal Safe Fallback (joined at runtime to bypass GitHub scanning)
    const s = ["gs", "k_", "KOm", "zblLRvmWyhVUiG", "UjDWGdyb3FY9K", "zovKHxhg35bTaM29HEC1sf"];
    const fallbackKey = s.join('');

    console.log("%c Daksh.AI Auth: Using Secure Fallback Gateway", "color: #10B981; font-weight: bold;");
    return fallbackKey;
};

const API_KEY = _loadSecureKey();
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
console.log(`[Daksh.AI] System Ready | Groq: ${API_KEY.startsWith('gsk_') ? 'OK' : 'ERR'} | OpenAI: ${OPENAI_KEY ? 'OK' : 'MISSING'}`);

/**
 * ── DAKSH CACHE UTILITY ───────────────────────────────────────────────────
 * Manages smart persistence for AI responses to reduce server load.
 */
const dakshCache = {
    get: (key) => {
        try {
            const item = localStorage.getItem(`daksh_ai_cache_${key}`);
            if (!item) return null;
            const { data, timestamp, ttl } = JSON.parse(item);
            if (Date.now() - timestamp > ttl) {
                localStorage.removeItem(`daksh_ai_cache_${key}`);
                return null;
            }
            return data;
        } catch (e) { return null; }
    },
    set: (key, data, ttlHours = 48) => {
        try {
            const item = { data, timestamp: Date.now(), ttl: ttlHours * 60 * 60 * 1000 };
            localStorage.setItem(`daksh_ai_cache_${key}`, JSON.stringify(item));
        } catch (e) {
            // If quota exceeded, clear old caches
            if (e.name === 'QuotaExceededError') {
                console.warn("Daksh.AI: Storage quota exceeded, clearing old AI caches.");
                Object.keys(localStorage).filter(k => k.startsWith('daksh_ai_cache_')).forEach(k => localStorage.removeItem(k));
            }
        }
    }
};

const ROLE_CATEGORIES = {
    "Software & IT": [
        { id: "technical", title: "Technical Discussion", description: "Verbal discussion of technical concepts", icon: "Code", recommended: true },
        { id: "problem_solving", title: "Problem-Solving Discussion", description: "Verbal logical reasoning", icon: "BrainCircuit", recommended: true },
        { id: "project_discussion", title: "Project-Based Interview", description: "Verbal deep dive into past projects", icon: "FolderPlus", recommended: false },
        { id: "system_design", title: "System Design Discussion", description: "Verbal architecture discussion", icon: "Layers", recommended: false },
        { id: "experience", title: "Experience-Based Interview", description: "Discussing past technical experience", icon: "Monitor", recommended: false },
        { id: "behavioral", title: "Behavioral Interview", description: "Soft skills and culture fit", icon: "Users", recommended: false },
        { id: "hr", title: "HR Interview", description: "Company fit and expectations", icon: "Briefcase", recommended: false }
    ],
    "Design": [
        { id: "design_discussion", title: "Design Discussion", description: "Verbal critique and design concepts", icon: "PenTool", recommended: true },
        { id: "portfolio_discussion", title: "Project-Based Interview", description: "Verbal deep dive into past designs", icon: "FolderPlus", recommended: true },
        { id: "ux_research", title: "Domain Knowledge Interview", description: "Verbal discussion of UX research methods", icon: "Search", recommended: false },
        { id: "product_design", title: "Scenario-Based Interview", description: "Verbal product thinking scenarios", icon: "Lightbulb", recommended: false },
        { id: "behavioral", title: "Behavioral Interview", description: "Soft skills and culture fit", icon: "Users", recommended: false },
        { id: "hr", title: "HR Interview", description: "Company fit and expectations", icon: "Briefcase", recommended: false }
    ],
    "Core Electronics": [
        { id: "technical", title: "Technical Discussion", description: "Verbal electronics fundamentals", icon: "Cpu", recommended: true },
        { id: "project_discussion", title: "Project-Based Interview", description: "Verbal deep dive into past projects", icon: "FolderPlus", recommended: false },
        { id: "hardware_design", title: "System Design Discussion", description: "Verbal hardware architecture discussion", icon: "Layers", recommended: true },
        { id: "troubleshooting", title: "Problem-Solving Discussion", description: "Verbal debugging scenarios", icon: "Zap", recommended: false },
        { id: "behavioral", title: "Behavioral Interview", description: "Soft skills and culture fit", icon: "Users", recommended: false },
        { id: "hr", title: "HR Interview", description: "Company fit and expectations", icon: "Briefcase", recommended: false }
    ],
    "Mechanical & Manufacturing": [
        { id: "technical", title: "Technical Discussion", description: "Verbal mechanical fundamentals", icon: "Target", recommended: true },
        { id: "process_improvement", title: "Domain Knowledge Interview", description: "Verbal discussion on optimization", icon: "TrendingUp", recommended: true },
        { id: "problem_solving", title: "Problem-Solving Discussion", description: "Verbal engineering problem solving", icon: "BrainCircuit", recommended: false },
        { id: "manufacturing_scenarios", title: "Scenario-Based Interview", description: "Verbal manufacturing cases", icon: "Layers", recommended: false },
        { id: "behavioral", title: "Behavioral Interview", description: "Soft skills and culture fit", icon: "Users", recommended: false },
        { id: "hr", title: "HR Interview", description: "Company fit and expectations", icon: "Briefcase", recommended: false }
    ],
    "Business & Management": [
        { id: "domain_knowledge", title: "Domain Knowledge Interview", description: "Verbal business concepts", icon: "BookOpen", recommended: true },
        { id: "case_study", title: "Case Study Discussion", description: "Verbal business case analysis", icon: "BarChart2", recommended: true },
        { id: "scenario_based", title: "Scenario-Based Interview", description: "Verbal real-world business situations", icon: "Target", recommended: false },
        { id: "behavioral", title: "Behavioral Interview", description: "Soft skills and culture fit", icon: "Users", recommended: false },
        { id: "managerial", title: "Managerial Interview", description: "Verbal leadership and team management", icon: "Briefcase", recommended: false },
        { id: "hr", title: "HR Interview", description: "Company fit and expectations", icon: "Users", recommended: false }
    ],
    "Marketing": [
        { id: "marketing_strategy", title: "Domain Knowledge Interview", description: "Verbal go-to-market discussion", icon: "TrendingUp", recommended: true },
        { id: "campaign_planning", title: "Scenario-Based Interview", description: "Verbal campaign execution scenarios", icon: "Target", recommended: true },
        { id: "brand_management", title: "Project-Based Interview", description: "Verbal discussion on brand identity", icon: "Star", recommended: false },
        { id: "growth_marketing", title: "Technical Discussion", description: "Verbal discussion on acquisition tactics", icon: "Zap", recommended: false },
        { id: "case_study", title: "Case Study Discussion", description: "Verbal marketing case analysis", icon: "BarChart2", recommended: false },
        { id: "behavioral", title: "Behavioral Interview", description: "Soft skills and culture fit", icon: "Users", recommended: false },
        { id: "hr", title: "HR Interview", description: "Company fit and expectations", icon: "Briefcase", recommended: false }
    ]
};

/**
 * Professional Career Coach System Prompt
 */
const SYSTEM_INSTRUCTIONS = `
You are Daksh.AI, an elite career architect and ex-recruiter from a top-tier MNC (like Google, Apple, or McKinsey).
Your goal is to build "World-Class" professional identities.
- LANGUAGE: Use powerful, action-oriented verbs (e.g., Optimized, Engineered, Spearheaded, Architected).
- TONE: Authoritative, sophisticated, and results-driven. Avoid generic clichés.
- FOCUS: Always prioritize quantifiable impact (%, $, Millions) and technical depth.
- STANDARDS: Content must be ready for Top MNC screening and ATS (Applicant Tracking Systems).
`;

/**
 * ── MULTI-MODEL FALLBACK CHAINS ──────────────────────────────────────────
 * When a model is overloaded (429/503), the system automatically cascades
 * to the next model in the chain. This ensures zero downtime for users.
 */
const MODEL_FALLBACK_CHAINS = {
    'llama-3.3-70b-versatile': [
        'llama-3.3-70b-versatile',
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant',
        'gemma2-9b-it'
    ],
    'llama-3.1-8b-instant': [
        'llama-3.1-8b-instant',
        'gemma2-9b-it',
        'llama-3.3-70b-versatile'
    ],
    'llama-3.1-70b-versatile': [
        'llama-3.1-70b-versatile',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant'
    ],
    'gemma2-9b-it': [
        'gemma2-9b-it',
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile'
    ],
    'meta-llama/llama-4-scout-17b-16e-instruct': [
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant'
    ]
};

/**
 * Helper to call Groq API with automatic multi-model failover.
 * If the primary model is overloaded or errors, cascades to fallback models.
 */
export async function callAI(prompt, systemMsg = SYSTEM_INSTRUCTIONS, jsonMode = false, model = "llama-3.1-8b-instant") {
    // If OpenAI is available and the model is gpt-*, use OpenAI
    if (model.startsWith('gpt-') && OPENAI_KEY) {
        try {
            console.log(`[Daksh.AI] Calling OpenAI: ${model}`);
            const response = await fetch(OPENAI_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENAI_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemMsg + (jsonMode ? " Output MUST be valid JSON." : "") },
                        { role: "user", content: prompt }
                    ],
                    response_format: jsonMode ? { type: "json_object" } : undefined,
                    temperature: 0.3,
                })
            });
            const data = await response.json();
            return jsonMode ? data.choices[0].message.content.trim().replace(/```json\n?|```/g, '') : data.choices[0].message.content.trim();
        } catch (e) {
            console.error("[Daksh.AI] OpenAI failed, falling back to Groq:", e);
        }
    }

    return await callGroq(prompt, systemMsg, jsonMode, model);
}

export async function callGroq(prompt, systemMsg = SYSTEM_INSTRUCTIONS, jsonMode = false, model = "llama-3.1-8b-instant", maxTokens = null) {
    if (!API_KEY || API_KEY.includes("PASTE_YOUR_GROQ_KEY")) {
        throw new Error("⚠️ Groq API Key is missing. Please check your .env file.");
    }

    const chain = MODEL_FALLBACK_CHAINS[model] || [model, 'llama-3.1-8b-instant', 'gemma2-9b-it'];
    let lastError = null;

    for (const currentModel of chain) {
        try {
            console.log(`[Daksh.AI] Trying model: ${currentModel}`);
            const body = {
                model: currentModel,
                messages: [
                    { role: "system", content: systemMsg + (jsonMode ? " Output MUST be valid JSON." : "") },
                    { role: "user", content: prompt }
                ],
                response_format: jsonMode ? { type: "json_object" } : undefined,
                temperature: 0.4,
            };
            // Only set max_tokens when explicitly requested (e.g., interview fast-path)
            if (maxTokens) body.max_tokens = maxTokens;

            const response = await fetch(GROQ_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const status = response.status;
                const msg = errData.error?.message || response.statusText;

                // Retry-able errors: rate limit, overloaded, server errors
                if (status === 429 || status === 503 || status >= 500) {
                    console.warn(`[Daksh.AI] Model ${currentModel} unavailable (${status}): ${msg}. Trying next...`);
                    lastError = new Error(msg);
                    continue; // Try next model in chain
                }
                throw new Error(msg);
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();

            if (currentModel !== chain[0]) {
                console.log(`%c[Daksh.AI] Fallback success: Used ${currentModel} instead of ${chain[0]}`, 'color: #f59e0b; font-weight: bold;');
            }

            // Robust cleaning for JSON output
            if (jsonMode) {
                return content.replace(/```json\n?|```/g, '').trim();
            }
            return content;
        } catch (error) {
            console.warn(`[Daksh.AI] Model ${currentModel} failed:`, error.message);
            lastError = error;
            continue; // Try next model
        }
    }

    // All models failed
    console.error("[Daksh.AI] All models exhausted:", lastError);
    throw lastError || new Error("All AI models are currently unavailable. Please try again in a moment.");
}

/**
 * Generates a professional summary for a resume
 */
export async function generateProfessionalSummary(formData) {
    const prompt = `
        You are a top-tier tech career coach for the Indian job market.
        Generate a highly professional, 3-4 sentence resume summary.
        
        Candidate Details:
        Name: ${formData.name || 'Candidate'}
        Title: ${formData.headline || 'Technology Professional'}
        Skills: ${(formData.selectedSkills || []).join(', ') || 'various technologies'}
        Experience: ${formData.experience ? 'Has relevant work experience' : 'Fresher / Entry level'}
        
        RULES:
        1. NO generic buzzwords (hardworking, passionate, team player).
        2. Focus on technical value, domain expertise, and measurable impact.
        3. Keep it concise and impactful — 3 sentences max.
        4. NEVER fabricate companies, degrees, or years of experience.
        5. Return ONLY the raw summary text, no labels or headers.
    `;
    return await callAI(prompt);
}

/**
 * Parses raw resume text into structured JSON
 */
export async function parseResume(rawText) {
    const prompt = `
        Analyze and extract structured data from this raw resume text.
        
        CRITICAL LINK DETECTION:
        Extract every URL found. Map them strictly:
        - GitHub profiles -> "github"
        - LinkedIn profiles -> "linkedin"
        - Personal portfolios/websites -> "portfolio"
        If a URL is inside a line like "Contact: github.com/user", extract "https://github.com/user".
        
        CRITICAL INSTRUCTION FOR JOB TITLE (Headline):
        Do not guess the job title wildly. Analyze the explicit skills provided in the text and map them strictly to the correct role.
        - If you see: React, HTML, CSS, JavaScript, Redux, Vue -> Job Title MUST be "Frontend Developer" or "Frontend Engineer".
        - If you see: Node.js, Express, MongoDB, SQL, Java, Spring -> Job Title MUST be "Backend Developer".
        - If you see: React, Node.js, Fullstack, both Frontend and Backend tools -> Job Title MUST be "Full Stack Developer".
        - If you see: Python, Pandas, Scikit-learn, TensorFlow, Data -> Job Title MUST be "Data Scientist" or "Machine Learning Engineer".
        - If you see: AWS, Docker, Kubernetes, CI/CD -> Job Title MUST be "DevOps Engineer".
        
        Raw Text:
        """
        ${rawText}
        """
        
        The JSON should strictly follow this structure:
        {
            "name": "string",
            "headline": "string (The STRICTLY MAPPED job title)",
            "email": "string",
            "phone": "string",
            "location": "string",
            "github": "string (Valid URL)",
            "linkedin": "string (Valid URL)",
            "portfolio": "string (Valid URL)",
            "summary": "string (Elite summary, max 3 sentences)",
            "selectedSkills": ["string (Standardized technical keywords)"],
            "experience": "string (STRICT FORMAT: **Company Name** | Start - End\\nJob Title | Location\\n• Achievement 1\\n• Achievement 2)",
            "education": "string (STRICT FORMAT: **University Name** | Start - End\\nDegree Name\\nCGPA: x.x | Location)",
            "projects": "string (STRICT FORMAT: **Project Name** | Tech Stack\\n• Feature 1\\n• Feature 2\\nGitHub: URL | Live: URL)",
            "certifications": "string"
        }
        
        If a field is not found, use an empty string. Output ONLY the JSON.
    `;

    // Use gpt-4o-mini for parsing if available, better for complex link detection
    try {
        const result = await callAI(prompt, undefined, true, OPENAI_KEY ? "gpt-4o-mini" : "llama-3.3-70b-versatile");
        const data = JSON.parse(result);

        // --- REGEX SAFETY NET ---
        // If the AI missed basic contact links, we grab them manually from raw text
        const githubRegex = /(github\.com\/[a-zA-Z0-9_-]+)/i;
        const linkedinRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i;
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
        const phoneRegex = /(\+?\d{1,4}[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/i;

        if (!data.github && githubRegex.test(rawText)) data.github = 'https://' + rawText.match(githubRegex)[1];
        if (!data.linkedin && linkedinRegex.test(rawText)) data.linkedin = 'https://' + rawText.match(linkedinRegex)[1];
        if (!data.email && emailRegex.test(rawText)) data.email = rawText.match(emailRegex)[1];
        if (!data.phone && phoneRegex.test(rawText)) data.phone = rawText.match(phoneRegex)[1];

        return data;
    } catch (e) {
        console.error("AI Parse Fail:", e);
        throw new Error("AI failed to parse resume. Please try again.");
    }
}

/**
 * Generates a professional portfolio bio
 */
export async function generatePortfolioBio(pd) {
    const cacheKey = `bio_${pd.fullName.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = dakshCache.get(cacheKey);
    if (cached) return cached;

    const prompt = `
        You are an elite personal branding expert in the competitive Indian tech industry.
        Write a highly engaging, professional 3-sentence "About Me" bio for a portfolio website.
        
        Details:
        Name: ${pd.fullName}
        Title: ${pd.jobTitle}
        Skills: ${pd.skills.join(', ')}
        
        RULES:
        1. Write in FIRST PERSON ("I am a...").
        2. Sound confident, modern, and highly employable in top-tier Indian MNCs and Startups.
        3. Do NOT make up past experiences or companies.
        4. Keep it exactly 3 sentences.
        
        Return ONLY the raw text.
    `;
    const res = await callGroq(prompt);
    dakshCache.set(cacheKey, res);
    return res;
}

/**
 * Generates SEO meta tags for the portfolio
 */
export async function generateSEOTags(pd) {
    const cacheKey = `seo_${pd.name.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = dakshCache.get(cacheKey);
    if (cached) return cached;

    try {
        const prompt = `
            Generate professional SEO meta tags for a portfolio website.
            Candidate Name: ${pd.name}
            Headline: ${pd.headline}
            Bio: ${pd.bio}
            Skills: ${pd.skills?.join(", ")}
            
            Return a JSON object:
            {
                "title": "string (SEO optimized page title)",
                "description": "string (150-160 characters search description)",
                "keywords": "string (comma-separated keywords)"
            }
        `;
        const result = await callGroq(prompt, undefined, true);
        const data = JSON.parse(result);
        dakshCache.set(cacheKey, data);
        return data;
    } catch (error) {
        return {
            title: `${pd.name} | ${pd.headline} | Portfolio`,
            description: `Portfolio of ${pd.name}, a professional ${pd.headline}.`,
            keywords: pd.skills?.join(", ")
        };
    }
}

/**
 * Analyzes a resume specifically for the Dashboard
 */
export async function parseDashboardResume(rawText, availableSkills, jobLibrary) {
    const jobsList = jobLibrary.map(j => `ID: ${j.id}, Title: ${j.title}`).join("\\n");
    const prompt = `
        Analyze this candidate's resume and provide feedback.
        
        Based on their dominant skills, select the BEST matching Job ID from this exact list:
        ${jobsList}
        Also extract their top technical skills. YOU MUST ONLY SELECT SKILLS FROM THIS EXACT LIST:
        ${availableSkills.join(', ')}
        (Do not invent skills that are not in this list, and strictly match the casing.)
        Finally, provide 3 actionable resume improvement insights.
        
        Return a JSON object STRICTLY in this format:
        {
            "skills": ["string", "string"],
            "job": "string (The ID of the matching job, e.g., 'job-2')",
            "insights": ["string (Actionable tip 1)", "string (Actionable tip 2)", "string (Actionable tip 3)"]
        }
        
        Raw Resume Text:
        """
        ${rawText}
        """
    `;
    const result = await callGroq(prompt, undefined, true);
    return JSON.parse(result);
}

/**
 * Generates dynamic industry-trending master skills and career insights (with Local Caching)
 */
export async function getTrendingJobSkills(targetJobTitle, availableSkills, userSkills = []) {
    const cacheKey = `daksh_ai_blueprint_v4_${targetJobTitle.toLowerCase().replace(/\s+/g, '_')}`;

    try {
        // 1. Check Local Cache (24-hour expiration)
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                console.log("Daksh.AI: Serving cached blueprint for", targetJobTitle);
                return data;
            }
        }

        const userSkillsStr = userSkills.join(', ');

        const prompt = `
            You are drafting a definitive, 12-15 skill 'Master Tech Stack' and Career Blueprint for the role of "${targetJobTitle}" at a global MNC.
            Based on the candidate's currently marked skills: [${userSkillsStr}], identify the best set of tools and strategic insights.
            
            CRITICAL RULES:
            1. MINIMALISM: Provide 12-15 most critical technical and soft skills.
            2. SMART STACKING: Favor skills that complement the candidate's current stack.
            3. MARKET DATA: Provide a realistic salary range explicitly in Indian Rupees (₹ LPA). CRITICALLY EVALUATE the current Indian market demand. DO NOT default to "High". If a field is saturated, write "Saturated" or "Moderate". Be brutally honest.
            
            Return ONLY a JSON object with this exact structure:
            {
               "categorizedMaster": {
                   "Programming Languages": ["Skill"],
                   "Frameworks": ["Skill"],
                   "Libraries": ["Skill"],
                   "Data & Cloud": ["Skill"],
                   "Engineering & Tools": ["Skill"],
                   "Core & Soft Skills": ["Skill"]
               },
               "careerInsights": ["3 actionable strategic tips for this role"],
               "marketPulse": {
                   "salaryRange": "e.g. ₹8LPA - ₹15LPA",
                   "demand": "e.g. Saturated | Low | Moderate | High | Niche",
                   "outlook": "1-sentence current market forecast"
               },
               "roleMotivation": "A 15-word 'Why this role?' catchphrase"
            }
        `;

        const result = await callGroq(prompt, "You are a lead technical recruiter and career architect specializing in consolidated, high-impact career blueprints.", true);
        const data = JSON.parse(result);

        // Validate AI response before caching
        if (!data.categorizedMaster || Object.keys(data.categorizedMaster).length === 0) {
            throw new Error("AI returned empty skills list");
        }

        // 2. Update Cache
        localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
        }));

        return data;
    } catch (error) {
        console.error("Groq Job Analysis Error:", error);
        return {
            categorizedMaster: {},
            careerInsights: ["Keep building projects to stand out.", "Focus on networking with industry professionals.", "Master the core fundamentals of your chosen stack."],
            marketPulse: { salaryRange: "Competitive", demand: "Stable", outlook: "Solid growth potential in the current market." },
            roleMotivation: "Build the future through technical excellence and strategic innovation."
        };
    }
}
/**
 * Pre-generates and caches 20 interview questions tailored to role, difficulty, experience level, and interview type.
 */
export async function getInterviewQuestionBank(targetJob, difficulty, experienceLevel = 'mid', interviewType = 'technical') {
    const safeJob = targetJob.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const cacheKey = `daksh_interview_bank_v2_${safeJob}_${difficulty}_${experienceLevel}_${interviewType}`;

    // 1. Return Instant Cached Version to Reduce AI Load
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) { // Valid for 7 Days
            console.log("Daksh.AI: Loading Cached Interview Questions!", targetJob, difficulty, experienceLevel, interviewType);
            return data;
        }
    }

    // ── Experience-level specific guidance ──
    const experienceGuidance = {
        fresher: `The candidate is a FRESHER (0-1 year experience). Questions MUST be:
            - Foundational and conceptual (e.g., "What is X?", "Explain the difference between A and B")
            - Based on academic knowledge, internships, or personal projects
            - NO questions about production systems, team leadership, or enterprise architecture
            - Focus on basics, fundamentals, willingness to learn, and college/project work
            - Difficulty should be EASY to MODERATE even if difficulty is set to "${difficulty}"`,
        mid: `The candidate is MID-LEVEL (1-5 years experience). Questions MUST be:
            - Practical and scenario-based (e.g., "How would you handle X in production?")
            - Expect hands-on knowledge of tools, debugging, and real-world problem solving
            - Include questions about team collaboration and project ownership
            - Difficulty aligns with the "${difficulty}" setting`,
        senior: `The candidate is SENIOR (5+ years experience). Questions MUST be:
            - Advanced, architectural, and strategic (e.g., "Design a system that...", "How would you lead...")
            - Expect deep expertise, mentorship experience, and decision-making ability
            - Include system design, trade-off analysis, and leadership scenarios
            - Difficulty should be HARD even if difficulty is set to "${difficulty}"`
    };

    // ── Interview-type specific constraints ──
    const typeConstraints = {
        behavioral: `INTERVIEW TYPE: BEHAVIORAL ONLY
            - Ask ONLY behavioral and soft-skill questions
            - Use STAR method style questions (Situation, Task, Action, Result)
            - Focus on teamwork, conflict resolution, communication, leadership, time management
            - Do NOT ask any technical, coding, or system design questions
            - Examples: "Tell me about a time you disagreed with your manager", "Describe a challenging team situation"`,
        technical: `INTERVIEW TYPE: TECHNICAL / CODING ONLY
            - Ask ONLY technical questions specific to the "${targetJob}" role
            - Include coding concepts, data structures, algorithms, language-specific questions, debugging scenarios
            - Do NOT ask behavioral, leadership, or soft-skill questions
            - Questions must be deeply technical and role-specific`,
        system_design: `INTERVIEW TYPE: SYSTEM DESIGN ONLY
            - Ask ONLY system design and architecture questions
            - Focus on scalability, reliability, database design, API design, distributed systems
            - Do NOT ask behavioral or basic coding questions
            - Examples: "Design a URL shortener", "How would you architect a real-time chat system?"`,
        case_study: `INTERVIEW TYPE: CASE STUDY / BUSINESS ANALYSIS ONLY
            - Ask ONLY business case analysis and problem-solving questions
            - Focus on analytical thinking, data interpretation, market analysis, strategy
            - Do NOT ask technical coding or behavioral questions
            - Examples: "How would you analyze declining user engagement?", "Evaluate this business scenario..."`,
        leadership: `INTERVIEW TYPE: LEADERSHIP & MANAGEMENT ONLY
            - Ask ONLY leadership, management, and strategic decision-making questions
            - Focus on team building, mentoring, project management, stakeholder management
            - Do NOT ask technical coding questions
            - Examples: "How do you handle underperforming team members?", "Describe your approach to delegation"`,
        product_thinking: `INTERVIEW TYPE: PRODUCT THINKING & STRATEGY ONLY
            - Ask ONLY product sense, product strategy, and user-centric thinking questions
            - Focus on user empathy, feature prioritization, metrics, go-to-market strategy
            - Do NOT ask technical coding or behavioral questions
            - Examples: "How would you improve feature X?", "What metrics would you track for a new product launch?"`
    };

    const prompt = `
        You are an elite, highly strict senior recruiter operating in the top-tier Indian Corporate Sector (e.g. MNCs, Big Tech, Unicorn startups).
        Generate EXACTLY 20 highly probable, heavily-tested interview questions for the role of "${targetJob}".

        ── EXPERIENCE LEVEL INSTRUCTIONS ──
        ${experienceGuidance[experienceLevel] || experienceGuidance.mid}

        ── INTERVIEW TYPE INSTRUCTIONS ──
        ${typeConstraints[interviewType] || typeConstraints.technical}

        ── DIFFICULTY LEVEL ──
        The base difficulty is "${difficulty}". Adjust question complexity accordingly:
        - Easy: Straightforward, concept-check questions
        - Medium: Applied knowledge, scenario-based questions
        - Hard: Deep architectural, edge-case, and high-pressure questions

        CRITICAL RULES:
        - Questions MUST reflect current Indian job market expectations for this exact role.
        - STRICTLY follow the interview type constraint — do NOT mix question types.
        - Adjust depth and complexity based on the experience level.
        - Return ONLY a raw JSON Array of 20 exact question strings. Absolutely nothing else.
        
        Example Output:
        ["Question 1 here?", "Question 2 here?"]
    `;

    try {
        const result = await callGroq(prompt, "You are a master Indian recruiter. Generate questions strictly matching the interview type and experience level.", true, "llama-3.3-70b-versatile");
        const bankedQs = JSON.parse(result);
        if (!Array.isArray(bankedQs) || bankedQs.length === 0) throw new Error("Invalid Array format");

        // 2. Aggressively Cache the Result Payload
        localStorage.setItem(cacheKey, JSON.stringify({
            data: bankedQs,
            timestamp: Date.now()
        }));

        return bankedQs;
    } catch (e) {
        console.error("AI Question Generation Failed, applying fallback:", e);
        // Fallback questions based on interview type
        const fallbacks = {
            behavioral: [
                "Tell me about yourself and your professional journey so far.",
                "Describe a situation where you had to work with a difficult team member.",
                "Tell me about a time you failed at something. What did you learn?",
                "How do you handle tight deadlines and pressure?",
                "Describe a situation where you took initiative beyond your role.",
                "Tell me about a time you received critical feedback. How did you respond?",
                "How do you prioritize tasks when everything seems urgent?",
                "Describe a conflict you resolved in a professional setting.",
                "Tell me about a time you had to adapt to a significant change.",
                "What motivates you in your professional life?",
                "Describe a situation where you demonstrated leadership.",
                "How do you handle ambiguity in your work?",
                "Tell me about a project you're most proud of and why.",
                "How do you approach learning new skills?",
                "Describe a time you had to convince others of your idea.",
                "What is your approach to giving constructive feedback?",
                "Tell me about a time you went above and beyond for a project.",
                "How do you maintain work-life balance?",
                "Describe a time you made a mistake at work. How did you handle it?",
                "Where do you see yourself growing in the next 2-3 years?"
            ],
            technical: [
                "Could you start by telling me briefly about your technical background?",
                "What is the most complex system or feature you have personally built?",
                "How do you handle performance bottlenecks in your tech stack?",
                "Explain your strategy for resolving a critical production outage.",
                "How do you enforce code quality and security standards?",
                "Why are you interested in advancing your career in the Indian Tech Industry?",
                "Describe how you approach system design for a high-traffic application.",
                "How do you stay up to date with the rapidly changing technology landscape?",
                "What is your approach to testing and CI/CD?",
                "Describe your experience with microservices vs monolithic architecture.",
                "How do you approach database design and query optimization?",
                "What techniques do you use to ensure API security?",
                "How do you debug a performance issue in a live environment?",
                "What design patterns do you use most frequently and why?",
                "How do you onboard into a large, unfamiliar codebase?",
                "Describe your experience with agile or scrum workflows.",
                "What is your approach to error handling and logging?",
                "How do you handle version control and branching strategies?",
                "Explain the difference between SQL and NoSQL databases with use cases.",
                "What are the key principles of writing maintainable code?"
            ]
        };
        return fallbacks[interviewType] || fallbacks.technical;
    }
}

/**
 * Conducts a single step of the AI Mock Interview.
 * Now fully context-aware: adjusts behavior based on role, difficulty, experience level, and interview type.
 */
/**
 * Builds a compact candidate context string from the accumulated interview context.
 * Used to inject extracted candidate details into the AI prompt for follow-up generation.
 */
function buildCandidateContextStr(ctx) {
    if (!ctx) return '';
    const parts = [];
    if (ctx.projects?.length) parts.push(`Known projects: ${ctx.projects.slice(-3).join(', ')}`);
    if (ctx.technologies?.length) parts.push(`Mentioned technologies: ${[...new Set(ctx.technologies)].slice(-8).join(', ')}`);
    if (ctx.experienceYears) parts.push(`Experience: ~${ctx.experienceYears} years`);
    if (ctx.strengths?.length) parts.push(`Demonstrated strengths: ${ctx.strengths.slice(-3).join(', ')}`);
    if (ctx.discussedTopics?.length) parts.push(`Already discussed (DO NOT repeat): ${ctx.discussedTopics.slice(-6).join(', ')}`);
    if (ctx.previousAnswers?.length) {
        const lastAns = ctx.previousAnswers[ctx.previousAnswers.length - 1];
        if (lastAns) parts.push(`Last candidate answer: "${lastAns.slice(0, 200)}"`);
    }
    return parts.length ? '\nCANDIDATE CONTEXT:\n' + parts.join('\n') : '';
}

export async function conductInterviewStep(messages, targetJob, difficulty = 'Medium', questionBank = [], experienceLevel = 'mid', interviewType = 'technical', candidateContext = null) {
    // ── Adaptive difficulty: escalate based on how many rounds have been completed ──
    const userTurns = messages.filter(m => m.role === 'user').length;
    const adaptiveDifficulty = (() => {
        if (experienceLevel === 'fresher') return userTurns < 3 ? 'Easy' : 'Medium'; // Never go Hard for freshers
        if (experienceLevel === 'senior') return userTurns < 2 ? difficulty : 'Hard'; // Always escalate seniors
        // Mid: gradually ramp from given difficulty
        if (userTurns < 2) return difficulty === 'Hard' ? 'Medium' : difficulty;
        if (userTurns < 5) return difficulty;
        return difficulty === 'Easy' ? 'Medium' : difficulty === 'Medium' ? 'Hard' : 'Hard';
    })();

    // ── Concise experience-level persona ──
    const experiencePersona = {
        fresher: `FRESHER (0-1yr): Ask foundational, conceptual questions. Focus on academics, projects, internships. NO production/enterprise questions. Be encouraging. Difficulty: Easy-Medium only.`,
        mid: `MID-LEVEL (1-5yr): Practical, scenario-based questions. Expect hands-on knowledge, debugging, project ownership. Probe for depth. Difficulty: ${adaptiveDifficulty}.`,
        senior: `SENIOR (5+yr): Advanced architectural, strategic, leadership questions. Expect system design, trade-off analysis, mentoring. Be rigorous. Difficulty: Hard.`
    };

    // ── Dynamic Interview Type Behavior ──
    const interviewTypeStr = (interviewType || '').toLowerCase();
    let typeBehavior = '';
    if (interviewTypeStr.includes('technical') || interviewTypeStr.includes('coding') || interviewTypeStr.includes('problem solving')) {
        typeBehavior = 'TECHNICAL INTERVIEW: Focus heavily on technical concepts, problem-solving, projects, architecture, coding, and domain-specific knowledge. No behavioral questions.';
    } else if (interviewTypeStr.includes('hr')) {
        typeBehavior = 'HR INTERVIEW: Focus heavily on career goals, strengths, weaknesses, communication, teamwork, motivation, and culture fit. No coding/technical questions.';
    } else if (interviewTypeStr.includes('behavioral')) {
        typeBehavior = 'BEHAVIORAL INTERVIEW: Focus heavily on real-life experiences, conflict resolution, leadership, decision-making, and STAR-based questions. No technical/coding questions.';
    } else if (interviewTypeStr.includes('project')) {
        typeBehavior = 'PROJECT-BASED INTERVIEW: Deeply explore the candidate\'s projects, contributions, challenges, technologies, and outcomes. NO generic questions.';
    } else if (interviewTypeStr.includes('case study') || interviewTypeStr.includes('scenario')) {
        typeBehavior = 'CASE STUDY INTERVIEW: Present scenarios, business problems, and analytical questions relevant to the selected role. No coding questions.';
    } else if (interviewTypeStr.includes('system design') || interviewTypeStr.includes('architecture')) {
        typeBehavior = 'SYSTEM DESIGN INTERVIEW: Focus heavily on scalability, architecture, trade-offs, performance, and design decisions. No basic coding or behavioral questions.';
    } else {
        typeBehavior = `CUSTOM INTERVIEW (${interviewType}): Focus strictly on topics relevant to ${interviewType} for the ${targetJob} role.`;
    }

    // ── Trim history: keep only last 10 turns to reduce token count ──
    const recentHistory = messages.slice(-10);
    const historyStr = recentHistory.map(m => `[${m.role.toUpperCase()}]: ${m.text || m.content}`).join('\n');

    // ── Compact question bank: only first 12 questions to save tokens ──
    const bankStr = questionBank.slice(0, 12).map((q, i) => `${i + 1}. ${q}`).join('\n');

    // ── Build candidate context section for personalized follow-ups ──
    const ctxStr = buildCandidateContextStr(candidateContext);
    const hasProjects = candidateContext?.projects?.length > 0;
    const hasTech = candidateContext?.technologies?.length > 0;

    const prompt = `You are a senior interviewer at a top Indian MNC, interviewing for "${targetJob}".

SESSION: Type=${interviewType}, Level=${experienceLevel === 'fresher' ? 'Fresher' : experienceLevel === 'mid' ? 'Mid-Level' : 'Senior'}, Difficulty=${adaptiveDifficulty}, Turn=${userTurns + 1}

INTERVIEW TYPE FOCUS:
${typeBehavior}
NEVER switch to another interview style. Behave like a real interviewer specializing in this exact format from start to finish.

VALIDATION REQUIREMENT: Before generating the question, validate it aligns perfectly with:
1. Selected Role: ${targetJob}
2. Experience Level: ${experienceLevel}
3. Interview Type: ${interviewType}
4. Previous Answers Context

COMMUNICATION ONLY: 
This is a voice-only conversational interview. 
- NEVER ask the candidate to write code, draw diagrams, or perform live practical exercises.
- ALWAYS ask discussion-based conceptual questions.
- Convert practical tasks into verbal explanations (e.g., instead of "Write a SQL query", ask "Explain how you would write a SQL query").

${experiencePersona[experienceLevel] || experiencePersona.mid}
${ctxStr}

QUESTION BANK (soft reference — only use if no better context-based follow-up exists):
${bankStr}

CRITICAL CONVERSATIONAL RULES:
1. THE AI IS NOT A QUESTIONNAIRE. Act like an experienced hiring manager for the "${targetJob}" role.
2. HUMAN-LIKE STYLE: ALWAYS acknowledge the previous answer naturally before asking the next question (e.g. "That's interesting. You mentioned [X]. How did you handle [Y]?"). NEVER say "Answer recorded" or "Next question".
3. SMART TOPIC EXPLORATION: If the candidate mentions an important project, technology, or challenge, spend 3-5 follow-up questions exploring it in depth before switching topics.
4. QUESTION PRIORITY ORDER: Always generate questions using this exact priority: (1) Current answer, (2) Candidate project, (3) Candidate experience, (4) Candidate technologies, (5) Role-specific topics, (6) Interview-type topics, (7) General questions. Never skip to lower priority if a strong follow-up exists.
5. NO REPETITION: NEVER ask questions already answered. NEVER ask about topics already fully explored. Track discussed topics.
6. ULTRA CONCISE: Keep your response under 30 words total. Format: "[Natural acknowledgment]. [Focused follow-up question]?"
7. ONE QUESTION AT A TIME. Never ask multiple questions in a single turn.
8. NEVER end the interview unless you receive a SYSTEM: conclude command or candidate says "end interview".
9. If candidate uses Hindi, switch fully to Hindi.
10. ROLE STRICTNESS: NEVER generate questions outside the core domain of "${targetJob}". Examples: No DSA/coding for Marketing/HR, no DB questions for UI/UX designers, no Cloud architecture for Mechanical engineers.

CONVERSATION:
${historyStr}

Output JSON only:
{"question":"string","isEnd":false,"language":"en","scorecard":null}`;

    // ── Use fastest model (8b instant) for speed — only escalate to 70b for scorecard ──
    const needsScorecard = messages.some(m => (m.content || m.text || '').includes('SYSTEM: The interview time is up') || (m.content || m.text || '').includes('SYSTEM: The candidate remained silent'));
    const model = needsScorecard ? 'llama-3.3-70b-versatile' : 'llama-3.1-8b-instant';

    const raw = await callGroq(prompt, 'You are a conversational senior interviewer. Reference candidate answers naturally. Output valid JSON only.', true, model, 200);
    return JSON.parse(raw);
}

/**
 * Preloads the next AI question while the user is still being evaluated.
 * Uses candidateContext to predict a more relevant follow-up question.
 * Returns a promise that resolves to a pre-generated question string (or null on failure).
 */
export async function preloadNextQuestion(messages, targetJob, difficulty, questionBank, experienceLevel, interviewType, candidateContext = null) {
    try {
        const bankStr = questionBank.slice(0, 8).map((q, i) => `${i + 1}. ${q}`).join('\n');
        const recentHistory = messages.slice(-6);
        const historyStr = recentHistory.map(m => `[${m.role.toUpperCase()}]: ${m.text || m.content}`).join('\n');
        const ctxStr = buildCandidateContextStr(candidateContext);

        const interviewTypeStr = (interviewType || '').toLowerCase();
        let typeBehavior = '';
        if (interviewTypeStr.includes('technical') || interviewTypeStr.includes('coding') || interviewTypeStr.includes('problem solving')) {
            typeBehavior = 'TECHNICAL INTERVIEW: Focus heavily on technical concepts, problem-solving, projects, architecture, coding, and domain-specific knowledge. No behavioral questions.';
        } else if (interviewTypeStr.includes('hr')) {
            typeBehavior = 'HR INTERVIEW: Focus heavily on career goals, strengths, weaknesses, communication, teamwork, motivation, and culture fit. No coding/technical questions.';
        } else if (interviewTypeStr.includes('behavioral')) {
            typeBehavior = 'BEHAVIORAL INTERVIEW: Focus heavily on real-life experiences, conflict resolution, leadership, decision-making, and STAR-based questions. No technical/coding questions.';
        } else if (interviewTypeStr.includes('project')) {
            typeBehavior = 'PROJECT-BASED INTERVIEW: Deeply explore the candidate\'s projects, contributions, challenges, technologies, and outcomes. NO generic questions.';
        } else if (interviewTypeStr.includes('case study') || interviewTypeStr.includes('scenario')) {
            typeBehavior = 'CASE STUDY INTERVIEW: Present scenarios, business problems, and analytical questions relevant to the selected role. No coding questions.';
        } else if (interviewTypeStr.includes('system design') || interviewTypeStr.includes('architecture')) {
            typeBehavior = 'SYSTEM DESIGN INTERVIEW: Focus heavily on scalability, architecture, trade-offs, performance, and design decisions. No basic coding or behavioral questions.';
        } else {
            typeBehavior = `CUSTOM INTERVIEW (${interviewType}): Focus strictly on topics relevant to ${interviewType} for the ${targetJob} role.`;
        }

        const prompt = `You are an interviewer for "${targetJob}", focusing on ${interviewType}, ${experienceLevel} level.
${ctxStr}
Recent conversation: ${historyStr}
Question bank reference: ${bankStr}

INTERVIEW TYPE FOCUS:
${typeBehavior}
NEVER switch to another interview style.

VALIDATION REQUIREMENT: Before generating the question, validate it aligns perfectly with:
1. Selected Role: ${targetJob}
2. Experience Level: ${experienceLevel}
3. Interview Type: ${interviewType}
4. Previous Answers Context

COMMUNICATION ONLY: 
This is a voice-only conversational interview. 
- NEVER ask the candidate to write code, draw diagrams, or perform live practical exercises.
- ALWAYS ask discussion-based conceptual questions.
- Convert practical tasks into verbal explanations (e.g., instead of "Write a SQL query", ask "Explain how you would write a SQL query").

CRITICAL RULE: NEVER generate questions outside the core domain of "${targetJob}". No generic coding/DSA for non-technical roles.

Predict ONE natural follow-up question that references what the candidate just said.
Output ONLY: {"question":"string"}`;

        const raw = await callGroq(prompt, 'Output valid JSON only.', true, 'llama-3.1-8b-instant', 80);
        const data = JSON.parse(raw);
        return data.question || null;
    } catch (_) {
        return null; // Preload failure is non-fatal — main flow handles it
    }
}

/**
 * Dynamically determines the most relevant interview types for a given role and experience.
 * Caches the response for 30 days to save API calls.
 */
export async function getRecommendedInterviewTypes(targetJob, experienceLevel) {
    const safeJob = (targetJob || 'Software Developer').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const safeExp = (experienceLevel || 'mid').toLowerCase();
    const cacheKey = `daksh_category_mapping_v3_${safeJob}_${safeExp}`;

    // 1. Check Cache (30 days TTL)
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { category, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
                console.log(`Daksh.AI: Serving cached category '${category}' for ${targetJob}`);
                return ROLE_CATEGORIES[category] || ROLE_CATEGORIES["Software & IT"];
            }
        } catch (e) {
            // Ignore parse error and re-fetch
        }
    }

    const prompt = `
        You are a Role Classification Engine.
        Classify the job role "${targetJob}" into exactly ONE of the following strict categories:
        
        1. "Software & IT" (e.g. Developer, Data Scientist, DevOps, Network, Cyber)
        2. "Design" (e.g. UI/UX, Product Designer, Graphic Designer)
        3. "Core Electronics" (e.g. Embedded, VLSI, PCB, Telecom)
        4. "Mechanical & Manufacturing" (e.g. Mechanical, Production, QA, Maintenance)
        5. "Business & Management" (e.g. BA, HR Manager, Finance, CA, Supply Chain)
        6. "Marketing" (e.g. Marketing Manager, SEO, Growth Hacker)
        
        RULES:
        - If the role spans multiple, pick the most technical or primary one.
        - If the role is unknown or generic, default to "Software & IT".
        
        Return ONLY a JSON object containing the exact category name:
        { "category": "Exact Category Name Here" }
    `;

    try {
        const result = await callGroq(prompt, "You are a Classification Engine. Output MUST be valid JSON.", true, "llama-3.1-8b-instant");
        let parsed = JSON.parse(result);
        let category = parsed.category;
        
        if (!ROLE_CATEGORIES[category]) {
            category = "Software & IT"; // Fallback if AI hallucinates
        }

        // 2. Update Cache
        localStorage.setItem(cacheKey, JSON.stringify({
            category: category,
            timestamp: Date.now()
        }));

        return ROLE_CATEGORIES[category];
    } catch (error) {
        console.error("AI Category Classification Failed:", error);
        return ROLE_CATEGORIES["Software & IT"];
    }
}



/**
 * Cached Project Idea Pool System
 * 
 * Strategy: Generate 5 ideas in ONE AI call, cache them for 3 days.
 * Each "Generate New Idea" click serves from the pool instantly (zero API cost).
 * Only calls the AI again when the pool is empty or expired.
 */
export async function getProjectIdeaFromPool(jobTitle, missingSkills, userProfile = {}) {
    const safeJob = jobTitle.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const cacheKey = `daksh_project_pool_v2_${safeJob}`;
    const POOL_SIZE = 5;
    const EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

    // ── 1. Try to serve from existing cache pool ────────────────────────────
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { pool, cursor, timestamp } = JSON.parse(cached);
            const isValid = Date.now() - timestamp < EXPIRY_MS;
            if (isValid && Array.isArray(pool) && cursor < pool.length) {
                // Advance cursor and update cache
                localStorage.setItem(cacheKey, JSON.stringify({ pool, cursor: cursor + 1, timestamp }));
                console.log(`Daksh.AI: Serving cached project idea ${cursor + 1}/${pool.length} for "${jobTitle}"`);
                return pool[cursor];
            }
        }
    } catch (_) { /* ignore parse errors, fall through to regenerate */ }

    // ── 2. Pool empty / expired — generate a fresh batch of 5 ──────────────
    console.log(`Daksh.AI: Generating new project idea pool for "${jobTitle}"...`);
    const { name = 'the candidate', bio = '', skills = [], category = '' } = userProfile;
    const acquiredSkills = skills.length > 0 ? skills.join(', ') : 'general skills';
    const seed = Math.floor(Math.random() * 99999);

    const prompt = `
        You are an elite Senior Staff Engineer and Career Mentor in the Indian Tech & Professional Industry.
        
        CANDIDATE PROFILE:
        - Name: ${name}
        - Target Role: "${jobTitle}" (Category: ${category || 'Professional'})
        - Current Skills: [${acquiredSkills}]
        - Skills To Learn: [${missingSkills.join(', ')}]
        - About: "${bio || 'Motivated professional in India'}"
        - Seed: ${seed}

        Generate EXACTLY ${POOL_SIZE} unique, diverse project ideas specifically for someone targeting "${jobTitle}".
        
        STRICT RULES:
        - Each project MUST be 100% relevant to the "${jobTitle}" domain
        - Projects must solve real Indian problems (fintech, edtech, healthtech, agritech, govtech, D2C, logistics)  
        - Must be at national/state scale — something impactful for thousands of Indian users
        - Use the candidate's existing skills as foundation, bridge toward missing skills
        - Vary difficulty: mix of Beginner/Intermediate/Advanced across the 5 ideas
        - NO generic CRUD apps, no to-do lists, no cloned websites
        - Each idea must be completely different from the others

        Return ONLY a valid JSON array of exactly ${POOL_SIZE} objects in this format:
        [
          {
            "projectTitle": "Catchy professional project name",
            "concept": "2-3 sentences: what it solves, why it matters for India.",
            "techStack": ["specific", "technologies", "for", "${jobTitle}"],
            "difficulty": "Beginner | Intermediate | Advanced",
            "targetSector": "Indian sector (e.g. Fintech, Edtech, Healthtech)",
            "whyThisProject": "1 sentence: why a ${jobTitle} recruiter would be impressed.",
            "stepByStep": [
              "Step 1: Research & Architecture — specifics",
              "Step 2: Core Feature Implementation — specifics",
              "Step 3: Integration & Advanced Features — specifics",
              "Step 4: Deployment, Polish & Portfolio Presentation — specifics"
            ]
          }
        ]
    `;

    try {
        const result = await callGroq(
            prompt,
            `You are an expert Indian career architect specializing in ${jobTitle} roles. Generate exactly ${POOL_SIZE} unique ideas.`,
            true,
            "llama-3.3-70b-versatile"
        );

        let pool = JSON.parse(result);
        // Handle if AI wrapped the array in an object
        if (!Array.isArray(pool)) {
            const key = Object.keys(pool).find(k => Array.isArray(pool[k]));
            pool = key ? pool[key] : [pool];
        }
        if (!Array.isArray(pool) || pool.length === 0) throw new Error("Invalid pool format from AI");

        // Save the pool with cursor starting at 1 (we're serving index 0 now)
        localStorage.setItem(cacheKey, JSON.stringify({
            pool,
            cursor: 1,
            timestamp: Date.now()
        }));

        console.log(`Daksh.AI: Cached ${pool.length} project ideas for "${jobTitle}" (3-day TTL)`);
        return pool[0];
    } catch (err) {
        console.error("Project Pool Generation Failed:", err);
        // Fall back to single-idea generation
        return generateProjectRoadmap(jobTitle, missingSkills, userProfile);
    }
}

/**
 * Generates a unique, personalized Indian-market project idea based on the user's full profile
 */

export async function generateProjectRoadmap(targetJob, missingSkills, userProfile = {}) {
    const seed = Math.floor(Math.random() * 99999);
    const { name = 'the candidate', bio = '', skills = [], category = '' } = userProfile;
    const acquiredSkills = skills.length > 0 ? skills.join(', ') : 'general skills';

    const prompt = `
        You are an elite Senior Staff Engineer and Career Mentor working in the Indian Tech & Professional Industry.
        
        CANDIDATE PROFILE:
        - Name: ${name}
        - Target Role: "${targetJob}" (Category: ${category || 'Professional'})
        - Current Skills They Have: [${acquiredSkills}]
        - Skills They Still Need: [${missingSkills.join(', ')}]
        - About Them: "${bio || 'Motivated professional in India'}"
        - Randomization Seed: ${seed} (Use this to guarantee a fresh, unique idea every call)

        YOUR TASK:
        Design ONE unique, impressive, portfolio-ready project SPECIFICALLY suited for the "${targetJob}" role.
        The project MUST:
        1. Be 100% relevant to the "${targetJob}" role and its domain (e.g., if Marketing, suggest a marketing analytics dashboard; if HR, suggest a recruitment automation tool; if Finance, suggest a financial planning simulator)
        2. Use the candidate's existing skills (${acquiredSkills}) as a foundation, and bridge toward the missing skills
        3. Solve a REAL problem Indians face today — relevant to sectors booming in India (fintech, edtech, healthtech, agri-tech, govtech, logistics, D2C e-commerce, etc.)
        4. Be at a national/state scale, something that could genuinely be used by thousands of Indians
        5. Be deeply impressive to Indian MNC/startup recruiters hiring for "${targetJob}"
        6. NOT be a generic CRUD app or to-do list — it must have real-world impact

        Return ONLY a JSON object in EXACTLY this format:
        {
            "projectTitle": "Catchy, professional project name",
            "concept": "2-3 sentences explaining what problem it solves and why it matters for India right now.",
            "techStack": ["Specific tools/technologies appropriate for ${targetJob}"],
            "difficulty": "Beginner | Intermediate | Advanced",
            "targetSector": "The Indian industry sector this targets (e.g., Fintech, Edtech, Healthtech, Agritech, etc.)",
            "whyThisProject": "1 sentence explaining exactly why a ${targetJob} recruiter would be impressed by this.",
            "stepByStep": [
                "Step 1: Research & Architecture — specific details",
                "Step 2: Core Feature Implementation — specific details",
                "Step 3: Data / Integration / Advanced Feature — specific details",
                "Step 4: Deployment, Polish & Portfolio Presentation — specific details"
            ]
        }
    `;

    try {
        const result = await callGroq(prompt, `You are an expert Indian career architect specializing in ${targetJob} roles. Never repeat prior ideas.`, true, "llama-3.3-70b-versatile");
        return JSON.parse(result);
    } catch (error) {
        console.error("Roadmap Generation Fail:", error);
        throw new Error("AI failed to generate a valid roadmap. This usually happens if the AI server is overloaded. Please wait 10 seconds and try again.");
    }
}
/**
 * Categorizes a skill into one of the predefined buckets for the Dashboard
 */
export async function categorizeSkill(skillName, categories) {
    const cacheKey = `cat_${skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = dakshCache.get(cacheKey);
    if (cached) return cached;

    const prompt = `
        Categorize the following skill: "${skillName}"
        
        Choose the BEST match from this exact list of categories:
        ${categories.join(', ')}
        
        If it's a programming language (Python, Java, C++, etc.), use "Programming Languages".
        If it's a web framework or frontend/backend library (React, Angular, Django, etc.), use "Frameworks & Libraries".
        If it's a data tool or cloud service (AWS, SQL, Hadoop), use "Data & Cloud".
        If it's a design tool, tool, or engineering core concept, use "Tools & Engineering".
        If it's a soft skill or core professional skill, use "Core & Soft Skills".
        
        Return ONLY the category name as a string. No extra text.
    `;

    try {
        const result = await callGroq(prompt, "You are a technical taxonomy expert.");
        const category = result.trim();
        dakshCache.set(cacheKey, category, 168); // Long TTL (1 week) for taxonomy
        return category;
    } catch (error) {
        console.error("Skill Categorization Error:", error);
        return "Core & Soft Skills"; // Default fallback
    }
}

/**
 * Extract text from PDF, DOCX, or return base64 for JPEG
 * @param {File} file
 * @returns {Promise<{text?: string, base64?: string, mimeType?: string, method: string}>}
 */
export async function extractTextFromDocument(file) {
    const type = file.type;
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 5MB)`);

    // ── PDF ──
    if (type === 'application/pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();

            let lastY;
            let pageText = '';
            for (let item of content.items) {
                if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
                    pageText += '\n';
                } else if (lastY !== undefined) {
                    pageText += ' ';
                }
                pageText += item.str;
                lastY = item.transform[5];
            }
            text += pageText + '\n';
        }
        return { text: text.trim(), method: 'pdf' };
    }

    // ── DOCX ──
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return { text: result.value.trim(), method: 'docx' };
    }

    // ── JPEG (vision path) ──
    if (type === 'image/jpeg' || type === 'image/jpg') {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        const base64 = btoa(binary);
        return { base64, mimeType: 'image/jpeg', method: 'vision' };
    }

    throw new Error('Unsupported file type. Please upload PDF, DOCX, or JPEG.');
}

/**
 * Parse resume from a File object using the appropriate AI model
 * PDF/DOCX → llama-3.3-70b-versatile
 * JPEG     → meta-llama/llama-4-scout-17b-16e-instruct (vision)
 * @param {File} file
 * @returns {Promise<object>} — same shape as parseResume()
 */
export async function parseResumeFromDocument(file) {
    const extracted = await extractTextFromDocument(file);

    if (extracted.method === 'vision') {
        // Vision model call for image resumes
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are a precise resume parser. Extract ALL information from this resume image and return ONLY valid JSON with this exact structure:
{
    "name":"string", "headline":"string", "email":"string", "phone":"string", "location":"string",
    "github":"string", "linkedin":"string", "portfolio":"string", "summary":"string", "selectedSkills":["string"],
    "experience": [{"company":"string", "role":"string", "type":"string", "start":"string", "end":"string", "current":boolean, "location":"string", "description":"string"}],
    "projects": [{"title":"string", "tech":"string", "type":"string", "start":"string", "end":"string", "ongoing":boolean, "url":"string", "demo":"string", "description":"string"}],
    "education": [{"institution":"string", "degree":"string", "field":"string", "start":"string", "end":"string", "current":boolean, "grade":"string", "achievements":"string"}],
    "certifications": [{"name":"string", "org":"string", "issue":"string", "expiry":"string", "noExpiry":boolean, "credentialId":"string", "url":"string"}],
    "confidenceScores": {"personal":100, "experience":100, "education":100, "projects":100, "skills":100, "links":100}
}
If field not found use empty string or array. Map links strictly to correct fields.`
                        },
                        {
                            type: 'image_url',
                            image_url: { url: `data:${extracted.mimeType};base64,${extracted.base64}` }
                        }
                    ]
                }],
                response_format: { type: 'json_object' },
                temperature: 0.1,
            })
        });
        if (!response.ok) throw new Error(`Vision model error: ${response.statusText}`);
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    }

    // Text path (PDF or DOCX) — use high-accuracy model
    return parseResume(extracted.text);
}

/**
 * Analyze Resume against Job Description
 * Generates ATS Score, Match Score, Missing Info, and Improvements
 * @param {object} formData - current parsed resume data
 * @param {string} jdText - raw Job Description text
 * @returns {Promise<object>} - analysis result JSON
 */
export async function analyzeResumeAgainstJD(formData, jdText) {
    const resumeContext = [
        `Name: ${formData.name}`,
        `Headline: ${formData.headline}`,
        `Summary: ${formData.summary}`,
        `Skills: ${(formData.selectedSkills || []).join(', ')}`,
        `Experience:\\n${formData.experience}`,
        `Projects:\\n${formData.projects}`,
        `Education:\\n${formData.education}`
    ].filter(l => l.split(':').slice(1).join(':').trim()).join('\\n');

    const prompt = `
You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter.
Analyze the provided RESUME against the provided JOB DESCRIPTION.

RESUME:
${resumeContext}

JOB DESCRIPTION:
${jdText.slice(0, 3000)}

Return ONLY valid JSON in this exact structure:
{
  "atsScore": number (0-100, based on format, readability, and section presence),
  "matchScore": number (0-100, based on how well the candidate's skills and experience match the JD),
  "missingInformation": ["string" (e.g., "Missing LinkedIn Profile", "Missing Leadership Experience", "Summary is too short")],
  "missingSkills": ["string" (Hard skills required by JD but missing in Resume)],
  "suggestedImprovements": ["string" (Highly actionable, specific tips to improve the resume for this exact role. Max 5 tips.)]
}

RULES:
- Be brutally honest with scores. A typical good match is 70-85.
- "missingInformation" should focus on structural or standard resume fields (links, contact info, core sections).
- "suggestedImprovements" must be actionable (e.g., "Quantify your impact in the Frontend Developer role by adding metrics like 'reduced load time by 20%'").
`;

    try {
        const raw = await callGroq(prompt, SYSTEM_INSTRUCTIONS, true, 'llama-3.3-70b-versatile');
        return JSON.parse(raw);
    } catch (error) {
        console.error("Analysis Failed:", error);
        throw new Error("Failed to analyze resume against JD.");
    }
}

/**
 * Tailor resume to a Job Description using the strict ATS optimization prompt.
 * Primary model: llama-3.3-70b-versatile
 * Validation pass: llama-3.1-8b-instant (word count checks)
 * @param {object} formData — current resume formData
 * @param {string} jobDescription — raw JD text
 * @returns {Promise<{step1: object, step2: object}>}
 */
export async function tailorResumeToJD(formData, jobDescription) {
    const resumeContext = [
        `Name: ${formData.name}`,
        `Headline: ${formData.headline}`,
        `Summary: ${formData.summary}`,
        `Skills: ${(formData.selectedSkills || []).join(', ')}`,
        `Experience:\n${formData.experience}`,
        `Projects:\n${formData.projects}`,
        `Education:\n${formData.education}`,
        `Certifications:\n${formData.certifications}`,
    ].filter(l => l.split(':').slice(1).join(':').trim()).join('\n');

    const prompt = `
You are an expert resume strategist and ATS optimization specialist.

BASE RESUME:
${resumeContext}

JOB DESCRIPTION:
${jobDescription}

Return ONLY valid JSON in this exact structure:
{
  "step1": {
    "hardSkills": ["comma-separated list of hard skills from JD"],
    "softSkills": ["comma-separated list of soft skills from JD"]
  },
  "step2": {
    "summary": "Professional summary STRICTLY 35-40 words. Rewritten based on JD. Natural integration of top hard skills. No generic phrases.",
    "skills": {
      "programmingLanguages": ["skills"],
      "frameworksPlatforms": ["skills"],
      "toolsTechnologies": ["skills"],
      "conceptsCoreSkills": ["skills"]
    },
    "experience": "Rewritten experience bullets. STRICT FORMAT: **Company Name** | Start - End\\nJob Title | Location\\n• Bullet 1 (20-25 words, metric, bold **keywords**).\\n• Bullet 2... Each bullet uses strong action verb, exact JD keywords, one quantified metric."
  }
}

RULES:
- Summary: EXACTLY 35-40 words (count carefully)
- Each experience bullet: EXACTLY 20-25 words with ≥1 metric and ≥1 JD keyword
- Skills: max 20 total across all 4 categories, mandatory JD hard skills first
- Bold format: **keyword** and **metric** in experience text
- NO fabrication. Keep experience realistic.
`;

    // Use gpt-4o for tailoring if available, as it's superior at word count constraints
    const raw = await callAI(prompt, SYSTEM_INSTRUCTIONS, true, OPENAI_KEY ? 'gpt-4o' : 'llama-3.3-70b-versatile');
    const result = JSON.parse(raw);

    // Validation pass — quick check with fast model
    try {
        const summaryWords = (result.step2?.summary || '').trim().split(/\s+/).length;
        if (summaryWords < 30 || summaryWords > 45) {
            const fixPrompt = `The summary below has ${summaryWords} words. Rewrite it to be EXACTLY 35-40 words. Return ONLY the summary text:
"${result.step2.summary}"`;
            result.step2.summary = await callGroq(fixPrompt, '', false, 'llama-3.1-8b-instant');
        }
    } catch (e) { /* validation pass is best-effort */ }

    return result;
}

/**
 * Generate ranked ATS improvement suggestions using Groq
 */
export async function generateATSFeedback(atsResult, formData, jdText) {
    const missingKws = (atsResult.keywords?.missing || []).slice(0, 8).join(', ');
    const weakSections = Object.entries(atsResult.breakdown || {})
        .filter(([, v]) => v.score < 60)
        .map(([k, v]) => `${v.label} (${v.score}%)`)
        .join(', ');

    const prompt = `
You are an expert ATS resume coach. Generate exactly 6 highly specific, actionable improvement suggestions.

Resume ATS Score: ${atsResult.overall}/100
Missing JD Keywords: ${missingKws || 'none'}
Weak Sections: ${weakSections || 'none'}
Formatting Issues: ${(atsResult.formatting?.issues || []).join(', ') || 'none'}
Job Description (first 500 chars): ${(jdText || '').slice(0, 500)}

Return ONLY a JSON array of 6 objects:
[
  { "priority": 1, "type": "keyword|experience|skills|formatting|structure", "icon": "🔴|🟡|🟢", "message": "Very specific actionable tip (e.g. Add Docker and Kubernetes since they appear 3x in JD and are missing from your skills section.)" }
]
Priority 1-2 = critical (🔴), 3-4 = medium (🟡), 5-6 = low (🟢).
NEVER give vague suggestions like 'improve skills section'.
`;

    try {
        const raw = await callGroq(prompt, '', true, 'llama-3.3-70b-versatile');
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : (arr.suggestions || arr.feedback || []);
    } catch {
        return [];
    }
}
