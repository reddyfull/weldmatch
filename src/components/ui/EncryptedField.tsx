// components/ui/EncryptedField.tsx
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Shield, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EncryptedFieldProps {
  label: string;
  value: string | null;
  maskedValue: string;
  isRevealed: boolean;
  isEncrypted: boolean;
  requiresVerification?: boolean;
  onReveal: () => Promise<boolean>;
  onHide: () => void;
  className?: string;
  allowCopy?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const EncryptedField: React.FC<EncryptedFieldProps> = ({
  label,
  value,
  maskedValue,
  isRevealed,
  isEncrypted,
  requiresVerification = false,
  onReveal,
  onHide,
  className,
  allowCopy = false,
  size = 'md',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToggleReveal = async () => {
    if (isRevealed) {
      onHide();
    } else {
      setIsLoading(true);
      try {
        await onReveal();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopy = async () => {
    if (value && isRevealed) {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClasses = {
    sm: 'text-sm py-1 px-2',
    md: 'text-base py-2 px-3',
    lg: 'text-lg py-3 px-4',
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-1", className)}>
        {/* Label with encryption indicator */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {label}
          {isEncrypted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className="h-3 w-3 text-primary" />
              </TooltipTrigger>
              <TooltipContent>
                <p>This field is encrypted for your protection</p>
              </TooltipContent>
            </Tooltip>
          )}
          {requiresVerification && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Shield className="h-3 w-3 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Requires verification to view</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Value display */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex-1 bg-muted rounded-md font-mono",
              sizeClasses[size],
              isRevealed ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {isRevealed ? value || '—' : maskedValue}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Reveal/Hide toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleReveal}
                  disabled={isLoading}
                  className="h-8 w-8"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isRevealed ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRevealed ? 'Hide' : 'Reveal'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Copy button (only when revealed) */}
            {allowCopy && isRevealed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-8 w-8"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? 'Copied!' : 'Copy'}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Auto-hide warning */}
        {isRevealed && requiresVerification && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            ⏱️ This value will auto-hide in 30 seconds
          </p>
        )}
      </div>
    </TooltipProvider>
  );
};
