import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, AlertTriangle } from 'lucide-react';
import { PortfolioProvider } from '../context/PortfolioContext';
import BaseThemeWrapper from '../templates/BaseThemeWrapper';

const PublicPortfolio = () => {
    const { id } = useParams();
    const [portfolioData, setPortfolioData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                if (id === 'preview-draft') {
                    const localData = localStorage.getItem('portfolio_draft_preview');
                    if (localData) {
                        setPortfolioData(JSON.parse(localData));
                    } else {
                        setError('No draft found. Please return to the builder and try again.');
                    }
                    setLoading(false);
                    return;
                }

                const docRef = doc(db, 'portfolios', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setPortfolioData(docSnap.data());
                } else {
                    setError('Portfolio not found');
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setError('Failed to load portfolio');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPortfolio();
    }, [id]);

    if (loading) return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
    );

    if (error) return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 text-white">
            <AlertTriangle className="text-amber-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold">{error}</h2>
        </div>
    );

    return (
        <PortfolioProvider initialData={portfolioData}>
            <div className="public-portfolio-view min-h-screen">
                <BaseThemeWrapper />
            </div>
        </PortfolioProvider>
    );
};

export default PublicPortfolio;
