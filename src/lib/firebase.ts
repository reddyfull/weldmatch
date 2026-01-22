import { initializeApp } from "firebase/app";
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
  User
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export auth functions
export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
};

export type { User };
