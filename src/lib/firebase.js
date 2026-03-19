import { initializeApp } from "firebase/app";
import { 
  getFirestore,
  initializeFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";
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

const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;
if (!isConfigValid) {
    console.warn('⚠️ Firebase config incomplete - some features may not work');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Firebase 9+ API) with persistent multiple tab manager
// Fallback to memory cache if internal assertion failed (common with Firebase 12)
let db;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
    console.log('✅ Firestore initialized with persistent cache');
} catch (error) {
    console.warn('⚠️ Persistent cache failed, using memory cache:', error.message);
    try {
        db = initializeFirestore(app, {
            localCache: memoryLocalCache()
        });
    } catch (error2) {
        console.warn('⚠️ Memory cache failed, using default:', error2.message);
        db = getFirestore(app);
    }
}

export { db };
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Analytics only in browser
export const analytics = typeof window !== 'undefined' && isConfigValid 
    ? (() => {
        try {
            return getAnalytics(app);
        } catch (e) {
            console.warn('Analytics failed:', e.message);
            return null;
        }
    })()
    : null;

// Initialize App Check for production security
if (typeof window !== 'undefined' && import.meta.env.PROD) {
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (recaptchaSiteKey) {
        try {
            initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider(recaptchaSiteKey),
                isTokenAutoRefreshEnabled: true
            });
        } catch (error) {
            console.error('❌ Failed to initialize App Check:', error);
        }
    }
}
