"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { ExperienceEntry, GeneratedDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

type SectionValue = string | string[] | ExperienceEntry[];

interface AiDraftSectionProps {
  section: keyof GeneratedDraft;
  label: string;
  value: SectionValue;
  currentValue?: SectionValue;
  accepted: boolean;
  onAccept: () => void;
  onEdit: (value: SectionValue) => void;
  onRegenerate: (section: keyof GeneratedDraft, guidance: string) => void;
  regenerating: boolean;
}

function isExperienceArray(val: SectionValue): val is ExperienceEntry[] {
  return (
    Array.isArray(val) &&
    val.length > 0 &&
    typeof val[0] === "object" &&
    "title" in val[0]
  );
}

export function AiDraftSection({
  section,
  label,
  value,
  currentValue,
  accepted,
  onAccept,
  onEdit,
  onRegenerate,
  regenerating,
}: AiDraftSectionProps) {
  const [mode, setMode] = useState<"view" | "edit" | "regen">("view");
  const [editValue, setEditValue] = useState("");
  const [regenGuidance, setRegenGuidance] = useState("");

  const isSkills = section === "skills";
  const isExperience = section === "experience";

  const displayValue = isExperience
    ? ""
    : Array.isArray(value)
      ? (value as string[]).join(", ")
      : (value as string);

  const charCount = isExperience
    ? `${(value as ExperienceEntry[]).length} entries`
    : Array.isArray(value)
      ? `${value.length} items`
      : `${(value as string).length} chars`;

  const hasExisting =
    currentValue !== undefined &&
    (Array.isArray(currentValue) ? currentValue.length > 0 : typeof currentValue === "string" ? currentValue.length > 0 : false);

  const startEdit = useCallback(() => {
    if (isExperience) {
      setEditValue(JSON.stringify(value, null, 2));
    } else {
      setEditValue(displayValue);
    }
    setMode("edit");
  }, [displayValue, isExperience, value]);

  const saveEdit = useCallback(() => {
    if (isExperience) {
      try {
        const parsed = JSON.parse(editValue);
        onEdit(parsed);
      } catch {
        return; // Don't save invalid JSON
      }
    } else if (isSkills) {
      onEdit(
        editValue
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    } else {
      onEdit(editValue);
    }
    setMode("view");
  }, [editValue, isSkills, isExperience, onEdit]);

  const submitRegen = useCallback(() => {
    if (regenGuidance.trim()) {
      onRegenerate(section, regenGuidance.trim());
      setRegenGuidance("");
      setMode("view");
    }
  }, [regenGuidance, onRegenerate, section]);

  return (
    <Card
      className={cn(
        "transition-all",
        accepted && "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/50"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{label}</CardTitle>
            <span className="text-xs text-muted-foreground">{charCount}</span>
            {accepted && (
              <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">
                Accepted
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {mode === "view" && (
              <>
                {!accepted && (
                  <Button size="sm" onClick={onAccept}>
                    Accept
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={startEdit}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode("regen")}
                  disabled={regenerating}
                >
                  {regenerating ? "..." : "Regen"}
                </Button>
              </>
            )}
            {mode === "edit" && (
              <>
                <Button size="sm" onClick={saveEdit}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode("view")}
                >
                  Cancel
                </Button>
              </>
            )}
            {mode === "regen" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("view")}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Edit mode */}
        {mode === "edit" && (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={isExperience ? 16 : isSkills ? 4 : section === "about" ? 12 : 3}
            className="font-mono text-sm"
          />
        )}

        {/* Regenerate mode */}
        {mode === "regen" && (
          <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm font-medium">
              What should change in this section?
            </p>
            <Textarea
              value={regenGuidance}
              onChange={(e) => setRegenGuidance(e.target.value)}
              placeholder={
                isExperience
                  ? "e.g., Add more quantified metrics, emphasize PE transformation experience..."
                  : "e.g., Make it shorter, emphasize AI more, add my Bain background..."
              }
              rows={2}
              autoFocus
            />
            <Button
              size="sm"
              onClick={submitRegen}
              disabled={!regenGuidance.trim() || regenerating}
            >
              {regenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        )}

        {/* Display mode */}
        {mode === "view" && (
          <>
            {isExperience && isExperienceArray(value) ? (
              <div className="space-y-3">
                {(value as ExperienceEntry[]).map((entry, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {entry.title}
                      </p>
                      {entry.is_current && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.company} &middot; {entry.duration_months} months
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {entry.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : isSkills && Array.isArray(value) ? (
              <div className="flex flex-wrap gap-1.5">
                {(value as string[]).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {displayValue}
              </p>
            )}

            {/* Before/after comparison */}
            {hasExisting && !accepted && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Compare with current
                </summary>
                <div className="mt-2 rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Current:
                  </p>
                  {isExperience && isExperienceArray(currentValue!) ? (
                    <div className="space-y-2">
                      {(currentValue as ExperienceEntry[]).map((entry, i) => (
                        <div key={i} className="text-xs text-muted-foreground">
                          <span className="font-medium">{entry.title}</span> at {entry.company} ({entry.duration_months}mo)
                        </div>
                      ))}
                    </div>
                  ) : isSkills && Array.isArray(currentValue) ? (
                    <div className="flex flex-wrap gap-1">
                      {(currentValue as string[]).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs opacity-60">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                      {Array.isArray(currentValue)
                        ? (currentValue as string[]).join(", ")
                        : (currentValue as string)}
                    </p>
                  )}
                </div>
              </details>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
