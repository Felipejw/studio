
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
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
  orderBy // Ensure orderBy is imported from firebase/firestore
} from 'firebase/firestore';
// import { getAuth } from 'firebase/auth'; // Import when auth is needed

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
// const auth = getAuth(app); // Initialize Auth when ready

// MOCK USER ID - Replace with actual authenticated user ID
const MOCK_USER_ID = 'mock_user_123';

export { 
  db, 
  // auth, 
  MOCK_USER_ID,
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  orderBy // Ensure orderBy is exported
};

// Note: You'll need to create a .env.local file in your project root 
// and add your Firebase project's configuration values there.
// Example .env.local content is provided in .env.example
