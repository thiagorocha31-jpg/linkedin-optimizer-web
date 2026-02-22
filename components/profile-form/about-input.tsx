"use client";

import { cn } from "@/lib/utils";

const MAX_CHARS = 2600;

interface AboutInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function AboutInput({ value, onChange }: AboutInputProps) {
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
        placeholder="Write your About section here. Open with a bold positioning statement, include quantified results, and weave in target keywords naturally."
        rows={10}
        className="w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed"
      />
      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            "font-medium transition-colors",
            len >= 1500
              ? "text-emerald-500"
              : len >= 500
                ? "text-amber-500"
                : "text-muted-foreground"
          )}
        >
          {len.toLocaleString()}/{MAX_CHARS.toLocaleString()} characters
        </span>
        {len < 1500 && len > 0 && (
          <span className="text-muted-foreground">
            {len < 500
              ? `Need ${500 - len} more chars minimum`
              : `${1500 - len} more for optimal`}
          </span>
        )}
      </div>
    </div>
  );
}
