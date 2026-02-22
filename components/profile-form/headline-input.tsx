"use client";

import { cn } from "@/lib/utils";

const MAX_CHARS = 220;

interface HeadlineInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function HeadlineInput({ value, onChange }: HeadlineInputProps) {
  const len = value.length;
  const pct = len / MAX_CHARS;

  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= MAX_CHARS) {
            onChange(e.target.value);
          }
        }}
        placeholder="e.g. PE Value Creation: 2x EBITDA (10mo) | Bain | Wharton"
        rows={2}
        className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm"
      />
      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            "font-medium transition-colors",
            pct >= 0.7
              ? "text-emerald-500"
              : pct >= 0.5
                ? "text-amber-500"
                : "text-muted-foreground"
          )}
        >
          {len}/{MAX_CHARS} characters
        </span>
        {pct < 0.7 && len > 0 && (
          <span className="text-muted-foreground">
            Use {Math.round((0.7 - pct) * MAX_CHARS)} more chars for optimal length
          </span>
        )}
      </div>
    </div>
  );
}
