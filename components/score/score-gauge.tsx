"use client";

import { useEffect, useState } from "react";
import { letterGrade, gradeRing } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  className?: string;
}

export function ScoreGauge({ score, size = 200, className }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate score from current to target
    const duration = 600;
    const start = animatedScore;
    const diff = score - start;
    const startTime = performance.now();

    function animate(time: number) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    // Only animate when score changes, not when animatedScore changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = animatedScore / 100;
  const dashOffset = circumference * (1 - progress);
  const grade = letterGrade(animatedScore);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn("transition-colors duration-500", gradeRing(animatedScore))}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-bold leading-none",
            size >= 180 ? "text-4xl" : size >= 120 ? "text-2xl" : "text-xl"
          )}
        >
          {animatedScore}
        </span>
        <span
          className={cn(
            "font-semibold text-muted-foreground",
            size >= 180 ? "text-lg" : "text-sm"
          )}
        >
          {grade}
        </span>
      </div>
    </div>
  );
}
