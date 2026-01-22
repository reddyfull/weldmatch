import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { User as FirebaseUser, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { supabase } from "@/integrations/supabase/client";
import { auth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, userType: 'welder' | 'employer') => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up Firebase auth state listener
    const unsubscribeFirebase = auth.onAuthStateChanged((firebaseUser) => {
      setFirebaseUser(firebaseUser);
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeFirebase();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, userType: 'welder' | 'employer') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    try {
      // Sign in with Firebase Google
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      if (!firebaseUser.email) {
        return { error: new Error("No email found in Google account") };
      }

      // Now sync with Supabase - try to sign in first, if fails, sign up
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: firebaseUser.email,
        password: firebaseUser.uid, // Use Firebase UID as password
      });

      if (signInError) {
        // User doesn't exist in Supabase, create them
        const { error: signUpError } = await supabase.auth.signUp({
          email: firebaseUser.email,
          password: firebaseUser.uid,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: firebaseUser.displayName || '',
              user_type: 'welder', // Default to welder, can be changed later
              avatar_url: firebaseUser.photoURL || '',
            },
          },
        });

        if (signUpError) {
          return { error: signUpError as Error };
        }
      }

      return { error: null };
    } catch (error) {
      console.error("Google sign-in error:", error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Sign out from both Firebase and Supabase
    await firebaseSignOut(auth);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
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
