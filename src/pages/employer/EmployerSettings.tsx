import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Settings, 
  Bell, 
  Shield, 
  LogOut, 
  Trash2,
  Building2,
  CreditCard,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS, getPlanDisplayName, isPaidPlan } from "@/lib/stripe";

export default function EmployerSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signOut, subscription, checkSubscription } = useAuth();
  const { toast } = useToast();
  
  const [emailNewApplications, setEmailNewApplications] = useState(true);
  const [emailApplicationUpdates, setEmailApplicationUpdates] = useState(true);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false);
  const [emailMarketingUpdates, setEmailMarketingUpdates] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<string | null>(null);

  // Handle success/canceled query params from Stripe redirect
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      toast({
        title: "Subscription Activated!",
        description: "Thank you for subscribing. Your plan is now active.",
      });
      // Refresh subscription status
      checkSubscription();
      // Clean up URL
      navigate("/employer/settings", { replace: true });
    } else if (canceled === "true") {
      toast({
        title: "Checkout Canceled",
        description: "You can upgrade your plan anytime.",
        variant: "destructive",
      });
      navigate("/employer/settings", { replace: true });
    }
  }, [searchParams, toast, navigate, checkSubscription]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Settings Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const handleUpgrade = async (priceId: string, planName: string) => {
    setIsLoadingCheckout(planName);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCheckout(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const currentPlanName = getPlanDisplayName(subscription.plan);
  const hasPaidSubscription = isPaidPlan(subscription.plan) && subscription.subscribed;

  return (
    <DashboardLayout userType="employer">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-accent" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Company Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              <CardTitle>Company Profile</CardTitle>
            </div>
            <CardDescription>
              Update your company information and branding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline"
              onClick={() => navigate("/employer/profile/edit")}
            >
              Edit Company Profile
            </Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Choose what notifications you receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-applications">New Applications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone applies to your jobs
                  </p>
                </div>
                <Switch
                  id="new-applications"
                  checked={emailNewApplications}
                  onCheckedChange={setEmailNewApplications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="application-updates">Application Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when applicants update their status
                  </p>
                </div>
                <Switch
                  id="application-updates"
                  checked={emailApplicationUpdates}
                  onCheckedChange={setEmailApplicationUpdates}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-digest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of your hiring activity
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={emailWeeklyDigest}
                  onCheckedChange={setEmailWeeklyDigest}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing">Marketing & Tips</Label>
                  <p className="text-sm text-muted-foreground">
                    Hiring tips and WeldMatch updates
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={emailMarketingUpdates}
                  onCheckedChange={setEmailMarketingUpdates}
                />
              </div>
            </div>
            
            <Button onClick={handleSaveNotifications}>
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className={hasPaidSubscription ? "border-success/50" : ""}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              <CardTitle>Subscription</CardTitle>
              {hasPaidSubscription && (
                <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Plan Display */}
            <div className={`flex items-center justify-between p-4 rounded-lg ${
              hasPaidSubscription ? "bg-success/5 border border-success/20" : "bg-muted"
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{currentPlanName}</p>
                  {hasPaidSubscription && <Sparkles className="w-4 h-4 text-success" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {hasPaidSubscription 
                    ? `Renews ${subscription.subscriptionEnd ? new Date(subscription.subscriptionEnd).toLocaleDateString() : "monthly"}`
                    : "You're currently on the free trial plan"
                  }
                </p>
              </div>
              {hasPaidSubscription ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isLoadingPortal}
                >
                  {isLoadingPortal ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Manage <ExternalLink className="w-3 h-3 ml-1" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>

            {/* Upgrade Options (only shown for free trial) */}
            {!hasPaidSubscription && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Upgrade your plan</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-4 border border-accent rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">Professional</p>
                        <p className="text-2xl font-bold">$49.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      </div>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                      <li>• Unlimited job postings</li>
                      <li>• Unlimited candidate views</li>
                      <li>• Priority support</li>
                    </ul>
                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleUpgrade(STRIPE_PLANS.pro.priceId!, "pro")}
                      disabled={isLoadingCheckout === "pro"}
                    >
                      {isLoadingCheckout === "pro" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Upgrade"
                      )}
                    </Button>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">Enterprise</p>
                        <p className="text-2xl font-bold">$99.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      </div>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                      <li>• Everything in Pro</li>
                      <li>• Dedicated account manager</li>
                      <li>• API access</li>
                    </ul>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleUpgrade(STRIPE_PLANS.enterprise.priceId!, "enterprise")}
                      disabled={isLoadingCheckout === "enterprise"}
                    >
                      {isLoadingCheckout === "enterprise" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Upgrade"
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  <a href="/pricing" className="text-accent hover:underline">View full pricing details</a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data including job postings and
                    applicant information.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
