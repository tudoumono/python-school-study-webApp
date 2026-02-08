import type { Problem } from "@/types/problem";
import type { UserProgress } from "@/types/progress";

/**
 * 過去のミス傾向に基づいて重み付けで問題を選出する
 */
export function pickWeakProblems(
  allProblems: Problem[],
  progress: UserProgress,
  count: number
): Problem[] {
  if (allProblems.length === 0) return [];

  const weighted = allProblems.map((problem) => {
    const attempt = progress.problemAttempts[problem.id];
    let weight = 0;

    if (!attempt) {
      // 未着手
      weight = 3;
    } else if (attempt.gaveUp) {
      // ギブアップした問題
      weight = 4;
    } else if (attempt.status === "attempted") {
      // 挑戦中（未完了）
      weight = 3;
    } else if (attempt.status === "completed") {
      if (attempt.attempts >= 3) {
        // 完了だが苦戦した問題
        weight = 2;
      } else if (attempt.attempts <= 1) {
        // 得意な問題は除外
        weight = 0;
      } else {
        weight = 1;
      }
    }

    // ヒントを使った場合
    if (attempt?.usedHint) {
      weight += 1;
    }

    // weakTags にマッチするタグがある場合
    const weakTags = progress.analytics.weakTags;
    if (weakTags.length > 0 && problem.tags.some((t) => weakTags.includes(t))) {
      weight += 2;
    }

    return { problem, weight };
  });

  // 全問 weight 0 の場合はランダムに出題
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  if (totalWeight === 0) {
    const shuffled = [...allProblems].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // 重み付きランダム選出
  const selected: Problem[] = [];
  const remaining = [...weighted].filter((w) => w.weight > 0);

  while (selected.length < count && remaining.length > 0) {
    const currentTotal = remaining.reduce((sum, w) => sum + w.weight, 0);
    let rand = Math.random() * currentTotal;

    for (let i = 0; i < remaining.length; i++) {
      rand -= remaining[i].weight;
      if (rand <= 0) {
        selected.push(remaining[i].problem);
        remaining.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}
