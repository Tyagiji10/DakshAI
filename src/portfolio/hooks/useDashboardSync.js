import { useState, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { usePortfolio } from '../context/PortfolioContext';

const useDashboardSync = () => {
  const { user } = useUser();
  const { state, updatePersonalInfo, updateSocialLinks, updateSectionData, bulkUpdatePortfolio, markFieldSynced } = usePortfolio();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const getFieldStatus = useCallback((fieldPath) => {
    // Check if dashboard has data for this field
    const dashboardValue = getNestedValue(user, fieldPath);
    if (!dashboardValue || (Array.isArray(dashboardValue) && dashboardValue.length === 0)) return 'missing';
    // Check if portfolio already has this data
    const portfolioValue = getNestedValue(state, fieldPath);
    if (portfolioValue && portfolioValue.length > 0) return 'already-filled';
    return 'available';
  }, [user, state]);

  // Helper to get nested values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  };

  const autoFillProfile = useCallback(async () => {
    const filled = [];
    const missing = [];
    const updates = {};

    if (user?.name) { updates.fullName = user.name; filled.push('Name'); }
    else missing.push('Name');

    if (user?.bio) { updates.bio = user.bio; filled.push('Bio'); }
    else missing.push('Bio');

    if (user?.photoURL) { updates.avatarUrl = user.photoURL; filled.push('Photo'); }
    else missing.push('Photo');

    if (user?.targetJob) {
      // Try to find job title from the job library isn't available here, use targetJob as headline hint
      updates.headline = user.targetJob;
      filled.push('Headline');
    }

    if (Object.keys(updates).length > 0) {
      updatePersonalInfo(updates);
      markFieldSynced?.('personalInfo');
    }

    return { filled, missing };
  }, [user, updatePersonalInfo, markFieldSynced]);

  const autoFillSocialLinks = useCallback(async () => {
    const filled = [];
    const missing = [];
    const links = {};

    if (user?.github) { links.github = user.github; filled.push('GitHub'); }
    else missing.push('GitHub');

    if (user?.linkedin) { links.linkedin = user.linkedin; filled.push('LinkedIn'); }
    else missing.push('LinkedIn');

    if (Object.keys(links).length > 0) {
      updateSocialLinks(links);
      markFieldSynced?.('socialLinks');
    }

    return { filled, missing };
  }, [user, updateSocialLinks, markFieldSynced]);

  const autoFillSkills = useCallback(async () => {
    const filled = [];
    const missing = [];

    if (user?.skills?.length > 0 || user?.githubProjects?.length > 0) {
      // Split user skills into technical and tools using a heuristic
      const toolKeywords = ['git', 'docker', 'figma', 'aws', 'azure', 'gcp', 'jenkins', 'jira', 'postman', 'vscode', 'vim', 'linux', 'firebase', 'vercel', 'netlify', 'heroku', 'kubernetes', 'terraform', 'ansible'];
      const technical = [];
      const tools = [];

      if (user?.skills) {
        user.skills.forEach(skill => {
          const skillName = typeof skill === 'string' ? skill : (skill?.name || '');
          if (toolKeywords.some(t => skillName.toLowerCase().includes(t))) {
            tools.push(skillName);
          } else if (skillName) {
            technical.push(skillName);
          }
        });
      }

      // Also extract unique technologies from GitHub projects
      if (user?.githubProjects?.length > 0) {
        const projectTech = new Set();
        user.githubProjects
          .filter(p => p.selected || p.score >= 60)
          .forEach(p => p.technologies?.forEach(t => projectTech.add(t)));
        
        projectTech.forEach(t => {
          if (!technical.includes(t) && !tools.includes(t)) {
            if (toolKeywords.some(tk => t.toLowerCase().includes(tk))) {
              tools.push(t);
            } else {
              technical.push(t);
            }
          }
        });
      }

      const currentSkills = state?.sectionData?.['sec-skills'] || {};
      updateSectionData('sec-skills', {
        technical: [...new Set([...(currentSkills.technical || []), ...technical])],
        tools: [...new Set([...(currentSkills.tools || []), ...tools])],
        soft: currentSkills.soft || [],
      });
      markFieldSynced?.('skills');
      filled.push('Skills');
    } else {
      missing.push('Skills');
    }

    return { filled, missing };
  }, [user, state, updateSectionData, markFieldSynced]);

  const autoFillProjects = useCallback(async () => {
    const filled = [];
    const missing = [];

    if (user?.githubProjects?.length > 0) {
      // Prioritize: featured first, then selected, then by score
      const sortedProjects = [...user.githubProjects]
        .filter(p => !p.hidden)
        .sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          if (a.selected && !b.selected) return -1;
          if (!a.selected && b.selected) return 1;
          return (b.score || 0) - (a.score || 0);
        })
        .slice(0, 6); // Max 6 projects

      const currentProjects = state?.sectionData?.['sec-projects'] || [];
      const existingTitles = new Set(currentProjects.map(p => p.title?.toLowerCase()));

      const newProjects = sortedProjects
        .filter(p => !existingTitles.has((p.customTitle || p.repoName)?.toLowerCase()))
        .map(p => ({
          id: Date.now() + Math.random(),
          title: p.customTitle || p.repoName,
          description: p.customDescription || p.aiSummary || p.description || '',
          technologies: p.technologies || [],
          link: p.deploymentUrl || '',
          github: p.githubUrl || '',
          image: p.customThumbnail || '',
        }));

      if (newProjects.length > 0) {
        updateSectionData('sec-projects', [...currentProjects, ...newProjects]);
        markFieldSynced?.('projects');
        filled.push(`${newProjects.length} Projects`);
      } else {
        filled.push('Projects (already up to date)');
      }
    } else {
      missing.push('Projects (connect GitHub in Dashboard)');
    }

    return { filled, missing };
  }, [user, state, updateSectionData, markFieldSynced]);

  const autoFillContact = useCallback(async () => {
    const filled = [];
    const missing = [];

    if (user?.email) {
      const current = state?.sectionData?.['sec-contact'] || {};
      // Preserve formspreeId during sync — never overwrite it
      updateSectionData('sec-contact', { ...current, email: user.email, formspreeId: current.formspreeId || '' });
      markFieldSynced?.('contact');
      filled.push('Email');
    } else {
      missing.push('Email');
    }

    return { filled, missing };
  }, [user, state, updateSectionData, markFieldSynced]);

  const autoFillAll = useCallback(async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const allFilled = [];
    const allMissing = [];

    try {
      const results = await Promise.all([
        autoFillProfile(),
        autoFillSocialLinks(),
        autoFillSkills(),
        autoFillProjects(),
        autoFillContact(),
      ]);

      results.forEach(r => {
        allFilled.push(...r.filled);
        allMissing.push(...r.missing);
      });

      const result = { filled: allFilled, missing: allMissing, timestamp: new Date().toISOString() };
      setSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [autoFillProfile, autoFillSocialLinks, autoFillSkills, autoFillProjects, autoFillContact]);

  const getSyncSummary = useCallback(() => {
    const summary = {
      profile: { name: !!user?.name, bio: !!user?.bio, photo: !!user?.photoURL },
      social: { github: !!user?.github, linkedin: !!user?.linkedin },
      skills: user?.skills?.length > 0,
      projects: user?.githubProjects?.filter(p => !p.hidden)?.length > 0,
      contact: !!user?.email,
      lastSyncedAt: state?.syncMeta?.lastSyncedAt,
    };
    return summary;
  }, [user, state]);

  return {
    isSyncing,
    syncResult,
    setSyncResult,
    autoFillAll,
    autoFillProfile,
    autoFillSocialLinks,
    autoFillSkills,
    autoFillProjects,
    autoFillContact,
    getFieldStatus,
    getSyncSummary,
  };
};

export default useDashboardSync;
