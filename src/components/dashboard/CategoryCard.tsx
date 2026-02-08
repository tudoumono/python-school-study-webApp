"use client";

import Link from "next/link";
import { Box, MessageSquare, GitBranch, Repeat, Puzzle, Lock } from "lucide-react";
import clsx from "clsx";
import type { Category } from "@/types/problem";
import type { CategoryProgress } from "@/types/progress";
import { ProgressBar } from "@/components/layout/ProgressBar";

const iconMap: Record<string, typeof Box> = {
  Box,
  MessageSquare,
  GitBranch,
  Repeat,
  Puzzle,
};

interface CategoryCardProps {
  category: Category;
  progress?: CategoryProgress;
}

export function CategoryCard({ category, progress }: CategoryCardProps) {
  const isUnlocked = progress?.isUnlocked ?? category.order === 1;
  const Icon = iconMap[category.icon] ?? Box;

  if (!isUnlocked) {
    return (
      <div className="bg-gray-100 rounded-2xl p-4 opacity-60 cursor-not-allowed">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
            <Lock size={20} className="text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-400">{category.title}</h3>
            <p className="text-xs text-gray-400">前のカテゴリをクリアして解放</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/categories/${category.id}`}>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white",
              category.color
            )}
          >
            <Icon size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{category.title}</h3>
            <p className="text-xs text-gray-500">{category.description}</p>
          </div>
        </div>
        {progress && progress.totalCount > 0 && (
          <ProgressBar
            current={progress.completedCount}
            total={progress.totalCount}
          />
        )}
      </div>
    </Link>
  );
}
