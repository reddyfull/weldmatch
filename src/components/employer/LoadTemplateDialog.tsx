import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, Trash2, Clock } from "lucide-react";
import { useJobTemplates, useDeleteJobTemplate, JobTemplate } from "@/hooks/useJobTemplates";
import { formatDistanceToNow } from "date-fns";

interface LoadTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: JobTemplate) => void;
}

export function LoadTemplateDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: LoadTemplateDialogProps) {
  const { data: templates, isLoading } = useJobTemplates();
  const deleteTemplate = useDeleteJobTemplate();

  const handleSelect = (template: JobTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  const handleDelete = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    deleteTemplate.mutate(templateId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            Load Template
          </DialogTitle>
          <DialogDescription>
            Select a saved template to use for this job posting.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !templates || templates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No templates saved yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generate a job description with AI and save it as a template.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4 -mr-4">
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="group flex items-start gap-3 p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 cursor-pointer transition-colors"
                  onClick={() => handleSelect(template)}
                >
                  <FileText className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {template.name}
                    </h4>
                    {template.job_title && (
                      <p className="text-sm text-muted-foreground truncate">
                        {template.job_title}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        Updated {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => handleDelete(e, template.id)}
                    disabled={deleteTemplate.isPending}
                  >
                    {deleteTemplate.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
