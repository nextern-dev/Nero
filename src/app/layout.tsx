import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Nero — Project management, as a fine art",
    template: "%s · Nero",
  },
  description:
    "Nero is an open-source project manager: kanban boards, priorities, labels, due dates, comments, team roles, activity history and a ⌘K palette — built with Next.js, Tailwind, Drizzle + PostgreSQL, Zod, Zustand, Auth.js and Resend.",
  openGraph: {
    title: "Nero — Project management, as a fine art",
    description:
      "Open-source project management: kanban, priorities, labels, charts and a ⌘K palette. Next.js 16 + PostgreSQL.",
    images: [{ url: "/og/cover.png", width: 1200, height: 630, alt: "Nero" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nero — Project management, as a fine art",
    description:
      "Open-source project management: kanban, priorities, labels, charts and a ⌘K palette.",
    images: ["/og/cover.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-ink-950 font-sans text-ink-100 antialiased">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#171410",
              border: "1px solid rgba(246,240,227,0.1)",
              color: "#ebe3d3",
              borderRadius: "6px",
            },
          }}
        />
      </body>
    </html>
  );
}
