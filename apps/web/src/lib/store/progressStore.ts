"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProgress, ProblemAttempt, UserAnalytics } from "@/types/progress";
import type { CategoryId, Problem } from "@/types/problem";
import {
  postAttemptLearningEvent,
  type AttemptLearningEventPayload,
} from "@/lib/services/learningEventService";
import { calculateLevel } from "@/lib/utils/scoring";
import { categories as defaultCategories } from "@/data/categories";

function createInitialProgress(): UserProgress {
  const categoryProgress: UserProgress["categoryProgress"] = {};
  for (const cat of defaultCategories) {
    categoryProgress[cat.id] = {
      categoryId: cat.id,
      completedCount: 0,
      totalCount: 0,
      totalPoints: 0,
      maxPoints: 0,
      isUnlocked: cat.order === 1,
    };
  }

  return {
    version: 1,
    totalPoints: 0,
    level: 1,
    problemAttempts: {},
    categoryProgress,
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: "",
    },
    totalSolved: 0,
    updatedAt: new Date().toISOString(),
    analytics: {
      categoryAccuracy: {},
      difficultyAccuracy: {},
      weakTags: [],
      avgAttemptsPerProblem: 0,
      totalStudyTimeSeconds: 0,
      lastSessionProblems: [],
    },
  };
}

interface ProgressActions {
  recordAttempt: (
    problem: Problem,
    isCorrect: boolean,
    points: number,
    usedHint: boolean,
    timeSpent: number,
    incorrectPattern?: string
  ) => void;
  markGaveUp: (problemId: string) => void;
  isCategoryUnlocked: (categoryId: CategoryId) => boolean;
  getNextUnsolvedProblem: (
    categoryId: CategoryId,
    problems: Problem[]
  ) => string | null;
  updateCategoryTotals: (categoryId: CategoryId, totalCount: number, maxPoints: number) => void;
  setCategoryOrder: (order: CategoryId[]) => void;
  resetProgress: () => void;
}

// カテゴリの表示順（動的に更新される）
let categoryOrder: CategoryId[] = defaultCategories
  .sort((a, b) => a.order - b.order)
  .map((c) => c.id);

type ProgressStore = UserProgress & ProgressActions;

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...createInitialProgress(),

      recordAttempt: (problem, isCorrect, points, usedHint, timeSpent, incorrectPattern) => {
        let eventPayload: AttemptLearningEventPayload | null = null;

        set((state) => {
          const existing = state.problemAttempts[problem.id];
          const nextAttemptNo = existing ? existing.attempts + 1 : 1;
          const now = new Date().toISOString();
          const today = now.slice(0, 10);

          // ProblemAttempt更新
          const attempt: ProblemAttempt = existing
            ? {
                ...existing,
                attempts: nextAttemptNo,
                usedHint: existing.usedHint || usedHint,
                bestScore: Math.max(existing.bestScore, points),
                completedAt: isCorrect ? now : existing.completedAt,
                status: isCorrect ? "completed" : "attempted",
                incorrectPatterns: incorrectPattern
                  ? [...existing.incorrectPatterns, incorrectPattern]
                  : existing.incorrectPatterns,
                avgTimePerAttempt:
                  (existing.avgTimePerAttempt * existing.attempts + timeSpent) /
                  nextAttemptNo,
                hintViewCount: usedHint
                  ? existing.hintViewCount + 1
                  : existing.hintViewCount,
              }
            : {
                problemId: problem.id,
                status: isCorrect ? "completed" : "attempted",
                attempts: nextAttemptNo,
                usedHint,
                bestScore: points,
                firstAttemptAt: now,
                completedAt: isCorrect ? now : undefined,
                incorrectPatterns: incorrectPattern ? [incorrectPattern] : [],
                avgTimePerAttempt: timeSpent,
                hintViewCount: usedHint ? 1 : 0,
                gaveUp: false,
              };

          const newAttempts = {
            ...state.problemAttempts,
            [problem.id]: attempt,
          };

          // 新規完了かチェック
          const wasCompleted = existing?.status === "completed";
          const newlyCompleted = isCorrect && !wasCompleted;

          // totalPoints, totalSolved更新
          const newTotalPoints = newlyCompleted
            ? state.totalPoints + points
            : state.totalPoints;
          const newTotalSolved = newlyCompleted
            ? state.totalSolved + 1
            : state.totalSolved;

          // カテゴリ進捗更新
          const catProgress = { ...state.categoryProgress };
          if (newlyCompleted && catProgress[problem.categoryId]) {
            const cp = { ...catProgress[problem.categoryId] };
            cp.completedCount += 1;
            cp.totalPoints += points;
            catProgress[problem.categoryId] = cp;
          }

          // カテゴリアンロック判定
          for (let i = 1; i < categoryOrder.length; i++) {
            const prevCatId = categoryOrder[i - 1];
            const currentCatId = categoryOrder[i];
            const prev = catProgress[prevCatId];
            if (prev && prev.totalCount > 0 && prev.completedCount >= Math.ceil(prev.totalCount * 0.5)) {
              if (catProgress[currentCatId]) {
                catProgress[currentCatId] = {
                  ...catProgress[currentCatId],
                  isUnlocked: true,
                };
              }
            }
          }

          // ストリーク更新
          const streak = { ...state.streak };
          if (streak.lastActivityDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);
            if (streak.lastActivityDate === yesterdayStr) {
              streak.currentStreak += 1;
            } else if (streak.lastActivityDate !== today) {
              streak.currentStreak = 1;
            }
            streak.longestStreak = Math.max(
              streak.longestStreak,
              streak.currentStreak
            );
            streak.lastActivityDate = today;
          }

          // アナリティクス再計算
          const analytics = recalculateAnalytics(newAttempts, problem);

          eventPayload = {
            problemId: problem.id,
            categoryId: problem.categoryId,
            isCorrect,
            points,
            usedHint,
            timeSpentSec: timeSpent,
            attemptNo: nextAttemptNo,
            incorrectPattern,
          };

          return {
            problemAttempts: newAttempts,
            totalPoints: newTotalPoints,
            totalSolved: newTotalSolved,
            level: calculateLevel(newTotalPoints),
            categoryProgress: catProgress,
            streak,
            updatedAt: now,
            analytics: {
              ...analytics,
              totalStudyTimeSeconds:
                state.analytics.totalStudyTimeSeconds + timeSpent,
              lastSessionProblems: [
                problem.id,
                ...state.analytics.lastSessionProblems.filter(
                  (id) => id !== problem.id
                ),
              ].slice(0, 20),
            },
          };
        });

        if (eventPayload) {
          void postAttemptLearningEvent(eventPayload).catch((error) => {
            console.error("Failed to send learning event:", error);
          });
        }
      },

      markGaveUp: (problemId) => {
        set((state) => {
          const existing = state.problemAttempts[problemId];
          if (!existing) return state;
          return {
            problemAttempts: {
              ...state.problemAttempts,
              [problemId]: { ...existing, gaveUp: true },
            },
          };
        });
      },

      isCategoryUnlocked: (categoryId) => {
        const state = get();
        const cp = state.categoryProgress[categoryId];
        return cp?.isUnlocked ?? false;
      },

      getNextUnsolvedProblem: (categoryId, problems) => {
        const state = get();
        const catProblems = problems
          .filter((p) => p.categoryId === categoryId)
          .sort((a, b) => a.order - b.order);

        for (const p of catProblems) {
          const attempt = state.problemAttempts[p.id];
          if (!attempt || attempt.status !== "completed") {
            return p.id;
          }
        }
        return null;
      },

      updateCategoryTotals: (categoryId, totalCount, maxPoints) => {
        set((state) => {
          const existing = state.categoryProgress[categoryId];
          const cp = existing || {
            categoryId,
            completedCount: 0,
            totalCount: 0,
            totalPoints: 0,
            maxPoints: 0,
            isUnlocked: categoryOrder[0] === categoryId,
          };
          return {
            categoryProgress: {
              ...state.categoryProgress,
              [categoryId]: { ...cp, totalCount, maxPoints },
            },
          };
        });
      },

      setCategoryOrder: (order) => {
        categoryOrder = order;
      },

      resetProgress: () => {
        set(createInitialProgress());
      },
    }),
    {
      name: "pypuzzle-progress",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

function recalculateAnalytics(
  attempts: Record<string, ProblemAttempt>,
  _currentProblem: Problem
): Omit<UserAnalytics, "totalStudyTimeSeconds" | "lastSessionProblems"> {
  const entries = Object.values(attempts);
  if (entries.length === 0) {
    return {
      categoryAccuracy: {},
      difficultyAccuracy: {},
      weakTags: [],
      avgAttemptsPerProblem: 0,
    };
  }

  const totalAttempts = entries.reduce((sum, a) => sum + a.attempts, 0);
  const avgAttemptsPerProblem = totalAttempts / entries.length;

  return {
    categoryAccuracy: {},
    difficultyAccuracy: {},
    weakTags: [],
    avgAttemptsPerProblem,
  };
}
