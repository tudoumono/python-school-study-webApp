"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Database, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import type { Problem, Category } from "@/types/problem";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import type { CategoriesResponse } from "@/app/api/categories/route";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProblems = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const url = refresh ? "/api/problems?refresh=true" : "/api/problems";
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const { data } = await res.json();
      setProblems(data as Problem[]);
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProblems();
    // カテゴリラベルを取得
    fetch("/api/categories")
      .then((r) => r.json())
      .then((res: CategoriesResponse) => {
        const labels: Record<string, string> = {};
        for (const cat of res.data) {
          labels[cat.id] = cat.title;
        }
        setCategoryLabels(labels);
      })
      .catch(() => {});
  }, [fetchProblems]);

  const categoryCounts = problems.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoryId] = (acc[p.categoryId] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="py-4 space-y-4">
      <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "問題一覧" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">問題一覧</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <FileSpreadsheet size={14} />
            Google Sheets から取得
          </p>
        </div>
        <button
          onClick={() => fetchProblems(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium active:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "更新中..." : "再取得"}
        </button>
      </div>

      {lastFetched && (
        <p className="text-xs text-gray-400">
          最終取得: {lastFetched.toLocaleTimeString("ja-JP")}
        </p>
      )}

      {error && (
        <Card className="bg-red-50 border-red-200">
          <p className="text-sm text-red-600">エラー: {error}</p>
        </Card>
      )}

      {/* サマリー */}
      {!isLoading && (
        <Card padding="sm">
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">
              合計 {problems.length} 問
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryCounts).map(([catId, count]) => (
              <span
                key={catId}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {categoryLabels[catId] || catId}: {count}問
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* 問題リスト */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {problems.map((problem) => (
            <Link
              key={problem.id}
              href={`/categories/${problem.categoryId}/${problem.id}`}
            >
              <Card
                padding="sm"
                className="active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">
                        {problem.id}
                      </span>
                      <Badge difficulty={problem.difficulty} />
                      <span className="text-xs text-gray-400">
                        {problem.blockMode === "token" ? "トークン" : "行"}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                      {problem.title}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {problem.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-amber-600">
                      {problem.points}pt
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {categoryLabels[problem.categoryId] || problem.categoryId}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  {problem.correctOrder.length > 0 && (
                    <span className="text-xs text-gray-400">
                      ブロック: {problem.correctOrder.length}
                      {problem.distractors && problem.distractors.length > 0
                        ? ` + ダミー${problem.distractors.length}`
                        : ""}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
