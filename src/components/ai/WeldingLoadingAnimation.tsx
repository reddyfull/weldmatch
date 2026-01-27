import { Flame, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeldingLoadingAnimationProps {
  message?: string;
  variant?: "default" | "spark" | "flame";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function WeldingLoadingAnimation({
  message = "AI is analyzing...",
  variant = "default",
  size = "md",
  className,
}: WeldingLoadingAnimationProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Outer glow ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-accent/20 animate-ping",
            sizeClasses[size]
          )}
        />
        
        {/* Main icon container */}
        <div
          className={cn(
            "relative rounded-full bg-accent flex items-center justify-center shadow-lg animate-pulse",
            sizeClasses[size]
          )}
        >
          {variant === "spark" ? (
            <Sparkles className={cn("text-white animate-spin", iconSizes[size])} />
          ) : variant === "flame" ? (
            <Flame className={cn("text-white", iconSizes[size])} />
          ) : (
            <Loader2 className={cn("text-white animate-spin", iconSizes[size])} />
          )}
        </div>

        {/* Welding sparks effect */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
        <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce delay-100" />
        <div className="absolute top-1/2 -right-2 w-1 h-1 bg-yellow-300 rounded-full animate-bounce delay-200" />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">This may take a moment...</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100" />
        <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-200" />
      </div>
    </div>
  );
}

export function WeldingLoadingOverlay({
  message,
  variant,
}: Pick<WeldingLoadingAnimationProps, "message" | "variant">) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
        <WeldingLoadingAnimation message={message} variant={variant} size="lg" />
      </div>
    </div>
  );
}
