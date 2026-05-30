import { GoogleGenAI } from '@google/genai';

const getAIClient = () => {
    // Try multiple possible locations for the key
    const apiKey = (
        import.meta.env.VITE_GEMINI_API_KEY ||
        window?._env_?.VITE_GEMINI_API_KEY ||
        ""
    ).trim();

    if (!apiKey || apiKey.length < 10) {
        console.error("Gemini API Key missing or too short. Key length:", apiKey.length);
        return null;
    }

    try {
        return new GoogleGenAI({ apiKey });
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI:", e);
        return null;
    }
};

export const generateBio = async (name, skills, goal) => {
    const genAI = getAIClient();
    if (!genAI) return `Passionate digital architect specializing in ${skills.slice(0, 2).join(' and ')}. I build futuristic web experiences.`;

    try {
        const prompt = `Write a short, professional, and impactful portfolio bio for ${name}. 
        Their core skills are: ${skills.join(', ')}. 
        Their main goal is: ${goal}. 
        The tone should be confident, modern, and concise (max 3 sentences). Do not include any greeting or quotes.`;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Failed to generate bio. Please try again later or check your API key.";
    }
};

export const suggestSkills = async (role) => {
    const genAI = getAIClient();
    if (!genAI) return ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Figma', 'System Design'];

    try {
        const prompt = `List the top 6 most in-demand technical skills for a modern "${role}". 
        Return ONLY a comma-separated list of the skills. Do not include any other text or formatting.`;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        return response.text.split(',').map(s => s.trim()).slice(0, 6);
    } catch (error) {
        console.error("Gemini API Error:", error);
        return ['JavaScript', 'React', 'Node.js', 'CSS', 'HTML', 'Git'];
    }
};

export const optimizeProjectDescription = async (desc) => {
    const genAI = getAIClient();
    if (!genAI) return `Architected a high-performance scalable solution using modern stack, improving user engagement by 40% and reducing latency by 200ms.`;

    try {
        const prompt = `Rewrite the following project description to make it sound highly professional, impact-driven, and impressive for a portfolio. 
        Focus on action verbs and outcomes. Keep it under 2 sentences.
        Original: "${desc}"`;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return desc;
    }
};

export const recommendTheme = async (role) => {
    if (role.toLowerCase().includes('design')) return 'glassmorphic';
    return 'neo-brutal';
};

export const buildDashboardPayload = (user) => {
    if (!user) return null;
    
    const payload = {
      name: user.name || '',
      email: user.email || '',
      bio: user.bio || '',
      skills: user.skills || [],
      targetJob: user.targetJob || '',
      photoURL: user.photoURL || '',
      github: user.github || '',
      linkedin: user.linkedin || '',
      githubProjects: (user.githubProjects || [])
        .filter(p => !p.hidden)
        .sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.score || 0) - (a.score || 0);
        })
        .slice(0, 8)
        .map(p => ({
          name: p.customTitle || p.repoName,
          description: p.customDescription || p.aiSummary || p.description || '',
          technologies: p.technologies || [],
          githubUrl: p.githubUrl || '',
          liveUrl: p.deploymentUrl || '',
          score: p.score || 0,
          selected: !!p.selected,
          featured: !!p.featured,
        })),
      resumeInsights: user.resumeInsights || null,
    };
    
    return payload;
};

export const chatWithAI = async (message, contextState, dashboardData = null) => {
    const genAI = getAIClient();
    if (!genAI) return JSON.stringify({ message: "AI Assistant is temporarily unavailable. Please try again later.", actions: [] });

    try {
        const systemPrompt = `You are DakshAI Portfolio Co-Pilot — a professional AI assistant that helps users build stunning portfolio websites.

Your personality: Confident, helpful, and design-savvy. You write in an achievement-focused tone.

## AVAILABLE DASHBOARD DATA
${dashboardData ? `
User Profile:
- Name: ${dashboardData.name || 'Not set'}
- Email: ${dashboardData.email || 'Not set'}
- Bio: ${dashboardData.bio || 'Not set'}
- Target Role: ${dashboardData.targetJob || 'Not set'}
- Skills: ${dashboardData.skills?.length ? dashboardData.skills.join(', ') : 'None added'}
- Photo: ${dashboardData.photoURL ? 'Available' : 'Not uploaded'}
- GitHub: ${dashboardData.github || 'Not connected'}
- LinkedIn: ${dashboardData.linkedin || 'Not connected'}

GitHub Projects (${dashboardData.githubProjects?.length || 0} available):
${dashboardData.githubProjects?.map((p, i) => `${i + 1}. ${p.name} — ${p.description} [Tech: ${p.technologies?.join(', ')}] Score: ${p.score}${p.featured ? ' ⭐FEATURED' : ''}${p.selected ? ' ✓SELECTED' : ''}`).join('\n') || 'No projects'}

Resume Data: ${dashboardData.resumeInsights ? 'Available (parsed from uploaded resume)' : 'Not available (no resume uploaded)'}
` : 'No dashboard data available.'}

## CURRENT PORTFOLIO STATE
- Name: ${contextState?.personalInfo?.fullName || 'Not set'}
- Theme: ${contextState?.theme?.id || 'glassmorphic'}
- Sections Enabled: ${contextState?.sections?.filter(s => s.visible).map(s => s.id).join(', ') || 'None'}

CRITICAL: You MUST respond in a strict JSON format with exactly two keys: "message" (your conversational response to the user) and "actions" (an array of automated changes to make).

ACTION FORMAT:
{ "type": "...", "data": { ... }, "requireApproval": true | false }

AVAILABLE ACTIONS:
1. { "type": "UPDATE_PERSONAL_INFO", "data": { "fullName": "...", "headline": "...", "bio": "...", "avatarUrl": "...", "socialLinks": {"github": "...", "linkedin": "..."} } }
2. { "type": "UPDATE_SECTION_DATA", "sectionId": "sec-skills" | "sec-projects" | "sec-experience" | "sec-education" | "sec-certifications", "data": { ... } }
3. { "type": "BULK_UPDATE", "data": { "personalInfo": {...}, "sectionData": {...} }, "requireApproval": true }  <- Use this to apply ALL dashboard data at once if asked to "auto fill" or "use my profile".

If the user asks to use their dashboard data or auto-fill their portfolio, YOU MUST construct a BULK_UPDATE action incorporating their Name, Bio, Target Role, Skills (categorized into technical/tools), and GitHub Projects (formatted for the portfolio).

User message: "${message}"

GUIDELINES:
- When extracting projects from dashboard data, map them to the portfolio format: { id: "p1", title, description, technologies, link, github, image }
- ALWAYS provide a friendly conversational message.
- Output ONLY valid JSON, do not wrap in markdown \`\`\` blocks unless it is parsed properly on the client.`;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: systemPrompt
        });
        let text = response.text.trim();

        // Extract JSON if AI wrapped it in markdown or added conversational text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? jsonMatch[0] : JSON.stringify({ message: text, actions: [] });
    } catch (error) {
        console.error("Gemini Chat API Error Details:", error);
        return JSON.stringify({
            message: "I encountered an error trying to process that. Please check your API key or try again in a moment.",
            actions: []
        });
    }
};
