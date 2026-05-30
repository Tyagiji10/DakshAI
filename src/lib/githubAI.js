/**
 * ═══════════════════════════════════════════════════════════════
 *  DAKSH.AI — GitHub AI Project Analysis Service
 *  Uses GitHub REST API (public) + existing callAI() Groq pipeline
 *  Results are cached in localStorage (24h TTL) and synced to Firestore
 * ═══════════════════════════════════════════════════════════════
 */

import { callAI } from './ai';

const GITHUB_API = 'https://api.github.com';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = 'daksh_github_';

// ── Patterns for filtering out low-quality / tutorial repos ──────────────────
const TUTORIAL_PATTERNS = [
    /^(hello[-_]?world)/i,
    /^(test[-_]?repo|practice|beginner|starter|template)/i,
    /^(todo[-_]?list|to[-_]?do)/i,
    /^(learn|learning|tutorial|course|workshop)/i,
    /^(demo|sample|example|playground|sandbox)/i,
    /^(first[-_]?repo|my[-_]?first|getting[-_]?started)/i,
    /^(fork[-_]?of|clone[-_]?of)/i,
];

const TUTORIAL_TOPICS = [
    'tutorial', 'beginner', 'learning', 'course', 'practice',
    'hacktoberfest', 'sample', 'demo', 'example', 'starter-template'
];

// ── Cache Utilities ───────────────────────────────────────────────────────────
const cache = {
    get(key) {
        try {
            const raw = localStorage.getItem(CACHE_PREFIX + key);
            if (!raw) return null;
            const { data, timestamp } = JSON.parse(raw);
            if (Date.now() - timestamp > CACHE_TTL_MS) {
                localStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }
            return data;
        } catch { return null; }
    },
    set(key, data) {
        try {
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                // Clear old github caches to free space
                Object.keys(localStorage)
                    .filter(k => k.startsWith(CACHE_PREFIX))
                    .forEach(k => localStorage.removeItem(k));
            }
        }
    },
    clear(username) {
        Object.keys(localStorage)
            .filter(k => k.startsWith(CACHE_PREFIX + username))
            .forEach(k => localStorage.removeItem(k));
    }
};

// ── URL Validation & Username Extraction ─────────────────────────────────────
export function validateGitHubUrl(url) {
    if (!url || typeof url !== 'string') return { valid: false, error: 'Please enter a GitHub URL.' };

    const trimmed = url.trim();

    // Accept: github.com/username, https://github.com/username, http://...
    const match = trimmed.match(
        /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)(?:\/.*)?$/
    );

    if (!match) {
        return { valid: false, error: 'Please enter a valid GitHub profile URL (e.g. github.com/username).' };
    }

    const username = match[1];

    // GitHub usernames cannot be certain reserved words
    const RESERVED = ['about', 'topics', 'trending', 'explore', 'marketplace', 'pricing', 'login', 'join'];
    if (RESERVED.includes(username.toLowerCase())) {
        return { valid: false, error: 'That appears to be a GitHub page URL, not a profile URL.' };
    }

    return { valid: true, username };
}

// ── Fetch Repositories from GitHub REST API ───────────────────────────────────
export async function fetchUserRepos(username, { onProgress } = {}) {
    const cacheKey = `repos_${username}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        onProgress?.('Loaded from cache', 30);
        return cached;
    }

    onProgress?.('Verifying GitHub profile...', 10);

    // Verify user exists first
    const userRes = await fetch(`${GITHUB_API}/users/${username}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (userRes.status === 404) throw new Error(`GitHub user "${username}" not found.`);
    if (userRes.status === 403) throw new Error('GitHub API rate limit reached. Please try again in 1 hour.');
    if (!userRes.ok) throw new Error('Failed to reach GitHub API. Check your connection.');

    const userProfile = await userRes.json();
    onProgress?.('Fetching repositories...', 25);

    // Paginate through all repos (GitHub returns max 100 per page)
    let allRepos = [];
    let page = 1;
    const PER_PAGE = 100;

    while (true) {
        const repoRes = await fetch(
            `${GITHUB_API}/users/${username}/repos?per_page=${PER_PAGE}&page=${page}&sort=updated&type=public`,
            { headers: { 'Accept': 'application/vnd.github.v3+json' } }
        );

        if (repoRes.status === 403) throw new Error('GitHub API rate limit reached. Please try again later.');
        if (!repoRes.ok) break;

        const repos = await repoRes.json();
        if (!Array.isArray(repos) || repos.length === 0) break;

        allRepos = [...allRepos, ...repos];
        if (repos.length < PER_PAGE) break;
        page++;

        // Safety cap at 200 repos to prevent excessive API calls
        if (allRepos.length >= 200) break;
    }

    const result = { repos: allRepos, userProfile };
    cache.set(cacheKey, result);
    return result;
}

// ── Filter Low-Quality Repositories ──────────────────────────────────────────
export function filterQualityRepos(repos) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return repos.filter(repo => {
        // Hard excludes
        if (repo.fork) return false;
        if (repo.archived) return false;
        if (repo.disabled) return false;
        if (repo.size === 0) return false;
        if (!repo.name) return false;

        // Skip repos with no activity AND very low engagement
        const pushedAt = new Date(repo.pushed_at);
        const hasRecentActivity = pushedAt > sixMonthsAgo;
        const hasEngagement = (repo.stargazers_count > 0) || (repo.forks_count > 0) || (repo.watchers_count > 0);

        if (!hasRecentActivity && !hasEngagement) return false;

        // Skip tutorial-pattern names
        const nameLower = repo.name.toLowerCase();
        if (TUTORIAL_PATTERNS.some(pattern => pattern.test(nameLower))) return false;

        // Skip if topics are all tutorial-type
        const topics = repo.topics || [];
        const nonTutorialTopics = topics.filter(t => !TUTORIAL_TOPICS.includes(t));
        if (topics.length > 0 && nonTutorialTopics.length === 0) return false;

        // Skip repos that are clearly just config/dotfiles
        const configPatterns = /^(dotfiles|\.files|config|\.config|setup|install)/i;
        if (configPatterns.test(nameLower)) return false;

        return true;
    });
}

// ── Detect Tech Stack from Repo Data ─────────────────────────────────────────
export function detectTechStack(repo) {
    const techs = new Set();

    if (repo.language) techs.add(repo.language);

    const topics = repo.topics || [];
    const techTopics = topics.filter(t => !TUTORIAL_TOPICS.includes(t));
    techTopics.forEach(t => techs.add(t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())));

    return [...techs].slice(0, 8); // cap at 8 tags
}

// ── AI Analysis: Batch analyze repos with Groq ────────────────────────────────
export async function analyzeReposWithAI(repos, userProfile, { onProgress } = {}) {
    if (!repos || repos.length === 0) return [];

    const cacheKey = `analysis_${userProfile.githubUsername}_${repos.map(r => r.id).join('_').slice(0, 100)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        onProgress?.('Loaded AI scores from cache', 90);
        return cached;
    }

    onProgress?.('AI analyzing repositories...', 60);

    // Batch repos into groups of 8 to stay within token limits
    const BATCH_SIZE = 8;
    const batches = [];
    for (let i = 0; i < repos.length; i += BATCH_SIZE) {
        batches.push(repos.slice(i, i + BATCH_SIZE));
    }

    let allResults = [];

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
        const batch = batches[batchIdx];
        const progressPct = 60 + Math.round((batchIdx / batches.length) * 30);
        onProgress?.(`AI scoring batch ${batchIdx + 1} of ${batches.length}...`, progressPct);

        const repoSummaries = batch.map((r, i) => `
Repo ${i + 1}:
  Name: ${r.name}
  Description: ${r.description || 'No description'}
  Language: ${r.language || 'Unknown'}
  Stars: ${r.stargazers_count}
  Forks: ${r.forks_count}
  Topics: ${(r.topics || []).join(', ') || 'none'}
  Has Deployment: ${r.homepage ? 'Yes (' + r.homepage + ')' : 'No'}
  Last Updated: ${r.updated_at?.split('T')[0]}
  Open Issues: ${r.open_issues_count}
  README Present: ${r.has_wiki || r.description ? 'Likely' : 'Unknown'}
`).join('\n---\n');

        const targetRole = userProfile.targetJob || 'Software Developer';

        const prompt = `
You are a senior technical recruiter and portfolio expert evaluating GitHub repositories for a ${targetRole}.
Analyze the following ${batch.length} repositories and score each for portfolio worthiness.

REPOSITORIES TO ANALYZE:
${repoSummaries}

SCORING CRITERIA (weight each 0-100):
- Real-world utility and impact (not a tutorial/clone)
- Technical complexity and depth
- Production readiness (deployment, documentation)
- Relevance to ${targetRole} role
- Code quality indicators (issues, activity, stars)

STRICT RULES:
1. Score 0-100 (80+ = highly recommended, 60-79 = recommended, below 60 = not recommended)
2. Penalize heavily: tutorial repos, clone projects, simple CRUD apps, hello-world
3. Reward: unique ideas, real deployments, complex architectures, API integrations
4. Generate a 1-2 sentence professional summary per repo
5. Return ONLY valid JSON, no other text

Return a JSON array with exactly ${batch.length} objects in this format:
[
  {
    "repoName": "exact-repo-name",
    "score": 85,
    "recommended": true,
    "summary": "A production-grade fintech dashboard that...",
    "technicalDepth": 80,
    "portfolioSuitability": 90,
    "strengths": ["real deployment", "complex data visualization"],
    "weaknesses": ["missing README"]
  }
]`;

        try {
            const raw = await callAI(
                prompt,
                'You are an elite technical portfolio analyst. Evaluate repositories strictly. Return only JSON array.',
                true,
                'llama-3.3-70b-versatile'
            );

            let parsed;
            try {
                const cleaned = raw.replace(/```json\n?|```/g, '').trim();
                parsed = JSON.parse(cleaned);
                if (!Array.isArray(parsed)) {
                    const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
                    parsed = key ? parsed[key] : [];
                }
            } catch {
                // If AI JSON fails, assign default scores to this batch
                parsed = batch.map(r => ({
                    repoName: r.name,
                    score: r.stargazers_count > 5 ? 65 : 45,
                    recommended: r.stargazers_count > 5,
                    summary: r.description || 'A GitHub project.',
                    technicalDepth: 50,
                    portfolioSuitability: r.stargazers_count > 5 ? 60 : 40,
                    strengths: [],
                    weaknesses: ['Could not fully analyze']
                }));
            }

            // Merge AI results back with original repo data
            batch.forEach((repo, idx) => {
                const aiData = parsed.find(p => p.repoName === repo.name) || parsed[idx] || {};
                allResults.push({
                    // Raw GitHub data
                    id: repo.id,
                    repoName: repo.name,
                    fullName: repo.full_name,
                    description: repo.description || '',
                    githubUrl: repo.html_url,
                    deploymentUrl: repo.homepage || null,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    watchers: repo.watchers_count,
                    language: repo.language || null,
                    technologies: detectTechStack(repo),
                    topics: repo.topics || [],
                    openIssues: repo.open_issues_count,
                    createdAt: repo.created_at,
                    updatedAt: repo.updated_at,
                    pushedAt: repo.pushed_at,
                    // AI Analysis
                    score: Math.max(0, Math.min(100, aiData.score || 50)),
                    recommended: aiData.score >= 60,
                    aiSummary: aiData.summary || repo.description || '',
                    technicalDepth: aiData.technicalDepth || 50,
                    portfolioSuitability: aiData.portfolioSuitability || 50,
                    strengths: aiData.strengths || [],
                    weaknesses: aiData.weaknesses || [],
                    analyzedAt: new Date().toISOString(),
                });
            });

        } catch (err) {
            console.error(`[GitHubAI] Batch ${batchIdx + 1} analysis failed:`, err);
            // Add repos with default scores on error
            batch.forEach(repo => {
                allResults.push({
                    id: repo.id,
                    repoName: repo.name,
                    fullName: repo.full_name,
                    description: repo.description || '',
                    githubUrl: repo.html_url,
                    deploymentUrl: repo.homepage || null,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    watchers: repo.watchers_count,
                    language: repo.language || null,
                    technologies: detectTechStack(repo),
                    topics: repo.topics || [],
                    openIssues: repo.open_issues_count,
                    createdAt: repo.created_at,
                    updatedAt: repo.updated_at,
                    pushedAt: repo.pushed_at,
                    score: repo.stargazers_count > 10 ? 65 : 45,
                    recommended: repo.stargazers_count > 10,
                    aiSummary: repo.description || '',
                    technicalDepth: 50,
                    portfolioSuitability: 50,
                    strengths: [],
                    weaknesses: ['Analysis unavailable'],
                    analyzedAt: new Date().toISOString(),
                });
            });
        }
    }

    // Sort by score descending
    allResults.sort((a, b) => b.score - a.score);

    cache.set(cacheKey, allResults);
    onProgress?.('Analysis complete!', 100);
    return allResults;
}

// ── Main Entry Point: Full Import Pipeline ────────────────────────────────────
export async function importGitHubProjects(githubUrl, userProfile, { onProgress, onStep } = {}) {
    // Step 1: Validate URL
    onStep?.('validating');
    const { valid, username, error } = validateGitHubUrl(githubUrl);
    if (!valid) throw new Error(error);

    onStep?.('fetching');
    onProgress?.('Connecting to GitHub...', 5);

    // Step 2: Fetch repos
    const { repos, userProfile: ghProfile } = await fetchUserRepos(username, { onProgress });

    if (!repos || repos.length === 0) {
        throw new Error(`No public repositories found for "${username}".`);
    }

    onStep?.('filtering');
    onProgress?.('Filtering quality repositories...', 40);

    // Step 3: Filter
    const filtered = filterQualityRepos(repos);

    if (filtered.length === 0) {
        throw new Error(`No portfolio-worthy repositories found. Try adding descriptions and making sure repos aren't forks.`);
    }

    onStep?.('analyzing');

    // Step 4: AI Analysis
    const analyzed = await analyzeReposWithAI(filtered, { ...userProfile, githubUsername: username }, { onProgress });

    onStep?.('done');
    onProgress?.('Import complete!', 100);

    return {
        username,
        githubUrl: `https://github.com/${username}`,
        avatarUrl: ghProfile?.avatar_url || null,
        publicRepos: ghProfile?.public_repos || repos.length,
        totalFetched: repos.length,
        totalFiltered: filtered.length,
        projects: analyzed,
        syncedAt: new Date().toISOString(),
    };
}

// ── Force Re-sync (clears cache first) ───────────────────────────────────────
export async function resyncGitHubProjects(githubUrl, userProfile, callbacks) {
    const { valid, username } = validateGitHubUrl(githubUrl);
    if (valid) cache.clear(username);
    return importGitHubProjects(githubUrl, userProfile, callbacks);
}
