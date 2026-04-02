import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import { useUser } from './context/UserContext';
import { Loader2 } from 'lucide-react';
import './index.css';

// Eagerly load the Login Screen so unauthenticated users aren't waiting on chunk split delays
import Login from './pages/Login';

// Lazy load the heavy protected routes to slash initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SkillAnalyzer = lazy(() => import('./pages/SkillAnalyzer'));
const LearningPath = lazy(() => import('./pages/LearningPath'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/privacy" element={<Suspense fallback={<GlobalLoader />}><PrivacyPolicy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<GlobalLoader />}><TermsConditions /></Suspense>} />

        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analyzer" element={<SkillAnalyzer />} />
          <Route path="learning" element={<LearningPath />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="resume-builder" element={<ResumeBuilder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
