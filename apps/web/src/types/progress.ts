import type { CategoryId, Difficulty } from "./problem";

export interface ProblemAttempt {
  problemId: string;
  status: "not-started" | "attempted" | "completed";
  attempts: number;
  usedHint: boolean;
  bestScore: number;
  firstAttemptAt: string;
  completedAt?: string;
  incorrectPatterns: string[];
  avgTimePerAttempt: number;
  hintViewCount: number;
  gaveUp: boolean;
}

export interface CategoryProgress {
  categoryId: CategoryId;
  completedCount: number;
  totalCount: number;
  totalPoints: number;
  maxPoints: number;
  isUnlocked: boolean;
}

export interface UserAnalytics {
  categoryAccuracy: Partial<Record<CategoryId, number>>;
  difficultyAccuracy: Partial<Record<Difficulty, number>>;
  weakTags: string[];
  avgAttemptsPerProblem: number;
  totalStudyTimeSeconds: number;
  lastSessionProblems: string[];
}

export interface UserProgress {
  version: number;
  totalPoints: number;
  level: number;
  problemAttempts: Record<string, ProblemAttempt>;
  categoryProgress: Record<string, CategoryProgress>;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
  };
  totalSolved: number;
  updatedAt: string;
  analytics: UserAnalytics;
}
