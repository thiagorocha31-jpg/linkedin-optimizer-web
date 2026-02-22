"use client";

import type { KeywordCoverage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface KeywordMapProps {
  coverage: KeywordCoverage;
}

export function KeywordMap({ coverage }: KeywordMapProps) {
  return (
    <div className="space-y-4">
      <TierSection
        label="Tier 1 (Must-Have)"
        found={coverage.tier1_found}
        missing={coverage.tier1_missing}
      />
      <TierSection
        label="Tier 2 (Should-Have)"
        found={coverage.tier2_found}
        missing={coverage.tier2_missing}
      />
      <TierSection
        label="Tier 3 (Nice-to-Have)"
        found={coverage.tier3_found}
        missing={coverage.tier3_missing}
      />
    </div>
  );
}

function TierSection({
  label,
  found,
  missing,
}: {
  label: string;
  found: string[];
  missing: string[];
}) {
  const total = found.length + missing.length;
  if (total === 0) return null;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {found.length}/{total}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {found.map((kw) => (
          <span
            key={kw}
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            )}
          >
            {kw}
          </span>
        ))}
        {missing.map((kw) => (
          <span
            key={kw}
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
            )}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}
