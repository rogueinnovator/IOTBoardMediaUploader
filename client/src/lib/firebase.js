// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableIndexedDbPersistence,
  getDoc,
  doc
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Log Firebase configuration for debugging (without sensitive values)
console.log('Firebase configuration:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId
});

// Initialize Firebase and export db
let db;
let auth;

try {
  console.log('Initializing Firebase app...');
  const app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  // Initialize Firebase Authentication
  auth = getAuth(app);
  console.log('Firebase Authentication initialized');
  
  // Initialize Firestore with a simpler approach
  db = getFirestore(app);
  console.log('Firestore initialized');
  
  // Enable persistence only on client side with proper error handling
  if (typeof window !== 'undefined') {
    // Enable persistence with proper error handling
    (async () => {
      try {
        await enableIndexedDbPersistence(db);
        console.log('Firestore persistence enabled successfully');
      } catch (err) {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a time.
          console.warn('Firestore persistence could not be enabled: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          console.warn('Firestore persistence is not available in this browser');
        } else {
          console.error('Unexpected error enabling Firestore persistence:', err);
        }
      }
    })();
  }
  
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create a dummy db object to prevent app crashes
  db = {
    collection: () => ({
      doc: () => ({
        get: async () => Promise.reject(new Error('Firebase initialization failed')),
        set: async () => Promise.reject(new Error('Firebase initialization failed')),
      }),
    }),
  };
  
  // Create a dummy auth object
  auth = {
    signInWithEmailAndPassword: async () => Promise.reject(new Error('Firebase authentication failed')),
    createUserWithEmailAndPassword: async () => Promise.reject(new Error('Firebase authentication failed')),
    signOut: async () => Promise.reject(new Error('Firebase authentication failed')),
    onAuthStateChanged: () => () => {},
  };
}

export { db, auth };