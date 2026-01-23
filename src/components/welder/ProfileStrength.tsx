import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Award,
  FileText,
  RefreshCw,
  Zap,
  Target,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, useWelderProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { 
  optimizeProfile, 
  ProfileOptimizationResult,
  getProfileStrengthBadge 
} from '@/lib/weldmatch-ai';

interface ProfileStrengthProps {
  compact?: boolean;
}

export function ProfileStrength({ compact = false }: ProfileStrengthProps) {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const { data: welderProfile } = useWelderProfile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStored, setIsLoadingStored] = useState(true);
  const [result, setResult] = useState<ProfileOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [hasStoredResult, setHasStoredResult] = useState(false);

  // Fetch certifications
  useEffect(() => {
    async function fetchCerts() {
      if (!welderProfile?.id) return;
      const { data } = await supabase
        .from('certifications')
        .select('cert_type, cert_number, verification_status, issue_date, expiry_date')
        .eq('welder_id', welderProfile.id);
      setCertifications(data || []);
    }
    fetchCerts();
  }, [welderProfile?.id]);

  // Load stored profile optimization result from career_coach_results
  useEffect(() => {
    async function loadStoredResult() {
      if (!welderProfile?.id) {
        setIsLoadingStored(false);
        return;
      }
      
      try {
        // Using any cast since types haven't been regenerated yet
        const { data, error } = await (supabase
          .from('career_coach_results' as any) as any)
          .select('result_data, updated_at')
          .eq('welder_id', welderProfile.id)
          .single();

        if (data && !error && data.result_data) {
          // We have stored career coach data - extract profile strength info
          setHasStoredResult(true);
          // For now, just mark that we have stored data so we don't auto-regenerate
          // The ProfileStrength uses a different endpoint than CareerCoach
        }
      } catch (err) {
        console.log('No stored results found');
      } finally {
        setIsLoadingStored(false);
      }
    }
    loadStoredResult();
  }, [welderProfile?.id]);

  const analyzeProfile = useCallback(async () => {
    if (!user?.id || !profile || !welderProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await optimizeProfile({
        welderId: user.id,
        profile: {
          full_name: profile.full_name || '',
          email: user.email || '',
          phone: profile.phone,
          city: welderProfile.city,
          state: welderProfile.state,
          years_experience: welderProfile.years_experience || 0,
          bio: welderProfile.bio,
          weld_processes: welderProfile.weld_processes || [],
          weld_positions: welderProfile.weld_positions || []
        },
        certifications: certifications.map(c => ({
          cert_type: c.cert_type,
          cert_number: c.cert_number,
          status: c.verification_status,
          issue_date: c.issue_date,
          expiry_date: c.expiry_date
        })),
        workHistory: [] // TODO: Add work history when available
      });

      setResult(response);
    } catch (err) {
      console.error('Profile optimization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze profile');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, welderProfile, certifications]);

  // Don't auto-analyze - only analyze when user clicks the button
  // This prevents unnecessary API calls on every page load

  const getStrengthBadge = (strength: string) => {
    const colors = {
      weak: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      moderate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      strong: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      excellent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };
    return colors[strength as keyof typeof colors] || colors.moderate;
  };

  if (isLoadingStored) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !result) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Analyzing your profile with AI...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Profile Strength
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={analyzeProfile} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show fallback when no AI result yet
  if (!result) {
    const localScore = welderProfile?.profile_completion || 0;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Profile Strength
          </CardTitle>
          <CardDescription>Complete your profile to get AI-powered recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * localScore) / 100}
                  className="text-primary transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{localScore}%</span>
              </div>
            </div>
          </div>
          <Button onClick={analyzeProfile} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { analysis, completenessScore } = result;

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={150.8}
                    strokeDashoffset={150.8 - (150.8 * analysis.overallScore) / 100}
                    className={`${getProfileStrengthBadge(analysis.profileStrength).classes} transition-all duration-500`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{analysis.overallScore}%</span>
                </div>
              </div>
              <div>
                <Badge className={getStrengthBadge(analysis.profileStrength)}>
                  {analysis.profileStrength.toUpperCase()}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {analysis.topPriority}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/welder/profile/edit">
                Improve
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5 border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Profile Strength
            </CardTitle>
            <CardDescription className="mt-1">
              AI-powered analysis of your career profile
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={analyzeProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Score Circle + Summary */}
        <div className="flex items-start gap-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * analysis.overallScore) / 100}
                className={`${getProfileStrengthBadge(analysis.profileStrength).classes} transition-all duration-500`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{analysis.overallScore}%</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={getStrengthBadge(analysis.profileStrength)}>
                {analysis.profileStrength.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {analysis.summary}
            </p>
            {analysis.estimatedJobMatches && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>
                  {analysis.estimatedJobMatches.current} matches now →{' '}
                  <span className="font-medium text-green-600">
                    {analysis.estimatedJobMatches.afterImprovements} after improvements
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top Priority */}
        {analysis.topPriority && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Top Priority</p>
              <p className="text-sm text-muted-foreground">{analysis.topPriority}</p>
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {analysis.criticalImprovements?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Quick Wins
            </h4>
            <div className="space-y-2">
              {analysis.criticalImprovements.slice(0, 3).map((improvement, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      improvement.impact === 'high' ? 'text-orange-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{improvement.action}</p>
                      <p className="text-xs text-muted-foreground">{improvement.reason}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    improvement.impact === 'high' 
                      ? 'text-orange-600 border-orange-200' 
                      : 'text-yellow-600 border-yellow-200'
                  }>
                    {improvement.impact === 'high' ? '+15 pts' : '+10 pts'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expandable Sections */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              View Full Analysis
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Certification Advice */}
            {analysis.certificationAdvice && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-500" />
                  Certification Recommendations
                </h4>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm">{analysis.certificationAdvice.reason}</p>
                  {analysis.certificationAdvice.recommendedCerts?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analysis.certificationAdvice.recommendedCerts.map((cert, i) => (
                        <Badge key={i} variant="secondary">{cert}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills Advice */}
            {analysis.skillsAdvice && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Skills Analysis
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {analysis.skillsAdvice.strongSkills?.length > 0 && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">Strong Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.skillsAdvice.strongSkills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-green-300">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.skillsAdvice.inDemandSkills?.length > 0 && (
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-2">In-Demand Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.skillsAdvice.inDemandSkills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-yellow-300">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bio Suggestion */}
            {analysis.bioSuggestion && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Bio Suggestion
                </h4>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm italic">"{analysis.bioSuggestion}"</p>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1">
            <Link to="/welder/profile/edit">
              <Sparkles className="h-4 w-4 mr-2" />
              Improve My Profile
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/welder/career-coach">
              Career Coach
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
