import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  Auth
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDj9i_dMvxmMDndR5CAiW6hSn-OzkMBoY8",
  authDomain: "weldmatch.firebaseapp.com",
  projectId: "weldmatch",
  storageBucket: "weldmatch.firebasestorage.app",
  messagingSenderId: "35864942817",
  appId: "1:35864942817:web:4302bcbac6a083b2173fa0",
  measurementId: "G-XE6V6Y2PNJ"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth: Auth;
let googleProvider: GoogleAuthProvider;

try {
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  // Configure Google provider
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Create fallback auth instance
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

// Export auth functions
export {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
};

export type { User };
