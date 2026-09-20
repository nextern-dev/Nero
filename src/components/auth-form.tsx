"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { login, loginWithGoogle, register } from "@/actions/auth";
import { Logo } from "@/components/logo";
import { Button, Field } from "@/components/ui";

function GoogleMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

function GoogleButton({ onError }: { onError: (msg: string) => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        onError("");
        startTransition(async () => {
          const res = await loginWithGoogle();
          if (res && !res.ok) onError(res.error);
        });
      }}
      className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-ink-50 text-[14px] font-medium text-ink-950 transition-all hover:bg-white hover:shadow-[0_10px_30px_-10px_rgba(246,240,227,0.25)] active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-400 border-t-ink-950" />
      ) : (
        <GoogleMark />
      )}
      Continue with Google
    </button>
  );
}

function Divider({ label = "or continue with email" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-ink-50/[0.08]" />
      <span className="text-[11px] tracking-wide text-ink-500">{label}</span>
      <span className="h-px flex-1 bg-ink-50/[0.08]" />
    </div>
  );
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await login({ email, password });
      if (res && !res.ok) setError(res.error);
    });
  };

  return (
    <div className="animate-mount">
      <div className="mb-8 lg:hidden">
        <Logo size={28} />
      </div>
      <h1 className="font-display text-[32px] font-medium tracking-tight text-ink-50 italic">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-ink-400">
        Sign in to your workspace to continue.
      </p>

      <div className="mt-7">
        <GoogleButton onError={(msg) => setError(msg || null)} />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-rose-300">
          {error}
        </div>
      )}

      <Divider />

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" size="lg" loading={pending} className="w-full">
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setEmail("demo@nero.dev");
          setPassword("demo1234");
          setError(null);
        }}
        className="mt-4 flex w-full items-center gap-3 rounded-lg border border-brand-500/25 bg-brand-500/[0.07] px-3.5 py-3 text-left transition-colors hover:border-brand-500/45 hover:bg-brand-500/[0.11]"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-brand-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-brand-300">
            Try the demo workspace
          </span>
          <span className="block truncate font-mono text-[11px] text-ink-400">
            demo@nero.dev · demo1234 — click to autofill
          </span>
        </span>
      </button>

      <p className="mt-6 text-center text-[13px] text-ink-400">
        New to Nero?{" "}
        <Link
          href="/register"
          className="font-medium text-brand-400 hover:text-brand-300"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await register({ name, email, password });
      if (res && !res.ok) setError(res.error);
    });
  };

  return (
    <div className="animate-mount">
      <div className="mb-8 lg:hidden">
        <Logo size={28} />
      </div>
      <h1 className="font-display text-[32px] font-medium tracking-tight text-ink-50 italic">
        Create your workspace
      </h1>
      <p className="mt-1.5 text-sm text-ink-400">
        One account. Boards, charts, your whole team.
      </p>

      <div className="mt-7">
        <GoogleButton onError={(msg) => setError(msg || null)} />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-rose-300">
          {error}
        </div>
      )}

      <Divider label="or sign up with email" />

      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <input
            className="input"
            placeholder="Ada Lovelace"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Email">
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password" hint="min. 8 characters">
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button
          type="submit"
          size="lg"
          loading={pending}
          className="mt-2 w-full"
        >
          Create account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-400 hover:text-brand-300"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
