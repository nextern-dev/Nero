import { cn } from "@/lib/utils";

/**
 * The Nero mark — a total eclipse.
 * A black disc ("nero") with one burning vermilion crescent.
 */
export function LogoMark({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <radialGradient
          id="nero-eclipse"
          cx="0.7"
          cy="0.26"
          r="0.95"
          fx="0.7"
          fy="0.26"
        >
          <stop offset="0%" stopColor="#FFB37E" />
          <stop offset="30%" stopColor="#FF5A24" />
          <stop offset="68%" stopColor="#A83308" />
          <stop offset="100%" stopColor="#2A1206" />
        </radialGradient>
      </defs>
      {/* burning sphere */}
      <circle cx="32" cy="32" r="25" fill="url(#nero-eclipse)" />
      {/* the occluder — pure black, sliding over the flame */}
      <circle cx="25.5" cy="37.5" r="24" fill="#0D0B08" />
    </svg>
  );
}

export function Logo({
  size = 22,
  withWordmark = true,
  className,
  wordmarkClassName,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {withWordmark && (
        <span
          className={cn(
            "font-display text-[19px] leading-none font-semibold tracking-tight text-ink-50 italic",
            wordmarkClassName,
          )}
          style={{ fontVariationSettings: '"opsz" 144, "WONK" 1' }}
        >
          Nero
        </span>
      )}
    </span>
  );
}
