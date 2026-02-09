"use client";

import type { SubmissionResult } from "@/types/common";
import { CheckCircle, XCircle } from "lucide-react";
import clsx from "clsx";

interface AnswerFeedbackProps {
  result: SubmissionResult;
  explanation?: string;
}

export function AnswerFeedback({ result, explanation }: AnswerFeedbackProps) {
  return (
    <div
      className={clsx(
        "rounded-xl p-4 animate-slide-up",
        result.isCorrect
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {result.isCorrect ? (
          <CheckCircle className="text-success" size={24} />
        ) : (
          <XCircle className="text-error" size={24} />
        )}
        <span
          className={clsx(
            "font-bold text-base",
            result.isCorrect ? "text-green-700" : "text-red-700"
          )}
        >
          {result.isCorrect ? "正解！" : "もう一度！"}
        </span>
      </div>
      <p
        className={clsx(
          "text-sm",
          result.isCorrect ? "text-green-600" : "text-red-600"
        )}
      >
        {result.message}
      </p>
      {result.isCorrect && explanation && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <p className="text-xs text-gray-500 mb-1">解説:</p>
          <p className="text-sm text-gray-700">{explanation}</p>
        </div>
      )}
    </div>
  );
}
