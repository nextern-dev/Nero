"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:pt-[10vh]">
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "relative w-full rounded-2xl border border-white/[0.08] bg-ink-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]",
              width,
            )}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
                <div>
                  {title && (
                    <h2 className="text-[15px] font-semibold tracking-tight text-ink-50">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
