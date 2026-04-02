import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

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
 * Generates a professional summary for a resume
 */
export async function generateProfessionalSummary(formData) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTIONS
        });

        const prompt = `
            Write an elite 3-sentence professional summary for this candidate:
            Name: ${formData.name}
            Target Role: ${formData.headline}
            Core Stack: ${formData.selectedSkills?.join(", ")}
            Experience Raw: ${formData.experience}
            
            DIRECTIONS:
            1. Sentence 1: Hook the recruiter with years of experience and core expertise.
            2. Sentence 2: Highlight a massive technical or business impact using quantifiable data.
            3. Sentence 3: Mention a unique value (e.g., leadership, specialized tech) that makes them an MNC-grade hire.
            Ensure it is highly dense and professional.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Error (Summary):", error);
        throw error;
    }
}

/**
 * Parses raw resume text into structured JSON
 */
export async function parseResume(rawText) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTIONS + "\nOutput MUST be valid JSON."
        });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean up markdown code blocks if present
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error (Parser):", error);
        throw error;
    }
}

/**
 * Generates a professional portfolio bio
 */
export async function generatePortfolioBio(pd) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTIONS
        });

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
            
            EXAMPLE OF EXPECTED TONE AND STRUCTURE:
            "I am a forward-thinking Software Engineer specializing in architecting highly scalable, resilient web applications that serve millions of users. With deep expertise across the modern JavaScript ecosystem and cloud-native infrastructure, I bridge the gap between elegant user interfaces and robust backend systems. 

            Throughout my career, I have spearheaded the migration of legacy monoliths to microservices, engineered performance optimizations that reduced load times by 40%, and leveraged modern frameworks to accelerate product delivery. I thrive in cross-functional, agile environments where code quality and tangible business impact are the ultimate metrics of success."
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Error (Bio):", error);
        throw error;
    }
}

/**
 * Generates SEO meta tags for the portfolio
 */
export async function generateSEOTags(pd) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTIONS + "\nOutput MUST be valid JSON."
        });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error (SEO):", error);
        return {
            title: `${pd.name} | ${pd.headline} | Portfolio`,
            description: `Portfolio of ${pd.name}, a professional ${pd.headline}.`,
            keywords: pd.skills?.join(", ")
        };
    }
}

/**
 * Analyzes a resume specifically for the Dashboard
 * Returns skills, matching job ID, and actionable insights.
 */
export async function parseDashboardResume(rawText, availableSkills, jobLibrary) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTIONS + "\nOutput MUST be valid JSON."
        });

        // Job library map for the prompt
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

        const result = await model.generateContent(prompt);

        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error (Dashboard Parser):", error);
        throw error;
    }
}

/**
 * Generates dynamic industry-trending master skills (with Global Firestore Caching)
 */
export async function getTrendingJobSkills(targetJobTitle, availableSkills) {
    try {
        // 1. Check Global AI Cache first
        const cacheRef = doc(db, 'ai_job_cache', targetJobTitle);
        const cacheSnap = await getDoc(cacheRef);
        
        if (cacheSnap.exists()) {
            console.log("Serving robust AI required skills from global scale cache:", targetJobTitle);
            return cacheSnap.data().skills;
        }

        // 2. Not in Cache? Query Gemini Model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTIONS + "\nOutput MUST be valid JSON."
        });

        const prompt = `
            You are evaluating candidates globally for the role of "${targetJobTitle}".
            Based on current industry trends and MNC standards, identify the definitive master list of the top 15 to 20 technical and soft skills absolutely required to land this role.
            
            CRITICAL: You MUST ONLY select skills from this exact approved list. Do not invent new skills or change the casing at all:
            ${availableSkills.join(', ')}
            
            Return ONLY a JSON array of strings representing the master list.
            Example: ["React", "AWS", "System Design", "Communication"]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const skillsArray = JSON.parse(text);

        // 3. Store result in Firestore to prevent future API usage
        await setDoc(cacheRef, { 
            skills: skillsArray, 
            updatedAt: new Date().toISOString()
        });
        
        return skillsArray;
    } catch (error) {
        console.error("Gemini Cache/Generation Error:", error);
        return [];
    }
}
