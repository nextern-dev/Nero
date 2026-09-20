import {
  AlertOctagon,
  Minus,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from "lucide-react";
import type { Priority } from "@/db/schema";
import { PRIORITY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<Priority, typeof SignalLow> = {
  none: Minus,
  low: SignalLow,
  medium: SignalMedium,
  high: SignalHigh,
  urgent: AlertOctagon,
};

export function PriorityIcon({
  priority,
  size = 14,
  className,
}: {
  priority: Priority;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[priority];
  return (
    <Icon
      style={{ color: PRIORITY_COLORS[priority], width: size, height: size }}
      className={cn("shrink-0", className)}
    />
  );
}

export function PriorityBadge({
  priority,
  label,
}: {
  priority: Priority;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[11px] font-medium text-ink-300">
      <PriorityIcon priority={priority} size={12} />
      {label}
    </span>
  );
}
