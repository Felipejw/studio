
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
  Timestamp, // Import Timestamp
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
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;


// Enhanced diagnostic check for Firebase configuration
if (!apiKey || !authDomain || !projectId) {
  const missingKeys = [];
  if (!apiKey) missingKeys.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!authDomain) missingKeys.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!projectId) missingKeys.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  
  const errorMessage = `🔴 Firebase Configuration Error: The following environment variables are missing or empty: ${missingKeys.join(', ')}. 
    This is likely the cause of any 'auth/invalid-api-key' errors you are seeing in the browser.
    Please ensure:
    1. You have a file named '.env.local' (or '.env') in the ROOT of your project directory.
    2. ALL NEXT_PUBLIC_FIREBASE_... variables (API_KEY, AUTH_DOMAIN, PROJECT_ID, etc.) are correctly set in this file with the values from your Firebase project console.
    3. You have RESTARTED your Next.js development server (e.g., stop and re-run 'npm run dev') AFTER creating or modifying the '.env.local' (or '.env') file.
    The application cannot connect to Firebase without these correct configurations.
    Loaded values:
    API Key: ${apiKey ? 'Loaded' : 'MISSING'}
    Auth Domain: ${authDomain ? 'Loaded' : 'MISSING'}
    Project ID: ${projectId ? 'Loaded' : 'MISSING'}
    Storage Bucket: ${storageBucket ? 'Loaded' : 'OPTIONAL_BUT_RECOMMENDED'}
    Messaging Sender ID: ${messagingSenderId ? 'Loaded' : 'OPTIONAL_BUT_RECOMMENDED'}
    App ID: ${appId ? 'Loaded' : 'OPTIONAL_BUT_RECOMMENDED'}`;
  
  console.error(errorMessage);
  // NOTE: This console.error runs in the environment where this module is imported.
  // For client-side, it's the browser. For server-side (e.g., during build or SSR), it's the terminal.
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e: any) {
    console.error("🔴 Firebase Initialization Error:", e.message, "Raw Config:", firebaseConfig);
    // Fallback to a dummy app object or rethrow to prevent further execution
    // This situation is critical and usually means config is fundamentally wrong.
    throw new Error("Firebase could not be initialized. Check console for details and verify .env.local setup.");
  }
} else {
  app = getApp();
}

let db: Firestore;
let auth: Auth;

try {
  db = getFirestore(app);
  auth = getAuth(app); 
} catch (e: any) {
   console.error("🔴 Firestore/Auth Initialization Error after app init:", e.message, "This might happen if Firebase app initialized but services failed (e.g. due to rules or deeper config issues).");
   throw new Error("Firestore/Auth services could not be initialized. Check console.");
}


export { 
  db, 
  auth, 
  app,
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
  Timestamp, // Export Timestamp
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type FirebaseApp,
  type Firestore,
  type Auth
};
    
