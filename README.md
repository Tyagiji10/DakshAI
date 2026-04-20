<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=for-the-badge" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=for-the-badge" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Groq_AI-Llama_3.3-orange?logo=groq&logoColor=white&style=for-the-badge" alt="Groq AI" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black&style=for-the-badge" alt="Firebase" />
</div>

<h1 align="center">DakshAI: Intelligent Career Architect</h1>

<p align="center">
  An advanced, AI-driven career development platform engineered to transform raw user skill sets into MNC-grade professional identities. Features real-time industry trend analysis, intelligent skill gap matching, and generative AI portfolio creation.
</p>

---

## ✨ Key Features

- 🧠 **Groq AI Engine** - Integrated with **Llama 3.3 (via Groq)** to automatically write elite-level professional content with lightning-fast inference.
- 🎤 **AI Mock Interview (Voice Native)** - A fully immersive, voice-interactive interview simulator. Features an animated AI recruiter avatar, real-time STT/TTS (Whisper/XTTS), and detailed performance radar charts.
- ⚡ **dakshCache Utility** - Centralized persistent caching layer that stores AI-generated bios, SEO tags, and skill categorizations locally, slashing API latency and server load.
- 🚀 **Modular Dashboard** - Refactored with a high-performance component architecture (`PersonaCard`, `ProfileScoreCard`, etc.) and memoized SVGs for a smooth 60FPS experience.
- 🎯 **Dynamic Skill Matcher** - An algorithm that parses industrial roles and calculates exact missing skills based on current MNC standards.
- 📄 **AI Magic Resume Maker** - Auto-fills professional sections from raw text or LinkedIn profiles with optimized phrasing instantly.

## 🛠️ Technology Stack

**Frontend Framework:** React 19 (Hooks, Context API)  
**Build Tool:** Vite 8  
**Routing:** React Router v7 (`react-router-dom`)  
**Design & UI:** Deep Vanilla CSS (Glassmorphism, High-FPS Animations) and `lucide-react` vectors.  
**Backend & Database:** Firebase SDK (Auth & Firestore integration)  
**AI Services:** Groq Cloud API, OpenAI Whisper (for voice), XTTS (Native Text-to-Speech).

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
   VITE_GROQ_API_KEY="your_gsk_key_here"
   ```

4. **Spin up the development server**
   ```bash
   npm run dev
   ```

5. **Voice Backend (Optional)**  
   To use native high-quality voice features, ensure the companion Python server is running in the `/server` directory.

## 📂 Project Architecture Highlights

- **`src/components/dashboard/`**: Modular sub-components for the main dashboard interface.
- **`src/lib/ai.js`**: Central AI bridge managing prompt engineering, `dakshCache`, and Firestore synchronization.
- **`src/pages/InterviewPrep.jsx`**: The voice-interactive interview engine.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

---
*Built with ❤️ for modern developers navigating the tech-industry.*
