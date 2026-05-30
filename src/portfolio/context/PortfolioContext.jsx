import React, { createContext, useContext, useState } from 'react';

const PortfolioContext = createContext(null);

export const THEME_PRESETS = {
    'glassmorphic': {
        name: 'Glassmorphism',
        description: 'Dark glass with neon glow',
        colors: { primary: '#0B0F19', accent: '#6366f1', text: '#ffffff', background: '#0B0F19' },
        accentPresets: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
        variants: [
            { id: 'glass-ai', label: 'Glass AI', desc: 'Futuristic glowing cards' },
            { id: 'glass-startup', label: 'Glass Startup', desc: 'Clean, professional layout' },
            { id: 'glass-minimal', label: 'Glass Minimal', desc: 'Subtle frost, lots of breathing room' },
            { id: 'glass-portfolio', label: 'Glass Portfolio', desc: 'Creative, masonry grids' }
        ]
    },
    'neo-brutal': {
        name: 'Neobrutalism',
        description: 'Bold borders, raw energy',
        colors: { primary: '#000000', accent: '#facc15', text: '#ffffff', background: '#000000' },
        accentPresets: ['#facc15', '#f97316', '#ec4899', '#22c55e', '#38bdf8'],
        variants: [
            { id: 'neo-designer', label: 'Neo Designer', desc: 'Offset shadows, huge typography' },
            { id: 'neo-creator', label: 'Neo Creator', desc: 'Sticker labels, playful layouts' },
            { id: 'neo-hacker', label: 'Neo Hacker', desc: 'Terminal vibes, dense grids' },
            { id: 'neo-agency', label: 'Neo Agency', desc: 'Structured grids, thick outlines' }
        ]
    }
};

const DEFAULT_STATE = {
    theme: {
        id: 'glassmorphic',
        variant: 'glass-ai',
        colors: { ...THEME_PRESETS['glassmorphic'].colors },
        fontFamily: "'Inter', sans-serif",
        background: {
            type: 'gradient', // 'solid' or 'gradient'
            direction: '135deg',
            colors: ['#0B0F19', '#1e1b4b']
        },
        layout: { borderRadius: '16px', spacing: '24px', glassBlur: '16px' }
    },
    personalInfo: {
        fullName: 'Alex Developer',
        headline: 'Creative Digital Architect',
        bio: 'Building futuristic web experiences with bleeding-edge technologies.',
        avatarUrl: '',
        siteTitle: '',
        siteTagline: '',
        socialLinks: {
            github: '',
            linkedin: '',
            twitter: '',
            website: ''
        }
    },
    sections: [
        { id: 'sec-hero', type: 'hero', title: 'Hero Section', visible: true },
        { id: 'sec-skills', type: 'skills', title: 'Technical Skills', visible: true },
        { id: 'sec-experience', type: 'experience', title: 'Experience', visible: true },
        { id: 'sec-projects', type: 'projects', title: 'Featured Work', visible: true },
        { id: 'sec-education', type: 'education', title: 'Education', visible: true },
        { id: 'sec-certifications', type: 'certifications', title: 'Certifications', visible: true },
        { id: 'sec-contact', type: 'contact', title: 'Contact Me', visible: true }
    ],
    sectionData: {
        'sec-skills': { technical: ['React', 'Node.js', 'Tailwind CSS'], tools: ['Git', 'Figma'], soft: ['Leadership'] },
        'sec-projects': [
            { id: 'p1', title: 'Project One', description: 'A cool project', technologies: ['React'], link: '', github: '', image: '' }
        ],
        'sec-experience': [
            { id: 'e1', role: 'Senior Developer', company: 'Tech Corp', location: '', duration: '2022 - Present', description: 'Led frontend development.\n• Built scalable React components.\n• Improved performance by 40%.' }
        ],
        'sec-education': [
            { id: 'ed1', institution: 'University of Technology', degree: 'B.Tech Computer Science', year: '2018 - 2022', gpa: '' }
        ],
        'sec-certifications': [],
        'sec-contact': { email: 'hello@example.com', phone: '', address: 'Remote', formspreeId: '' }
    },
    syncMeta: {
        lastSyncedAt: null,
        syncedFields: {},
        manuallyEdited: {}
    }
};

export function PortfolioProvider({ children, initialData }) {
    const [state, setState] = useState(() => {
        if (initialData) return initialData;
        try {
            const savedRaw = localStorage.getItem('dakshai-portfolio-state');
            if (!savedRaw || savedRaw === 'undefined' || savedRaw === 'null') return DEFAULT_STATE;
            const saved = JSON.parse(savedRaw);
            if (!saved || typeof saved !== 'object') return DEFAULT_STATE;

            return {
                ...DEFAULT_STATE,
                ...saved,
                theme: {
                    ...DEFAULT_STATE.theme,
                    ...(saved.theme || {}),
                    variant: saved.theme?.variant || DEFAULT_STATE.theme.variant,
                    colors: { ...DEFAULT_STATE.theme.colors, ...(saved.theme?.colors || {}) },
                    background: { ...DEFAULT_STATE.theme.background, ...(saved.theme?.background || {}) },
                    layout: { ...DEFAULT_STATE.theme.layout, ...(saved.theme?.layout || {}) }
                },
                personalInfo: {
                    ...DEFAULT_STATE.personalInfo,
                    ...(saved.personalInfo || {}),
                    socialLinks: {
                        ...DEFAULT_STATE.personalInfo.socialLinks,
                        ...(saved.personalInfo?.socialLinks || {}),
                        // migrate legacy top-level socialLinks
                        ...(saved.socialLinks || {})
                    }
                },
                sections: saved.sections?.length ? saved.sections : DEFAULT_STATE.sections,
                sectionData: { ...DEFAULT_STATE.sectionData, ...(saved.sectionData || {}) },
                syncMeta: { ...DEFAULT_STATE.syncMeta, ...(saved.syncMeta || {}) }
            };
        } catch (e) {
            console.error('Failed to parse portfolio state:', e);
            return DEFAULT_STATE;
        }
    });

    const [aiMessages, setAiMessages] = useState(() => {
        try {
            const saved = localStorage.getItem('dakshai-ai-chat');
            return saved ? JSON.parse(saved) : [
                { role: 'bot', content: "Hi! I'm your AI Portfolio Assistant. Tell me what to build, or use a quick action below to get started!", timestamp: Date.now() }
            ];
        } catch { return []; }
    });

    React.useEffect(() => {
        localStorage.setItem('dakshai-portfolio-state', JSON.stringify(state));
    }, [state]);

    React.useEffect(() => {
        localStorage.setItem('dakshai-ai-chat', JSON.stringify(aiMessages));
    }, [aiMessages]);

    const updateTheme = (updates) => setState(prev => ({ ...prev, theme: { ...prev.theme, ...updates } }));
    const updateThemeColors = (updates) => setState(prev => ({ ...prev, theme: { ...prev.theme, colors: { ...prev.theme.colors, ...updates } } }));

    const applyThemePreset = (themeId) => {
        const preset = THEME_PRESETS[themeId];
        if (!preset) return;
        setState(prev => ({
            ...prev,
            theme: {
                ...prev.theme,
                id: themeId,
                variant: preset.variants[0].id,
                colors: { ...preset.colors }
            }
        }));
    };

    const updatePersonalInfo = (updates) => setState(prev => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, ...updates }
    }));

    const updateSocialLinks = (updates) => setState(prev => ({
        ...prev,
        personalInfo: {
            ...prev.personalInfo,
            socialLinks: { ...prev.personalInfo.socialLinks, ...updates }
        }
    }));

    const updateSections = (newSections) => setState(prev => ({ ...prev, sections: newSections }));
    const toggleSectionVisibility = (sectionId) => setState(prev => ({
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s)
    }));
    const updateSectionData = (sectionId, data) => setState(prev => ({
        ...prev,
        sectionData: { ...prev.sectionData, [sectionId]: data }
    }));

    const markFieldSynced = (fieldPath) => {
        setState(prev => ({
            ...prev,
            syncMeta: {
                ...prev.syncMeta,
                lastSyncedAt: new Date().toISOString(),
                syncedFields: { ...prev.syncMeta?.syncedFields, [fieldPath]: new Date().toISOString() }
            }
        }));
    };

    const markFieldEdited = (fieldPath) => {
        setState(prev => ({
            ...prev,
            syncMeta: {
                ...prev.syncMeta,
                manuallyEdited: { ...prev.syncMeta?.manuallyEdited, [fieldPath]: true }
            }
        }));
    };

    const bulkUpdatePortfolio = (updates) => {
        setState(prev => {
            const next = { ...prev };
            if (updates.personalInfo) {
                next.personalInfo = { ...prev.personalInfo, ...updates.personalInfo };
                if (updates.personalInfo.socialLinks) {
                    next.personalInfo.socialLinks = { ...prev.personalInfo.socialLinks, ...updates.personalInfo.socialLinks };
                }
            }
            if (updates.sectionData) {
                next.sectionData = { ...next.sectionData };
                Object.entries(updates.sectionData).forEach(([key, val]) => {
                    next.sectionData[key] = val;
                });
            }
            if (updates.theme) {
                next.theme = { ...next.theme, ...updates.theme };
            }
            next.syncMeta = {
                ...next.syncMeta,
                lastSyncedAt: new Date().toISOString(),
            };
            return next;
        });
    };

    return (
        <PortfolioContext.Provider value={{
            state,
            aiMessages,
            setAiMessages,
            updateTheme,
            updateThemeColors,
            applyThemePreset,
            updatePersonalInfo,
            updateSocialLinks,
            updateSections,
            toggleSectionVisibility,
            updateSectionData,
            markFieldSynced,
            markFieldEdited,
            bulkUpdatePortfolio
        }}>
            {children}
        </PortfolioContext.Provider>
    );
}

export const usePortfolio = () => {
    const context = useContext(PortfolioContext);
    if (!context) {
        return {
            state: DEFAULT_STATE,
            aiMessages: [],
            setAiMessages: () => {},
            updateTheme: () => {},
            updateThemeColors: () => {},
            applyThemePreset: () => {},
            updatePersonalInfo: () => {},
            updateSocialLinks: () => {},
            updateSections: () => {},
            toggleSectionVisibility: () => {},
            updateSectionData: () => {},
            markFieldSynced: () => {},
            markFieldEdited: () => {},
            bulkUpdatePortfolio: () => {}
        };
    }
    return context;
};
