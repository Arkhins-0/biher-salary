interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends a transactional email. Uses Brevo's HTTP API when
 * EMAIL_PROVIDER=brevo and BREVO_API_KEY are set; otherwise logs the message
 * to the server console so local development still works without a key.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER ?? "").toLowerCase();
  const from = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME ?? "Biher Salary";

  if (provider !== "brevo" || !process.env.BREVO_API_KEY || !from) {
    console.log(
      `[email:console] To: ${input.to}\nSubject: ${input.subject}\n\n${input.text}\n`,
    );
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: from, name: fromName },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Email provider rejected the message (${res.status}). ${body}`.trim(),
    );
  }
}

/** Shared bits every template needs: absolute origin for the logo, support contact. */
export interface EmailContext {
  baseUrl: string;
}

function supportEmail() {
  return process.env.SUPPORT_EMAIL?.trim() || null;
}

function supportTextFooter() {
  const s = supportEmail();
  return s ? `\n\nNeed help? Contact ${s}` : "";
}

function layout(ctx: EmailContext, title: string, bodyHtml: string) {
  const logoUrl = `${ctx.baseUrl}/logo.png`;
  const s = supportEmail();
  const supportHtml = s
    ? `<p style="margin:0 0 4px;font-size:12px;color:#777">Need help? Contact <a href="mailto:${escapeHtml(s)}" style="color:#111">${escapeHtml(s)}</a></p>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:32px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <img src="${escapeHtml(logoUrl)}" alt="Biher" width="44" height="44" style="display:inline-block;width:44px;height:44px;border-radius:8px;vertical-align:middle;margin-right:12px">
      <span style="font-size:15px;font-weight:700;vertical-align:middle">Biher Salary Calculator</span>
    </div>
    <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
    ${bodyHtml}
    <hr style="border:0;border-top:1px solid #eee;margin:28px 0 16px">
    ${supportHtml}
    <p style="margin:0;font-size:12px;color:#999">Biher Salary Calculator</p>
  </div>
</body></html>`;
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600">${escapeHtml(label)}</a></p>
  <p style="font-size:12px;color:#777;word-break:break-all">Or paste this link into your browser:<br>${escapeHtml(href)}</p>`;
}

export function inviteEmail(
  ctx: EmailContext,
  opts: {
    to: string;
    role: "admin" | "dev";
    setupUrl: string;
    expiresInDays: number;
  },
) {
  const roleLabel = opts.role === "dev" ? "developer" : "admin";
  const subject = "Set up your Biher Salary account";
  const text = `You have been given ${roleLabel} access to the Biher Salary Calculator.

Open the link below to choose your name, designation and password. The link expires in ${opts.expiresInDays} days.

${opts.setupUrl}

If you were not expecting this email you can ignore it.${supportTextFooter()}`;
  const html = layout(
    ctx,
    subject,
    `<p style="font-size:14px;line-height:1.6">You have been given <strong>${roleLabel}</strong> access to the Biher Salary Calculator.</p>
     <p style="font-size:14px;line-height:1.6">Open the link below to choose your name, designation and password. The link expires in ${opts.expiresInDays} days.</p>
     ${button(opts.setupUrl, "Set up my account")}
     <p style="font-size:12px;color:#777">If you were not expecting this email you can ignore it.</p>`,
  );
  return { to: opts.to, subject, text, html };
}

export function resetPasswordEmail(
  ctx: EmailContext,
  opts: { to: string; resetUrl: string; expiresInMinutes: number },
) {
  const subject = "Reset your Biher Salary password";
  const text = `We received a request to reset the password for your Biher Salary account.

Open the link below to choose a new password. The link expires in ${opts.expiresInMinutes} minutes.

${opts.resetUrl}

If you did not request this, you can ignore this email. Your password will not change.${supportTextFooter()}`;
  const html = layout(
    ctx,
    subject,
    `<p style="font-size:14px;line-height:1.6">We received a request to reset the password for your Biher Salary account.</p>
     <p style="font-size:14px;line-height:1.6">Open the link below to choose a new password. The link expires in ${opts.expiresInMinutes} minutes.</p>
     ${button(opts.resetUrl, "Reset password")}
     <p style="font-size:12px;color:#777">If you did not request this, you can ignore this email. Your password will not change.</p>`,
  );
  return { to: opts.to, subject, text, html };
}

export function verifyEmailChangeEmail(
  ctx: EmailContext,
  opts: {
    to: string;
    currentEmail: string | null;
    verifyUrl: string;
    expiresInMinutes: number;
  },
) {
  const subject = "Verify your new Biher Salary email address";
  const fromLine = opts.currentEmail
    ? `A request was made to change the sign-in email for your Biher Salary account from ${opts.currentEmail} to ${opts.to}.`
    : `A request was made to set ${opts.to} as the sign-in email for your Biher Salary account.`;
  const text = `${fromLine}

Open the link below to confirm this address. The link expires in ${opts.expiresInMinutes} minutes. After verifying, you will be asked to sign in again with the new email.

${opts.verifyUrl}

If you did not request this, you can ignore this email. Your email will not change.${supportTextFooter()}`;
  const html = layout(
    ctx,
    subject,
    `<p style="font-size:14px;line-height:1.6">${escapeHtml(fromLine)}</p>
     <p style="font-size:14px;line-height:1.6">Open the link below to confirm this address. The link expires in ${opts.expiresInMinutes} minutes. After verifying, you will be asked to sign in again with the new email.</p>
     ${button(opts.verifyUrl, "Verify email address")}
     <p style="font-size:12px;color:#777">If you did not request this, you can ignore this email. Your email will not change.</p>`,
  );
  return { to: opts.to, subject, text, html };
}
