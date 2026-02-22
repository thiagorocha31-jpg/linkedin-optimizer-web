"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ExperienceEntry } from "@/lib/types";

interface ExperienceCardProps {
  entry: ExperienceEntry;
  index: number;
  onChange: (updates: Partial<ExperienceEntry>) => void;
  onRemove: () => void;
}

export function ExperienceCard({
  entry,
  index,
  onChange,
  onRemove,
}: ExperienceCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Role {index + 1}
        </span>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
          Remove
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">Title</label>
          <input
            type="text"
            value={entry.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. SVP Transformation"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Company</label>
          <input
            type="text"
            value={entry.company}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="e.g. PE-Backed Lab Platform"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">
            Duration (months)
          </label>
          <input
            type="number"
            value={entry.duration_months || ""}
            onChange={(e) =>
              onChange({ duration_months: parseInt(e.target.value) || 0 })
            }
            placeholder="e.g. 18"
            min={0}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Switch
              id={`current-${index}`}
              checked={entry.is_current}
              onCheckedChange={(checked) => onChange({ is_current: checked })}
            />
            <Label htmlFor={`current-${index}`} className="text-sm">
              Current role
            </Label>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">
          Description ({entry.description.length} chars)
        </label>
        <textarea
          value={entry.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe achievements with quantified results. Use bullet points starting with action verbs (Led, Built, Drove, Spearheaded)."
          rows={5}
          className="w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}
