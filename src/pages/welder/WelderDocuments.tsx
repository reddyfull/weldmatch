import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Award, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWelderProfile } from "@/hooks/useUserProfile";
import { ResumeUpload } from "@/components/ResumeUpload";
import { CertificationUpload } from "@/components/CertificationUpload";
import { CertificationsList } from "@/components/CertificationsList";
import { ProfileSuggestions } from "@/lib/n8n";
import { useToast } from "@/hooks/use-toast";

export default function WelderDocuments() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: welderProfile, isLoading: welderLoading, refetch } = useWelderProfile();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!welderLoading && !welderProfile && user) {
      navigate("/welder/profile/setup");
    }
  }, [welderProfile, welderLoading, user, navigate]);

  const isLoading = authLoading || welderLoading;

  const handleResumeSuggestions = (suggestions: ProfileSuggestions) => {
    toast({
      title: "Resume Parsed Successfully",
      description: "Go to your profile to apply the extracted information.",
    });
    // User can navigate to profile edit to apply suggestions
  };

  const handleCertificationSuccess = () => {
    refetch();
    toast({
      title: "Certification Added",
      description: "Your certification has been uploaded and processed.",
    });
  };

  const handleCertificationsChange = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="welder">
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="welder">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">
            Upload your resume and certifications to enhance your profile
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Resume
              </CardTitle>
              <CardDescription>
                Upload your resume for AI-powered profile auto-fill. Our system will extract your experience, skills, and certifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {welderProfile?.id && (
                <ResumeUpload
                  welderId={welderProfile.id}
                  onSuggestionsReady={handleResumeSuggestions}
                />
              )}
            </CardContent>
          </Card>

          {/* Certification Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-accent" />
                Upload Certification
              </CardTitle>
              <CardDescription>
                Upload certification documents for AI-powered verification. Supported formats: PDF, images.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {welderProfile?.id && (
                <CertificationUpload
                  welderId={welderProfile.id}
                  onSuccess={handleCertificationSuccess}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Certifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              My Certifications
            </CardTitle>
            <CardDescription>
              View and manage your uploaded certifications and their verification status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {welderProfile?.id && (
              <CertificationsList
                welderId={welderProfile.id}
                onCertificationsChange={handleCertificationsChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
