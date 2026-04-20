import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

// TODO: Replace these with your actual Firebase project settings
const firebaseConfig = {
    apiKey: "AIzaSyDuvJhIegjI9xVgql41UMC15qamCsnanyk",
    authDomain: "dakshai-13bc1.firebaseapp.com",
    projectId: "dakshai-13bc1",
    storageBucket: "dakshai-13bc1.firebasestorage.app",
    messagingSenderId: "436072489930",
    appId: "1:436072489930:web:28531559d43c59ee9de533",
    measurementId: "G-L0T6E6KGN5"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Enable persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn("Firestore persistence failed: Multiple tabs open");
    } else if (err.code === 'unimplemented') {
        console.warn("Firestore persistence failed: Browser not supported");
    }
});
