import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState(localStorage.getItem('dakshai-theme') || 'light');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dakshai-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };


    const [user, setUser] = useState({
        name: '',
        email: '',
        bio: '',
        skills: [],
        targetJob: '',
        portfolioLinks: [],
        photoURL: '',
        resumeInsights: null
    });

    // Handle debounced syncing to Firestore
    const syncTimerRef = useRef(null);
    const lastSyncedUserRef = useRef(null);

    useEffect(() => {
        // Skip if not authenticated or first load
        if (!auth.currentUser || !user.email) return;

        // Don't sync if this change was just loaded from Firestore
        if (JSON.stringify(user) === JSON.stringify(lastSyncedUserRef.current)) return;

        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

        syncTimerRef.current = setTimeout(async () => {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const syncData = {
                name: user.name,
                bio: user.bio,
                skills: user.skills,
                targetJob: user.targetJob,
                portfolioLinks: user.portfolioLinks,
                photoURL: user.photoURL || '',
                resumeInsights: user.resumeInsights || null
            };
            
            try {
                await updateDoc(userRef, syncData);
                lastSyncedUserRef.current = JSON.parse(JSON.stringify(user));
            } catch (e) {
                await setDoc(userRef, syncData, { merge: true });
                lastSyncedUserRef.current = JSON.parse(JSON.stringify(user));
            }
        }, 1500);

        return () => {
            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        };
    }, [user, isAuthenticated]);

    // Listen to Firebase Auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setIsAuthenticated(true);
                // Fetch user document from Firestore
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setUser({ ...userSnap.data(), email: firebaseUser.email });
                } else {
                    // New user (from signup) hasn't set up full document yet
                    setUser(prev => ({ ...prev, email: firebaseUser.email }));
                }
            } else {
                setIsAuthenticated(false);
                setUser({ name: '', email: '', bio: '', skills: [], targetJob: '', portfolioLinks: [] });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Save changes to Firestore whenever specific parts of the user profile update
    const saveToFirestore = async (updates) => {
        if (!auth.currentUser) return;
        const userRef = doc(db, 'users', auth.currentUser.uid);
        try {
            await updateDoc(userRef, updates);
        } catch (e) {
            // If document doesn't exist, set it
            await setDoc(userRef, { ...user, ...updates }, { merge: true });
        }
    };


    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error) {
            console.error("Login Error:", error.message);
            alert(error.message);
            return false;
        }
    };

    const signup = async (name, email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            // Initialize Firestore document
            const initialData = {
                name,
                email,
                bio: 'Just getting started with Daksh.AI!',
                skills: [],
                targetJob: '',
                portfolioLinks: []
            };

            await setDoc(doc(db, 'users', newUser.uid), initialData);
            setUser(initialData);
            
            
            return true;
        } catch (error) {
            console.error("Signup Error:", error.message);
            alert(error.message);
            return false;
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const updateSkills = (newSkills) => {
        setUser(prev => ({ ...prev, skills: newSkills }));
    };

    const updateTargetJob = (jobId) => {
        setUser(prev => ({ ...prev, targetJob: jobId }));
    };

    const updatePortfolio = (links) => {
        setUser(prev => ({ ...prev, portfolioLinks: links }));
    };

    const updateResumeInsights = (insights) => {
        setUser(prev => ({ ...prev, resumeInsights: insights }));
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-light)' }}>
                <div className="loading-spinner"></div>
                <div style={{ marginTop: '1.5rem', color: 'var(--text-dark)', fontWeight: 600, fontSize: '1.1rem' }}>Starting Daksh.AI...</div>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Securely authenticating connection</div>
            </div>
        );
    }

    return (
        <UserContext.Provider value={{
            isAuthenticated, loading, login, signup, logout,
            user, theme, toggleTheme,
            updateSkills, updateTargetJob, updatePortfolio, updateResumeInsights, setUser: (newUser) => {
                setUser(newUser);
            }
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
