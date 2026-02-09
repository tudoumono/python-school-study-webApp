import clsx from "clsx";
import type { Difficulty } from "@/types/problem";

const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
  beginner: { label: "入門", className: "bg-green-100 text-green-700" },
  easy: { label: "かんたん", className: "bg-blue-100 text-blue-700" },
  medium: { label: "ふつう", className: "bg-orange-100 text-orange-700" },
  hard: { label: "むずかしい", className: "bg-red-100 text-red-700" },
};

interface BadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export function Badge({ difficulty, className }: BadgeProps) {
  const config = difficultyConfig[difficulty];
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
