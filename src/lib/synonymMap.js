/**
 * Tech Synonym Groups for ATS Keyword Matching
 * Each group contains semantically equivalent terms.
 * Used for partial-credit keyword matching (0.85x score vs exact match 1.0x).
 */
export const SYNONYM_GROUPS = [
    ['REST API', 'RESTful', 'RESTful services', 'REST services', 'HTTP API', 'REST endpoints'],
    ['TensorFlow', 'TF', 'Deep Learning', 'Neural Networks', 'DL', 'deep neural network'],
    ['Kubernetes', 'K8s', 'container orchestration', 'k8s cluster'],
    ['JavaScript', 'JS', 'ECMAScript', 'ES6', 'ES2015', 'ES2020', 'Vanilla JS'],
    ['TypeScript', 'TS', 'typed JavaScript'],
    ['PostgreSQL', 'Postgres', 'PSQL', 'relational database', 'SQL database'],
    ['MongoDB', 'Mongo', 'NoSQL', 'document database', 'document store'],
    ['CI/CD', 'Continuous Integration', 'Continuous Deployment', 'DevOps pipeline', 'build pipeline'],
    ['Docker', 'containerization', 'container', 'containerized', 'Docker container'],
    ['Machine Learning', 'ML', 'predictive modeling', 'statistical learning'],
    ['Node.js', 'NodeJS', 'Node', 'server-side JavaScript'],
    ['React', 'ReactJS', 'React.js', 'React framework'],
    ['Python', 'Python3', 'Python 3', 'py'],
    ['AWS', 'Amazon Web Services', 'Amazon Cloud', 'cloud infrastructure'],
    ['GCP', 'Google Cloud', 'Google Cloud Platform'],
    ['Azure', 'Microsoft Azure', 'Azure Cloud'],
    ['Microservices', 'micro-services', 'microservice architecture', 'service-oriented architecture', 'SOA'],
    ['GraphQL', 'Graph QL', 'graph query language'],
    ['Redis', 'in-memory cache', 'cache layer', 'caching'],
    ['Git', 'version control', 'source control', 'Git version control'],
    ['Agile', 'Scrum', 'sprint-based', 'agile methodology'],
    ['Unit Testing', 'unit tests', 'test-driven development', 'TDD', 'automated testing'],
    ['SQL', 'Structured Query Language', 'relational queries', 'database queries'],
    ['API', 'Application Programming Interface', 'web API', 'backend API'],
    ['Spring Boot', 'Spring', 'Spring Framework', 'Java Spring'],
    ['Django', 'Django REST Framework', 'DRF', 'Python web framework'],
    ['FastAPI', 'Fast API', 'Python API framework'],
    ['Terraform', 'Infrastructure as Code', 'IaC'],
    ['Linux', 'Unix', 'bash scripting', 'shell scripting', 'CLI'],
    ['Pandas', 'data manipulation', 'dataframe', 'data processing'],
    ['Data Structures', 'DSA', 'algorithms', 'data structures and algorithms'],
    ['OOP', 'Object Oriented Programming', 'object-oriented design'],
    ['Frontend', 'front-end', 'client-side', 'UI development'],
    ['Backend', 'back-end', 'server-side', 'API development'],
    ['Full Stack', 'fullstack', 'full-stack developer'],
    ['Webpack', 'Vite', 'build tool', 'module bundler'],
    ['GitHub', 'GitLab', 'Bitbucket', 'code repository'],
    ['HTML', 'HTML5', 'markup language'],
    ['CSS', 'CSS3', 'stylesheets', 'Sass', 'SCSS'],
    ['Tailwind', 'Tailwind CSS', 'utility-first CSS'],
    ['Java', 'JVM', 'Java SE', 'Java EE'],
    ['C++', 'CPP', 'C plus plus'],
    ['Data Science', 'data analysis', 'data analytics'],
    ['NLP', 'Natural Language Processing', 'text processing', 'language model'],
    ['LLM', 'Large Language Model', 'generative AI', 'GenAI'],
    ['Keras', 'deep learning framework'],
    ['PyTorch', 'torch', 'deep learning'],
    ['Elasticsearch', 'Elastic Search', 'search engine', 'full-text search'],
    ['Kafka', 'message queue', 'event streaming', 'pub/sub'],
    ['Firebase', 'BaaS', 'backend as a service'],
];

/**
 * Build a flat lookup: term → group index (for fast O(1) synonym resolution)
 */
const _lookup = new Map();
SYNONYM_GROUPS.forEach((group, idx) => {
    group.forEach(term => _lookup.set(term.toLowerCase(), idx));
});

/**
 * Check if two terms are synonyms.
 * @returns {boolean}
 */
export function areSynonyms(termA, termB) {
    const a = termA.toLowerCase();
    const b = termB.toLowerCase();
    if (a === b) return true;
    const gi = _lookup.get(a);
    const gj = _lookup.get(b);
    return gi !== undefined && gi === gj;
}

/**
 * Find all synonyms for a term.
 * @returns {string[]}
 */
export function getSynonyms(term) {
    const idx = _lookup.get(term.toLowerCase());
    if (idx === undefined) return [term];
    return SYNONYM_GROUPS[idx];
}
