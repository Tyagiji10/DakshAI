import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import { useUser } from './context/UserContext';
import { Loader2 } from 'lucide-react';
import './index.css';

// Eagerly load the Login Screen so unauthenticated users aren't waiting on chunk split delays
import Login from './pages/Login';

// Eagerly load all protected routes to ensure smooth tab switching without Suspense flashes
import Dashboard from './pages/Dashboard';
import SkillAnalyzer from './pages/SkillAnalyzer';
import LearningPath from './pages/LearningPath';
import ResumeBuilder from './pages/ResumeBuilder';
import InterviewPrep from './pages/InterviewPrep';
import ProjectGenerator from './pages/ProjectGenerator';
import PortfolioBuilder from './portfolio/pages/PortfolioBuilder';
import PublicPortfolio from './portfolio/pages/PublicPortfolio';


const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));

const GlobalLoader = () => (
  <div style={{ display: 'flex', height: '80vh', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
      <Loader2 size={36} className="animate-spin" style={{ color: '#6366f1' }} />
      <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Loading Workspace...</span>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useUser();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const ProtectedLayout = () => {
  const { isAuthenticated } = useUser();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Suspense fallback={<GlobalLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="bg-aura-backdrop shadow-none" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/privacy" element={<Suspense fallback={<GlobalLoader />}><PrivacyPolicy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<GlobalLoader />}><TermsConditions /></Suspense>} />

        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analyzer" element={<SkillAnalyzer />} />
          <Route path="learning" element={<LearningPath />} />
          <Route path="resume-builder" element={<ResumeBuilder />} />
          <Route path="interview-prep" element={<InterviewPrep />} />
          <Route path="project-generator" element={<ProjectGenerator />} />
          <Route path="portfolio" element={<Navigate to="/portfolio/builder" replace />} />
          <Route path="portfolio/builder" element={<PortfolioBuilder />} />
        </Route>
        <Route path="/p/:username/:id" element={<PublicPortfolio />} />

        {/* Catch-all for white screen prevention */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
