"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HeadlineInput } from "@/components/profile-form/headline-input";
import { AboutInput } from "@/components/profile-form/about-input";
import { ExperienceCard } from "@/components/profile-form/experience-card";
import { SkillsInput } from "@/components/profile-form/skills-input";
import { SettingsPanel } from "@/components/profile-form/settings-panel";
import { ScoreGauge } from "@/components/score/score-gauge";
import type {
  AnalysisReport,
  ExperienceEntry,
  LinkedInProfile,
  TargetRole,
} from "@/lib/types";

interface StepProfileProps {
  profile: LinkedInProfile;
  targetRole: TargetRole;
  report: AnalysisReport | null;
  onChange: (updates: Partial<LinkedInProfile>) => void;
  onNext: () => void;
}

export function StepProfile({
  profile,
  targetRole,
  report,
  onChange,
  onNext,
}: StepProfileProps) {
  const [showExamples, setShowExamples] = useState(false);

  const handleAddExperience = useCallback(() => {
    onChange({
      experience: [
        ...profile.experience,
        {
          title: "",
          company: "",
          duration_months: 0,
          description: "",
          is_current: false,
        },
      ],
    });
  }, [profile.experience, onChange]);

  const handleUpdateExperience = useCallback(
    (index: number, updates: Partial<ExperienceEntry>) => {
      const next = [...profile.experience];
      next[index] = { ...next[index], ...updates };
      onChange({ experience: next });
    },
    [profile.experience, onChange]
  );

  const handleRemoveExperience = useCallback(
    (index: number) => {
      onChange({
        experience: profile.experience.filter((_, i) => i !== index),
      });
    },
    [profile.experience, onChange]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
      {/* Main form */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Profile</h2>
            <p className="text-sm text-muted-foreground">
              Fill in your current LinkedIn content. Score updates live as you type.
            </p>
          </div>
          <Button onClick={onNext} size="lg">
            See Full Score &rarr;
          </Button>
        </div>

        {/* Name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Name</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Your full name"
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>

        {/* Headline */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Headline</CardTitle>
              {targetRole.headline_examples.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExamples(!showExamples)}
                >
                  {showExamples ? "Hide" : "Show"} examples
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <HeadlineInput
              value={profile.headline}
              onChange={(v) => onChange({ headline: v })}
            />
            {showExamples && targetRole.headline_examples.length > 0 && (
              <div className="space-y-2 rounded-md bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Example headlines for {targetRole.name}:
                </p>
                {targetRole.headline_examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => onChange({ headline: ex })}
                    className="block w-full rounded-md bg-background p-2 text-left text-xs hover:bg-accent transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <AboutInput
              value={profile.about}
              onChange={(v) => onChange({ about: v })}
            />
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Experience ({profile.experience.length} roles)
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleAddExperience}>
                + Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.experience.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No experience entries yet. Add your roles to get scored.
              </p>
            )}
            {profile.experience.map((exp, i) => (
              <div key={i}>
                {i > 0 && <Separator className="mb-4" />}
                <ExperienceCard
                  entry={exp}
                  index={i}
                  onChange={(updates) => handleUpdateExperience(i, updates)}
                  onRemove={() => handleRemoveExperience(i)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Skills ({profile.skills.length}/50)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkillsInput
              skills={profile.skills}
              recommendedSkills={targetRole.recommended_skills}
              onChange={(skills) => onChange({ skills })}
            />
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Education</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={profile.education.join(", ")}
              onChange={(e) =>
                onChange({
                  education: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="e.g. MBA, Wharton School; BS, MIT"
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Separate multiple entries with commas
            </p>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile Settings & Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsPanel profile={profile} onChange={onChange} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onNext} size="lg">
            See Full Score &rarr;
          </Button>
        </div>
      </div>

      {/* Sticky score sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-8">
          {report ? (
            <div className="flex flex-col items-center gap-2">
              <ScoreGauge score={report.overall_score} size={140} />
              <p className="text-xs text-muted-foreground text-center">
                Live score
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="flex h-[140px] w-[140px] items-center justify-center rounded-full border-4 border-dashed">
                <span className="text-2xl font-bold">?</span>
              </div>
              <p className="text-xs text-center">Fill in your profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
