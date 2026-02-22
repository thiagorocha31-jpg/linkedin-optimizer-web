"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GenerationProgress } from "./generation-progress";
import { AiDraftSection } from "./ai-draft-section";
import type {
  ExperienceEntry,
  GeneratedDraft,
  GenerationContext,
  LinkedInProfile,
} from "@/lib/types";

interface StepReviewProps {
  role: string;
  context: GenerationContext;
  currentProfile: LinkedInProfile;
  existingDraft: GeneratedDraft | null;
  onDraftChange: (draft: GeneratedDraft | null) => void;
  onApplyDraft: (draft: Partial<GeneratedDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SECTION_CONFIG: {
  key: keyof GeneratedDraft;
  label: string;
  profileKey?: keyof LinkedInProfile;
}[] = [
  { key: "headline", label: "Headline", profileKey: "headline" },
  { key: "about", label: "About Section", profileKey: "about" },
  { key: "experience", label: "Experience", profileKey: "experience" },
  { key: "skills", label: "Skills (50)", profileKey: "skills" },
];

export function StepReview({
  role,
  context,
  currentProfile,
  existingDraft,
  onDraftChange,
  onApplyDraft,
  onNext,
  onBack,
}: StepReviewProps) {
  const [draft, setDraftLocal] = useState<GeneratedDraft | null>(existingDraft);
  const [streamedText, setStreamedText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(
    null
  );
  const generatedRef = useRef(!!existingDraft);

  // Sync draft changes up to parent for persistence across navigation
  const setDraft = useCallback(
    (value: GeneratedDraft | null | ((prev: GeneratedDraft | null) => GeneratedDraft | null)) => {
      setDraftLocal((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        onDraftChange(next);
        return next;
      });
    },
    [onDraftChange]
  );

  // Generate on mount
  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setStreamedText("");
    setDraft(null);
    setAccepted({});

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          context,
          currentProfile,
        }),
      });

      if (!res.ok) {
        throw new Error("Generation request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          try {
            const event = JSON.parse(data);

            if (event.type === "chunk") {
              accumulated += event.text;
              setStreamedText(accumulated);
            } else if (event.type === "complete") {
              setDraft(event.draft);
            } else if (event.type === "error") {
              setError(event.error);
            }
          } catch {
            // Ignore malformed events
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [role, context, currentProfile]);

  useEffect(() => {
    if (!generatedRef.current) {
      generatedRef.current = true;
      generate();
    }
  }, [generate]);

  // Accept a single section
  const handleAccept = useCallback(
    (key: keyof GeneratedDraft) => {
      if (!draft) return;
      setAccepted((prev) => ({ ...prev, [key]: true }));
      // Apply just this section
      onApplyDraft({ [key]: draft[key] });
    },
    [draft, onApplyDraft]
  );

  // Edit a section in the draft
  const handleEdit = useCallback(
    (key: keyof GeneratedDraft, value: string | string[] | ExperienceEntry[]) => {
      if (!draft) return;
      setDraft({ ...draft, [key]: value });
      // If it was accepted, re-apply the edited version
      if (accepted[key]) {
        onApplyDraft({ [key]: value });
      }
    },
    [draft, accepted, onApplyDraft]
  );

  // Regenerate a single section
  const handleRegenerate = useCallback(
    async (section: keyof GeneratedDraft, guidance: string) => {
      if (!draft) return;
      setRegeneratingSection(section);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            context,
            currentProfile,
            regenerate: {
              section,
              guidance,
              currentValue: draft[section],
            },
          }),
        });

        if (!res.ok) throw new Error("Regeneration failed");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "complete" && event.draft) {
                const newValue = event.draft[section];
                if (newValue !== undefined) {
                  setDraft((prev) =>
                    prev ? { ...prev, [section]: newValue } : prev
                  );
                  // If previously accepted, update the applied value
                  if (accepted[section]) {
                    onApplyDraft({ [section]: newValue });
                  }
                }
              }
            } catch {
              // Ignore
            }
          }
        }
      } catch (err) {
        console.error("Regen error:", err);
      } finally {
        setRegeneratingSection(null);
      }
    },
    [draft, role, context, currentProfile, accepted, onApplyDraft]
  );

  // Accept all sections and advance
  const handleAcceptAll = useCallback(() => {
    if (!draft) return;

    const allAccepted: Record<string, boolean> = {};
    const fullDraft: Partial<GeneratedDraft> = {};

    for (const { key } of SECTION_CONFIG) {
      allAccepted[key] = true;
      (fullDraft as Record<string, unknown>)[key] = draft[key];
    }

    setAccepted(allAccepted);
    onApplyDraft(fullDraft);
    onNext();
  }, [draft, onApplyDraft, onNext]);

  const isComplete = !generating && draft !== null;
  const allAccepted = SECTION_CONFIG.every((s) => accepted[s.key]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI-Generated Draft</h2>
          <p className="text-sm text-muted-foreground">
            Review each section. Accept, edit, or regenerate with guidance.
          </p>
        </div>
        {isComplete && (
          <Button size="lg" onClick={handleAcceptAll}>
            Accept All & Score &rarr;
          </Button>
        )}
      </div>

      {/* Progress indicator during generation */}
      {(generating || error) && (
        <GenerationProgress
          streamedText={streamedText}
          isComplete={isComplete}
          error={error}
        />
      )}

      {/* Error retry */}
      {error && (
        <div className="flex justify-center">
          <Button onClick={generate} variant="outline">
            Retry Generation
          </Button>
        </div>
      )}

      {/* Draft sections */}
      {draft && (
        <div className="space-y-4">
          {SECTION_CONFIG.map(({ key, label, profileKey }) => (
            <AiDraftSection
              key={key}
              section={key}
              label={label}
              value={draft[key]}
              currentValue={
                profileKey
                  ? (currentProfile[profileKey] as string | string[])
                  : undefined
              }
              accepted={!!accepted[key]}
              onAccept={() => handleAccept(key)}
              onEdit={(val) =>
                handleEdit(key, val)
              }
              onRegenerate={handleRegenerate}
              regenerating={regeneratingSection === key}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          &larr; Back
        </Button>
        {isComplete && (
          <div className="flex items-center gap-3">
            {allAccepted ? (
              <Button onClick={onNext} size="lg">
                See Score &rarr;
              </Button>
            ) : (
              <Button onClick={handleAcceptAll} size="lg">
                Accept All & Score &rarr;
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
