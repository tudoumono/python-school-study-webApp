"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { problemService } from "@/lib/services/problemService";
import { useProblemStore } from "@/lib/store/problemStore";
import { useProgressStore } from "@/lib/store/progressStore";
import type { Problem, CategoryId } from "@/types/problem";
import { ProblemDisplay } from "@/components/problem/ProblemDisplay";
import { CodeBlockArea } from "@/components/problem/CodeBlockArea";
import { AnswerFeedback } from "@/components/feedback/AnswerFeedback";
import { HintDisplay } from "@/components/feedback/HintDisplay";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, Lightbulb, RotateCcw } from "lucide-react";

export default function ProblemPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as CategoryId;
  const problemId = params.problemId as string;

  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    currentProblem,
    answerBlocks,
    poolBlocks,
    submissionResult,
    attemptCount,
    isHintVisible,
    currentHintIndex,
    startTime,
    loadProblem,
    selectBlock,
    removeBlock,
    reorderBlocks,
    submitAnswer,
    showHint,
    reset,
  } = useProblemStore();

  const { recordAttempt } = useProgressStore();

  useEffect(() => {
    problemService
      .getProblemsByCategory(categoryId)
      .then((problems) => {
        setAllProblems(problems);
        const problem = problems.find((p) => p.id === problemId);
        if (problem) loadProblem(problem);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, problemId]);

  const handleSubmit = useCallback(() => {
    const result = submitAnswer();
    if (currentProblem && startTime) {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const incorrectPattern = !result.isCorrect
        ? answerBlocks.map((b) => b.id).join(",")
        : undefined;
      recordAttempt(
        currentProblem,
        result.isCorrect,
        result.pointsEarned,
        isHintVisible,
        timeSpent,
        incorrectPattern
      );
    }
  }, [submitAnswer, currentProblem, startTime, answerBlocks, isHintVisible, recordAttempt]);

  const currentIndex = allProblems.findIndex((p) => p.id === problemId);
  const nextProblem = allProblems[currentIndex + 1];
  const prevProblem = allProblems[currentIndex - 1];

  const handleNext = () => {
    if (nextProblem) {
      router.push(`/categories/${categoryId}/${nextProblem.id}`);
    } else {
      router.push(`/categories/${categoryId}`);
    }
  };

  if (loading) {
    return (
      <div className="py-4 space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!currentProblem) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p className="text-lg">問題が見つかりませんでした。</p>
        <Link
          href={`/categories/${categoryId}`}
          className="text-primary-600 mt-2 inline-block"
        >
          カテゴリに戻る
        </Link>
      </div>
    );
  }

  const isAnswered = submissionResult?.isCorrect;

  return (
    <div className="py-4 space-y-5">
      {/* ナビゲーション & 進捗 */}
      <div className="flex items-center gap-2">
        <Link
          href={`/categories/${categoryId}`}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft size={22} />
        </Link>
        <ProgressBar
          current={currentIndex + 1}
          total={allProblems.length}
          className="flex-1"
        />
      </div>

      {/* 問題文 */}
      <ProblemDisplay problem={currentProblem} />

      {/* タップ式コードブロックエリア */}
      <CodeBlockArea
        answerBlocks={answerBlocks}
        poolBlocks={poolBlocks}
        onSelectFromPool={selectBlock}
        onRemoveFromAnswer={removeBlock}
        onReorder={reorderBlocks}
        blockMode={currentProblem.blockMode}
        incorrectPositions={submissionResult?.incorrectPositions}
        disabled={isAnswered}
      />

      {/* ヒント */}
      {isHintVisible && currentProblem.hints.length > 0 && (
        <HintDisplay
          hints={currentProblem.hints}
          currentIndex={currentHintIndex}
        />
      )}

      {/* フィードバック */}
      {submissionResult && (
        <AnswerFeedback
          result={submissionResult}
          explanation={
            submissionResult.isCorrect
              ? currentProblem.explanation
              : undefined
          }
        />
      )}

      {/* アクションボタン */}
      <div className="space-y-3">
        {!isAnswered && (
          <>
            <Button
              onClick={handleSubmit}
              className="w-full"
              size="lg"
              disabled={answerBlocks.length === 0}
            >
              答えを確認する
            </Button>
            <div className="flex gap-2">
              {currentProblem.hints.length > 0 && (
                <Button
                  variant="outline"
                  onClick={showHint}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Lightbulb size={18} />
                  ヒント
                </Button>
              )}
              {(attemptCount > 0 || answerBlocks.length > 0) && (
                <Button
                  variant="secondary"
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  リセット
                </Button>
              )}
            </div>
          </>
        )}

        {isAnswered && (
          <Button
            onClick={handleNext}
            variant="success"
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            {nextProblem ? "次の問題へ" : "カテゴリに戻る"}
            <ArrowRight size={20} />
          </Button>
        )}
      </div>

      {/* 前後ナビゲーション */}
      <div className="flex justify-between pt-2">
        {prevProblem ? (
          <Link
            href={`/categories/${categoryId}/${prevProblem.id}`}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← 前の問題
          </Link>
        ) : (
          <span />
        )}
        {nextProblem && (
          <Link
            href={`/categories/${categoryId}/${nextProblem.id}`}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            次の問題 →
          </Link>
        )}
      </div>
    </div>
  );
}
