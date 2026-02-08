"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { problemService } from "@/lib/services/problemService";
import { useProgressStore } from "@/lib/store/progressStore";
import { categories } from "@/data/categories";
import type { Problem, CategoryId } from "@/types/problem";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { CheckCircle, Circle, ArrowLeft } from "lucide-react";
import clsx from "clsx";

export default function CategoryProblemsPage() {
  const params = useParams();
  const categoryId = params.categoryId as CategoryId;
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const { problemAttempts, categoryProgress } = useProgressStore();

  const category = categories.find((c) => c.id === categoryId);
  const progress = categoryProgress[categoryId];

  useEffect(() => {
    problemService
      .getProblemsByCategory(categoryId)
      .then(setProblems)
      .catch(() => setProblems([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) {
    return (
      <div className="py-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <Link
        href="/categories"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} />
        カテゴリ一覧
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-800">
          {category?.title ?? categoryId}
        </h1>
        {progress && progress.totalCount > 0 && (
          <ProgressBar
            current={progress.completedCount}
            total={progress.totalCount}
            className="mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        {problems.map((problem, index) => {
          const attempt = problemAttempts[problem.id];
          const isCompleted = attempt?.status === "completed";

          return (
            <Link
              key={problem.id}
              href={`/categories/${categoryId}/${problem.id}`}
            >
              <Card
                className={clsx(
                  "flex items-center gap-3 active:scale-[0.98] transition-transform",
                  isCompleted && "bg-green-50 border-green-100"
                )}
                padding="sm"
              >
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isCompleted
                      ? "bg-success text-white"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle size={18} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm truncate">
                      {problem.title}
                    </span>
                    <Badge difficulty={problem.difficulty} />
                  </div>
                  {attempt && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {attempt.attempts}回挑戦
                      </span>
                      {isCompleted && (
                        <span className="text-xs text-success font-medium">
                          +{attempt.bestScore}pt
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Circle size={16} className="text-gray-300" />
              </Card>
            </Link>
          );
        })}
      </div>

      {problems.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>問題データを読み込めませんでした。</p>
          <p className="text-sm mt-1">
            スプレッドシートの設定を確認してください。
          </p>
        </div>
      )}
    </div>
  );
}
