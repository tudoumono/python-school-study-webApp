"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { problemService } from "@/lib/services/problemService";
import { useProblemStore } from "@/lib/store/problemStore";
import { useProgressStore } from "@/lib/store/progressStore";
import type { Problem } from "@/types/problem";
import { ProblemDisplay } from "@/components/problem/ProblemDisplay";
import { CodeBlockArea } from "@/components/problem/CodeBlockArea";
import { AnswerFeedback } from "@/components/feedback/AnswerFeedback";
import { HintDisplay } from "@/components/feedback/HintDisplay";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, ArrowRight, Lightbulb, RotateCcw, Trophy } from "lucide-react";

export default function RandomProblemPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentIndex = Number(params.index);
  const problemIds = (searchParams.get("problems") ?? "").split(",").filter(Boolean);
  const queryString = `problems=${problemIds.join(",")}`;

  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [sessionScores, setSessionScores] = useState<number[]>([]);

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
    if (problemIds.length === 0) {
      setLoading(false);
      return;
    }
    problemService
      .getAllProblems()
      .then((problems) => {
        setAllProblems(problems);
        const targetId = problemIds[currentIndex];
        const problem = problems.find((p) => p.id === targetId);
        if (problem) loadProblem(problem);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

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
      if (result.isCorrect) {
        setSessionScores((prev) => [...prev, result.pointsEarned]);
      }
    }
  }, [submitAnswer, currentProblem, startTime, answerBlocks, isHintVisible, recordAttempt]);

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= problemIds.length) {
      setShowResults(true);
    } else {
      router.push(`/random/${nextIndex}?${queryString}`);
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

  if (problemIds.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p className="text-lg">問題が指定されていません。</p>
        <Link href="/random" className="text-primary-600 mt-2 inline-block">
          ランダム問題集に戻る
        </Link>
      </div>
    );
  }

  if (showResults) {
    const totalScore = sessionScores.reduce((s, v) => s + v, 0);
    return (
      <div className="py-8 space-y-6">
        <Card padding="lg" className="text-center">
          <Trophy className="mx-auto text-accent-500 mb-3" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">お疲れさま！</h2>
          <p className="text-gray-600 mb-4">
            {problemIds.length}問中{sessionScores.length}問クリア
          </p>
          <div className="text-3xl font-bold text-primary-600 mb-6">
            +{totalScore}pt
          </div>
          <div className="space-y-3">
            <Link href="/random">
              <Button className="w-full" size="lg">
                もう一度挑戦する
              </Button>
            </Link>
            <Link href="/">
              <Button variant="secondary" className="w-full" size="lg">
                ホームに戻る
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentProblem) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p className="text-lg">問題が見つかりませんでした。</p>
        <Link href="/random" className="text-primary-600 mt-2 inline-block">
          ランダム問題集に戻る
        </Link>
      </div>
    );
  }

  const isAnswered = submissionResult?.isCorrect;

  return (
    <div className="py-4 space-y-5">
      {/* ナビゲーション & 進捗 */}
      <div className="flex items-center gap-2">
        <Link href="/random" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={22} />
        </Link>
        <ProgressBar
          current={currentIndex + 1}
          total={problemIds.length}
          className="flex-1"
        />
      </div>

      {/* 問題文 */}
      <ProblemDisplay problem={currentProblem} />

      {/* コードブロックエリア */}
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
            submissionResult.isCorrect ? currentProblem.explanation : undefined
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
            {currentIndex + 1 < problemIds.length ? "次の問題へ" : "結果を見る"}
            <ArrowRight size={20} />
          </Button>
        )}
      </div>
    </div>
  );
}
