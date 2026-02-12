interface StatItem {
  label: string;
  value: number | string;
  color?: "default" | "green" | "amber" | "primary";
}

interface StatsGridProps {
  items: StatItem[];
  className?: string;
}

const colorMap = {
  default: "text-gray-900",
  green: "text-green-600",
  amber: "text-amber-600",
  primary: "text-primary",
};

export function StatsGrid({ items, className = "" }: StatsGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="border border-gray-200 rounded-lg p-4 text-center"
        >
          <p className={`text-2xl font-bold ${colorMap[item.color || "default"]}`}>
            {item.value}
          </p>
          <p className="text-sm text-gray-600 mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
