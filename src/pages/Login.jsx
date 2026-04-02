import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { jobLibrary } from '../lib/mockData';


const Login = () => {
    const [isLogin, setIsLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, signup, isAuthenticated, updateSkills, updateTargetJob, theme, toggleTheme } = useUser();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        let success = false;

        if (isLogin) {
            success = await login(formData.email, formData.password);
        } else {
            success = await signup(formData.name, formData.email, formData.password);
        }

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
          background-color: var(--bg-light);
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
          background: radial-gradient(circle, rgba(16, 185, 129, 0.20) 0%, transparent 60%);
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
        }
        .login-left {
          display: none;
          flex: 1;
          background: linear-gradient(135deg, #16244C 0%, #202D58 40%, #56688A 100%);
          color: white;
          padding: 4rem;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
        }
        @media (min-width: 900px) {
          .login-left { display: flex; }
        }
        .logo-box {
          background: white;
          color: #1A237E;
          font-size: 3.5rem;
          font-weight: 800;
          width: 90px;
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          margin-bottom: 2.5rem;
          transform: rotate(-6deg);
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
        .custom-card {
          background: var(--glass-bg, var(--primary-white));
          backdrop-filter: blur(24px) saturate(150%);
          -webkit-backdrop-filter: blur(24px) saturate(150%);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
          border: 1px solid var(--glass-border, var(--border-color));
        }
        .input-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 0.4rem;
        }
        .styled-input, .styled-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background-color: var(--primary-white);
          color: var(--text-dark);
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .styled-input::placeholder {
          color: var(--text-muted);
        }
        .styled-input:focus, .styled-select:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .btn-modern {
          width: 100%;
          padding: 0.9rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--primary-blue);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }
        .btn-modern:hover:not(:disabled) {
          opacity: 0.9;
        }
        .btn-modern:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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
      `}</style>

            {/* Left Branding Panel */}
            <div className="login-left">
                <div className="logo-box">D</div>
                <h1 className="mb-5 leading-tight"
                    style={{
                        color: 'white',
                        fontSize: '3rem',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        margin: '0 0 1.25rem 0'
                    }}>
                    Rise to your full<br />potential.
                </h1>
                <p className="max-w-sm mx-auto"
                    style={{
                        lineHeight: '1.6',
                        color: '#CBD5E1',
                        fontSize: '1.05rem',
                        margin: 0
                    }}>
                    Bridge the gap between your current skills and your dream career with AI-powered guidance.
                </p>
            </div>

            {/* Right Form Panel */}
            <div className="login-right">
                <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 10 }}>
                    <button
                        onClick={toggleTheme}
                        title="Toggle Dark Mode"
                        style={{ border: '1px solid var(--border-color)', background: 'var(--primary-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}
                    >
                        {theme === 'dark' ? <Sun size={20} color="var(--text-dark)" /> : <Moon size={20} color="var(--primary-blue)" />}
                    </button>
                </div>

                <div className="login-form-container">
                    <div className="mb-6">
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
                                    <div className="mb-2">
                                        <label className="input-label">Password</label>
                                        <input
                                            type="password"
                                            className="styled-input"
                                            placeholder="Create a strong password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
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
                                        <label className="input-label">Password</label>
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
                    </div>

                    <div className="mt-6 text-center">
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="link-button"
                        >
                            {isLogin ? 'Create Profile' : 'Log In Instead'}
                        </button>
                    </div>

                    <div className="mt-12 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', opacity: 0.7 }}>
                        &copy; Copyright of this web application reserved by Daksh.AI.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
