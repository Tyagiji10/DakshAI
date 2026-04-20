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
    const [initError, setInitError] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('dakshai-theme') || 'light');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dakshai-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const capitalize = (str) => {
        if (!str || typeof str !== 'string') return str;
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };


    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('dakshai-user-profile');
            return saved ? JSON.parse(saved) : {
                name: '',
                email: '',
                bio: '',
                skills: [],
                targetJob: '',
                portfolioLinks: [],
                photoURL: '',
                resumeInsights: null
            };
        } catch (e) {
            return { name: '', email: '', bio: '', skills: [], targetJob: '', portfolioLinks: [], photoURL: '', resumeInsights: null };
        }
    });

    // LocalStorage Persistence
    useEffect(() => {
        if (user.email) {
            const profileToSave = {
                name: user.name,
                email: user.email,
                photoURL: user.photoURL,
                bio: user.bio,
                skills: user.skills,
                targetJob: user.targetJob,
                portfolioLinks: user.portfolioLinks
            };
            localStorage.setItem('dakshai-user-profile', JSON.stringify(profileToSave));
        }
    }, [user.name, user.email, user.photoURL, user.bio, user.skills, user.targetJob]);

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
                // If the user has permission issues, we just log it and keep local state
                try {
                    await setDoc(userRef, syncData, { merge: true });
                    lastSyncedUserRef.current = JSON.parse(JSON.stringify(user));
                } catch (innerError) {
                    console.error("[Daksh.AI] Firestore Sync Permission Denied:", innerError);
                }
            }
        }, 1500);

        return () => {
            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        };
    }, [user, isAuthenticated]);

    // Listen to Firebase Auth state
    useEffect(() => {
        console.log("[Daksh.AI] Auth Listener Initializing...");
        
        // Fail-safe: ensure loading screen disappears after 8 seconds regardless of Firebase state
        const failSafeTimeout = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn("[Daksh.AI] Auth state check timed out. Forcing UI to load.");
                    return false;
                }
                return prev;
            });
        }, 8000);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("[Daksh.AI] Auth state change detected. User:", firebaseUser ? firebaseUser.email : 'None');
            
            try {
                if (firebaseUser) {
                    // Fetch user document from Firestore but wait for data before flagging as fully authenticated to prevent sync blink
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        setUser(prev => {
                            const updatedUser = { 
                                ...prev, 
                                ...data, 
                                name: capitalize(data.name || prev.name || ''), 
                                email: firebaseUser.email 
                            };
                            lastSyncedUserRef.current = JSON.parse(JSON.stringify(updatedUser)); // Snapshot for sync prevention
                            console.log("[Daksh.AI] User profile loaded and capitalized from Firestore");
                            return updatedUser;
                        });
                    } else {
                        // Keep current local name/bio if Firestore doc doesn't exist yet
                        setUser(prev => {
                            const updated = { ...prev, email: firebaseUser.email };
                            lastSyncedUserRef.current = JSON.parse(JSON.stringify(updated));
                            return updated;
                        });
                        console.log("[Daksh.AI] Using local/auth profile as Firestore document was not found");
                    }
                    setIsAuthenticated(true);
                } else {
                    console.log("[Daksh.AI] No authenticated session found (Auth state is null)");
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("[Daksh.AI] Critical error in Auth State Listener:", error);
                setInitError(true);
                // Even on error, we try to let the user proceed to login/dashboard
            } finally {
                clearTimeout(failSafeTimeout);
                setLoading(false);
                console.log("[Daksh.AI] Loading state cleared");
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(failSafeTimeout);
        };
    }, []);

    // Defensive check: Ensure user.email is synced with auth.currentUser even after other state updates
    useEffect(() => {
        if (auth.currentUser && auth.currentUser.email && !user.email) {
            setUser(prev => ({ ...prev, email: auth.currentUser.email }));
        }
    }, [user.email]);

    // Save changes to Firestore whenever specific parts of the user profile update
    const saveToFirestore = async (updates) => {
        if (!auth.currentUser) return;
        const userRef = doc(db, 'users', auth.currentUser.uid);
        try {
            await updateDoc(userRef, updates);
        } catch (e) {
            // If document doesn't exist, set it
            try {
                await setDoc(userRef, { ...user, ...updates }, { merge: true });
            } catch (innerError) {
                console.error("[Daksh.AI] Save to Firestore failed:", innerError);
            }
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
                name: capitalize(name),
                email,
                bio: 'Just getting started with Daksh.AI!',
                skills: [],
                targetJob: '',
                portfolioLinks: []
            };

            try {
                await setDoc(doc(db, 'users', newUser.uid), initialData);
                lastSyncedUserRef.current = JSON.parse(JSON.stringify(initialData));
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
        try {
            await signOut(auth);
            localStorage.removeItem('dakshai-user-profile'); // Explicit clear on logout
            setUser({ name: '', email: '', bio: '', skills: [], targetJob: '', portfolioLinks: [], photoURL: '', resumeInsights: null });
            setIsAuthenticated(false);
            console.log("Logged out and cache cleared");
        } catch (error) {
            console.error("Logout error:", error);
        }
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
            updateSkills, updateTargetJob, updatePortfolio, updateResumeInsights, setUser: (newUserOrFn) => {
                setUser(prev => {
                    const newUser = typeof newUserOrFn === 'function' ? newUserOrFn(prev) : newUserOrFn;
                    if (newUser.name) {
                        newUser.name = capitalize(newUser.name);
                    }
                    return newUser;
                });
            }
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
