"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CodeBlock } from "./CodeBlock";
import type { CodeBlock as CodeBlockType } from "@/types/problem";

interface SortableCodeBlockProps {
  block: CodeBlockType;
  onClick?: () => void;
  isIncorrect?: boolean;
  disabled?: boolean;
  isLineMode?: boolean;
}

export function SortableCodeBlock({
  block,
  onClick,
  isIncorrect,
  disabled,
  isLineMode,
}: SortableCodeBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 50 : undefined,
    width: isLineMode ? "100%" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <CodeBlock
        block={block}
        onClick={onClick}
        isIncorrect={isIncorrect}
        disabled={disabled}
      />
    </div>
  );
}
