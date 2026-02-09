import type { UserProgress } from "@/types/progress";

export function exportAnalyticsAsJson(progress: UserProgress): string {
  const exportData = {
    exportDate: new Date().toISOString(),
    totalPoints: progress.totalPoints,
    level: progress.level,
    totalSolved: progress.totalSolved,
    streak: progress.streak,
    analytics: progress.analytics,
    problemAttempts: progress.problemAttempts,
  };
  return JSON.stringify(exportData, null, 2);
}

export function downloadAnalytics(progress: UserProgress): void {
  const json = exportAnalyticsAsJson(progress);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pypuzzle-analytics-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
