"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- */
/*  Button                                                           */
/* ---------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "xs" | "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#ff7a47,#ee4309)] text-[#2a0c00] font-semibold hover:brightness-110 hover:-translate-y-px shadow-[0_12px_30px_-10px_rgba(255,90,36,0.55),inset_0_1px_0_rgba(255,255,255,0.22)]",
  secondary:
    "bg-ink-750 text-ink-100 border border-white/[0.07] hover:bg-ink-700 hover:border-white/[0.12]",
  ghost: "text-ink-300 hover:text-ink-100 hover:bg-white/[0.05]",
  danger:
    "bg-rose-500/10 text-rose-300 border border-rose-500/25 hover:bg-rose-500/20",
  outline:
    "border border-white/12 text-ink-200 hover:border-brand-500/60 hover:text-brand-300",
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-xs rounded-md gap-1.5",
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-9.5 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-6 text-[15px] rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center whitespace-nowrap transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 h-9",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------- */
/*  Card / Field / EmptyState                                        */
/* ---------------------------------------------------------------- */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between text-xs font-medium text-ink-300">
        {label}
        {hint && <span className="text-[11px] text-ink-500">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-ink-800 text-brand-400">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-ink-100">{title}</p>
      {body && (
        <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-ink-400">
          {body}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LabelChip({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-ink-300"
      title={name}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}

export function Progress({
  value,
  color = "#FF5A24",
  className,
}: {
  value: number; // 0..100
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]",
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
        }}
      />
    </div>
  );
}
