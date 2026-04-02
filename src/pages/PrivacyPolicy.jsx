import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="fade-in page-container" style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem 4rem' }}>
            <button 
                onClick={() => navigate(-1)}
                className="btn btn-outline mb-6"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'rgba(150, 150, 150, 0.1)', color: 'var(--text-dark)' }}
            >
                <ArrowLeft size={18} /> Back
            </button>

            <div className="glass-card p-8 md:p-12" style={{ borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-green)' }}>
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-4xl font-black m-0" style={{ letterSpacing: '-0.04em', color: 'var(--text-dark)' }}>
                        Privacy Policy
                    </h1>
                </div>

                <div className="space-y-8" style={{ lineHeight: '1.7', color: 'var(--text-dark)', opacity: 0.9 }}>
                    <section>
                        <p className="text-lg">
                            At <strong>Daksh.AI</strong>, we are committed to protecting your personal information and your right to privacy. This policy explains how we handle your data as you use our AI-powered career growth platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-2 text-xl font-bold mb-4" style={{ color: 'var(--primary-blue)' }}>
                            <Database size={20} /> 1. Data We Collect
                        </h2>
                        <p>
                            To provide personalized career guidance, we collect information that you voluntarily provide to us, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li><strong>Profile Information</strong>: Name, email address, and professional bio.</li>
                            <li><strong>Career Assets</strong>: Resumes (PDF/Text), project links, and skill sets.</li>
                            <li><strong>Preferences</strong>: Your "Dream Job" targets and learning interests.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-2 text-xl font-bold mb-4" style={{ color: 'var(--primary-blue)' }}>
                            <Eye size={20} /> 2. How We Use AI
                        </h2>
                        <p>
                            Daksh.AI leverages advanced Artificial Intelligence (via Google Gemini) to analyze your professional data.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li><strong>Skill Gap Analysis</strong>: Comparing your current profile against industry requirements.</li>
                            <li><strong>Content Generation</strong>: Automatically drafting professional summaries and portfolio descriptions.</li>
                            <li><strong>Resume Parsing</strong>: Extracting structured data from your uploaded documents to improve your profile score.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-2 text-xl font-bold mb-4" style={{ color: 'var(--primary-blue)' }}>
                            <Lock size={20} /> 3. Data Protection
                        </h2>
                        <p>
                            We implement robust security measures to maintain the safety of your personal information. Your data is processed securely and is never sold to third-party advertisers. AI processing is done using enterprise-grade API standards to ensure your sensitive career documents remain protected.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--primary-blue)' }}>
                            4. Your Rights
                        </h2>
                        <p>
                            You have the right to access, update, or delete your personal information at any time directly through your dashboard settings. If you choose to delete your account, all associated professional data and AI-generated content will be permanently removed from our active databases.
                        </p>
                    </section>

                    <section className="pt-8 border-t" style={{ borderColor: 'var(--border-color)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <p>Last Updated: {new Date().toLocaleDateString()}</p>
                        <p>Contact: support@daksh.ai</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
