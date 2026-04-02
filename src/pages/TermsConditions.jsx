import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, AlertTriangle, FileText, Ban } from 'lucide-react';

const TermsConditions = () => {
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
                    <div className="p-3 rounded-2xl" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-blue)' }}>
                        <Scale size={32} />
                    </div>
                    <h1 className="text-4xl font-black m-0" style={{ letterSpacing: '-0.04em', color: 'var(--text-dark)' }}>
                        Terms & Conditions
                    </h1>
                </div>

                <div className="space-y-8" style={{ lineHeight: '1.7', color: 'var(--text-dark)', opacity: 0.9 }}>
                    <section>
                        <p className="text-lg">
                            By accessing or using <strong>Daksh.AI</strong>, you agree to be bound by these Terms and Conditions. Please read them carefully to understand your rights and responsibilities.
                        </p>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-2 text-xl font-bold mb-4" style={{ color: 'var(--primary-blue)' }}>
                            <FileText size={20} /> 1. Intellectual Property
                        </h2>
                        <p>
                            All content, features, and functionality of Daksh.AI (including branding and text) are the exclusive property of Daksh.AI. When you use our "Resume Builder" or "Portfolio" tools, you retain ownership of your original input data, but we grant you a limited license to use any AI-generated output for professional purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-2 text-xl font-bold mb-4" style={{ color: 'var(--text-danger)' }}>
                            <AlertTriangle size={20} /> 2. AI Output Disclaimer
                        </h2>
                        <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid var(--text-danger)' }}>
                            <p className="font-bold mb-2">Important Legal Notice:</p>
                            <p>
                                Daksh.AI provides guidance based on Large Language Models (LLMs). While we strive for extreme accuracy, AI outputs may contain inaccuracies, historical gaps, or "hallucinations." All career advice, skill gap suggestions, and resume revisions should be verified by a human professional before final submission to employers.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-2 text-xl font-bold mb-4" style={{ color: 'var(--primary-blue)' }}>
                            <Ban size={20} /> 3. Prohibited Conduct
                        </h2>
                        <p>You agree NOT to use our platform to:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-3">
                            <li>Upload malicious scripts, deep-faked professional credentials, or copyrighted materials.</li>
                            <li>Attempt to reverse-engineer our AI processing pipelines or bypass character limits.</li>
                            <li>Use our automated advice to generate bulk spam job applications or fraudulent career identities.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--primary-blue)' }}>
                            4. Limitation of Liability
                        </h2>
                        <p>
                            Daksh.AI is a tool for professional enhancement. We do not guarantee job placement, interview success, or salary increases. Under no circumstances shall Daksh.AI be liable for indirect, incidental, or consequential damages resulting from the use of our AI suggestions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--primary-blue)' }}>
                            5. Modifications
                        </h2>
                        <p>
                            We reserve the right to modify these terms at any time as the underlying AI landscape evolves. Continued use of the platform after changes are posted constitutes acceptance of those modified terms.
                        </p>
                    </section>

                    <section className="pt-8 border-t" style={{ borderColor: 'var(--border-color)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <p>Last Review: {new Date().toLocaleDateString()}</p>
                        <p>Contact: legal@daksh.ai</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions;
