"use client";

import { Lightbulb } from "lucide-react";

interface HintDisplayProps {
  hints: string[];
  currentIndex: number;
}

export function HintDisplay({ hints, currentIndex }: HintDisplayProps) {
  if (hints.length === 0) return null;

  const visibleHints = hints.slice(0, currentIndex + 1);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="text-amber-500" size={18} />
        <span className="text-sm font-semibold text-amber-700">ヒント</span>
      </div>
      <div className="space-y-2">
        {visibleHints.map((hint, i) => (
          <p key={i} className="text-sm text-amber-800">
            {hint}
          </p>
        ))}
      </div>
    </div>
  );
}
