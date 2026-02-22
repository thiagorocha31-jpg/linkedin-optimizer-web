"use client";

import { letterGrade, gradeBg, gradeColor } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { SectionScore } from "@/lib/types";

interface SectionBarProps {
  section: SectionScore;
  snapshotScore?: number;
}

export function SectionBar({ section, snapshotScore }: SectionBarProps) {
  const delta = snapshotScore !== undefined ? section.score - snapshotScore : undefined;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{section.name}</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-bold", gradeColor(section.score))}>
            {section.score} ({letterGrade(section.score)})
          </span>
          {delta !== undefined && delta !== 0 && (
            <span
              className={cn(
                "text-xs font-medium",
                delta > 0 ? "text-emerald-500" : "text-red-500"
              )}
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
          )}
        </div>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
            gradeBg(section.score)
          )}
          style={{ width: `${section.score}%` }}
        />
        {snapshotScore !== undefined && (
          <div
            className="absolute inset-y-0 w-0.5 bg-foreground/30"
            style={{ left: `${snapshotScore}%` }}
          />
        )}
      </div>
    </div>
  );
}
