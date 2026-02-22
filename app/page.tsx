import { Suspense } from "react";
import { WizardShell } from "@/components/wizard/wizard-shell";

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <WizardShell />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading optimizer...</p>
      </div>
    </div>
  );
}
