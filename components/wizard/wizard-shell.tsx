"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { analyzeProfile } from "@/lib/analyzer";
import { getRole, listRoles } from "@/lib/roles";
import type {
  AnalysisReport,
  LinkedInProfile,
  TargetRole,
} from "@/lib/types";
import { EMPTY_PROFILE } from "@/lib/types";
import { StepRole } from "./step-role";
import { StepProfile } from "./step-profile";
import { StepScore } from "./step-score";
import { StepRecommendations } from "./step-recommendations";

const STEPS = [
  { label: "Pick Role", num: 1 },
  { label: "Your Profile", num: 2 },
  { label: "Your Score", num: 3 },
  { label: "Fix It", num: 4 },
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
  const initRef = useRef(false);

  // URL param: ?role=pe-operating-partner
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

  const goTo = useCallback(
    (s: number) => {
      if (s === 1 || (s >= 2 && selectedRole) || (s >= 3 && report)) {
        setStep(s);
      }
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
                (s.num === 2 && !!selectedRole) ||
                (s.num >= 3 && !!report);

              return (
                <div key={s.num} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={cn(
                        "h-px w-6 sm:w-10",
                        isCompleted ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                  <button
                    onClick={() => isClickable && goTo(s.num)}
                    disabled={!isClickable}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
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
          />
        )}
        {step === 2 && targetRole && (
          <StepProfile
            profile={profile}
            targetRole={targetRole}
            report={report}
            onChange={updateProfile}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && report && (
          <StepScore
            report={report}
            snapshot={snapshot}
            onSaveSnapshot={handleSaveSnapshot}
            onClearSnapshot={handleClearSnapshot}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && report && (
          <StepRecommendations
            report={report}
            onBack={() => setStep(2)}
          />
        )}
      </main>
    </div>
  );
}
