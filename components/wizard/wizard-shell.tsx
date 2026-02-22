"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { analyzeProfile } from "@/lib/analyzer";
import { getRole, listRoles } from "@/lib/roles";
import type {
  AnalysisReport,
  GeneratedDraft,
  GenerationContext,
  LinkedInProfile,
  TargetRole,
} from "@/lib/types";
import { EMPTY_PROFILE } from "@/lib/types";
import { StepRole } from "./step-role";
import { StepContext } from "./step-context";
import { StepReview } from "./step-review";
import { StepScore } from "./step-score";
import { StepRecommendations } from "./step-recommendations";

const STEPS = [
  { label: "Pick Role", num: 1 },
  { label: "Your Context", num: 2 },
  { label: "AI Draft", num: 3 },
  { label: "Your Score", num: 4 },
  { label: "Fix It", num: 5 },
];

const STORAGE_KEY = "linkedin-optimizer-profile";
const SNAPSHOT_KEY = "linkedin-optimizer-snapshot";

function loadProfile(): LinkedInProfile {
  if (typeof window === "undefined") return { ...EMPTY_PROFILE };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { ...EMPTY_PROFILE };
}

function saveProfile(profile: LinkedInProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {}
}

export function WizardShell() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<LinkedInProfile>(loadProfile);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [snapshot, setSnapshot] = useState<AnalysisReport | null>(null);
  const [importedFromExtension, setImportedFromExtension] = useState(false);
  const initRef = useRef(false);

  // AI generation state
  const [generationContext, setGenerationContext] = useState<GenerationContext>({
    resumeText: "",
    notes: "",
  });
  const [generatedDraft, setGeneratedDraft] = useState<GeneratedDraft | null>(null);

  // Listen for postMessage from the Chrome extension
  useEffect(() => {
    const isExtensionImport = searchParams.get("import") === "extension";
    if (!isExtensionImport) return;

    function handleMessage(event: MessageEvent) {
      if (
        event.data &&
        event.data.type === "linkedin-optimizer-import" &&
        event.data.profile
      ) {
        console.log("[LinkedIn Optimizer] Received profile via postMessage:", event.data.profile);
        const imported = { ...EMPTY_PROFILE, ...event.data.profile };
        setProfile(imported);
        setImportedFromExtension(true);
        saveProfile(imported);
        // Clean the URL
        history.replaceState(null, "", window.location.pathname);
        // Remove listener after successful import
        window.removeEventListener("message", handleMessage);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [searchParams]);

  // URL param: ?role=pe-operating-partner (non-extension case)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const roleParam = searchParams.get("role");
    if (roleParam) {
      const normalized = roleParam.replace(/-/g, " ");
      const role = getRole(normalized);
      if (role) {
        setSelectedRole(role.name);
        setStep(2);
      }
    }
  }, [searchParams]);

  // Auto-save profile to localStorage
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // Load snapshot from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SNAPSHOT_KEY);
      if (saved) setSnapshot(JSON.parse(saved));
    } catch {}
  }, []);

  const targetRole: TargetRole | undefined = useMemo(
    () => getRole(selectedRole),
    [selectedRole]
  );

  const report: AnalysisReport | null = useMemo(() => {
    if (!targetRole) return null;
    return analyzeProfile(profile, targetRole);
  }, [profile, targetRole]);

  const updateProfile = useCallback(
    (updates: Partial<LinkedInProfile>) => {
      setProfile((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Apply AI-generated draft to profile
  const applyDraft = useCallback(
    (draft: Partial<GeneratedDraft>) => {
      setProfile((prev) => {
        const updates: Partial<LinkedInProfile> = {};
        if (draft.headline !== undefined) updates.headline = draft.headline;
        if (draft.about !== undefined) updates.about = draft.about;
        if (draft.skills !== undefined) updates.skills = draft.skills;
        // experience_suggestions is text advice, not directly applied
        return { ...prev, ...updates };
      });
    },
    []
  );

  const handleRoleSelect = useCallback((roleName: string) => {
    setSelectedRole(roleName);
    setStep(2);
  }, []);

  const handleSaveSnapshot = useCallback(() => {
    if (report) {
      setSnapshot(report);
      try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(report));
      } catch {}
    }
  }, [report]);

  const handleClearSnapshot = useCallback(() => {
    setSnapshot(null);
    localStorage.removeItem(SNAPSHOT_KEY);
  }, []);

  // Check if profile has meaningful content (for "existing profile" indicator)
  const hasExistingProfile =
    profile.headline.length > 0 ||
    profile.about.length > 0 ||
    profile.experience.length > 0 ||
    profile.skills.length > 0;

  const goTo = useCallback(
    (s: number) => {
      if (s === 1) setStep(1);
      else if (s >= 2 && s <= 3 && selectedRole) setStep(s);
      else if (s >= 4 && report) setStep(s);
    },
    [selectedRole, report]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            LinkedIn Profile Optimizer
          </h1>
          <p className="text-sm text-muted-foreground">
            Score and optimize your profile for PE recruiters
          </p>
        </div>
      </header>

      {/* Step Progress */}
      <nav className="border-b bg-card/50">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              const isClickable =
                s.num === 1 ||
                (s.num >= 2 && s.num <= 3 && !!selectedRole) ||
                (s.num >= 4 && !!report);

              return (
                <div key={s.num} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={cn(
                        "h-px w-4 sm:w-8",
                        isCompleted ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                  <button
                    onClick={() => isClickable && goTo(s.num)}
                    disabled={!isClickable}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors",
                      isActive &&
                        "bg-primary text-primary-foreground",
                      isCompleted &&
                        !isActive &&
                        "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20",
                      !isActive &&
                        !isCompleted &&
                        "text-muted-foreground",
                      isClickable &&
                        !isActive &&
                        "cursor-pointer"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                        isActive && "bg-primary-foreground text-primary",
                        isCompleted && !isActive && "bg-primary text-primary-foreground",
                        !isActive && !isCompleted && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted && !isActive ? "\u2713" : s.num}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                </div>
              );
            })}
            {report && (
              <div className="ml-auto">
                <div
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-bold",
                    report.overall_score >= 80
                      ? "bg-emerald-100 text-emerald-700"
                      : report.overall_score >= 60
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  )}
                >
                  {report.overall_score}/100
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Step Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {step === 1 && (
          <StepRole
            roles={listRoles()}
            selectedRole={selectedRole}
            onSelect={handleRoleSelect}
            importedFromExtension={importedFromExtension}
            profileName={profile.name}
          />
        )}
        {step === 2 && selectedRole && (
          <StepContext
            context={generationContext}
            onChange={setGenerationContext}
            onNext={() => setStep(3)}
            onSkip={() => setStep(4)}
            onBack={() => setStep(1)}
            hasExistingProfile={hasExistingProfile}
          />
        )}
        {step === 3 && selectedRole && (
          <StepReview
            role={selectedRole}
            context={generationContext}
            currentProfile={profile}
            existingDraft={generatedDraft}
            onDraftChange={setGeneratedDraft}
            onApplyDraft={applyDraft}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && report && (
          <StepScore
            report={report}
            snapshot={snapshot}
            onSaveSnapshot={handleSaveSnapshot}
            onClearSnapshot={handleClearSnapshot}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && report && (
          <StepRecommendations
            report={report}
            onBack={() => setStep(4)}
          />
        )}
      </main>
    </div>
  );
}
