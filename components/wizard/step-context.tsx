"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { GenerationContext } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StepContextProps {
  context: GenerationContext;
  onChange: (ctx: GenerationContext) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  hasExistingProfile: boolean;
}

export function StepContext({
  context,
  onChange,
  onNext,
  onSkip,
  onBack,
  hasExistingProfile,
}: StepContextProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are supported");
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to parse resume");
        }

        const data = await res.json();
        setFileName(file.name);
        onChange({ ...context, resumeText: data.text });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [context, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const canProceed = context.resumeText.length > 0 || context.notes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Context</h2>
          <p className="text-sm text-muted-foreground">
            Give the AI context to generate optimized profile content.
            Upload your resume and/or describe your background.
          </p>
        </div>
      </div>

      {hasExistingProfile && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Your existing profile data will also be used as context for generation.
          </p>
        </div>
      )}

      {/* Resume Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume (PDF)</CardTitle>
          <CardDescription>
            Upload your resume so the AI can reference your actual experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            className="hidden"
          />

          {context.resumeText ? (
            <div className="flex items-center gap-3 rounded-lg border bg-emerald-50 p-4 dark:bg-emerald-950">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{fileName || "Resume uploaded"}</p>
                <p className="text-xs text-muted-foreground">
                  {context.resumeText.length.toLocaleString()} characters extracted
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange({ ...context, resumeText: "" });
                  setFileName(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50",
                uploading && "pointer-events-none opacity-50"
              )}
            >
              {uploading ? (
                <>
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
                  <p className="text-sm text-muted-foreground">
                    Extracting text from PDF...
                  </p>
                </>
              ) : (
                <>
                  <svg
                    className="h-8 w-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm font-medium">
                    Drop your resume PDF here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF only, max 10MB. Text is extracted, file is not stored.
                  </p>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Context</CardTitle>
          <CardDescription>
            Add anything the AI should know: specific achievements, target companies,
            positioning preferences, or what makes you unique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={context.notes}
            onChange={(e) =>
              onChange({ ...context, notes: e.target.value })
            }
            placeholder={`Examples:\n- Led $50M cost transformation across 12 sites\n- Want to emphasize AI/digital transformation angle\n- Targeting PE firms focused on industrial services\n- Include Bain & Company and Wharton MBA credentials`}
            rows={6}
            className="resize-y"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {context.notes.length > 0
              ? `${context.notes.length} characters`
              : "Optional but helps produce more personalized content"}
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          &larr; Change Role
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
          >
            Skip AI &rarr;
          </Button>
          <Button onClick={onNext} size="lg" disabled={!canProceed}>
            Generate with AI &rarr;
          </Button>
        </div>
      </div>

      {!canProceed && (
        <p className="text-center text-sm text-muted-foreground">
          Upload a resume or add context to continue
        </p>
      )}
    </div>
  );
}
