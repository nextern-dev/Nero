import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="bg-vignette relative flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <div className="bg-ruled pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-glow-brand" />

      <div className="relative">
        <LogoMark size={52} className="mx-auto mb-10" />
        <p className="folio mb-6">Error 404</p>
        <h1 className="wonk mx-auto max-w-lg font-display text-[40px] leading-[1.05] font-medium tracking-tight text-ink-50 italic sm:text-[56px]">
          This card never made it onto{" "}
          <span className="text-gradient-brand">the board.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-[14.5px] leading-relaxed text-ink-400">
          The page you&apos;re looking for doesn&apos;t exist, was deleted, or
          belongs to another workspace.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-sm bg-ink-50 px-6 py-3 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-brand-200"
          >
            Back to front page
          </Link>
          <Link
            href="/dashboard"
            className="u-link rounded-sm px-4 py-3 text-[14px] font-medium text-ink-300 transition-colors hover:text-ink-50"
          >
            Open the app
          </Link>
        </div>
      </div>
    </div>
  );
}
