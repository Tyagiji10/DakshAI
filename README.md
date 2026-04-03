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

- 🧠 **Groq AI Engine** - Integrated with **Llama 3.3 (via Groq)** to automatically write elite-level, impact-driven professional summaries, portfolio bios, and resume bullet points with lightning-fast inference.
- 🛡️ **Stable-Fetch Architecture** - Uses a native browser-safe fetch implementation for AI calls, eliminating "White Screen" crashes and ensuring high-reliability across all modern viewports.
- ⚡ **Global Firebase Caching** - Built with an advanced Firestore backend interception layer so that AI-generated job requirements are cached globally, slashing API latency and costs.
- 🎯 **Dynamic Skill Matcher** - An algorithm that parses over 50+ uniquely defined industry roles and mathematically calculates the exact missing skills a user needs based on current MNC standards.
- 📄 **AI Magic Resume Maker** - Effortlessly imports raw resume text or LinkedIn profiles to auto-fill professional sections with optimized phrasing instantly.
- 🚀 **Premium Dashboard** - Real-time "Persona Score" calculation driven by a multi-factor analysis engine including bio-depth, project-links, and job-skill alignment.

## 🛠️ Technology Stack

**Frontend Framework:** React 19 (Hooks, Context API)  
**Build Tool:** Vite 8  
**Routing:** React Router v7 (`react-router-dom`)  
**Design & UI:** Deep Vanilla CSS (Glassmorphism, High-FPS Animations) and `lucide-react` vectors.  
**Backend & Database:** Firebase SDK (Auth & Firestore integration)  
**Artificial Intelligence:** Groq Cloud API (Llama 3.3 70B Model)  

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/dakshai.git
   cd dakshai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**  
   Create a `.env` file in the root directory and add your Groq API key:
   ```env
   VITE_GROQ_API_KEY="your_gsk_key_here"
   ```

4. **Connect Firebase**  
   Navigate to `src/lib/firebase.js` and ensure your Firebase configuration variables match your real project.

5. **Spin up the development server**
   ```bash
   npm run dev
   ```

## 📂 Project Architecture Highlights

- **`src/pages/`**: Holds the core routes (Dashboard, ResumeBuilder, Portfolio, Login).
- **`src/lib/ai.js`**: The central AI bridge managing prompts, system personas, and the Firestore caching logic.
- **`src/context/`**: Global state management, handling Firebase authentication and user profile synchronization.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---
*Built with ❤️ for modern developers navigating the tech-industry.*
