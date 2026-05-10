/**
 * DakshAI ATS Score Engine (Browser Layer)
 * ─────────────────────────────────────────
 * Handles:
 *  - JS-based keyword analysis, formatting check, structure check
 *  - Calls Python server (localhost:5001) for semantic NLP scoring
 *  - Falls back to Groq if Python server is offline
 *  - Aggregates weighted final score
 */
import { SYNONYM_GROUPS, areSynonyms } from './synonymMap';

const ATS_SERVER = 'http://localhost:5001';

// ── Weights ───────────────────────────────────────────────────────────────────
export const ATS_WEIGHTS = {
    skills:     0.30,
    experience: 0.25,
    keywords:   0.20,
    projects:   0.10,
    structure:  0.05,
    formatting: 0.05,
    education:  0.05,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function tokenize(text) {
    return (text || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function wordCount(text) { return tokenize(text).length; }

function occurrences(text, keyword) {
    const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    return ((text || '').match(re) || []).length;
}

/** Extract meaningful keywords from JD (filter stop words) */
const STOP_WORDS = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
    'from','as','is','was','are','were','be','been','being','have','has','had',
    'do','does','did','will','would','could','should','may','might','can','this',
    'that','these','those','we','you','our','your','they','their','its','it',
    'not','no','nor','so','yet','both','either','neither','than','such','when',
    'who','which','what','where','how','if','while','although','though','because',
    'since','unless','until','about','above','below','over','under','between',
    'during','before','after','within','without','through','also','more','most',
    'strong','good','great','must','need','required','preferred','experience',
    'ability','role','team','work','working','using','use','looking','seeking',
    'candidate','candidates','join','position','opportunity','company',
]);

export function extractJDKeywords(jdText) {
    if (!jdText) return [];
    const tokens = tokenize(jdText);
    const freq = {};
    tokens.forEach(t => {
        if (t.length > 2 && !STOP_WORDS.has(t)) freq[t] = (freq[t] || 0) + 1;
    });
    // Also extract multi-word terms
    const text = jdText.toLowerCase();
    SYNONYM_GROUPS.flat().forEach(term => {
        if (text.includes(term.toLowerCase()) && term.split(' ').length > 1) {
            const key = term.toLowerCase();
            freq[key] = (freq[key] || 0) + 2; // boost multi-word matches
        }
    });
    return Object.entries(freq)
        .filter(([, count]) => count >= 1)
        .sort((a, b) => b[1] - a[1])
        .map(([term]) => term);
}

// ── Module 1: Keyword Analysis ────────────────────────────────────────────────
export function analyzeKeywords(resumeText, jdText) {
    if (!jdText) return { score: 0, matched: [], missing: [], synonymMatched: [], stuffed: [] };

    const jdKeywords = extractJDKeywords(jdText);
    const resumeLower = (resumeText || '').toLowerCase();
    const totalWords = wordCount(resumeText);

    const matched = [];
    const missing = [];
    const synonymMatched = [];
    const stuffed = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    jdKeywords.slice(0, 60).forEach((kw, i) => {
        const weight = Math.max(1, 10 - i * 0.15); // earlier keywords weigh more
        totalWeight += weight;

        const exactHits = occurrences(resumeText, kw);

        if (exactHits > 0) {
            // Stuffing check: keyword > 4x or > 3% of total word count
            const density = exactHits / Math.max(1, totalWords);
            if (exactHits > 4 || density > 0.03) {
                stuffed.push(kw);
                earnedWeight += weight * 0.5; // 50% penalty for stuffing
            } else {
                matched.push(kw);
                earnedWeight += weight;
            }
        } else {
            // Check synonyms
            let foundSynonym = null;
            for (const group of SYNONYM_GROUPS) {
                if (group.some(s => s.toLowerCase() === kw)) {
                    const synonymInResume = group.find(s =>
                        s.toLowerCase() !== kw && resumeLower.includes(s.toLowerCase())
                    );
                    if (synonymInResume) {
                        foundSynonym = synonymInResume;
                        break;
                    }
                }
            }
            if (foundSynonym) {
                synonymMatched.push({ jd: kw, found: foundSynonym });
                earnedWeight += weight * 0.85; // 85% credit for synonym
            } else {
                missing.push(kw);
            }
        }
    });

    const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
    return { score: Math.min(100, score), matched, missing, synonymMatched, stuffed };
}

// ── Module 2: Structure Check ──────────────────────────────────────────────────
export function checkStructure(formData) {
    const required = [
        { key: 'summary',        label: 'Summary' },
        { key: 'selectedSkills', label: 'Skills' },
        { key: 'experience',     label: 'Work Experience' },
        { key: 'education',      label: 'Education' },
    ];
    const optional = [
        { key: 'projects',        label: 'Projects' },
        { key: 'certifications',  label: 'Certifications' },
    ];

    const present = [];
    const missing = [];

    required.forEach(({ key, label }) => {
        const val = formData[key];
        const filled = Array.isArray(val) ? val.length > 0 : Boolean(val?.trim());
        if (filled) present.push(label); else missing.push(label);
    });
    optional.forEach(({ key, label }) => {
        const val = formData[key];
        if (Array.isArray(val) ? val.length > 0 : Boolean(val?.trim())) present.push(label);
    });

    const score = Math.round((present.length / (required.length + optional.length)) * 100);
    return { score, present, missing };
}

// ── Module 3: Formatting Check ─────────────────────────────────────────────────
export function checkFormatting(htmlString) {
    const issues = [];
    if (/<table[\s>]/i.test(htmlString))    issues.push('Table detected — ATS cannot parse tables');
    if (/col-\d|grid-cols|flex.*col/i.test(htmlString)) issues.push('Multi-column layout detected');
    if (/<img[\s>]/i.test(htmlString))      issues.push('Image element — ATS will ignore it');
    if (/<header[\s>]|<footer[\s>]/i.test(htmlString)) issues.push('Header/footer elements');
    if (/font-family.*(?:comic|impact|papyrus)/i.test(htmlString)) issues.push('Non-standard fonts');

    const penalty = Math.min(100, issues.reduce((s, _) => s + 20, 0));
    return { score: 100 - penalty, issues };
}

// ── Check Python server availability ──────────────────────────────────────────
export async function checkServerAvailable() {
    try {
        const r = await fetch(`${ATS_SERVER}/health`, { signal: AbortSignal.timeout(2000) });
        return r.ok;
    } catch { return false; }
}

// ── Main: Compute Full ATS Score ───────────────────────────────────────────────
export async function computeATSScore(formData, jdText, resumeHTMLString = '') {
    const resumeText = buildPlainText(formData);

    // Run JS modules (synchronous, instant)
    const kwResult  = analyzeKeywords(resumeText, jdText);
    const strResult = checkStructure(formData);
    const fmtResult = checkFormatting(resumeHTMLString);

    // Default semantic scores (Groq fallback values)
    let skillsSemantic     = 0;
    let experienceSemantic = 0;
    let projectsSemantic   = 0;
    let educationSemantic  = 0;
    let serverUsed         = false;
    let aiSuggestions      = [];

    // Try Python server for real NLP
    const serverAvailable = await checkServerAvailable();
    if (serverAvailable) {
        try {
            const resp = await fetch(`${ATS_SERVER}/ats/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jd_text: jdText,
                    sections: {
                        skills:     formData.selectedSkills.join(', '),
                        summary:    formData.summary || '',
                        experience: formData.experience || '',
                        projects:   formData.projects || '',
                        education:  formData.education || '',
                    }
                }),
                signal: AbortSignal.timeout(8000)
            });
            if (resp.ok) {
                const data = await resp.json();
                skillsSemantic     = data.skills     || 0;
                experienceSemantic = data.experience  || 0;
                projectsSemantic   = data.projects    || 0;
                educationSemantic  = data.education   || 0;
                aiSuggestions      = data.suggestions || [];
                serverUsed         = true;
            }
        } catch (e) {
            console.warn('ATS server unavailable, using Groq fallback');
        }
    }

    // If server unavailable, use keyword-based approximation
    if (!serverUsed) {
        skillsSemantic     = kwResult.score * 0.9;
        experienceSemantic = kwResult.score * 0.8;
        projectsSemantic   = kwResult.score * 0.75;
        educationSemantic  = 60; // neutral fallback
    }

    // ── Weighted aggregation ──
    const breakdown = {
        skills:     { score: Math.round(skillsSemantic),     weight: ATS_WEIGHTS.skills,     label: 'Skills Match' },
        experience: { score: Math.round(experienceSemantic), weight: ATS_WEIGHTS.experience, label: 'Experience Relevance' },
        keywords:   { score: kwResult.score,                  weight: ATS_WEIGHTS.keywords,   label: 'Keyword Match' },
        projects:   { score: Math.round(projectsSemantic),   weight: ATS_WEIGHTS.projects,   label: 'Projects Relevance' },
        structure:  { score: strResult.score,                 weight: ATS_WEIGHTS.structure,  label: 'Resume Structure' },
        formatting: { score: fmtResult.score,                 weight: ATS_WEIGHTS.formatting, label: 'ATS Formatting' },
        education:  { score: Math.round(educationSemantic),  weight: ATS_WEIGHTS.education,  label: 'Education Match' },
    };

    let overall = Object.entries(breakdown).reduce((sum, [, v]) => sum + v.score * v.weight, 0);

    // Realism calibration: high score requires both semantic + keyword match
    if (overall > 85 && kwResult.score < 70) overall = Math.min(overall, 82);

    overall = Math.round(Math.min(100, Math.max(0, overall)));

    const grade = overall >= 90 ? 'A+' : overall >= 80 ? 'A' : overall >= 70 ? 'B' : overall >= 60 ? 'C' : 'D';

    // Build strengths & weaknesses
    const strengths = [];
    const weaknesses = [];
    Object.entries(breakdown).forEach(([, v]) => {
        if (v.score >= 75) strengths.push(`Strong ${v.label.toLowerCase()}`);
        else if (v.score < 55) weaknesses.push(`Weak ${v.label.toLowerCase()} (${v.score}%)`);
    });
    if (kwResult.matched.length > 5) strengths.push(`${kwResult.matched.length} JD keywords matched`);
    if (kwResult.missing.length > 3) weaknesses.push(`${kwResult.missing.length} critical keywords missing`);

    return {
        overall,
        grade,
        breakdown,
        keywords: {
            matched: kwResult.matched.slice(0, 20),
            missing: kwResult.missing.slice(0, 15),
            synonymMatched: kwResult.synonymMatched.slice(0, 10),
            stuffed: kwResult.stuffed,
        },
        structure: strResult,
        formatting: fmtResult,
        strengths,
        weaknesses,
        suggestions: aiSuggestions,
        serverUsed,
    };
}

/** Build plain text from formData for keyword analysis */
function buildPlainText(fd) {
    return [
        fd.name, fd.headline, fd.summary,
        (fd.selectedSkills || []).join(' '),
        fd.experience, fd.projects, fd.education,
        fd.certifications, fd.achievements, fd.leadership,
    ].filter(Boolean).join('\n');
}
