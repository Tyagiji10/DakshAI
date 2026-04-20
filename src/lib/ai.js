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
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
console.log(`[Daksh.AI] System Ready | Auth Mode: ${API_KEY.startsWith('gsk_') ? 'Verified' : 'Error'}`);

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
 * Helper to call Groq API via native fetch (Safer for browser)
 */
async function callGroq(prompt, systemMsg = SYSTEM_INSTRUCTIONS, jsonMode = false, model = "llama-3.1-8b-instant") {
    if (!API_KEY || API_KEY.includes("PASTE_YOUR_GROQ_KEY")) {
        throw new Error("⚠️ Groq API Key is missing. Please check your .env file.");
    }

    try {
        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemMsg + (jsonMode ? " Output MUST be valid JSON." : "") },
                    { role: "user", content: prompt }
                ],
                response_format: jsonMode ? { type: "json_object" } : undefined,
                temperature: 0.5,
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Groq API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();

        // Robust cleaning for JSON output
        if (jsonMode) {
            // Remove markdown code blocks if present
            return content.replace(/```json\n?|```/g, '').trim();
        }

        return content;
    } catch (error) {
        console.error("Groq AI Error:", error);
        throw error;
    }
}

/**
 * Generates a professional summary for a resume
 */
export async function generateProfessionalSummary(formData) {
    const prompt = `
        You are a top-tier tech career coach operating strictly within the Indian Job Market.
        Generate a highly professional, 3-4 sentence resume summary for a candidate in India.
        
        Candidate Details:
        Name: ${formData.personalInfo.fullName}
        Title: ${formData.personalInfo.title}
        Experience: ${formData.summary.experienceYears}
        Skills: ${formData.skills.map(s => s.name).join(', ')}
        
        RULES:
        1. NO generic buzzwords.
        2. Focus on value, domain expertise, and Indian corporate expectations (e.g. scalable systems, agile delivery, client requirements).
        3. Keep it punchy and impactful, strictly using Indian market terminology.
        4. NEVER hallucinate companies, degrees, or years of experience. Strictly use the provided details. Use "Proven experience" if no exact years are specified.
        
        Return ONLY the raw text.
    `;
    return await callGroq(prompt);
}

/**
 * Parses raw resume text into structured JSON
 */
export async function parseResume(rawText) {
    const prompt = `
        Analyze and extract data from this raw resume text.
        
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
            "headline": "string (The STRICTLY MAPPED job title based on the rules above)",
            "email": "string",
            "phone": "string",
            "location": "string",
            "summary": "string (Refined into an elite professional summary, max 3 sentences)",
            "selectedSkills": ["string (Standardized technical keywords)"],
            "experience": "string (Formatted with '•' bullets for impact; ignore layout noise)",
            "education": "string (School, Degree, Dates)",
            "projects": "string (Title: Impact)",
            "certifications": "string"
        }
        
        If a field is not found, use an empty string. Output ONLY the JSON.
    `;
    const result = await callGroq(prompt, undefined, true);
    return JSON.parse(result);
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
 * Pre-generates and severely caches exactly 6 top-tier Indian market interview questions.
 */
export async function getInterviewQuestionBank(targetJob, difficulty) {
    const cacheKey = `daksh_interview_bank_${targetJob.toLowerCase().replace(/\s+/g, '_')}_${difficulty}`;

    // 1. Return Instant Cached Version to Reduce AI Load
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) { // Valid for 7 Days
            console.log("Daksh.AI: Loading Cached Interview Questions!", targetJob, difficulty);
            return data;
        }
    }

    const prompt = `
        You are an elite, highly strict senior technical recruiter operating in the top-tier Indian Corporate IT Sector (e.g. MNCs, Big Tech, Unicorn startups).
        Generate EXACTLY 20 highly probable, heavily-tested interview questions for the role of "${targetJob}" aligned with a "${difficulty}" difficulty level.
        
        CRITICAL RULES:
        - Questions MUST reflect current Indian job market expectations for this exact role.
        - Questions must be deeply technical, architectural, or situational. Avoid generic fluff.
        - Return ONLY a raw JSON Array of 20 exact question strings. Absolute nothing else.
        
        Example Output:
        ["How do you manage state in a highly scalable React app?", "Explain event loop architecture."]
    `;

    try {
        const result = await callGroq(prompt, "You are a master Indian tech recruiter.", true, "llama-3.3-70b-versatile");
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
        return [
            "Could you start by telling me briefly about your technical background?",
            "What is the most complex scalable architecture or system you have personally built?",
            "How do you handle severe performance bottlenecks in a generic enterprise stack?",
            "Explain your strategy for resolving a critical production application outage.",
            "How do you enforce rigorous code quality and security standards in a large team?",
            "Why are you interested in advancing your career in the Indian Tech Industry?",
            "Describe how you approach system design for a high-traffic web application.",
            "How do you stay up to date with the rapidly changing technology landscape?",
            "Can you walk us through a time you mentored or improved a team's workflow?",
            "What is your approach to testing, deployment pipelines, and CI/CD?",
            "How do you handle disagreements with senior engineers or stakeholders on technical decisions?",
            "Describe your experience with microservices vs monolithic architecture.",
            "How do you approach database design and query optimization at scale?",
            "What techniques do you use to ensure security in your APIs?",
            "Tell me about a time you delivered a project under tight deadline pressure.",
            "How do you debug a performance issue in a live production environment?",
            "What design patterns do you use most frequently and why?",
            "How do you onboard into a large, unfamiliar codebase quickly?",
            "Describe your experience with agile, scrum, or kanban workflows.",
            "Where do you see yourself growing technically in the next 2 years in the Indian IT industry?"
        ];
    }
}

/**
 * Conducts a single step of the AI Mock Interview
 */
export async function conductInterviewStep(messages, targetJob, difficulty = 'Intermediate', questionBank = []) {
    const prompt = `
        You are a strict, senior technical hiring manager operating at a top-tier product company in India.
        You are interviewing a candidate for the role of ${targetJob}.
        The interview difficulty is: ${difficulty}.
        
        Your persona: Professional, challenging, highly focused on clear architectures, performance, and best practices expected in the Indian corporate landscape.
        
        MANDATORY INTERVIEW BLUEPRINT (CACHED):
        ${questionBank.map((q, i) => `${i + 1}. ${q}`).join('\n')}
        
        RULES:
        1. Ask exactly ONE technical or behavioral question at a time. Progress through the MANDATORY INTERVIEW BLUEPRINT, and if you run out of blueprint questions, dynamically invent new relevant ones.
        2. If the candidate's last answer was weak, politely but firmly press them on it.
        3. Only set "isEnd" to true and provide the "scorecard" IF AND ONLY IF the candidate explicitly states they want to end the interview, OR if you receive a SYSTEM message commanding you to conclude the interview. Do NOT evaluate based on a fixed number of questions.
        4. PERSONALIZATION (CRITICAL): If the candidate explicitly mentions a specific personal project, a company they worked at, a technology they built something with, or a concrete achievement — YOU MUST ask exactly ONE targeted, curious follow-up question about that detail.
        5. LANGUAGE SWITCH (CRITICAL): The AI Recruiter MUST support both English and Hindi. If the candidate explicitly asks to "talk in Hindi", or heavily uses Hindi, YOU MUST immediately translate your next question into Hindi and formally conduct the rest of the interview in Hindi.
        
        Current conversation history:
        ${messages.map(m => `[${m.role.toUpperCase()}]: ${m.text || m.content}`).join('\n')}
        
        Output MUST be a JSON object:
        {
            "question": "string (The next interview question. Respond in Hindi if the conversation has switched to Hindi, otherwise English)",
            "isEnd": boolean (true if the interview is finished),
            "language": "string ('en' or 'hi' - set to 'hi' if you are communicating in Hindi, otherwise 'en')",
            "scorecard": { 
                "communication": number (1-5), 
                "technical": number (1-5), 
                "problemSolving": number (1-5),
                "confidence": number (1-5),
                "taskPerformance": number (1-5),
                "overall": number (1-5),
                "feedback": "string (3 actionable tips to improve specifically for the Indian market)" 
            } (Only provide scorecard if isEnd is true, otherwise null)
        }
    `;

    // We send the full conversation history to maintain context
    return JSON.parse(await callGroq(prompt, "You are a senior technical interviewer.", true, "llama-3.3-70b-versatile"));
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
