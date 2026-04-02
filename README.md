<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=for-the-badge" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=for-the-badge" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google&logoColor=white&style=for-the-badge" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black&style=for-the-badge" alt="Firebase" />
</div>

<h1 align="center">DakshAI: Intelligent Career Architect</h1>

<p align="center">
  An advanced, AI-driven career development platform engineered to transform raw user skill sets into MNC-grade professional identities. Features real-time industry trend analysis, intelligent skill gap matching, and generative AI portfolio creation.
</p>

---

## ✨ Key Features

- 🧠 **Generative AI Engine** - Integrated with **Google Gemini 2.5 Flash** to automatically write elite-level, impact-driven professional summaries, portfolio bios, and resume bullet points tailored to your specific tech stack.
- ⚡ **Global Firebase Caching** - Built with an advanced Firestore backend interception layer so that AI-generated job requirements are cached globally, slashing API costs to zero across concurrent users while resulting in instantaneous data fetches.
- 🎯 **Dynamic Skill Matcher** - An algorithm that parses over 50+ uniquely defined industry roles (from Full Stack Developer to AI/ML Engineer) and mathematically calculates the exact missing skills a user needs based on current MNC standards.
- 📄 **Smart Resume Builder** - Parses user-uploaded PDFs entirely client-side using `pdfjs-dist` (keeping private text local) before securely routing the text to the AI for ATS-friendly restructuring.
- 🚀 **Lightning Fast UX** - Built with **React Code Splitting** (`lazy` and `Suspense`), ensuring heavy payload bundles like the Dashboard or Portfolio builder only load when accessed, keeping the initial app size incredibly lean.

## 🛠️ Technology Stack

**Frontend Framework:** React 19 (Hooks, Context API)  
**Build Tool:** Vite 8  
**Routing:** React Router v7 (`react-router-dom`)  
**Design & UI:** Deep Vanilla CSS (Glassmorphism, High-FPS Animations) and `lucide-react` vectors.  
**Backend & Database:** Firebase SDK (Firestore Database integration)  
**Artificial Intelligence:** `@google/generative-ai` SDK  
**Client Integrations:** EmailJS (Client-side contact forms)

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
   Create a `.env` file in the root directory and securely add your Google Gemini API key:
   ```env
   VITE_GEMINI_API_KEY="your_api_key_here"
   ```

4. **Connect Firebase (Optional but Recommended for Scale)**  
   Navigate to `src/lib/firebase.js` and ensure your Firebase configuration variables match your real project. Set your Firestore rules to allow the dashboard to populate the `ai_job_cache` table.

5. **Spin up the development server**
   ```bash
   npm run dev
   ```

## 📂 Project Architecture Highlights

- **`src/pages/`**: Holds the heavy, chunk-rendered routes (Dashboard, Application, Portfolio, Login).
- **`src/lib/gemini.js`**: Pure backend-style AI connection proxy managing all prompt constraints, system personas, and the Firebase caching handshake layer.
- **`src/context/`**: Global state management, handling Firebase authentication bindings across the React Router tree.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---
*Built with ❤️ for modern developers navigating the tech-industry.*
