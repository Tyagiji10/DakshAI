export const availableSkills = [
    "Python", "Java", "C", "C++", "C#", "JavaScript", "TypeScript", "HTML & CSS", "Go", "Rust", "Swift", "Kotlin", "Ruby", "Haskell", "Lisp", "Scheme", "F#", "OCaml", "Erlang", "Elixir", "Bash", "PowerShell", "Perl", "Lua", "PHP", "SQL", "R", "MATLAB", "SAS", "Verilog", "VHDL", "Julia", "Elm", "Crystal", "Nim",
    "React", "Angular", "Vue.js", "Svelte", "Next.js", "Django", "Flask", "Spring Boot", "ASP.NET Core", "React Native", "Flutter", "SwiftUI", "Jetpack Compose", "Xamarin", "Express.js", "FastAPI", "NestJS", "Ruby on Rails", "Node.js", "Tailwind CSS", "Redux", "Bootstrap",
    "Lodash", "D3.js", "Chart.js", "Axios", "NumPy", "Pandas", "Matplotlib", "Seaborn", "Requests", "Guava", "Apache Commons", "Hibernate", "Boost", "OpenCV", "Eigen", "TensorFlow", "PyTorch", "Scikit-learn", "Keras",
    "MySQL", "PostgreSQL", "MongoDB", "Oracle", "Redis", "Cassandra", "Neo4j", "NoSQL", "Hadoop", "Spark", "Kafka", "Flink", "AWS", "Azure", "GCP", "IBM Cloud", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "GitHub Actions",
    "Git", "GitHub", "Version Control", "VS Code", "Postman", "npm", "Yarn", "Webpack", "Vite", "Babel", "Jupyter Notebook", "AutoCAD", "SolidWorks", "Simulink", "Excel", "Tableau", "PowerBI", "SAP", "ERP Systems", "SPSS", "LaTeX", "EndNote", "NVivo",
    "Figma", "Sketch", "Adobe XD", "InVision", "Balsamiq", "Miro", "Jira", "Trello", "Asana", "Notion", "Slack", "Teams", "Confluence", "Graphic Design", "UI Design", "UX Research", "Wireframing", "Prototyping", "Adobe CC", "Unity", "Product Management",
    "SEMrush", "Ahrefs", "Moz", "Google Analytics", "Mixpanel", "Amplitude", "Hootsuite", "Buffer", "Sprout Social", "Mailchimp", "HubSpot", "SendGrid", "Google Ads", "Facebook Ads", "LinkedIn Ads", "Salesforce", "Marketing", "Sales", "SEO", "Content Writing", "Social Media Management", "Email Marketing",
    "Algorithms", "Data Structures", "System Design", "Networking", "Security", "Cloud Architecture", "Cybersecurity", "Software Engineering", "Machine Learning", "Testing & Debugging", "APIs", "REST/GraphQL", "Responsive Design", "Web Performance Optimization", "Communication", "Leadership", "Collaboration", "Critical Thinking", "Problem Solving", "Adaptability", "Teamwork", "Innovation", "Agile", "Scrum", "Agile/Scrum", "Stakeholder Management", "Strategic Management", "Business Analytics", "Financial Modeling", "Operations Management", "Brand Management", "Market Research", "Negotiation", "Decision-Making", "Data Analysis", "Statistics", "Research Methodology", "Academic Writing", "Presentation Skills", "Biotechnology", "Physics", "Chemistry", "Mathematics", "CAD/CAM", "Embedded Systems", "AI/ML", "Data Science"
];

export const jobLibrary = [
    // ─── Data Science & AI ──────────────────────────────────────────────────
    { id: "job-1", title: "Data Analyst", category: "Data Science", requiredSkills: ["Python", "SQL", "Data Analysis", "Tableau", "PowerBI", "Excel", "Statistics", "Communication", "Problem Solving", "Pandas", "Matplotlib"] },
    { id: "job-2", title: "Data Engineer", category: "Data Science", requiredSkills: ["Python", "SQL", "Hadoop", "Spark", "Kafka", "Data Analysis", "AWS", "Java", "Docker"] },
    { id: "job-3", title: "Data Scientist", category: "Data Science", requiredSkills: ["Python", "R", "Machine Learning", "SQL", "Data Analysis", "Statistics", "Mathematics", "Tableau", "Pandas", "PyTorch"] },
    { id: "job-4", title: "Machine Learning Engineer", category: "Data Science", requiredSkills: ["Python", "Machine Learning", "Data Analysis", "AWS", "SQL", "TensorFlow", "PyTorch", "Scikit-learn", "NumPy", "Pandas", "Mathematics", "Statistics", "Docker"] },
    { id: "job-5", title: "AI/ML Developer", category: "Data Science", requiredSkills: ["Python", "Machine Learning", "AI/ML", "TensorFlow", "PyTorch", "APIs", "Data Structures", "Algorithms"] },
    { id: "job-6", title: "Statistician", category: "Data Science", requiredSkills: ["R", "Python", "Statistics", "Mathematics", "Data Analysis", "Research Methodology", "Problem Solving"] },
    { id: "job-7", title: "Bioinformatics Specialist", category: "Data Science", requiredSkills: ["Biotechnology", "Python", "R", "Data Analysis", "Research Methodology", "Statistics"] },

    // ─── Software Engineering ───────────────────────────────────────────────
    { id: "job-8", title: "Software Developer", category: "Software Engineering", requiredSkills: ["Java", "Python", "C++", "JavaScript", "Algorithms", "Data Structures", "Git", "GitHub", "Problem Solving"] },
    { id: "job-9", title: "Software Engineer", category: "Software Engineering", requiredSkills: ["Java", "C++", "System Design", "Algorithms", "Data Structures", "Software Engineering", "Testing & Debugging", "Git"] },
    { id: "job-10", title: "Frontend Developer", category: "Software Engineering", requiredSkills: ["HTML & CSS", "JavaScript", "TypeScript", "React", "Redux", "Tailwind CSS", "Responsive Design", "Git", "GitHub", "Testing & Debugging", "APIs", "Web Performance Optimization", "Vite", "npm", "Figma", "Communication"] },
    { id: "job-11", title: "Backend Engineer", category: "Software Engineering", requiredSkills: ["Node.js", "Java", "Python", "Go", "SQL", "PostgreSQL", "NoSQL", "MongoDB", "Docker", "Git", "GitHub", "APIs", "REST/GraphQL", "System Design", "Testing & Debugging"] },
    { id: "job-12", title: "Full Stack Developer", category: "Software Engineering", requiredSkills: ["HTML & CSS", "JavaScript", "TypeScript", "React", "Node.js", "Express.js", "SQL", "MongoDB", "Docker", "AWS", "Git", "GitHub", "System Design", "APIs", "REST/GraphQL", "Responsive Design"] },
    { id: "job-13", title: "Web Developer", category: "Software Engineering", requiredSkills: ["HTML & CSS", "JavaScript", "React", "Node.js", "Responsive Design", "Git", "Web Performance Optimization"] },
    { id: "job-14", title: "Mobile App Developer", category: "Software Engineering", requiredSkills: ["Swift", "Kotlin", "React Native", "Flutter", "JavaScript", "APIs", "Git", "GitHub", "Testing & Debugging", "UI Design"] },
    { id: "job-15", title: "Embedded Systems Engineer", category: "Software Engineering", requiredSkills: ["C", "C++", "Embedded Systems", "Problem Solving"] },
    { id: "job-16", title: "Quality Assurance Engineer", category: "Software Engineering", requiredSkills: ["Testing & Debugging", "Python", "Java", "Agile/Scrum", "Problem Solving", "Communication", "Software Engineering"] },
    { id: "job-17", title: "Test Engineer", category: "Software Engineering", requiredSkills: ["Testing & Debugging", "Jira", "Python", "Problem Solving", "Communication"] },
    { id: "job-18", title: "Programmer", category: "Software Engineering", requiredSkills: ["C", "C++", "Java", "Python", "Data Structures", "Algorithms"] },
    { id: "job-19", title: "Game Developer", category: "Software Engineering", requiredSkills: ["Unity", "C++", "C#", "Mathematics", "Physics", "Graphic Design", "Problem Solving", "Algorithms"] },
    { id: "job-20", title: "AR/VR Developer", category: "Software Engineering", requiredSkills: ["Unity", "C++", "C#", "UI Design", "Mathematics", "Problem Solving", "Algorithms"] },

    // ─── IT, Cloud & Security ───────────────────────────────────────────────
    { id: "job-21", title: "Cloud Engineer", category: "IT & Infrastructure", requiredSkills: ["AWS", "Azure", "Docker", "Kubernetes", "Bash", "Python", "Networking", "Security"] },
    { id: "job-22", title: "Cloud Architect", category: "IT & Infrastructure", requiredSkills: ["AWS", "Azure", "Docker", "Kubernetes", "Bash", "Python", "Terraform", "Cloud Architecture", "System Design", "Security", "Networking"] },
    { id: "job-23", title: "Cloud Solutions Architect", category: "IT & Infrastructure", requiredSkills: ["Cloud Architecture", "System Design", "AWS", "Azure", "Security", "Communication", "Problem Solving"] },
    { id: "job-24", title: "DevOps Engineer", category: "IT & Infrastructure", requiredSkills: ["Docker", "Kubernetes", "AWS", "Python", "Bash", "Terraform", "Ansible", "Jenkins", "GitHub Actions", "Agile/Scrum", "Networking"] },
    { id: "job-25", title: "Cybersecurity Analyst", category: "Security", requiredSkills: ["Cybersecurity", "Python", "SQL", "Networking", "Security", "Bash", "Communication", "Problem Solving", "Cybersecurity"] },
    { id: "job-26", title: "Cybersecurity Specialist", category: "Security", requiredSkills: ["Cybersecurity", "Security", "Networking", "Python", "Problem Solving"] },
    { id: "job-27", title: "Network Engineer", category: "IT & Infrastructure", requiredSkills: ["Networking", "Security", "Bash", "Communication", "Problem Solving"] },
    { id: "job-28", title: "Database Administrator", category: "IT & Infrastructure", requiredSkills: ["SQL", "MySQL", "PostgreSQL", "Oracle", "MongoDB", "Data Analysis", "Security"] },
    { id: "job-29", title: "System Analyst", category: "IT & Infrastructure", requiredSkills: ["System Design", "SQL", "Data Analysis", "Communication", "Problem Solving", "Agile/Scrum"] },
    { id: "job-30", title: "IT Consultant", category: "IT & Infrastructure", requiredSkills: ["Cloud Architecture", "System Design", "Networking", "Security", "Communication", "Problem Solving"] },
    { id: "job-31", title: "ERP Specialist", category: "IT & Infrastructure", requiredSkills: ["SAP", "ERP Systems", "Business Analytics", "Operations Management", "Communication"] },

    // ─── Management & Business ──────────────────────────────────────────────
    { id: "job-32", title: "Business Analyst", category: "Management", requiredSkills: ["Business Analytics", "Data Analysis", "SQL", "Excel", "Tableau", "Communication", "Problem Solving"] },
    { id: "job-33", title: "Product Manager", category: "Management", requiredSkills: ["Communication", "Data Analysis", "Product Management", "Agile/Scrum", "Leadership", "Jira", "Wireframing", "Stakeholder Management", "Strategic Management", "Problem Solving"] },
    { id: "job-34", title: "Project Manager", category: "Management", requiredSkills: ["Agile/Scrum", "Jira", "Leadership", "Communication", "Stakeholder Management", "Problem Solving", "Operations Management"] },
    { id: "job-35", title: "Operations Manager", category: "Management", requiredSkills: ["Operations Management", "Leadership", "Problem Solving", "Communication", "Strategic Management", "Data Analysis"] },
    { id: "job-36", title: "Supply Chain Manager", category: "Management", requiredSkills: ["Operations Management", "ERP Systems", "Data Analysis", "Leadership", "Problem Solving", "Negotiation"] },
    { id: "job-37", title: "HR Manager", category: "Management", requiredSkills: ["Communication", "Leadership", "Negotiation", "Problem Solving", "Stakeholder Management"] },
    { id: "job-38", title: "Talent Acquisition Specialist", category: "Management", requiredSkills: ["Communication", "Networking", "LinkedIn Ads", "Negotiation", "Marketing"] },
    { id: "job-39", title: "Financial Analyst", category: "Management", requiredSkills: ["Financial Modeling", "Excel", "Data Analysis", "SQL", "Statistics", "Problem Solving", "Communication"] },
    { id: "job-40", title: "Investment Banker", category: "Management", requiredSkills: ["Financial Modeling", "Excel", "Strategic Management", "Negotiation", "Communication", "Problem Solving"] },
    { id: "job-41", title: "Strategy Consultant", category: "Management", requiredSkills: ["Strategic Management", "Business Analytics", "Presentation Skills", "Communication", "Problem Solving", "Data Analysis"] },
    { id: "job-42", title: "Management Consultant", category: "Management", requiredSkills: ["Strategic Management", "Operations Management", "Leadership", "Communication", "Problem Solving", "Presentation Skills"] },

    // ─── Marketing & Design ─────────────────────────────────────────────────
    { id: "job-43", title: "Marketing Manager", category: "Marketing", requiredSkills: ["Marketing", "SEO", "Google Ads", "Strategic Management", "Communication", "Leadership", "Data Analysis"] },
    { id: "job-44", title: "Digital Marketing Specialist", category: "Marketing", requiredSkills: ["SEO", "SEMrush", "Google Analytics", "Content Writing", "Social Media Management", "Email Marketing", "Marketing"] },
    { id: "job-45", title: "Digital Marketing Manager", category: "Marketing", requiredSkills: ["Marketing", "SEO", "Content Writing", "Google Analytics", "Social Media Management", "Email Marketing", "Data Analysis", "SEMrush", "Google Ads"] },
    { id: "job-46", title: "UI/UX Designer", category: "Design", requiredSkills: ["Figma", "UI Design", "UX Research", "Wireframing", "Prototyping", "Graphic Design", "Adobe XD", "Communication", "Problem Solving"] },

    // ─── Science, Content & Research ────────────────────────────────────────
    { id: "job-47", title: "Research Scientist", category: "Science & Research", requiredSkills: ["Research Methodology", "Academic Writing", "Data Analysis", "Statistics", "Problem Solving", "Presentation Skills"] },
    { id: "job-48", title: "Academic Lecturer", category: "Science & Research", requiredSkills: ["Presentation Skills", "Academic Writing", "Communication", "Research Methodology"] },
    { id: "job-49", title: "Research Associate", category: "Science & Research", requiredSkills: ["Research Methodology", "Data Analysis", "Academic Writing", "Statistics"] },
    { id: "job-50", title: "Environmental Analyst", category: "Science & Research", requiredSkills: ["Data Analysis", "Research Methodology", "Statistics", "Problem Solving"] },
    { id: "job-51", title: "Clinical Research Associate", category: "Science & Research", requiredSkills: ["Research Methodology", "Data Analysis", "Biotechnology", "Communication"] },
    { id: "job-52", title: "Lab Technician", category: "Science & Research", requiredSkills: ["Chemistry", "Physics", "Data Analysis", "Problem Solving"] },
    { id: "job-53", title: "Core Scientist", category: "Science & Research", requiredSkills: ["Physics", "Chemistry", "Mathematics", "Research Methodology", "Data Analysis", "Problem Solving"] },
    { id: "job-54", title: "Technical Writer", category: "Content", requiredSkills: ["Communication", "Content Writing", "Academic Writing", "SEO", "Python", "Git", "GitHub"] }
];

export const resourceLibrary = [
    { skill: "Python", title: "Python for Beginners", link: "#", type: "Video", duration: "2 hrs" },
    { skill: "SQL", title: "SQL Basics to Advanced", link: "#", type: "Course", duration: "4 hrs" },
    { skill: "Data Analysis", title: "Data Analysis with Pandas", link: "#", type: "Course", duration: "3 weeks" },
    { skill: "React", title: "React JS Crash Course", link: "#", type: "Video", duration: "1.5 hrs" },
    { skill: "JavaScript", title: "JavaScript Deep Dive", link: "#", type: "Video", duration: "3 hrs" },
    { skill: "Figma", title: "Figma UI Design Tutorial", link: "#", type: "Video", duration: "45 mins" },
    { skill: "Graphic Design", title: "Graphic Design Masterclass", link: "#", type: "Course", duration: "1 week" },
    { skill: "Communication", title: "Business English & Comm", link: "#", type: "Course", duration: "2 weeks" },
    { skill: "Node.js", title: "Node.js API Development", link: "#", type: "Course", duration: "4 weeks" },
    { skill: "Java", title: "Java Programming Fundamentals", link: "#", type: "Video", duration: "5 hrs" },
    { skill: "AWS", title: "AWS Cloud Practitioner", link: "#", type: "Course", duration: "3 weeks" },
    { skill: "Docker", title: "Docker Containerization", link: "#", type: "Video", duration: "2 hrs" },
    { skill: "Machine Learning", title: "Intro to ML Algorithms", link: "#", type: "Course", duration: "4 weeks" },
    { skill: "Unity", title: "Game Dev with Unity", link: "#", type: "Course", duration: "5 weeks" },
    { skill: "Cybersecurity", title: "Cybersecurity Basics", link: "#", type: "Course", duration: "2 weeks" },
    { skill: "TypeScript", title: "TypeScript for React", link: "#", type: "Video", duration: "2.5 hrs" },
    { skill: "Swift", title: "iOS App Dev with Swift", link: "#", type: "Course", duration: "4 weeks" },
    { skill: "Kotlin", title: "Android Dev with Kotlin", link: "#", type: "Course", duration: "3 weeks" },
    { skill: "Flutter", title: "Flutter UI Bootcamp", link: "#", type: "Video", duration: "4 hrs" },
    { skill: "UX Research", title: "Foundations of UX", link: "#", type: "Course", duration: "2 weeks" }
];
