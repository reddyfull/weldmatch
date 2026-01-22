import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWelderProfile, useEmployerProfile } from "@/hooks/useUserProfile";

export default function PostLoginRouter() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { data: welderProfile, isLoading: welderLoading } = useWelderProfile();
  const { data: employerProfile, isLoading: employerLoading } = useEmployerProfile();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (authLoading || welderLoading || employerLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (hasChecked) return;
    setHasChecked(true);

    const userType = profile?.user_type;

    if (userType === "welder") {
      navigate(welderProfile ? "/welder/dashboard" : "/welder/profile/setup");
    } else if (userType === "employer") {
      navigate(employerProfile ? "/employer/dashboard" : "/employer/profile/setup");
    } else {
      // For Google sign-ins without a profile type yet
      navigate("/choose-role");
    }
  }, [user, profile, welderProfile, employerProfile, authLoading, welderLoading, employerLoading, hasChecked, navigate]);

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
