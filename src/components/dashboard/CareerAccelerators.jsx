import React from 'react';
import { Rocket, MessageSquare, Lightbulb, ArrowRight } from 'lucide-react';

const CareerAccelerators = React.memo(({ navigate }) => {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Rocket size={18} style={{ color: 'var(--primary-blue)' }} />
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-dark)' }}>AI Career Accelerators</h3>
            </div>
            <div className="accelerator-grid">
                <div className="accent-card" onClick={() => navigate('/interview-prep')}>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg leading-tight">AI Mock Interview</h4>
                            <p className="text-xs text-muted">Practice with a senior AI recruiter</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">New Beta</span>
                        <ArrowRight size={16} className="text-blue-500" />
                    </div>
                </div>

                <div className="accent-card" onClick={() => navigate('/project-generator')}>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                            <Lightbulb size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg leading-tight">Project Blueprints</h4>
                            <p className="text-xs text-muted">Unique ideas to fill your skill gaps</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Personalized</span>
                        <ArrowRight size={16} className="text-amber-500" />
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CareerAccelerators;
