interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showFraction?: boolean;
  color?: "primary" | "green" | "amber" | "gray";
  size?: "sm" | "md";
  className?: string;
}

const colorMap = {
  primary: "bg-primary",
  green: "bg-green-500",
  amber: "bg-amber-500",
  gray: "bg-gray-400",
};

const sizeMap = {
  sm: "h-2",
  md: "h-3",
};

export function ProgressBar({
  value,
  max,
  label,
  showFraction = true,
  color = "primary",
  size = "md",
  className = "",
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;

  return (
    <div className={className}>
      {(label || showFraction) && (
        <div className="flex justify-between text-sm mb-1">
          {label && <span className="text-gray-600">{label}</span>}
          {showFraction && (
            <span className="font-medium text-gray-900">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeMap[size]}`}>
        <div
          className={`${colorMap[color]} ${sizeMap[size]} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
