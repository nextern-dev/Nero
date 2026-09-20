"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Command,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AvatarStack } from "@/components/avatar";
import { AreaChart } from "@/components/charts";
import { Logo, LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}


/* ------------------------------------------------------------------ */
/*  Board figures                                                      */
/* ------------------------------------------------------------------ */

const PEOPLE = [
  { name: "Ada Chen", color: "#E8A33C" },
  { name: "Kaito Mori", color: "#7BA05B" },
  { name: "Mira Sol", color: "#E5608F" },
  { name: "Felix Bram", color: "#A98AE0" },
];

function MiniCard({
  title,
  tag,
  tagColor,
  priority = "none",
  dragging = false,
}: {
  title: string;
  tag?: string;
  tagColor?: string;
  priority?: "none" | "low" | "medium" | "high";
  dragging?: boolean;
}) {
  const PIcon =
    priority === "high"
      ? SignalHigh
      : priority === "medium"
        ? SignalMedium
        : priority === "low"
          ? SignalLow
          : null;
  const pColor =
    priority === "high" ? "#ff7a47" : priority === "medium" ? "#e0a32e" : "#7c9fb8";
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        dragging
          ? "rotate-[1.5deg] border-brand-500/60 bg-ink-750 shadow-[0_18px_40px_-10px_rgba(0,0,0,0.75)]"
          : "border-ink-50/8 bg-ink-800",
      )}
    >
      {tag && (
        <span className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-ink-50/10 px-1.5 py-px text-[9px] font-medium text-ink-300">
          <span
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: tagColor }}
          />
          {tag}
        </span>
      )}
      <p className="text-[11px] leading-snug font-medium text-ink-100">
        {title}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        {PIcon && <PIcon style={{ color: pColor, width: 11, height: 11 }} />}
        <span className="flex-1" />
        <AvatarStack users={PEOPLE.slice(0, 2)} size={16} />
      </div>
    </div>
  );
}

function BoardPlate() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-12 bg-[radial-gradient(ellipse_55%_50%_at_50%_0%,rgba(255,90,36,0.12),transparent_70%)]" />
      <motion.figure
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: EASE }}
        className="plate relative overflow-hidden rounded-sm"
      >
        <div className="flex items-center gap-2 border-b border-ink-50/8 px-4 py-2.5">
          <LogoMark size={14} />
          <span className="font-mono text-[10px] tracking-[0.18em] text-ink-500 uppercase">
            Nero Labs — Nero Web App
          </span>
          <span className="kbd ml-auto hidden sm:inline-flex">⌘K</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4 sm:p-5">
          <div className="space-y-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7c9fb8]" /> To Do
              <span className="text-ink-600">3</span>
            </p>
            <MiniCard
              title="Ship /api/search endpoint"
              tag="Feature"
              tagColor="#a98ae0"
              priority="high"
            />
            <MiniCard
              title="Design empty states for boards"
              tag="Design"
              tagColor="#e5608f"
              priority="medium"
            />
            <div className="hidden sm:block">
              <MiniCard title="Write onboarding letters" />
            </div>
          </div>
          <div className="space-y-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a24]" /> In
              Progress <span className="text-ink-600">2</span>
            </p>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <MiniCard
                title="Kanban drag physics pass"
                tag="Improvement"
                tagColor="#7c9fb8"
                priority="high"
                dragging
              />
              <motion.span
                animate={{ y: [0, -10, 0], x: [0, 4, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-1 -bottom-3 flex items-center gap-1 rounded-full border border-brand-500/40 bg-ink-900 px-1.5 py-0.5 text-[8.5px] font-medium text-brand-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                Ada
              </motion.span>
            </motion.div>
            <div className="hidden sm:block">
              <MiniCard title="Tune area-chart easing" priority="low" />
            </div>
          </div>
          <div className="space-y-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7ba05b]" /> Done
              <span className="text-ink-600">12</span>
            </p>
            <div className="opacity-50">
              <MiniCard title="Auth.js credentials flow" tag="Feature" tagColor="#a98ae0" />
            </div>
            <div className="hidden opacity-50 sm:block">
              <MiniCard title="Zod schemas everywhere" />
            </div>
          </div>
        </div>
      </motion.figure>
      <motion.figcaption
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.9 }}
        className="mt-4 text-center font-display text-[13px] text-ink-400 italic"
      >
        Fig. 01 — The board, mid-drag. Soft springs, hard deadlines.
      </motion.figcaption>
    </div>
  );
}

function PalettePlate() {
  const rows = [
    { label: "Kanban drag physics pass", meta: "NER-21", active: true },
    { label: "Design system tokens", meta: "DS-8" },
    { label: "Go to Members", meta: "Page" },
  ];
  return (
    <div className="plate w-full max-w-sm overflow-hidden rounded-sm">
      <div className="flex items-center gap-2 border-b border-ink-50/8 px-3 py-2.5">
        <Command className="h-3.5 w-3.5 text-ink-500" />
        <span className="text-[11.5px] text-ink-400">
          kanb<span className="text-brand-300">▌</span>
        </span>
      </div>
      <div className="p-1.5">
        {rows.map((r, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11.5px]",
              r.active && "bg-ink-50/7",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            <span className="flex-1 text-ink-100">{r.label}</span>
            <span className="font-mono text-[9px] text-ink-500">{r.meta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating capsule masthead                                          */
/* ------------------------------------------------------------------ */

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-4 z-40 mx-auto w-full max-w-6xl px-5">
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className={cn(
          "flex h-14 items-center gap-6 rounded-full border pr-2 pl-5 transition-all duration-500",
          scrolled
            ? "border-ink-50/[0.13] bg-ink-950/80 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <Link href="/" aria-label="Nero home" className="shrink-0">
          <Logo size={20} />
        </Link>

        <nav className="mx-auto hidden items-center gap-7 text-[12.5px] text-ink-400 md:flex">
          {[
            ["Chapters", "#chapters"],
            ["Manifesto", "#manifesto"],
            ["Index", "#index"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="u-link transition-colors hover:text-ink-100"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link
            href="/login"
            className="u-link rounded-full px-3.5 py-2 text-[12.5px] font-medium text-ink-300 transition-colors hover:text-ink-50"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="group flex items-center gap-1.5 rounded-full bg-ink-50 py-2 pr-4 pl-4 text-[12.5px] font-semibold text-ink-950 transition-all hover:bg-brand-200 active:scale-[0.97]"
          >
            Begin free
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const STACK: [string, string][] = [
  ["Next.js 16", "Framework"],
  ["React 19", "Interface"],
  ["Tailwind CSS 4", "Styling"],
  ["PostgreSQL", "Memory"],
  ["Drizzle ORM", "Access"],
  ["Auth.js", "Identity"],
  ["Zod", "Certainty"],
  ["Zustand", "State"],
  ["Resend", "Letters"],
  ["dnd kit", "Physics"],
  ["Fraunces & Geist", "Voice"],
];

export function Landing() {
  const { scrollYProgress } = useScroll();
  const heroDrift = useTransform(scrollYProgress, [0, 0.3], [0, -80]);

  return (
    <div className="noise bg-vignette relative min-h-screen overflow-x-clip bg-ink-950 text-ink-100">
      {/* Reading progress */}
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-brand-600 via-brand-400 to-[#e8a33c]"
        style={{ scaleX: scrollYProgress }}
      />
      <div className="bg-ruled pointer-events-none absolute inset-x-0 top-0 h-[880px] mask-fade-y" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-glow-brand" />

      {/* ————— Masthead ————— */}
      <LandingNav />

      {/* ————— Front page ————— */}
      <section className="relative mx-auto max-w-6xl px-5 pt-20 pb-24 sm:pt-28">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="folio mb-8 flex items-center gap-3"
        >
          <LogoMark size={16} />
          Open source · MIT · Self-hosted on your own Postgres
        </motion.p>

        <h1 className="max-w-5xl font-display text-[13.5vw] leading-[0.98] font-medium tracking-[-0.02em] text-ink-50 sm:text-[86px] lg:text-[104px]">
          {["Project", "management,"].map((line, i) => (
            <motion.span
              key={line}
              className="block"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08 + i * 0.1, ease: EASE }}
            >
              {line}
            </motion.span>
          ))}
          <motion.span
            className="text-gradient-brand wonk block italic"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.28, ease: EASE }}
          >
            as a fine art.
          </motion.span>
        </h1>

        <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
            className="max-w-md text-[15px] leading-relaxed text-ink-400"
          >
            Nero is an open-source project manager with kanban boards,
            priorities, labels, due dates, comments, team roles and a full
            activity history — built on Next.js 16 and PostgreSQL, with the
            source in this repo.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
            className="flex shrink-0 items-center gap-3"
          >
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-sm bg-ink-50 px-6 py-3.5 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-brand-200"
            >
              Begin free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="rounded-sm border border-ink-50/15 px-6 py-3.5 text-[14px] font-medium text-ink-200 transition-colors hover:border-brand-500/60 hover:text-brand-300"
            >
              Enter the demo
            </Link>
          </motion.div>
        </div>

        <motion.div style={{ y: heroDrift }} className="mt-20 sm:mt-24">
          <BoardPlate />
        </motion.div>
      </section>

      {/* ————— Running sheet ————— */}
      <section className="border-y border-ink-50/8 py-5">
        <div className="mask-fade-x overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-10 px-5">
            {[...STACK, ...STACK].map(([name], i) => (
              <span
                key={`${name}-${i}`}
                className="flex items-center gap-10 whitespace-nowrap"
              >
                <span className="font-display text-[14px] text-ink-400 italic">
                  {name}
                </span>
                <span className="text-[10px] text-brand-500">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Chapters ————— */}
      <section id="chapters" className="mx-auto max-w-6xl px-5 py-28">
        <Chapter
          no="01"
          title="Paper, with physics"
          body="Drag between columns and the board answers instantly — optimistic updates first, PostgreSQL persistence a heartbeat later. Dropping into “Done” completes the task for you."
          caption="Fig. 02 — five columns, zero friction"
        >
          <div className="grid grid-cols-2 gap-3">
            <MiniCard
              title="Optimistic UI"
              tag="Feature"
              tagColor="#a98ae0"
              priority="high"
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <MiniCard title="…and drop" dragging />
            </motion.div>
            <div className="col-span-2 opacity-50">
              <MiniCard title="Completed automatically" tag="Done" tagColor="#7ba05b" />
            </div>
          </div>
        </Chapter>

        <Chapter
          no="02"
          title="Ask, and it appears"
          body="⌘K opens a palette that searches task titles and project names across your workspace, with quick actions for common jumps. Results appear as you type, arrow keys navigate, Enter opens."
          caption="Fig. 03 — the command palette"
          flip
        >
          <div className="flex justify-center">
            <PalettePlate />
          </div>
        </Chapter>

        <Chapter
          no="03"
          title="Progress you can see"
          body="The dashboard charts how many tasks were completed each day over the last two weeks, and how open work is split across columns — computed from the board you already use. No exports or plugins needed."
          caption="Fig. 04 — fourteen days of shipping"
        >
          <div className="plate rounded-sm p-5">
            <AreaChart
              height={150}
              points={[
                { label: "W1", value: 3 },
                { label: "W2", value: 5 },
                { label: "W3", value: 4 },
                { label: "W4", value: 8 },
                { label: "W5", value: 6 },
                { label: "W6", value: 11 },
                { label: "W7", value: 9 },
                { label: "W8", value: 14 },
              ]}
            />
          </div>
        </Chapter>
      </section>

      {/* ————— Manifesto ————— */}
      <section
        id="manifesto"
        className="relative border-y border-ink-50/8 bg-ink-900/40 py-28"
      >
        <div className="bg-ruled pointer-events-none absolute inset-0 opacity-60" />
        <Reveal className="relative mx-auto max-w-3xl px-5 text-center">
          <LogoMark size={44} className="mx-auto mb-10" />
          <p className="wonk font-display text-[28px] leading-snug font-medium tracking-tight text-ink-100 italic sm:text-[38px]">
            “One Postgres, a handful of libraries, no hidden services —{" "}
            <span className="text-gradient-brand">code you can read</span> in an
            evening.”
          </p>
          <p className="folio mt-8">Why Nero exists</p>
          <p className="mx-auto mt-6 max-w-lg text-[13.5px] leading-relaxed text-ink-400">
            Nero is built to study how a modern full-stack app fits together:
            server actions, typed queries, authentication and transactional
            email — all visible, all in one repository.
          </p>
        </Reveal>
      </section>

      {/* ————— Index ————— */}
      <section id="index" className="mx-auto max-w-4xl px-5 py-28">
        <Reveal>
          <p className="folio mb-4">Index</p>
          <h2 className="font-display text-[34px] font-medium tracking-tight text-ink-50 italic sm:text-[44px]">
            Composed of fine materials
          </h2>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink-400">
            Every layer is open source and inspectable. Fork it, read it, run
            it on a box under your desk.
          </p>
        </Reveal>
        <Reveal className="mt-12" delay={0.1}>
          <div className="border-t border-ink-50/10">
            {STACK.map(([name, role], i) => (
              <div
                key={name}
                className="group flex items-baseline gap-4 border-b border-ink-50/10 py-3.5 transition-colors hover:bg-ink-50/[0.02]"
              >
                <span className="w-8 shrink-0 font-mono text-[11px] text-ink-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-[15px] text-ink-100 transition-colors group-hover:text-brand-200">
                  {name}
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.18em] text-ink-500 uppercase">
                  {role}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ————— Colophon CTA ————— */}
      <section className="relative overflow-hidden border-t border-ink-50/8 py-28 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_65%_at_50%_100%,rgba(255,90,36,0.14),transparent_70%)]" />
        <Reveal className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-10 w-fit"
          >
            <LogoMark size={72} />
          </motion.div>
          <h2 className="mx-auto max-w-2xl font-display text-[40px] font-medium tracking-tight text-ink-50 sm:text-[56px]">
            The page is blank.{" "}
            <span className="text-gradient-brand italic">Begin.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[14px] text-ink-400">
            Create a workspace in ten seconds. Your first project — a guided
            tour — is already waiting on the board.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-sm bg-ink-50 px-7 py-3.5 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-brand-200"
            >
              Begin free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="rounded-sm border border-ink-50/15 px-7 py-3.5 text-[14px] font-medium text-ink-200 transition-colors hover:border-brand-500/60 hover:text-brand-300"
            >
              Explore the demo
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ————— Colophon ————— */}
      <footer className="border-t border-ink-50/8 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 sm:flex-row">
          <Logo size={20} />
          <p className="max-w-md text-center font-display text-[12px] leading-relaxed text-ink-500 italic sm:text-right">
            Set in Fraunces & Geist. Printed on pixels. MIT licensed.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Chapter({
  no,
  title,
  body,
  caption,
  children,
  flip = false,
}: {
  no: string;
  title: string;
  body: string;
  caption: string;
  children: ReactNode;
  flip?: boolean;
}) {
  return (
    <Reveal className="relative mb-24 last:mb-0">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 right-0 font-display text-[120px] leading-none font-semibold text-ink-50/[0.045] italic select-none sm:text-[180px]"
      >
        {no}
      </span>
      <div
        className={cn(
          "relative grid items-center gap-10 lg:grid-cols-2",
          flip && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div>
          <p className="folio mb-4">№ {no}</p>
          <h3 className="font-display text-[30px] font-medium tracking-tight text-ink-50 italic sm:text-[40px]">
            {title}
          </h3>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-ink-400">
            {body}
          </p>
        </div>
        <div>
          <div className="plate plate-lift rounded-sm p-4">{children}</div>
          <p className="mt-3 text-center font-display text-[12px] text-ink-500 italic">
            {caption}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
