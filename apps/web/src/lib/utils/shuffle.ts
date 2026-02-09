import type { CodeBlock } from "@/types/problem";

export function shuffleBlocks(
  blocks: CodeBlock[],
  distractors: CodeBlock[] = []
): CodeBlock[] {
  const allBlocks = [...blocks, ...distractors];
  if (allBlocks.length <= 1) return [...allBlocks];

  let shuffled: CodeBlock[];
  let attempts = 0;

  do {
    shuffled = [...allBlocks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    attempts++;
  } while (
    attempts < 10 &&
    allBlocks.length > 1 &&
    shuffled.every((b, i) => i < blocks.length && b.id === blocks[i].id)
  );

  return shuffled;
}
