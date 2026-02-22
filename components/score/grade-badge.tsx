"use client";

import { letterGrade, severityBadge } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface GradeBadgeProps {
  score: number;
  className?: string;
}

export function GradeBadge({ score, className }: GradeBadgeProps) {
  const grade = letterGrade(score);
  const variant =
    score >= 80 ? "positive" : score >= 60 ? "warning" : "critical";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold",
        severityBadge(variant),
        className
      )}
    >
      {grade}
    </span>
  );
}
