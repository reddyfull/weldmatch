import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile, useWelderProfile, useEmployerProfile } from "@/hooks/useUserProfile";

export default function PostLoginRouter() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: welderProfile, isLoading: welderLoading } = useWelderProfile();
  const { data: employerProfile, isLoading: employerLoading } = useEmployerProfile();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Wait for all data to load
    if (authLoading || profileLoading || welderLoading || employerLoading) {
      return;
    }

    // Not logged in, redirect to login
    if (!user) {
      navigate("/login");
      return;
    }

    // Prevent multiple redirects
    if (hasChecked) return;
    setHasChecked(true);

    // Determine user type and route accordingly
    const userType = profile?.user_type;

    if (userType === "welder") {
      if (welderProfile) {
        // Welder profile exists, go to dashboard
        navigate("/welder/dashboard");
      } else {
        // No welder profile, go to setup
        navigate("/welder/profile/setup");
      }
    } else if (userType === "employer") {
      if (employerProfile) {
        // Employer profile exists, go to dashboard
        navigate("/employer/dashboard");
      } else {
        // No employer profile, go to setup
        navigate("/employer/profile/setup");
      }
    } else {
      // Default to welder flow for users who signed up via Google
      if (welderProfile) {
        navigate("/welder/dashboard");
      } else if (employerProfile) {
        navigate("/employer/dashboard");
      } else {
        // No profile at all, let them choose
        navigate("/choose-role");
      }
    }
  }, [user, profile, welderProfile, employerProfile, authLoading, profileLoading, welderLoading, employerLoading, hasChecked, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary-dark flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center mx-auto shadow-lg animate-pulse">
          <Flame className="w-10 h-10 text-white" />
        </div>
        <div className="flex items-center gap-2 justify-center text-white">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    </div>
  );
}
