import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Wrench, Building, ArrowRight } from "lucide-react";
import { useUpdateProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";

export default function ChooseRole() {
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const handleRoleSelect = async (role: "welder" | "employer") => {
    try {
      await updateProfile.mutateAsync({ user_type: role });
      
      if (role === "welder") {
        navigate("/welder/profile/setup");
      } else {
        navigate("/employer/profile/setup");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your role. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary-dark flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <Card className="w-full max-w-2xl relative z-10 shadow-2xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center shadow-lg">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary">
              Weld<span className="text-accent">Match</span>
            </span>
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome to WeldMatch!</CardTitle>
            <CardDescription className="text-muted-foreground">
              How would you like to use our platform?
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Welder Option */}
            <button
              onClick={() => handleRoleSelect("welder")}
              disabled={updateProfile.isPending}
              className="group relative p-6 rounded-xl border-2 border-border hover:border-accent bg-card text-left transition-all hover:shadow-lg disabled:opacity-50"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                  <Wrench className="w-7 h-7 text-accent group-hover:text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">I'm a Welder</h3>
                  <p className="text-sm text-muted-foreground">
                    Find welding jobs that match your skills and certifications
                  </p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Browse job listings</li>
                  <li>• Upload certifications</li>
                  <li>• Get matched with employers</li>
                </ul>
              </div>
              <ArrowRight className="absolute top-6 right-6 w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </button>

            {/* Employer Option */}
            <button
              onClick={() => handleRoleSelect("employer")}
              disabled={updateProfile.isPending}
              className="group relative p-6 rounded-xl border-2 border-border hover:border-accent bg-card text-left transition-all hover:shadow-lg disabled:opacity-50"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Building className="w-7 h-7 text-primary group-hover:text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">I'm Hiring Welders</h3>
                  <p className="text-sm text-muted-foreground">
                    Post jobs and find certified welders for your projects
                  </p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Post job listings</li>
                  <li>• Search candidate database</li>
                  <li>• Verify certifications</li>
                </ul>
              </div>
              <ArrowRight className="absolute top-6 right-6 w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
