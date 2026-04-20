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
        console.log("[Daksh.AI] Auth Listener Initializing...");
        
        // Fallback timeout to ensure the app doesn't stay stuck on the loading screen
        const timeoutId = setTimeout(() => {
            console.warn("[Daksh.AI] Auth initialization timeout reached. Forcing UI load.");
            setLoading(false);
        }, 5000); // Reduced to 5 seconds for faster recovery

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("[Daksh.AI] Auth state change detected:", firebaseUser ? "User logged in" : "No user");
            
            // Set basic auth state immediately from the Auth service
            setIsAuthenticated(!!firebaseUser);

            if (firebaseUser) {
                try {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        setUser({ ...userSnap.data(), email: firebaseUser.email });
                    } else {
                        setUser(prev => ({ ...prev, email: firebaseUser.email }));
                    }
                } catch (error) {
                    console.error("[Daksh.AI] Firestore Profile Sync Error:", error);
                    setInitError(true);
                    
                    // Fallback: Use basic account info if database is blocked
                    setUser(prev => ({ 
                        ...prev, 
                        name: firebaseUser.displayName || 'Daksh User',
                        email: firebaseUser.email 
                    }));

                    // IMPORTANT: We do NOT set setIsAuthenticated(false) here. 
                    // We allow the user to reach the dashboard even with a default profile.
                } finally {
                    console.log("[Daksh.AI] Auth initialization complete.");
                    clearTimeout(timeoutId);
                    setLoading(false);
                }
            } else {
                setUser({ name: '', email: '', bio: '', skills: [], targetJob: '', portfolioLinks: [] });
                clearTimeout(timeoutId);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
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

            // Initialize Firestore document (Attempt only)
            const initialData = {
                name,
                email,
                bio: 'Just getting started with Daksh.AI!',
                skills: [],
                targetJob: '',
                portfolioLinks: []
            };

            try {
                await setDoc(doc(db, 'users', newUser.uid), initialData);
            } catch (e) {
                console.error("[Daksh.AI] Initial profile creation blocked by permissions. Using local state.");
            }
            
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

    const [initError, setInitError] = useState(false);

    console.log("[Daksh.AI] UserProvider Render | Loading:", loading, "| Error:", initError);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-light)' }}>
                <div className="loading-spinner"></div>
                <div style={{ marginTop: '1.5rem', color: 'var(--text-dark)', fontWeight: 600, fontSize: '1.1rem' }}>Starting Daksh.AI...</div>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{initError ? "Auth gateway issue detected. Retrying..." : "Securely authenticating connection"}</div>
                
                {(initError || loading) && (
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '250px', textAlign: 'center' }}>
                            If you stay stuck, your connection or security rules might be blocking the request.
                        </p>
                        <button 
                            onClick={() => setLoading(false)} 
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-dark)', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        >
                            Proceed to Login
                        </button>
                    </div>
                )}
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
