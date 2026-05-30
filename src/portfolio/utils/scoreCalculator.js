export const calculatePortfolioScore = (state) => {
    let score = 0;
    let missing = [];

    if (!state) return { score: 0, missing: [] };
    const { personalInfo, sectionData } = state;

    if (personalInfo?.avatarUrl) score += 15; 
    else missing.push({ label: 'Profile Photo', suggestion: 'Add a professional photo to build trust.' });
    
    if (personalInfo?.fullName?.trim()) score += 5; 
    else missing.push({ label: 'Full Name', suggestion: 'Your name is the foundation of your portfolio.' });
    
    if (personalInfo?.headline?.trim()) score += 10; 
    else missing.push({ label: 'Headline', suggestion: 'Add a catchy headline to summarize who you are.' });
    
    if (personalInfo?.bio?.trim()) score += 10; 
    else missing.push({ label: 'Bio', suggestion: 'Write a short bio detailing your background.' });

    const socialCount = ['github', 'linkedin', 'twitter', 'website'].filter(k => personalInfo?.socialLinks?.[k]?.trim()).length;
    score += socialCount * 2.5; // Max 10
    if (socialCount === 0) missing.push({ label: 'Social Links', suggestion: 'Link your GitHub or LinkedIn.' });
    else if (socialCount < 2) missing.push({ label: 'More Social Links', suggestion: 'Add more professional links.' });

    const skillsData = sectionData?.['sec-skills'];
    const hasSkills = skillsData && (skillsData.technical?.length || skillsData.tools?.length || skillsData.soft?.length);
    if (hasSkills) score += 10; 
    else missing.push({ label: 'Skills', suggestion: 'List your technical and soft skills.' });

    const hasExperience = sectionData?.['sec-experience']?.length > 0;
    if (hasExperience) score += 15; 
    else missing.push({ label: 'Experience', suggestion: 'Add your work history or internships.' });

    const hasProjects = sectionData?.['sec-projects']?.length > 0;
    if (hasProjects) score += 15; 
    else missing.push({ label: 'Projects', suggestion: 'Showcase your best work with project details.' });

    const hasEducation = sectionData?.['sec-education']?.length > 0;
    if (hasEducation) score += 10; 
    else missing.push({ label: 'Education', suggestion: 'Add your educational background.' });

    return { 
        score: Math.min(100, Math.round(score)), 
        missing 
    };
};
