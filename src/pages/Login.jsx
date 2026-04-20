import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { haptic } from '../lib/haptics';
import { jobLibrary } from '../lib/mockData';
import futuristicBigD from '../assets/big_d_metallic_hologram.png';
import { auth } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const Login = () => {
    const [isLogin, setIsLogin] = useState(() => {
        return localStorage.getItem('hasVisitedBefore') === 'true';
    });
    const [loading, setLoading] = useState(false);
    const { login, signup, isAuthenticated, updateSkills, updateTargetJob, theme, toggleTheme, loginWithGoogle } = useUser();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        gender: ''
    });

    React.useEffect(() => {
        if (!localStorage.getItem('hasVisitedBefore')) {
            // First visit gets signup layout (isLogin = false), then we mark it for subsequent visits
            localStorage.setItem('hasVisitedBefore', 'true');
        }
    }, []);

    const handleResetPassword = async () => {
        if (!formData.email) {
            alert('Please enter your email address first to reset your password.');
            return;
        }
        haptic.medium();
        try {
            await sendPasswordResetEmail(auth, formData.email);
            alert('Password reset link sent! Check your email inbox.\n\n(Please also check your spam folder).');
        } catch (error) {
            haptic.error();
            alert('Error resetting password: ' + error.message);
        }
    };

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        haptic.medium();
        setLoading(true);
        let success = false;

        if (isLogin) {
            success = await login(formData.email, formData.password);
        } else {
            if(!formData.gender) {
                setLoading(false);
                alert("Please select a gender.");
                return;
            }
            success = await signup(formData.name, formData.email, formData.password, formData.gender);
        }

        setLoading(false);
        if (success) {
            navigate('/dashboard');
        }
    };

    const handleGoogleLogin = async () => {
        haptic.medium();
        setLoading(true);
        const success = await loginWithGoogle();
        setLoading(false);
        if (success) {
            navigate('/dashboard');
        }
    };


    return (
        <div className="login-wrapper">
            <div className="login-bg-blob"></div>
            <style>{`
        .login-wrapper {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: transparent;
          position: relative;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .login-bg-blob {
          position: absolute;
          bottom: -150px;
          right: -100px;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 60%);
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
        }
        .login-left {
          display: none;
          flex: 1;
          background-color: rgba(15, 23, 42, 0.85); /* Semi-transparent for aurora blend */
          background-image: url('${futuristicBigD}');
          background-size: cover;
          background-position: center;
          color: white;
          padding: 4rem;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
        }

        @keyframes floatBadge {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        
        .flavor-badge {
          position: absolute;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--accent-green);
          padding: 0.6rem 1.2rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: floatBadge 6s ease-in-out infinite;
          z-index: 10;
          transition: all 0.5s ease;
          cursor: default;
        }

        .flavor-badge:hover {
          background: rgba(15, 23, 42, 0.7);
          border-color: rgba(16, 185, 129, 0.8);
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
        }

        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.7) 100%);
          z-index: 0;
        }
        .login-left-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        @media (min-width: 900px) {
          .login-left { display: flex; }
        }
        .login-right {
          flex: 1.1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2rem;
          background: transparent;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }
        .login-form-container {
          width: 100%;
          max-width: 540px;
          margin: 0 auto;
        }
        @keyframes starFall {
          0% { background-position: -50% -50%; }
          100% { background-position: 150% 150%; }
        }
        
        .custom-card {
          background: rgba(150, 150, 150, 0.1) !important;
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border-radius: 20px;
          padding: 2.5rem;
          position: relative;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          border: 1px solid rgba(150, 150, 150, 0.2);
        }
        
        /* Smooth Falling Star Border */
        .custom-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(135deg, transparent 40%, rgba(16, 185, 129, 1) 50%, transparent 60%);
          background-size: 250% 250%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
          animation: starFall 6s ease-in-out infinite alternate;
          pointer-events: none;
        }

        .input-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .styled-input, .styled-select {
          width: 100%;
          padding: 0.85rem 1rem;
          border: 1px solid rgba(150, 150, 150, 0.2);
          border-radius: 10px;
          background-color: rgba(150, 150, 150, 0.1);
          backdrop-filter: blur(10px);
          color: var(--text-dark);
          font-size: 0.95rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .styled-input::placeholder {
          color: var(--text-muted);
          opacity: 0.7;
        }
        .styled-input:focus, .styled-select:focus {
          outline: none;
          border-color: var(--accent-green);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
          background-color: rgba(150, 150, 150, 0.15);
          transform: translateY(-1px);
        }
        .btn-modern {
          width: 100%;
          padding: 0.95rem;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--primary-blue);
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 0.75rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .btn-modern:hover:not(:disabled) {
          background-color: var(--accent-green);
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.6);
          transform: translateY(-2px);
          border-color: rgba(16, 185, 129, 0.8);
        }
        .btn-modern:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-google {
          background-color: var(--primary-white);
          color: var(--text-dark);
          border: 1px solid var(--border-color);
        }
        .btn-google:hover:not(:disabled) {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          transform: translateY(-2px);
        }
        [data-theme='dark'] .btn-google {
          background-color: rgba(15, 23, 42, 0.6);
          border-color: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }
        [data-theme='dark'] .btn-google:hover:not(:disabled) {
          background-color: rgba(30, 41, 59, 0.8);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .link-button {
          background: none;
          border: none;
          color: var(--primary-blue);
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0;
        }
        .link-button:hover {
          text-decoration: underline;
        }

        /* Responsive Mobile Optimizations */
        @media (min-width: 992px) {
          .login-left {
            display: flex !important;
          }
        }

        @media (max-width: 768px) {
          .login-wrapper {
            flex-direction: column;
          }
          .login-right {
            padding: 2rem 1.5rem; /* Increased vertical padding to give more room for the toggle */
            align-items: stretch;
            justify-content: center;
          }
          .custom-card {
            padding: 2rem 1.5rem;
            border-radius: 16px;
            margin-top: 1rem;
          }
          .theme-toggle-container {
            top: 1rem !important;
            right: 1rem !important;
          }
          .login-header-section {
            margin-bottom: 2rem !important; /* Extra gap between header and card */
            padding-top: 1.5rem; /* Push down to avoid status bar/toggle overlap */
          }
          .login-header-section h2 {
            font-size: 1.65rem !important;
            padding-right: 2.5rem; /* Make room for the toggle icon if it's nearby */
          }
        }
        @media (max-width: 480px) {
           .login-header-section h2 {
            font-size: 1.5rem !important;
          }
          .theme-toggle-container {
            top: 0.75rem !important;
            right: 0.75rem !important;
          }
        }
      `}</style>

            {/* Left Branding Panel */}
            <div className="login-left">
                {/* Floating Interactive Flavor Badges */}
                <div className="flavor-badge" style={{ top: '25%', left: '8%', animationDelay: '0s' }}>
                    [ Analyzing Skill Gaps... ]
                </div>
                <div className="flavor-badge" style={{ top: '15%', right: '10%', animationDelay: '2s' }}>
                    [ Mapping Neural Career Path ]
                </div>
                <div className="flavor-badge" style={{ bottom: '25%', left: '15%', animationDelay: '4s' }}>
                    [ AI Optimization Active ]
                </div>
                <div className="flavor-badge" style={{ bottom: '15%', right: '15%', animationDelay: '1s' }}>
                    [ Processing Dream Job... ]
                </div>

                <div className="login-left-content" style={{ zIndex: 1, position: 'relative' }}>
                    <h1 className="mb-5 leading-tight"
                        style={{
                            color: 'white',
                            fontSize: '3.5rem',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            margin: '0 0 1.25rem 0'
                        }}>
                        Rise to your full<br />potential.
                    </h1>
                    <p className="max-w-md mx-auto"
                        style={{
                            lineHeight: '1.6',
                            color: '#e2e8f0',
                            fontSize: '1.1rem',
                            fontWeight: '500',
                            textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                            margin: 0
                        }}>
                        Bridge the gap between your current skills and your dream career with AI-powered guidance.
                    </p>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="login-right">
                <div className="theme-toggle-container" style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 10 }}>
                    <button
                        onClick={() => {
                            haptic.light();
                            toggleTheme();
                        }}
                        title="Toggle Dark Mode"
                        style={{ border: '1px solid var(--border-color)', background: 'var(--primary-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}
                    >
                        {theme === 'dark' ? <Sun size={20} color="var(--text-dark)" /> : <Moon size={20} color="var(--primary-blue)" />}
                    </button>
                </div>

                <div className="login-form-container">
                    <div className="login-header-section mb-6">
                        <h2 className="font-extrabold mb-2 flex items-center gap-2"
                            style={{ color: 'var(--text-dark)', fontSize: '1.875rem', letterSpacing: '-0.01em', margin: '0 0 0.5rem 0' }}>
                            Welcome to Daksh.AI
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" /></svg>
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0 }}>
                            Let's bridge your employability gap.
                        </p>
                    </div>

                    <div className="custom-card">
                        <form onSubmit={handleSubmit} style={{ margin: 0 }}>
                            {!isLogin ? (
                                /* EXACT SIGN UP FORM MATCH */
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="input-label">Full Name</label>
                                        <input
                                            type="text"
                                            className="styled-input"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="styled-input"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-4 sm:flex-row flex-col">
                                        <div className="flex-1">
                                            <label className="input-label">Password</label>
                                            <input
                                                type="password"
                                                className="styled-input"
                                                placeholder="Create strong password"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="input-label">Gender</label>
                                            <select 
                                                className="styled-select"
                                                value={formData.gender}
                                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                                required
                                                style={{ appearance: 'none' }}
                                            >
                                                <option value="" disabled>Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                                <option value="Prefer not to say">Prefer not to say</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-modern" disabled={loading}>
                                        {loading ? 'Creating Profile...' : 'Create Profile'}
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            ) : (
                                /* SIGN IN FORM */
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="input-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="styled-input"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
                                            <button
                                                type="button"
                                                onClick={handleResetPassword}
                                                className="link-button"
                                                style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent-green)' }}
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        <input
                                            type="password"
                                            className="styled-input"
                                            placeholder="Enter your password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn-modern" disabled={loading}>
                                        {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}
                        </form>

                        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                            <span style={{ padding: '0 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                        </div>

                        <button 
                            onClick={handleGoogleLogin} 
                            disabled={loading}
                            className="btn-modern btn-google" 
                            style={{ margin: 0, justifyContent: 'center' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                <path fill="none" d="M0 0h48v48H0z"/>
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    <div className="text-center" style={{ marginTop: '2.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                haptic.light();
                                setIsLogin(!isLogin);
                            }}
                            className="link-button"
                        >
                            {isLogin ? 'Create Profile' : 'Log In Instead'}
                        </button>
                    </div>

                    <div className="text-center" style={{ marginTop: '5rem', color: 'var(--text-muted)', fontSize: '0.75rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                        <div>&copy; {new Date().getFullYear()} Daksh.AI by Shaurya. All rights reserved.</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='var(--primary-blue)'} onMouseOut={e=>e.target.style.color='var(--text-muted)'}>Privacy Policy</Link>
                            <span style={{ opacity: 0.3 }}>•</span>
                            <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.target.style.color='var(--primary-blue)'} onMouseOut={e=>e.target.style.color='var(--text-muted)'}>Terms & Conditions</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
