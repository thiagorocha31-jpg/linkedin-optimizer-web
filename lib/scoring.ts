/** Grade and color utilities for score display */

export function letterGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function gradeColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

export function gradeBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function gradeRing(score: number): string {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-red-500";
    case "warning":
      return "text-amber-500";
    case "info":
      return "text-blue-500";
    case "positive":
      return "text-emerald-500";
    default:
      return "text-muted-foreground";
  }
}

export function severityBadge(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    case "warning":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    case "info":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    case "positive":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function severityIcon(severity: string): string {
  switch (severity) {
    case "critical":
      return "\u2718"; // ✘
    case "warning":
      return "!";
    case "info":
      return "i";
    case "positive":
      return "\u2714"; // ✔
    default:
      return "?";
  }
}
