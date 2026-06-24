<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=for-the-badge" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=for-the-badge" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Groq_AI-Llama_3.3-orange?logo=groq&logoColor=white&style=for-the-badge" alt="Groq AI" />
  <img src="https://img.shields.io/badge/Google-Gemini-4285F4?logo=google&logoColor=white&style=for-the-badge" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black&style=for-the-badge" alt="Firebase" />
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white&style=for-the-badge" alt="Cloudflare Workers" />
</div>

<h1 align="center">DakshAI — Intelligent Career Architect</h1>

<p align="center">
  An advanced, AI-driven career development platform that transforms raw skill sets into MNC-grade professional identities. Features real-time industry trend analysis, intelligent skill gap matching, voice-native mock interviews, a drag-and-drop portfolio builder, and generative AI content creation — all in one place.
</p>

---

## ✨ Features

### 🚀 Dashboard
A modular command-center with high-performance components (`PersonaCard`, `ProfileScoreCard`, `ScoreRing`, `GitHubProjectsSection`). Includes memoized SVGs, profile photo cropping, and a GitHub project importer that auto-syncs repositories into your profile.

### 🎯 Skill Analyzer
Parses industrial job roles and calculates exact missing skills based on current MNC standards. Provides a detailed match breakdown so you know precisely where your skill gaps are.

### 📚 Learning Path
Generates AI-powered, personalized learning roadmaps for any target role. Courses are curated with priority ordering to close your skill gaps in the most efficient sequence.

### 📄 Resume Builder
A full-featured resume creation tool with AI-powered content generation, PDF parsing (via `pdfjs-dist`), DOCX import (via `mammoth`), dark mode support, and multiple section types. Auto-fills professional sections with optimized phrasing from raw text.

### 🎤 Interview Prep (Voice-Native)
A fully immersive, voice-interactive interview simulator. Features an animated AI recruiter avatar, real-time speech-to-text, text-to-speech responses, configurable difficulty levels, and detailed performance radar charts with scoring breakdown.

### ⚡ Project Generator
AI-generates complete project roadmaps and ideas tailored to your target role and existing skill set. Includes step-by-step implementation guides with tech stack recommendations.

### 🌐 Portfolio Builder
A drag-and-drop portfolio website builder powered by Google Gemini AI:
- **Visual Builder** — Section-based editor with live preview and theme customization.
- **AI Assistant** — Auto-generates professional content for each section.
- **Dashboard Sync** — One-click import of profile data, social links, and GitHub projects.
- **Export** — Downloads a complete, deployable portfolio website as a ZIP file (HTML/CSS/JS).
- **Public Portfolios** — Shareable links at `/p/:username/:id`.

### 🔧 Platform-Wide Features
- **dakshCache** — Centralized persistent caching layer that stores AI-generated bios, SEO tags, and skill categorizations locally, reducing API latency.
- **Haptic Feedback** — Touch feedback system with configurable toggle.
- **Swipe Navigation** — Mobile gesture-based route switching.
- **Performance Scaling** — Auto-detects device capability and adjusts glass blur, animations, and tilt effects accordingly.
- **Dark Mode** — Full dark theme with aurora-gradient backgrounds.
- **Google Translate** — Built-in multi-language support (Hindi, Tamil, Kannada, English).
- **PWA-Style Scrolling** — Single-container scroll architecture for native-app feel.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19 (Hooks, Context API), React Router v7 |
| **Styling** | Tailwind CSS v4, Deep Vanilla CSS (Glassmorphism, 60FPS Animations) |
| **Build & Deploy** | Vite 8, Cloudflare Workers (`wrangler`) |
| **AI — Core** | Groq Cloud API (Llama 3.3) for dashboard, resume, interview, learning path, project generation |
| **AI — Portfolio** | Google Gemini (`@google/genai`) for portfolio content generation |
| **Backend & Auth** | Firebase SDK (Firestore, Authentication) |
| **Animation** | Framer Motion (portfolio builder), CSS keyframes + custom hooks |
| **Drag & Drop** | dnd-kit (portfolio section reordering) |
| **File Processing** | pdfjs-dist (PDF parsing), mammoth (DOCX import), JSZip + FileSaver (ZIP export) |
| **Icons** | Lucide React |
| **UI Extras** | react-easy-crop (profile photo), custom tilt/swipe hooks |

---

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tyagiji10/DakshAI.git
   cd DakshAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GROQ_API_KEY="your_groq_api_key"
   VITE_GEMINI_API_KEY="your_gemini_api_key"
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Deploy to Cloudflare Workers** *(optional)*
   ```bash
   npm run deploy
   ```

6. **Voice Backend** *(optional)*
   To use native high-quality voice features in Interview Prep, start the companion Python server:
   ```bash
   cd server
   pip install -r requirements.txt
   python main.py
   ```

---

## 📂 Project Structure

```
src/
├── components/
│   ├── Layout.jsx              # App shell — header, sidebar, bottom nav, settings
│   └── dashboard/              # PersonaCard, ProfileScoreCard, ScoreRing, GitHubProjectsSection
├── context/
│   └── UserContext.jsx         # Global auth & user state
├── hooks/
│   ├── usePerformanceScale.js  # Auto-adjusts visual fidelity to device capability
│   ├── useSwipeNav.js          # Mobile swipe gesture navigation
│   └── useTilt.js              # 3D card tilt effect
├── lib/
│   ├── ai.js                   # Central AI bridge — Groq prompts, dakshCache, Firestore sync
│   ├── firebase.js             # Firebase SDK initialization
│   ├── githubAI.js             # GitHub project import & AI analysis
│   ├── haptics.js              # Touch feedback utility
│   └── mockData.js             # Job library & skill catalog
├── pages/
│   ├── Dashboard.jsx / .css
│   ├── SkillAnalyzer.jsx
│   ├── LearningPath.jsx / .css
│   ├── ResumeBuilder.jsx / .css
│   ├── InterviewPrep.jsx / .css
│   ├── ProjectGenerator.jsx / .css
│   ├── Login.jsx
│   ├── PrivacyPolicy.jsx
│   └── TermsConditions.jsx
├── portfolio/                  # Self-contained portfolio builder module
│   ├── components/builder/     # AIAssistant, BuilderHeader, BuilderPanel, SectionEditor, drag-and-drop
│   ├── components/preview/     # Live preview with theme-aware section renderers
│   ├── context/                # PortfolioContext — portfolio state management
│   ├── hooks/                  # useAppTheme, useDashboardSync
│   ├── pages/                  # PortfolioBuilder, PublicPortfolio
│   ├── services/               # Gemini AI service, ZIP export
│   ├── styles/                 # portfolio-builder.css
│   ├── templates/              # BaseThemeWrapper — unified theme renderer
│   └── utils/                  # colorUtils, scoreCalculator
├── index.css                   # Global design system — tokens, animations, utilities
├── App.jsx                     # Route definitions & auth guards
└── main.jsx                    # React root — UserProvider + PortfolioProvider
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

*Built with ❤️ for modern developers navigating the tech industry.*
