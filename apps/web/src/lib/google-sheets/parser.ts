import type { Problem, Category, CategoryId, Difficulty, BlockMode, CodeBlock } from "@/types/problem";

/**
 * スプレッドシートのヘッダー行のカラム順:
 * id | categoryId | difficulty | order | title | description | blockMode |
 * correctOrder (JSON) | distractors (JSON) | hints (JSON) | points |
 * explanation | tags (JSON) | source | codeHash | createdAt
 */
const COL = {
  ID: 0,
  CATEGORY_ID: 1,
  DIFFICULTY: 2,
  ORDER: 3,
  TITLE: 4,
  DESCRIPTION: 5,
  BLOCK_MODE: 6,
  CORRECT_ORDER: 7,
  DISTRACTORS: 8,
  HINTS: 9,
  POINTS: 10,
  EXPLANATION: 11,
  TAGS: 12,
  SOURCE: 13,
  CODE_HASH: 14,
  EXPECTED_OUTPUT: 15,
} as const;

function safeJsonParse<T>(value: string | undefined, fallback: T): T {
  if (!value || value.trim() === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function parseRow(row: string[]): Problem | null {
  const id = row[COL.ID]?.trim();
  if (!id) return null;

  const categoryId = row[COL.CATEGORY_ID]?.trim() as CategoryId;
  const difficulty = (row[COL.DIFFICULTY]?.trim() || "beginner") as Difficulty;
  const blockMode = (row[COL.BLOCK_MODE]?.trim() || "token") as BlockMode;
  const order = parseInt(row[COL.ORDER] || "0", 10);
  const points = parseInt(row[COL.POINTS] || "10", 10);

  const correctOrder = safeJsonParse<CodeBlock[]>(row[COL.CORRECT_ORDER], []);
  if (correctOrder.length === 0) return null;

  const distractors = safeJsonParse<CodeBlock[]>(row[COL.DISTRACTORS], []);
  const hints = safeJsonParse<string[]>(row[COL.HINTS], []);
  const tags = safeJsonParse<string[]>(row[COL.TAGS], []);
  const source = (row[COL.SOURCE]?.trim() || "manual") as "manual" | "ai-generated";

  return {
    id,
    categoryId,
    difficulty,
    order,
    title: row[COL.TITLE]?.trim() || "",
    description: row[COL.DESCRIPTION]?.trim() || "",
    expectedOutput: row[COL.EXPECTED_OUTPUT]?.trim() || undefined,
    explanation: row[COL.EXPLANATION]?.trim() || undefined,
    blockMode,
    correctOrder,
    distractors: distractors.length > 0 ? distractors : undefined,
    hints,
    points,
    tags,
    metadata: {
      source,
      codeHash: row[COL.CODE_HASH]?.trim() || undefined,
    },
  };
}

export function parseRows(rows: string[][]): Problem[] {
  // 1行目はヘッダーなのでスキップ
  return rows
    .slice(1)
    .map(parseRow)
    .filter((p): p is Problem => p !== null);
}

/**
 * categories シートのカラム順:
 * id | title | description | icon | color | order
 */
const CAT_COL = {
  ID: 0,
  TITLE: 1,
  DESCRIPTION: 2,
  ICON: 3,
  COLOR: 4,
  ORDER: 5,
} as const;

export function parseCategoryRow(row: string[]): Category | null {
  const id = row[CAT_COL.ID]?.trim();
  if (!id) return null;

  return {
    id: id as CategoryId,
    title: row[CAT_COL.TITLE]?.trim() || id,
    description: row[CAT_COL.DESCRIPTION]?.trim() || "",
    icon: row[CAT_COL.ICON]?.trim() || "Folder",
    color: row[CAT_COL.COLOR]?.trim() || "bg-gray-500",
    order: parseInt(row[CAT_COL.ORDER] || "0", 10),
  };
}

export function parseCategoryRows(rows: string[][]): Category[] {
  return rows
    .slice(1)
    .map(parseCategoryRow)
    .filter((c): c is Category => c !== null)
    .sort((a, b) => a.order - b.order);
}
