"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { problemService } from "@/lib/services/problemService";
import { useProgressStore } from "@/lib/store/progressStore";
import { pickWeakProblems } from "@/lib/utils/randomPicker";
import type { Problem } from "@/types/problem";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Shuffle, ArrowLeft } from "lucide-react";

const RANDOM_COUNT = 5;

export default function RandomPage() {
  const router = useRouter();
  const progress = useProgressStore();
  const [loading, setLoading] = useState(true);
  const [selectedProblems, setSelectedProblems] = useState<Problem[]>([]);

  useEffect(() => {
    problemService
      .getAllProblems()
      .then((allProblems) => {
        const picked = pickWeakProblems(allProblems, progress, RANDOM_COUNT);
        setSelectedProblems(picked);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    if (selectedProblems.length === 0) return;
    const ids = selectedProblems.map((p) => p.id).join(",");
    router.push(`/random/0?problems=${ids}`);
  };

  if (loading) {
    return (
      <div className="py-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">ニガテ問題に挑戦</h1>
      </div>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Shuffle className="text-orange-500" size={22} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">ランダム問題集</h2>
            <p className="text-sm text-gray-500">
              苦手な傾向から{RANDOM_COUNT}問を選出
            </p>
          </div>
        </div>

        {selectedProblems.length > 0 ? (
          <>
            <div className="space-y-2 mb-4">
              {selectedProblems.map((problem, i) => (
                <div
                  key={problem.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {problem.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {problem.categoryId} / {problem.difficulty}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleStart} className="w-full" size="lg">
              挑戦スタート！
            </Button>
          </>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">
            問題データが見つかりませんでした
          </p>
        )}
      </Card>
    </div>
  );
}
