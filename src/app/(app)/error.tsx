"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { LogoMark } from "@/components/logo";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <LogoMark size={40} className="mb-8" />
      <h1 className="font-display text-[32px] font-medium tracking-tight text-ink-50 italic">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-ink-400">
        An unexpected error interrupted the board. Your data is safe — try
        again, or head back to the dashboard.
        {error.digest && (
          <span className="mt-2 block font-mono text-[11px] text-ink-600">
            digest: {error.digest}
          </span>
        )}
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={reset}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#ff7a47,#ee4309)] px-5 py-2.5 text-[13.5px] font-semibold text-[#2a0c00] transition-all hover:brightness-110 active:scale-[0.97]"
        >
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-ink-50/15 px-5 py-2.5 text-[13.5px] font-medium text-ink-200 transition-colors hover:border-brand-500/50 hover:text-brand-300"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
