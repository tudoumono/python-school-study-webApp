import clsx from "clsx";

interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  color = "bg-primary-500",
  showLabel = true,
  className,
}: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {current}/{total}
        </span>
      )}
    </div>
  );
}
