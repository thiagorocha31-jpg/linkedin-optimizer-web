"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TargetRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StepRoleProps {
  roles: TargetRole[];
  selectedRole: string;
  onSelect: (roleName: string) => void;
  importedFromExtension?: boolean;
  profileName?: string;
}

const ROLE_ICONS: Record<string, string> = {
  "PE Operating Partner": "\u{1F3AF}",
  "Portfolio Company CEO/COO": "\u{1F3E2}",
  "VP Transformation": "\u{1F680}",
  "Chief of Staff": "\u{2699}",
  Custom: "\u{1F527}",
};

export function StepRole({ roles, selectedRole, onSelect, importedFromExtension, profileName }: StepRoleProps) {
  return (
    <div className="space-y-6">
      {importedFromExtension && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Profile imported{profileName ? ` for ${profileName}` : ""} from LinkedIn.
            Now pick a target role to see your score.
          </p>
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold">What role are you targeting?</h2>
        <p className="mt-1 text-muted-foreground">
          We&apos;ll score your profile against the keywords PE recruiters and
          executive search firms actually use.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card
            key={role.name}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
              selectedRole === role.name && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => onSelect(role.name)}
          >
            <CardHeader>
              <div className="text-3xl mb-2">
                {ROLE_ICONS[role.name] || "\u{1F4BC}"}
              </div>
              <CardTitle className="text-lg">{role.name}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
              {role.tier1_keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {role.tier1_keywords.slice(0, 4).map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {kw}
                    </span>
                  ))}
                  {role.tier1_keywords.length > 4 && (
                    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      +{role.tier1_keywords.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
