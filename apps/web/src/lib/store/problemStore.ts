"use client";

import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import type { CodeBlock, Problem } from "@/types/problem";
import type { SubmissionResult } from "@/types/common";
import { checkAnswer } from "@/lib/utils/answerChecker";
import { shuffleBlocks } from "@/lib/utils/shuffle";

interface ProblemState {
  currentProblem: Problem | null;
  /** 回答エリアに配置されたブロック */
  answerBlocks: CodeBlock[];
  /** まだ選択されていないブロック（プール） */
  poolBlocks: CodeBlock[];
  submissionResult: SubmissionResult | null;
  attemptCount: number;
  isHintVisible: boolean;
  currentHintIndex: number;
  startTime: number | null;

  loadProblem: (problem: Problem) => void;
  /** プールから回答エリアへ移動 */
  selectBlock: (blockId: string) => void;
  /** 回答エリアからプールへ戻す */
  removeBlock: (blockId: string) => void;
  /** 回答エリア内のブロックを並び替え */
  reorderBlocks: (oldIndex: number, newIndex: number) => void;
  submitAnswer: () => SubmissionResult;
  showHint: () => void;
  reset: () => void;
}

export const useProblemStore = create<ProblemState>((set, get) => ({
  currentProblem: null,
  answerBlocks: [],
  poolBlocks: [],
  submissionResult: null,
  attemptCount: 0,
  isHintVisible: false,
  currentHintIndex: 0,
  startTime: null,

  loadProblem: (problem) => {
    const shuffled = shuffleBlocks(
      problem.correctOrder,
      problem.distractors ?? []
    );
    set({
      currentProblem: problem,
      answerBlocks: [],
      poolBlocks: shuffled,
      submissionResult: null,
      attemptCount: 0,
      isHintVisible: false,
      currentHintIndex: 0,
      startTime: Date.now(),
    });
  },

  selectBlock: (blockId) => {
    const state = get();
    const block = state.poolBlocks.find((b) => b.id === blockId);
    if (!block) return;
    set({
      poolBlocks: state.poolBlocks.filter((b) => b.id !== blockId),
      answerBlocks: [...state.answerBlocks, block],
      submissionResult: null,
    });
  },

  removeBlock: (blockId) => {
    const state = get();
    const block = state.answerBlocks.find((b) => b.id === blockId);
    if (!block) return;
    set({
      answerBlocks: state.answerBlocks.filter((b) => b.id !== blockId),
      poolBlocks: [...state.poolBlocks, block],
      submissionResult: null,
    });
  },

  reorderBlocks: (oldIndex, newIndex) => {
    const state = get();
    set({
      answerBlocks: arrayMove(state.answerBlocks, oldIndex, newIndex),
      submissionResult: null,
    });
  },

  submitAnswer: () => {
    const state = get();
    if (!state.currentProblem) {
      const result: SubmissionResult = {
        isCorrect: false,
        pointsEarned: 0,
        incorrectPositions: [],
        message: "問題が読み込まれていません",
      };
      set({ submissionResult: result });
      return result;
    }

    const newAttemptCount = state.attemptCount + 1;
    const result = checkAnswer(
      state.answerBlocks,
      state.currentProblem.correctOrder,
      state.currentProblem.points,
      newAttemptCount,
      state.isHintVisible
    );

    set({
      attemptCount: newAttemptCount,
      submissionResult: result,
    });

    return result;
  },

  showHint: () => {
    const state = get();
    if (!state.currentProblem) return;
    const hints = state.currentProblem.hints;
    if (hints.length === 0) return;

    set({
      isHintVisible: true,
      currentHintIndex: Math.min(state.currentHintIndex + 1, hints.length - 1),
    });
  },

  reset: () => {
    const state = get();
    if (state.currentProblem) {
      const shuffled = shuffleBlocks(
        state.currentProblem.correctOrder,
        state.currentProblem.distractors ?? []
      );
      set({
        answerBlocks: [],
        poolBlocks: shuffled,
        submissionResult: null,
        startTime: Date.now(),
      });
    }
  },
}));
