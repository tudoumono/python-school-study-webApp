import type { CategoryId } from "@/types/problem";

export interface AttemptLearningEventPayload {
  problemId: string;
  categoryId: CategoryId;
  isCorrect: boolean;
  points: number;
  usedHint: boolean;
  timeSpentSec: number;
  attemptNo: number;
  incorrectPattern?: string;
}

const LEARNER_ID_STORAGE_KEY = "py-puzzle:learner-id";
let cachedLearnerId: string | null = null;

function createLearnerId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `anon-${crypto.randomUUID()}`;
  }
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateLearnerId(): string {
  if (cachedLearnerId) return cachedLearnerId;
  if (typeof window === "undefined") return "anonymous";

  try {
    const stored = window.localStorage.getItem(LEARNER_ID_STORAGE_KEY);
    if (stored) {
      cachedLearnerId = stored;
      return stored;
    }

    const newId = createLearnerId();
    window.localStorage.setItem(LEARNER_ID_STORAGE_KEY, newId);
    cachedLearnerId = newId;
    return newId;
  } catch {
    return "anonymous";
  }
}

export async function postAttemptLearningEvent(
  payload: AttemptLearningEventPayload
): Promise<void> {
  const response = await fetch("/api/learning-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      userId: getOrCreateLearnerId(),
      problemId: payload.problemId,
      categoryId: payload.categoryId,
      isCorrect: payload.isCorrect,
      points: Math.max(0, Math.round(payload.points)),
      usedHint: payload.usedHint,
      timeSpentSec: Math.max(0, Math.round(payload.timeSpentSec)),
      attemptNo: Math.max(1, Math.round(payload.attemptNo)),
      incorrectPattern: payload.incorrectPattern,
    }),
  });

  if (response.ok) return;

  const body = await response.json().catch(() => ({}));
  const message =
    typeof body.error === "string" ? body.error : `API error: ${response.status}`;
  throw new Error(message);
}
