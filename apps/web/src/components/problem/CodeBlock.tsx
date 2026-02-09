"use client";

import type { CodeBlock as CodeBlockType } from "@/types/problem";
import clsx from "clsx";

const typeColors: Record<CodeBlockType["type"], string> = {
  keyword: "bg-purple-100 border-purple-300 text-purple-800",
  string: "bg-green-100 border-green-300 text-green-800",
  number: "bg-amber-100 border-amber-300 text-amber-800",
  operator: "bg-orange-100 border-orange-300 text-orange-800",
  variable: "bg-blue-100 border-blue-300 text-blue-800",
  function: "bg-yellow-100 border-yellow-300 text-yellow-800",
  punctuation: "bg-gray-200 border-gray-400 text-gray-700",
  comment: "bg-gray-100 border-gray-300 text-gray-500 italic",
};

interface CodeBlockProps {
  block: CodeBlockType;
  onClick?: () => void;
  isPlaceholder?: boolean;
  isIncorrect?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}

export function CodeBlock({
  block,
  onClick,
  isPlaceholder,
  isIncorrect,
  isCorrect,
  disabled,
}: CodeBlockProps) {
  if (isPlaceholder) {
    return (
      <div className="h-[48px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-800/50" />
    );
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={clsx(
        "font-mono text-base px-4 py-2.5 rounded-xl border-2",
        "select-none transition-all duration-150",
        "min-h-[48px] inline-flex items-center",
        "active:scale-95",
        typeColors[block.type],
        isIncorrect && "!border-error animate-shake",
        isCorrect && "!border-success",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:shadow-md",
      )}
      style={{
        marginLeft: block.indentLevel > 0 ? `${block.indentLevel * 28}px` : undefined,
      }}
      disabled={disabled}
    >
      {block.content}
    </button>
  );
}
