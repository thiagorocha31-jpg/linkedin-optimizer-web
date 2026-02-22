"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalysisReport, Finding } from "@/lib/types";
import { severityBadge, severityIcon } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface StepRecommendationsProps {
  report: AnalysisReport;
  onBack: () => void;
}

export function StepRecommendations({
  report,
  onBack,
}: StepRecommendationsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fix It</h2>
          <p className="text-sm text-muted-foreground">
            Prioritized recommendations to improve your score
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          &larr; Edit Profile
        </Button>
      </div>

      {/* Top recommendations */}
      {report.top_recommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">
              Top {report.top_recommendations.length} Priorities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {report.top_recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {i + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Section-by-section findings */}
      {report.sections.map((section) => {
        const actionable = section.findings.filter(
          (f) => f.severity !== "positive"
        );
        const positive = section.findings.filter(
          (f) => f.severity === "positive"
        );

        return (
          <Card key={section.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{section.name}</CardTitle>
                <span
                  className={cn(
                    "text-sm font-bold",
                    section.score >= 80
                      ? "text-emerald-500"
                      : section.score >= 60
                        ? "text-amber-500"
                        : "text-red-500"
                  )}
                >
                  {section.score}/100
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {actionable.length === 0 && (
                <p className="text-sm text-emerald-600">
                  All good! No issues found.
                </p>
              )}
              {actionable.map((finding, i) => (
                <FindingRow key={i} finding={finding} />
              ))}
              {positive.length > 0 && (
                <div className="mt-2 border-t pt-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    What&apos;s working:
                  </p>
                  {positive.map((finding, i) => (
                    <p
                      key={i}
                      className="text-xs text-emerald-600"
                    >
                      {severityIcon("positive")} {finding.message}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (finding.fix) {
      navigator.clipboard.writeText(finding.fix).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [finding.fix]);

  return (
    <div className="flex items-start gap-3 rounded-md bg-muted/50 p-3">
      <Badge
        variant="outline"
        className={cn("shrink-0 text-xs", severityBadge(finding.severity))}
      >
        {finding.severity}
      </Badge>
      <div className="flex-1 space-y-1">
        <p className="text-sm">{finding.message}</p>
        {finding.fix && (
          <div className="flex items-start gap-2">
            <p className="text-xs text-muted-foreground">
              Fix: {finding.fix}
            </p>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded px-1.5 py-0.5 text-xs text-primary hover:bg-primary/10 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
