import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDksNTEkRDILZimpnX7vUc36u66SAAH5l0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "wearecity-2ab89.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "wearecity-2ab89",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "wearecity-2ab89.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "294062779330",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:294062779330:web:8a8b5c9d7e6f1a2b3c4d5e",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Functions and get a reference to the service
export const functions = getFunctions(app);