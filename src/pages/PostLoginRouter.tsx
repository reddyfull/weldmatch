import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWelderProfile, useEmployerProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function PostLoginRouter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, loading: authLoading, isAdmin, adminChecked } = useAuth();
  const { data: welderProfile, isLoading: welderLoading } = useWelderProfile();
  const { data: employerProfile, isLoading: employerLoading } = useEmployerProfile();
  const [hasChecked, setHasChecked] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    const handleRouting = async () => {
      // Wait for auth and admin check to complete
      if (authLoading || !adminChecked || isUpdatingRole) return;

      if (!user) {
        navigate("/login");
        return;
      }

      if (hasChecked) return;

      // PRIORITY: Admin users go directly to admin dashboard
      if (isAdmin) {
        setHasChecked(true);
        navigate("/admin/dashboard");
        return;
      }

      // Wait for profile data for non-admin users
      if (welderLoading || employerLoading) return;

      // Check for pending user type from OAuth registration flow
      const pendingUserType = sessionStorage.getItem('pendingUserType') as 'welder' | 'employer' | null;
      
      // If there's a pending user type AND the profile user_type doesn't match, update it
      if (pendingUserType && profile?.user_type !== pendingUserType) {
        setIsUpdatingRole(true);
        sessionStorage.removeItem('pendingUserType');
        
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ user_type: pendingUserType })
            .eq('id', user.id);
          
          if (error) {
            console.error('Error updating user type:', error);
          } else {
            // Invalidate profile queries to refresh the data
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            
            // Navigate based on the pending user type
            if (pendingUserType === 'welder') {
              navigate("/welder/profile/setup");
            } else {
              navigate("/employer/profile/setup");
            }
            return;
          }
        } catch (error) {
          console.error('Error updating user type:', error);
        } finally {
          setIsUpdatingRole(false);
        }
      } else {
        // Clear pending user type if it matches
        sessionStorage.removeItem('pendingUserType');
      }

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
    };

    handleRouting();
  }, [user, profile, welderProfile, employerProfile, authLoading, welderLoading, employerLoading, hasChecked, isUpdatingRole, isAdmin, adminChecked, navigate, queryClient]);

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
