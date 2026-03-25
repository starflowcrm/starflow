"use client";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export function AccountBadge({
  accountId,
  label,
}: {
  accountId: number;
  label?: string;
}) {
  const color = COLORS[accountId % COLORS.length];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {label && <span className="truncate">{label}</span>}
    </span>
  );
}
