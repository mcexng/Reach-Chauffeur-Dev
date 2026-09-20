import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Reach Chauffeur Official Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDfOXYrl9McXClrhZYmnMjLbN-sh0S28Rg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "reach-chauffeur.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "reach-chauffeur",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "reach-chauffeur.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "734221846623",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:734221846623:web:fade0c2a3d20db6fdcf3ea"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const dbFS = getFirestore(app);
