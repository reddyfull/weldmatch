import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User,
  auth, 
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_type: "welder" | "employer" | "admin";
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, userType: 'welder' | 'employer') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create user profile in Supabase
  const syncUserProfile = async (firebaseUser: User, userType?: 'welder' | 'employer') => {
    try {
      // Try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", firebaseUser.uid)
        .maybeSingle();

      if (existingProfile) {
        setProfile(existingProfile as UserProfile);
        return existingProfile;
      }

      // Create new profile if doesn't exist
      const newProfile = {
        id: firebaseUser.uid,
        user_type: userType || 'welder',
        full_name: firebaseUser.displayName || '',
        phone: null,
        avatar_url: firebaseUser.photoURL || null,
      };

      const { data: createdProfile, error: insertError } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.error("Error creating profile:", insertError);
        // Profile might already exist due to race condition, try fetching again
        const { data: refetchedProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", firebaseUser.uid)
          .single();
        
        if (refetchedProfile) {
          setProfile(refetchedProfile as UserProfile);
          return refetchedProfile;
        }
        return null;
      }

      setProfile(createdProfile as UserProfile);
      return createdProfile;
    } catch (error) {
      console.error("Error syncing profile:", error);
      return null;
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await syncUserProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
      return { error: null };
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      
      if (error.code === "auth/popup-closed-by-user") {
        return { error: new Error("Sign-in cancelled. Please try again.") };
      }
      if (error.code === "auth/account-exists-with-different-credential") {
        return { error: new Error("An account already exists with this email using a different sign-in method.") };
      }
      
      return { error: error as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await syncUserProfile(result.user);
      return { error: null };
    } catch (error: any) {
      console.error("Email sign-in error:", error);
      
      if (error.code === "auth/user-not-found") {
        return { error: new Error("No account found with this email. Please register first.") };
      }
      if (error.code === "auth/wrong-password") {
        return { error: new Error("Incorrect password. Please try again.") };
      }
      if (error.code === "auth/invalid-email") {
        return { error: new Error("Invalid email address.") };
      }
      if (error.code === "auth/too-many-requests") {
        return { error: new Error("Too many failed attempts. Please try again later.") };
      }
      if (error.code === "auth/invalid-credential") {
        return { error: new Error("Invalid email or password. Please check and try again.") };
      }
      
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, userType: 'welder' | 'employer') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase profile with display name
      await updateProfile(result.user, {
        displayName: fullName,
      });

      // Create Supabase profile
      await syncUserProfile(result.user, userType);
      
      return { error: null };
    } catch (error: any) {
      console.error("Sign-up error:", error);
      
      if (error.code === "auth/email-already-in-use") {
        return { error: new Error("An account with this email already exists. Please sign in instead.") };
      }
      if (error.code === "auth/weak-password") {
        return { error: new Error("Password is too weak. Please use at least 6 characters.") };
      }
      if (error.code === "auth/invalid-email") {
        return { error: new Error("Invalid email address.") };
      }
      
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        return { error: new Error("No account found with this email.") };
      }
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
