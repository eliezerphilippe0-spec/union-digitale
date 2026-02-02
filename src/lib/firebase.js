import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize App Check for production security
// IMPORTANT: Set VITE_RECAPTCHA_SITE_KEY in your .env file
// Get it from: https://console.cloud.google.com/security/recaptcha
if (typeof window !== 'undefined' && import.meta.env.PROD) {
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    if (recaptchaSiteKey) {
        try {
            const appCheck = initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider(recaptchaSiteKey),
                isTokenAutoRefreshEnabled: true
            });
            console.log('✅ Firebase App Check initialized');
        } catch (error) {
            console.error('❌ Failed to initialize App Check:', error);
        }
    } else {
        console.warn('⚠️ App Check not configured: VITE_RECAPTCHA_SITE_KEY missing');
    }
}

// Enable Offline Persistence
import { enableIndexedDbPersistence } from 'firebase/firestore';
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.warn('Firestore persistence not supported by browser');
        }
    });
}

// Connect to Emulators if on localhost
// Temporarily disabled to use production Firebase
/*
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log("🔥 Connecting to Firebase Emulators...");
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
}
*/
