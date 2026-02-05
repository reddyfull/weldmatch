import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_type: "welder" | "employer" | "admin";
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface SubscriptionState {
  subscribed: boolean;
  plan: string | null;
  subscriptionEnd: string | null;
  customerId: string | null;
  isLoading: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
  subscription: SubscriptionState;
  checkSubscription: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, userType: 'welder' | 'employer') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    subscribed: false,
    plan: "free_trial",
    subscriptionEnd: null,
    customerId: null,
    isLoading: false,
  });

  // Cache to prevent duplicate subscription checks
  const subscriptionCheckedRef = useRef(false);
  const adminCheckedForUserRef = useRef<string | null>(null);

  // Check subscription status - centralized, no duplicate calls
  const checkSubscription = useCallback(async () => {
    if (!user || subscriptionCheckedRef.current) {
      return;
    }

    // Only check for employers
    if (profile?.user_type !== "employer") {
      return;
    }

    subscriptionCheckedRef.current = true;
    setSubscription(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("Error checking subscription:", error);
        setSubscription(prev => ({ ...prev, isLoading: false }));
        return;
      }

      setSubscription({
        subscribed: data.subscribed || false,
        plan: data.plan || "free_trial",
        subscriptionEnd: data.subscription_end || null,
        customerId: data.customer_id || null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscription(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, profile?.user_type]);

  // Parallel fetch profile and admin role
  const fetchUserData = useCallback(async (userId: string) => {
    // Skip if we already checked admin for this user
    if (adminCheckedForUserRef.current === userId) {
      return;
    }
    adminCheckedForUserRef.current = userId;

    try {
      // Run profile fetch and admin check in parallel
      const [profileResult, adminResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle(),
        supabase.rpc('has_role', { _user_id: userId, _role: 'admin' })
      ]);

      // Handle profile result
      if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
      } else if (profileResult.data) {
        setProfile(profileResult.data as UserProfile);
      }

      // Handle admin result
      if (adminResult.error) {
        console.error('Error checking admin role:', adminResult.error);
        setIsAdmin(false);
      } else {
        setIsAdmin(adminResult.data === true);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setIsAdmin(false);
    } finally {
      setAdminChecked(true);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // No setTimeout - directly call the parallel fetch
          fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setAdminChecked(true);
          // Reset caches on logout
          subscriptionCheckedRef.current = false;
          adminCheckedForUserRef.current = null;
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, [fetchUserData]);

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error: unknown) {
      console.error("Google sign-in error:", error);
      return { error: error as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { error: new Error("Invalid email or password. Please check and try again.") };
        }
        if (error.message.includes("Email not confirmed")) {
          return { error: new Error("Please verify your email before signing in.") };
        }
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error: unknown) {
      console.error("Email sign-in error:", error);
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, userType: 'welder' | 'employer') => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
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

      if (error) {
        if (error.message.includes("User already registered")) {
          return { error: new Error("An account with this email already exists. Please sign in instead.") };
        }
        if (error.message.includes("Password should be")) {
          return { error: new Error("Password is too weak. Please use at least 6 characters.") };
        }
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error: unknown) {
      console.error("Sign-up error:", error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    // Reset caches
    subscriptionCheckedRef.current = false;
    adminCheckedForUserRef.current = null;
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error: unknown) {
      return { error: error as Error };
    }
  };

  // Check subscription when profile changes to employer - only once
  useEffect(() => {
    if (profile?.user_type === "employer" && user && !subscriptionCheckedRef.current) {
      checkSubscription();
    }
  }, [profile?.user_type, user, checkSubscription]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,
        adminChecked,
        subscription,
        checkSubscription,
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
