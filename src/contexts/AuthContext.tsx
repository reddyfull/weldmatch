import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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
  const [subscription, setSubscription] = useState<SubscriptionState>({
    subscribed: false,
    plan: "free_trial",
    subscriptionEnd: null,
    customerId: null,
    isLoading: false,
  });

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({
        subscribed: false,
        plan: "free_trial",
        subscriptionEnd: null,
        customerId: null,
        isLoading: false,
      });
      return;
    }

    // Only check for employers
    if (profile?.user_type !== "employer") {
      return;
    }

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

  // Check if user has admin role
  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: userId, _role: 'admin' });
      
      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
        return;
      }
      
      setIsAdmin(data === true);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  // Fetch user profile from Supabase
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      if (data) {
        setProfile(data as UserProfile);
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Sign-up error:", error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
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
    } catch (error: any) {
      return { error: error as Error };
    }
  };

  // Check subscription when profile changes to employer
  useEffect(() => {
    if (profile?.user_type === "employer" && user) {
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
