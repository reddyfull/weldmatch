import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useSaveJobTemplate } from "@/hooks/useJobTemplates";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  jobTitle?: string;
  metadata?: Record<string, unknown>;
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  description,
  jobTitle,
  metadata,
}: SaveTemplateDialogProps) {
  const [templateName, setTemplateName] = useState(
    jobTitle ? `${jobTitle} Template` : ""
  );
  const saveTemplate = useSaveJobTemplate();

  const handleSave = () => {
    if (!templateName.trim()) return;

    saveTemplate.mutate(
      {
        name: templateName.trim(),
        description,
        jobTitle,
        metadata,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTemplateName("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-accent" />
            Save as Template
          </DialogTitle>
          <DialogDescription>
            Save this job description as a reusable template for future job postings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Senior Pipe Welder Template"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && templateName.trim()) {
                  handleSave();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!templateName.trim() || saveTemplate.isPending}
          >
            {saveTemplate.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
