import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Clock,
  DollarSign,
  TrendingUp,
  Lightbulb,
  Bookmark,
  Loader2,
  Target,
  Sparkles,
  Award
} from 'lucide-react';
import { 
  analyzeSkillsGap, 
  SkillsGapResult,
  getMatchCategoryColor,
  getGapSeverityColor
} from '@/lib/careerAI';

interface SkillsGapModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobData: {
    processes: string[];
    positions: string[];
    certifications: string[];
    experienceMin: number;
    location: string;
    salaryMin: number | null;
    salaryMax: number | null;
    description: string | null;
  };
  welderData: {
    id: string;
    name: string;
    experience: number;
    processes: string[];
    positions: string[];
    certifications: string[];
    location: string;
  };
  onApply?: () => void;
  onSaveJob?: () => void;
  currentMatchScore?: number;
}

export function SkillsGapModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  jobData,
  welderData,
  onApply,
  onSaveJob,
  currentMatchScore
}: SkillsGapModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SkillsGapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStrategy, setShowStrategy] = useState(false);
  const [showImprovement, setShowImprovement] = useState(false);

  useEffect(() => {
    if (isOpen && !result && !isLoading) {
      analyzeGaps();
    }
  }, [isOpen]);

  async function analyzeGaps() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await analyzeSkillsGap({
        welderId: welderData.id,
        jobId,
        welderName: welderData.name,
        welderExperience: welderData.experience,
        welderProcesses: welderData.processes,
        welderPositions: welderData.positions,
        welderCertifications: welderData.certifications,
        welderLocation: welderData.location,
        jobTitle,
        companyName,
        jobProcesses: jobData.processes,
        jobPositions: jobData.positions,
        jobCertifications: jobData.certifications,
        jobExperienceMin: jobData.experienceMin,
        jobLocation: jobData.location,
        jobSalaryMin: jobData.salaryMin,
        jobSalaryMax: jobData.salaryMax,
        jobDescription: jobData.description
      });

      setResult(response);
    } catch (err) {
      console.error('Skills gap analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze skills');
    } finally {
      setIsLoading(false);
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMatchScoreBackground = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-600';
    if (score >= 75) return 'from-blue-500 to-blue-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    if (score >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">{jobTitle}</DialogTitle>
          <DialogDescription>{companyName}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Analyzing your fit for this role...</span>
                </div>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <XCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={analyzeGaps} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : result ? (
              <>
                {/* Match Score Header */}
                <div className={`rounded-xl p-4 bg-gradient-to-r ${getMatchScoreBackground(result.matchScore)} text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Your Match Score</p>
                      <p className="text-4xl font-bold">{result.matchScore}%</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-white/20 text-white border-0 text-sm">
                        {result.matchCategory.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-sm mt-2 opacity-90">
                        {result.canApply ? 'Recommended to apply' : 'Consider improving first'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm opacity-90">{result.summary}</p>
                </div>

                {/* Qualified Areas */}
                {result.qualifiedAreas?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Where You Qualify
                    </h3>
                    <div className="space-y-2">
                      {result.qualifiedAreas.map((area, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{area.requirement}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-muted-foreground">{area.welderHas}</span>
                            <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
                              {area.status === 'exceeds' ? 'Exceeds' : 'Meets'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Gaps */}
                {result.gaps?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Skill Gaps
                    </h3>
                    <div className="space-y-3">
                      {result.gaps.map((gap, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            gap.gapSeverity === 'critical' 
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : gap.gapSeverity === 'moderate'
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-muted/50 border-muted'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {gap.gapSeverity === 'critical' ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : gap.gapSeverity === 'moderate' ? (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <Target className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium">{gap.requirement}</span>
                            </div>
                            <Badge className={getGapSeverityColor(gap.gapSeverity)}>
                              {gap.importance.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Current: {gap.currentLevel}
                          </p>
                          <div className="p-2 rounded bg-background/50">
                            <p className="text-sm font-medium">How to close:</p>
                            <p className="text-sm text-muted-foreground">{gap.howToClose}</p>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {gap.timeToAchieve}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {gap.estimatedCost}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Strategy */}
                {result.applicationStrategy && (
                  <Collapsible open={showStrategy} onOpenChange={setShowStrategy}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          Application Strategy
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showStrategy ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-2">
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium mb-2">
                          Confidence: {result.applicationStrategy.confidence.toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                          {result.applicationStrategy.approachAdvice}
                        </p>
                        
                        {result.applicationStrategy.highlightInResume?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                              Highlight in Resume:
                            </p>
                            <ul className="text-sm space-y-1">
                              {result.applicationStrategy.highlightInResume.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.applicationStrategy.addressInCoverLetter?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                              Address in Cover Letter:
                            </p>
                            <ul className="text-sm space-y-1">
                              {result.applicationStrategy.addressInCoverLetter.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Sparkles className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.applicationStrategy.prepareForInterview?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                              Prepare for Interview:
                            </p>
                            <ul className="text-sm space-y-1">
                              {result.applicationStrategy.prepareForInterview.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Award className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Improvement Path */}
                {result.improvementPath && (
                  <Collapsible open={showImprovement} onOpenChange={setShowImprovement}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Improvement Path
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showImprovement ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-2">
                      {result.improvementPath.quickWins?.length > 0 && (
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
                            Quick Wins
                          </p>
                          <ul className="text-sm space-y-1">
                            {result.improvementPath.quickWins.map((item, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.improvementPath.shortTerm?.length > 0 && (
                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-2">
                            Short-Term Goals
                          </p>
                          <ul className="text-sm space-y-2">
                            {result.improvementPath.shortTerm.map((item, i) => (
                              <li key={i} className="flex items-start justify-between">
                                <span>{item.action}</span>
                                <Badge variant="outline" className="text-xs">{item.timeline}</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.improvementPath.longTerm?.length > 0 && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                            Long-Term Goals
                          </p>
                          <ul className="text-sm space-y-2">
                            {result.improvementPath.longTerm.map((item, i) => (
                              <li key={i} className="flex items-start justify-between">
                                <span>{item.action}</span>
                                <Badge variant="outline" className="text-xs">{item.timeline}</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/welder/career-coach">
                          Get Full Career Coaching
                          <Sparkles className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            ) : null}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/30 flex gap-3">
          {result?.applicationStrategy?.shouldApply !== false ? (
            <Button className="flex-1" onClick={onApply}>
              Apply Now - {result?.matchScore || currentMatchScore}% Match
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/welder/profile/edit">
                <TrendingUp className="h-4 w-4 mr-2" />
                Improve First
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={onSaveJob}>
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
