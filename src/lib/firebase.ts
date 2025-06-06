
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  orderBy,
  type Firestore
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Early warning if essential config is missing
if (!apiKey || !authDomain || !projectId) {
  const missingKeys = [];
  if (!apiKey) missingKeys.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!authDomain) missingKeys.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!projectId) missingKeys.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  
  console.error(
    `🔴 Firebase Configuration Error: The following environment variables are missing or empty: ${missingKeys.join(', ')}. 
    This is likely the cause of any 'auth/invalid-api-key' errors you are seeing in the browser.
    Please ensure:
    1. You have a file named '.env.local' in the ROOT of your project directory.
    2. ALL NEXT_PUBLIC_FIREBASE_... variables (API_KEY, AUTH_DOMAIN, PROJECT_ID, etc.) are correctly set in this '.env.local' file with the values from your Firebase project console.
    3. You have RESTARTED your Next.js development server (e.g., stop and re-run 'npm run dev') AFTER creating or modifying the '.env.local' file.
    The application cannot connect to Firebase without these correct configurations.`
  );
  // Note: Firebase initialization will likely fail with its own error if config is truly missing/invalid.
  // This console log is an additional diagnostic helper visible in your terminal.
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app); // The error (auth/invalid-api-key) originates here if config is bad

export { 
  db, 
  auth, 
  app, // Export app if needed elsewhere, though db and auth are usually sufficient
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  orderBy,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type FirebaseApp,
  type Firestore,
  type Auth
};

// Note: You'll need to create a .env.local file in your project root 
// and add your Firebase project's configuration values there.
// Example .env.local content is provided in .env.example
    