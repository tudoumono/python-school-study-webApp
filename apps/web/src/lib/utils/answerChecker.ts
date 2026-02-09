import type { CodeBlock } from "@/types/problem";
import type { SubmissionResult } from "@/types/common";

export function checkAnswer(
  userOrder: CodeBlock[],
  correctOrder: CodeBlock[],
  maxPoints: number,
  attemptNumber: number,
  usedHint: boolean
): SubmissionResult {
  const correctIds = new Set(correctOrder.map((b) => b.id));

  // ダミーブロックが含まれていないかチェック
  const hasDistractors = userOrder.some((b) => !correctIds.has(b.id));
  if (hasDistractors) {
    return {
      isCorrect: false,
      pointsEarned: 0,
      incorrectPositions: [],
      message: "余分なブロックが含まれています。不要なブロックを取り除きましょう！",
    };
  }

  // ブロック数が足りない場合
  if (userOrder.length < correctOrder.length) {
    return {
      isCorrect: false,
      pointsEarned: 0,
      incorrectPositions: [],
      message: "ブロックが足りません。すべてのブロックを配置してください。",
    };
  }

  // 位置を比較
  const incorrectPositions: number[] = [];
  for (let i = 0; i < correctOrder.length; i++) {
    if (i >= userOrder.length || userOrder[i].id !== correctOrder[i].id) {
      incorrectPositions.push(i);
    }
  }

  const isCorrect = incorrectPositions.length === 0;

  let pointsEarned = 0;
  if (isCorrect) {
    const attemptMultiplier = Math.max(0.25, 1 - (attemptNumber - 1) * 0.25);
    const hintPenalty = usedHint ? 0.5 : 1;
    pointsEarned = Math.round(maxPoints * attemptMultiplier * hintPenalty);
  }

  return {
    isCorrect,
    pointsEarned,
    incorrectPositions,
    message: isCorrect
      ? `正解！ +${pointsEarned}ポイント`
      : `おしい！ ${incorrectPositions.length}個のブロックが違う位置にあります。`,
  };
}
