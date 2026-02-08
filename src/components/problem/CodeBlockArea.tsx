"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CodeBlock } from "./CodeBlock";
import { SortableCodeBlock } from "./SortableCodeBlock";
import type { CodeBlock as CodeBlockType, BlockMode } from "@/types/problem";
import clsx from "clsx";

interface CodeBlockAreaProps {
  answerBlocks: CodeBlockType[];
  poolBlocks: CodeBlockType[];
  onSelectFromPool: (blockId: string) => void;
  onRemoveFromAnswer: (blockId: string) => void;
  onReorder?: (oldIndex: number, newIndex: number) => void;
  blockMode?: BlockMode;
  incorrectPositions?: number[];
  disabled?: boolean;
}

export function CodeBlockArea({
  answerBlocks,
  poolBlocks,
  onSelectFromPool,
  onRemoveFromAnswer,
  onReorder,
  blockMode = "token",
  incorrectPositions = [],
  disabled,
}: CodeBlockAreaProps) {
  const isLineMode = blockMode === "line";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = answerBlocks.findIndex((b) => b.id === active.id);
    const newIndex = answerBlocks.findIndex((b) => b.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <div className="space-y-4">
      {/* 回答エリア */}
      <div className="bg-gray-900 rounded-2xl p-4 min-h-[140px]">
        <div className="text-xs text-gray-400 mb-3 font-mono">
          # 回答エリア（タップで取り消し・長押しで並び替え）
        </div>
        {answerBlocks.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
            下のブロックをタップして並べよう
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={answerBlocks.map((b) => b.id)}
              strategy={
                isLineMode
                  ? verticalListSortingStrategy
                  : horizontalListSortingStrategy
              }
            >
              <div
                className={clsx(
                  "gap-2",
                  isLineMode ? "flex flex-col" : "flex flex-wrap"
                )}
              >
                {answerBlocks.map((block, index) => (
                  <SortableCodeBlock
                    key={block.id}
                    block={block}
                    onClick={() => onRemoveFromAnswer(block.id)}
                    isIncorrect={incorrectPositions.includes(index)}
                    disabled={disabled}
                    isLineMode={isLineMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* ブロックプール */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 min-h-[80px]">
        <div className="text-xs text-gray-400 mb-3">
          ブロックを選んでタップ
        </div>
        {poolBlocks.length === 0 ? (
          <div className="flex items-center justify-center h-12 text-gray-400 text-sm">
            すべて配置済み
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {poolBlocks.map((block) => (
              <div key={block.id} className="animate-pop">
                <CodeBlock
                  block={block}
                  onClick={() => onSelectFromPool(block.id)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
