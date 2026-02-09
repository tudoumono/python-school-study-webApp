import type { Problem } from "@/types/problem";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface ProblemDisplayProps {
  problem: Problem;
}

export function ProblemDisplay({ problem }: ProblemDisplayProps) {
  return (
    <Card className="mb-4" padding="lg">
      <div className="flex items-center gap-2 mb-3">
        <Badge difficulty={problem.difficulty} />
        <span className="text-sm text-gray-400 font-mono">
          {problem.blockMode === "token" ? "トークン並べ替え" : "行並べ替え"}
        </span>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{problem.title}</h2>
      <p className="text-base text-gray-600 leading-relaxed">
        {problem.description}
      </p>
      {problem.expectedOutput && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
          <span className="text-sm text-gray-400 block mb-1">期待される出力:</span>
          <code className="text-base font-mono text-gray-800 whitespace-pre-wrap">
            {problem.expectedOutput}
          </code>
        </div>
      )}
    </Card>
  );
}
