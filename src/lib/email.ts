import { Resend } from "resend";

/**
 * Transactional email via Resend.
 * Set RESEND_API_KEY (+ optionally EMAIL_FROM) to enable delivery.
 * Without a key the app keeps working and emails are logged to the server.
 */
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM = process.env.EMAIL_FROM ?? "Nero <onboarding@resend.dev>";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function shell(heading: string, body: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0D0B08;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:520px;margin:0 auto;padding:48px 24px;">
      <div style="margin-bottom:32px;">
        <span style="font-size:22px;font-style:italic;font-weight:700;color:#F6F0E3;letter-spacing:-0.02em;">Nero</span>
      </div>
      <div style="background:#14110D;border:1px solid rgba(246,240,227,0.1);padding:34px;">
        <h1 style="margin:0 0 12px;color:#F6F0E3;font-size:24px;font-weight:600;font-style:italic;letter-spacing:-0.01em;">${heading}</h1>
        <div style="color:#BCAF97;font-size:14px;line-height:1.8;font-family:'Segoe UI',Arial,sans-serif;">${body}</div>
        <a href="${escapeHtml(APP_URL)}" style="display:inline-block;margin-top:26px;background:#F6F0E3;color:#0D0B08;text-decoration:none;font-weight:600;font-size:13px;padding:12px 24px;font-family:'Segoe UI',Arial,sans-serif;">Open Nero</a>
      </div>
      <p style="color:#6B5D49;font-size:12px;margin-top:24px;line-height:1.7;font-style:italic;">
        Nero — focused project management. Open source, built with Next.js &amp; PostgreSQL.
      </p>
    </div>
  </body>
</html>`;
}

async function deliver(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[nero:email] RESEND_API_KEY not set — skipped "${subject}" → ${to}`);
    return { delivered: false as const };
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    return { delivered: true as const };
  } catch (error) {
    console.error("[nero:email] delivery failed:", error);
    return { delivered: false as const };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  return deliver(
    to,
    "Welcome to Nero",
    shell(
      `Welcome aboard, ${escapeHtml(name)}`,
      `Your workspace is ready. Nero keeps projects, tasks, priorities and your team
       in one shared place — with a board, comments and an activity history for every project.<br/><br/>
       Tip: press <b style="color:#FFA67E">⌘K</b> anywhere to search tasks and projects.`,
    ),
  );
}

export async function sendInviteEmail(
  to: string,
  opts: { workspaceName: string; inviterName: string; token: string },
) {
  return deliver(
    to,
    `${opts.inviterName} invited you to ${opts.workspaceName}`,
    shell(
      "You've been invited",
      `<b style="color:#F6F0E3">${escapeHtml(opts.inviterName)}</b> added you to the\n       <b style="color:#F6F0E3">${escapeHtml(opts.workspaceName)}</b> workspace on Nero.
       Create your account with this email to take your seat at the board.<br/><br/>
       <a href="${escapeHtml(APP_URL)}/invite/${encodeURIComponent(opts.token)}"
          style="display:inline-block;background:#F6F0E3;color:#0D0B08;text-decoration:none;font-weight:600;font-size:13px;padding:12px 24px;font-family:'Segoe UI',Arial,sans-serif;">Accept invitation</a>`,
    ),
  );
}
