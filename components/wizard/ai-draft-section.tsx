"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { GeneratedDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AiDraftSectionProps {
  section: keyof GeneratedDraft;
  label: string;
  value: string | string[];
  currentValue?: string | string[];
  accepted: boolean;
  onAccept: () => void;
  onEdit: (value: string | string[]) => void;
  onRegenerate: (section: keyof GeneratedDraft, guidance: string) => void;
  regenerating: boolean;
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
  const displayValue = Array.isArray(value) ? value.join(", ") : value;
  const charCount = Array.isArray(value)
    ? `${value.length} items`
    : `${value.length} chars`;

  const hasExisting =
    currentValue &&
    (Array.isArray(currentValue) ? currentValue.length > 0 : currentValue.length > 0);

  const startEdit = useCallback(() => {
    setEditValue(displayValue);
    setMode("edit");
  }, [displayValue]);

  const saveEdit = useCallback(() => {
    if (isSkills) {
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
  }, [editValue, isSkills, onEdit]);

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
            rows={isSkills ? 4 : section === "about" ? 12 : section === "experience_suggestions" ? 10 : 3}
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
              placeholder="e.g., Make it shorter, emphasize AI more, add my Bain background..."
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
            {isSkills && Array.isArray(value) ? (
              <div className="flex flex-wrap gap-1.5">
                {value.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : section === "experience_suggestions" ? (
              <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">
                {displayValue}
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
                  {isSkills && Array.isArray(currentValue) ? (
                    <div className="flex flex-wrap gap-1">
                      {currentValue.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs opacity-60">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                      {Array.isArray(currentValue)
                        ? currentValue.join(", ")
                        : currentValue}
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
