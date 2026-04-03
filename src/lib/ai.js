import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

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
async function callGroq(prompt, systemMsg = SYSTEM_INSTRUCTIONS, jsonMode = false) {
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
                model: "llama-3.3-70b-versatile",
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
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error("Groq AI Error:", error);
        throw error;
    }
}

/**
 * Generates a professional summary for a resume
 */
export async function generateProfessionalSummary(formData) {
    const hasExp = Boolean(formData.experience?.trim());
    const prompt = `
        Write an elite 3-sentence professional summary for this candidate:
        Name: ${formData.name}
        Target Role: ${formData.headline}
        Core Stack: ${formData.selectedSkills?.join(", ")}
        Experience Raw: ${formData.experience}
        
        CRITICAL CONSTRAINTS:
        1. STRICT DATA ADHERENCE: Do NOT mention years of experience (e.g., "5 years", "8 years") unless specifically stated in the "Experience Raw" section.
        2. FRESHER/STUDENT STRATEGY (If Experience Raw is empty or minimal): Focus on "Emerging talent", "Academic excellence", "Technical proficiency", and "Project-driven impact".
        3. SENIOR STRATEGY (If Experience Raw is detailed): Focus on "Strategic leadership", "Architecting scalable solutions", and "Quantifiable business outcomes".
        
        DIRECTIONS:
        - Sentence 1: Establish high-level authority based only on provided roles and skills.
        - Sentence 2: Highlight a technical or project achievement using forceful verbs (Spearheaded, Engineered, Optimized).
        - Sentence 3: Mention a unique value proposition for Top MNCs (e.g., agile collaboration, specialized research, or rapid adaptation).
        
        Tone: Professional, aggressive, and results-oriented. Max 3 sentences.
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
    const prompt = `
        Write an elite, high-impact "About Me" bio for an MNC-grade portfolio website.
        Name: ${pd.name}
        Headline: ${pd.headline}
        Key Skills: ${pd.skills?.join(", ")}
        Brief Background: ${pd.bio}
        
        GUIDELINES:
        1. No generic fluff like "I am a passionate developer."
        2. First paragraph: Establish high-level authority. State what you architect or build, and the scale of it. 
        3. Second paragraph: Connect technical proficiency with tangible business or performance outcomes. Use words like "spearheaded", "architected", "optimized", "leveraged".
        4. Length: Dense but readable (approx 120-150 words).
    `;
    return await callGroq(prompt);
}

/**
 * Generates SEO meta tags for the portfolio
 */
export async function generateSEOTags(pd) {
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
        return JSON.parse(result);
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
 * Generates dynamic industry-trending master skills (with Global Firestore Caching)
 */
export async function getTrendingJobSkills(targetJobTitle, availableSkills) {
    try {
        const cacheRef = doc(db, 'ai_job_cache', targetJobTitle);
        const cacheSnap = await getDoc(cacheRef);
        
        if (cacheSnap.exists()) {
            return cacheSnap.data().skills;
        }

        const prompt = `
            You are evaluating candidates globally for the role of "${targetJobTitle}".
            Based on current industry trends and MNC standards, identify the definitive master list of the top 15 to 20 technical and soft skills absolutely required to land this role.
            
            CRITICAL: You MUST ONLY select skills from this exact approved list. Do not invent new skills or change the casing at all:
            ${availableSkills.join(', ')}
            
            Return ONLY a JSON array of strings representing the master list.
        `;

        const result = await callGroq(prompt, undefined, true);
        const skillsArray = JSON.parse(result);

        await setDoc(cacheRef, { 
            skills: skillsArray, 
            updatedAt: new Date().toISOString()
        });
        
        return skillsArray;
    } catch (error) {
        console.error("Groq Cache Error:", error);
        return [];
    }
}
