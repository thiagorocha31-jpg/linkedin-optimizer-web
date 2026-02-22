"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreGauge } from "@/components/score/score-gauge";
import { SectionBar } from "@/components/score/section-bar";
import { KeywordMap } from "@/components/score/keyword-map";
import { GradeBadge } from "@/components/score/grade-badge";
import type { AnalysisReport } from "@/lib/types";
import { gradeColor } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface StepScoreProps {
  report: AnalysisReport;
  snapshot: AnalysisReport | null;
  onSaveSnapshot: () => void;
  onClearSnapshot: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepScore({
  report,
  snapshot,
  onSaveSnapshot,
  onClearSnapshot,
  onNext,
  onBack,
}: StepScoreProps) {
  const delta = snapshot
    ? report.overall_score - snapshot.overall_score
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Score</h2>
          <p className="text-sm text-muted-foreground">
            {report.profile_name || "Profile"} &middot; Target: {report.target_role}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            &larr; Edit Profile
          </Button>
          <Button onClick={onNext}>See Recommendations &rarr;</Button>
        </div>
      </div>

      {/* Score gauge + snapshot */}
      <div className="flex flex-col items-center gap-4">
        <ScoreGauge score={report.overall_score} size={200} />
        {delta !== undefined && delta !== 0 && (
          <div
            className={cn(
              "text-lg font-bold",
              delta > 0 ? "text-emerald-500" : "text-red-500"
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta} from snapshot
          </div>
        )}
        <div className="flex gap-2">
          {!snapshot ? (
            <Button variant="outline" size="sm" onClick={onSaveSnapshot}>
              Save Snapshot
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onSaveSnapshot}>
                Update Snapshot
              </Button>
              <Button variant="ghost" size="sm" onClick={onClearSnapshot}>
                Clear Snapshot
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Section breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.sections.map((section) => {
            const snapshotSection = snapshot?.sections.find(
              (s) => s.name === section.name
            );
            return (
              <SectionBar
                key={section.name}
                section={section}
                snapshotScore={snapshotSection?.score}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Keyword coverage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Keyword Coverage</CardTitle>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-bold",
                  gradeColor(report.keyword_coverage.coverage_pct)
                )}
              >
                {report.keyword_coverage.coverage_pct}%
              </span>
              <GradeBadge score={report.keyword_coverage.coverage_pct} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <KeywordMap coverage={report.keyword_coverage} />
        </CardContent>
      </Card>
    </div>
  );
}
