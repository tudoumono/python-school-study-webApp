"use client";

import Link from "next/link";
import { useProgressStore } from "@/lib/store/progressStore";
import { getLevelProgress } from "@/lib/utils/scoring";

export function AppHeader() {
  const { totalPoints, level } = useProgressStore();
  const levelProgress = getLevelProgress(totalPoints);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14">
      <div className="max-w-lg mx-auto px-4 h-full flex items-center justify-between md:max-w-2xl">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-600">🐍</span>
          <span className="text-lg font-bold text-gray-800">PyPuzzle</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-primary-600">Lv.{level}</span>
          </div>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress * 100}%` }}
            />
          </div>
          <div className="text-sm font-medium text-accent-500">
            {totalPoints}pt
          </div>
        </div>
      </div>
    </header>
  );
}
