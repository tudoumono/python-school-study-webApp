export type BlockType =
  | "keyword"
  | "string"
  | "number"
  | "operator"
  | "variable"
  | "function"
  | "punctuation"
  | "comment";

export interface CodeBlock {
  id: string;
  content: string;
  indentLevel: number;
  type: BlockType;
}

export type Difficulty = "beginner" | "easy" | "medium" | "hard";

export type CategoryId = string;

export type BlockMode = "token" | "line";

export interface Problem {
  id: string;
  categoryId: CategoryId;
  difficulty: Difficulty;
  order: number;
  title: string;
  description: string;
  expectedOutput?: string;
  explanation?: string;
  blockMode: BlockMode;
  correctOrder: CodeBlock[];
  distractors?: CodeBlock[];
  hints: string[];
  points: number;
  tags: string[];
  metadata?: {
    source: "manual" | "ai-generated";
    generatedAt?: string;
    modelId?: string;
    codeHash?: string;
  };
}

export interface Category {
  id: CategoryId;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}
