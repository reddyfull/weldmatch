import { cn } from "@/lib/utils";
import { getScoreColor, getScoreBgColor } from "@/lib/ai-features";

interface ScoreCircleProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  showGrade?: boolean;
  className?: string;
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function ScoreCircle({
  score,
  label,
  size = "md",
  showGrade = false,
  className,
}: ScoreCircleProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const labelSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const grade = getGrade(score);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center border-4",
          sizeClasses[size],
          getScoreColor(score),
          score >= 90 ? "border-green-500" : 
          score >= 70 ? "border-blue-500" : 
          score >= 50 ? "border-yellow-500" : 
          score >= 30 ? "border-orange-500" : "border-red-500"
        )}
      >
        {/* Background circle progress */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${score * 2.83} 283`}
            className={cn(
              "opacity-20",
              score >= 90 ? "stroke-green-500" : 
              score >= 70 ? "stroke-blue-500" : 
              score >= 50 ? "stroke-yellow-500" : 
              score >= 30 ? "stroke-orange-500" : "stroke-red-500"
            )}
          />
        </svg>

        <div className="text-center z-10">
          <div className={cn("font-bold", textSizes[size])}>{score}</div>
          {showGrade && (
            <div className={cn("font-medium", labelSizes[size])}>
              Grade: {grade}
            </div>
          )}
        </div>
      </div>
      {label && (
        <span className={cn("mt-2 text-muted-foreground", labelSizes[size])}>
          {label}
        </span>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  variant = "default",
  className,
}: StatCardProps) {
  const variantClasses = {
    default: "bg-muted",
    success: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
    warning: "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300",
    danger: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
    info: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  };

  return (
    <div
      className={cn(
        "rounded-lg p-4 text-center",
        variantClasses[variant],
        className
      )}
    >
      {icon && <div className="flex justify-center mb-2">{icon}</div>}
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}
