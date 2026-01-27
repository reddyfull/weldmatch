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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Sparkles, AlertCircle } from "lucide-react";
import { GeneratedJobDescription } from "@/lib/n8n";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIJobDescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generated: GeneratedJobDescription | null;
  isLoading: boolean;
  error: string | null;
  onUseDescription: () => void;
}

export function AIJobDescriptionModal({
  open,
  onOpenChange,
  generated,
  isLoading,
  error,
  onUseDescription,
}: AIJobDescriptionModalProps) {
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-accent" />
              <Sparkles className="w-5 h-5 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">Generating Job Description</h3>
              <p className="text-muted-foreground text-sm mt-1">
                AI is crafting a professional, SEO-optimized description...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">Generation Failed</h3>
              <p className="text-muted-foreground text-sm mt-1">{error}</p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!generated) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI-Generated Job Description
          </DialogTitle>
          <DialogDescription>
            Review and use this AI-crafted job description
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 py-4">
            {/* Headline */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Headline
              </Label>
              <p className="text-lg font-semibold text-accent">{generated.headline}</p>
            </div>

            {/* Company Intro */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Company Introduction
              </Label>
              <p className="text-foreground leading-relaxed">{generated.companyIntro}</p>
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Key Responsibilities
              </Label>
              <ul className="space-y-2">
                {generated.responsibilities.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Requirements
              </Label>
              <ul className="space-y-2">
                {generated.requirements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compensation */}
            {generated.compensation && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Compensation
                </Label>
                <p className="text-foreground font-medium">{generated.compensation}</p>
              </div>
            )}

            {/* Benefits */}
            {generated.benefits && generated.benefits.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Benefits & Perks
                </Label>
                <ul className="space-y-1">
                  {generated.benefits.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-success">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Call to Action */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Call to Action
              </Label>
              <p className="text-foreground italic">{generated.callToAction}</p>
            </div>

            {/* SEO Keywords */}
            {generated.seoKeywords && generated.seoKeywords.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  SEO Keywords
                </Label>
                <div className="flex flex-wrap gap-2">
                  {generated.seoKeywords.map((keyword, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onUseDescription} variant="hero">
            <Check className="w-4 h-4 mr-2" />
            Use This Description
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
