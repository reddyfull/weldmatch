import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MapPin,
  DollarSign,
  Briefcase,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  Building,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface ExternalJobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    company_logo: string | null;
    location: string | null;
    salary_display: string | null;
    employment_type: string | null;
    posted_at: string | null;
    apply_link: string;
    source: string | null;
    description_snippet: string | null;
    match_score?: number | null;
    match_reason?: string | null;
    missing_skills?: string[] | null;
    status?: string;
  };
  isLoggedIn: boolean;
  onSave: () => void;
  onApplyClick: () => void;
  onMarkApplied: (notes?: string) => void;
}

function MatchScoreBadge({ score }: { score: number }) {
  const getScoreConfig = (score: number) => {
    if (score >= 85) {
      return {
        label: 'Excellent Match',
        className: 'bg-green-500 text-white',
        ringColor: 'ring-green-500/20',
      };
    }
    if (score >= 70) {
      return {
        label: 'Good Match',
        className: 'bg-blue-500 text-white',
        ringColor: 'ring-blue-500/20',
      };
    }
    if (score >= 50) {
      return {
        label: 'Fair Match',
        className: 'bg-yellow-500 text-white',
        ringColor: 'ring-yellow-500/20',
      };
    }
    return {
      label: 'Low Match',
      className: 'bg-muted text-muted-foreground',
      ringColor: 'ring-muted/20',
    };
  };

  const config = getScoreConfig(score);

  return (
    <div className={`${config.className} rounded-full w-12 h-12 flex items-center justify-center font-bold text-sm ring-4 ${config.ringColor}`}>
      {score}%
    </div>
  );
}

export function ExternalJobCard({ 
  job, 
  isLoggedIn,
  onSave, 
  onApplyClick, 
  onMarkApplied 
}: ExternalJobCardProps) {
  const [showAppliedModal, setShowAppliedModal] = useState(false);
  const [notes, setNotes] = useState('');

  const statusColors: Record<string, string> = {
    new: 'bg-muted text-muted-foreground',
    saved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    clicked_apply: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    applied: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    not_interested: 'bg-muted text-muted-foreground',
  };

  const isSaved = job.status === 'saved';
  const isApplied = job.status === 'applied';
  const hasMissingSkills = job.missing_skills && job.missing_skills.length > 0;

  const handleApplyButtonClick = () => {
    onApplyClick();
    if (isLoggedIn) {
      setShowAppliedModal(true);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={job.company}
                  className="w-10 h-10 rounded-lg object-contain bg-muted flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Building className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground line-clamp-2">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.company}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {/* Match Score Badge */}
              {job.match_score != null && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <MatchScoreBadge score={job.match_score} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Match Score
                      </p>
                      {job.match_reason && (
                        <p className="text-sm">{job.match_reason}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Status Badge */}
              {job.status && job.status !== 'new' && (
                <Badge className={statusColors[job.status] || statusColors.new}>
                  {job.status.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Match Reason (shown inline if no tooltip) */}
          {job.match_reason && !job.match_score && (
            <p className="text-xs text-primary bg-primary/5 p-2 rounded-md">
              💡 {job.match_reason}
            </p>
          )}

          {/* Missing Skills Alert */}
          {hasMissingSkills && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-2 rounded-md cursor-help">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Skills to develop: {job.missing_skills!.slice(0, 2).join(', ')}{job.missing_skills!.length > 2 ? ` +${job.missing_skills!.length - 2} more` : ''}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">Skills needed for this job:</p>
                  <ul className="text-sm list-disc pl-4">
                    {job.missing_skills!.map((skill, i) => (
                      <li key={i}>{skill}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Job Details */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            {job.salary_display && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {job.salary_display}
              </span>
            )}
            {job.employment_type && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {job.employment_type.replace('_', '-')}
              </span>
            )}
          </div>

          {/* Description Snippet */}
          {job.description_snippet && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {job.description_snippet}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-3">
              {/* Match Score in Footer */}
              {job.match_score != null && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold cursor-help ${
                      job.match_score >= 85 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      job.match_score >= 70 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      job.match_score >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <Sparkles className="h-3 w-3" />
                      {job.match_score}% Match
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">AI Match Score</p>
                      {job.match_reason && (
                        <p className="text-sm">{job.match_reason}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>via {job.source || 'External'}</span>
                {job.posted_at && (
                  <>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLoggedIn && !isApplied && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSave}
                  className={isSaved ? 'text-blue-600' : ''}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              )}

              {isApplied ? (
                <Button size="sm" variant="secondary" disabled>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Applied
                </Button>
              ) : (
                <Button size="sm" onClick={handleApplyButtonClick}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applied Confirmation Modal */}
      <Dialog open={showAppliedModal} onOpenChange={setShowAppliedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Did you apply to this job?</DialogTitle>
            <DialogDescription>
              Track your application by marking it as applied. This helps you keep track of your job search progress.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (optional): resume version, questions answered, contact name..."
              className="h-24"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAppliedModal(false)}>
              Not Yet
            </Button>
            <Button
              onClick={() => {
                onMarkApplied(notes);
                setShowAppliedModal(false);
                setNotes('');
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Yes, I Applied
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
