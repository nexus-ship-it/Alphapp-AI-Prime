
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Helper to get env var safe for Vite and standard environments
const getEnv = (key: string) => {
    // Check import.meta.env (Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        return import.meta.env[`VITE_${key}`] || import.meta.env[key];
    }
    // Check process.env
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        return process.env[`VITE_${key}`] || process.env[key];
    }
    return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID')
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
    // Only initialize if API key is present to avoid "auth/invalid-api-key" crash
    if (firebaseConfig.apiKey) {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.warn("Firebase API Key is missing. Firebase features will be disabled.");
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
}

export { app, auth, db };
export default app;
