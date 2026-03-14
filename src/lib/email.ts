/**
 * Email utility — powered by Resend.
 * Set RESEND_API_KEY in your environment variables.
 * Set NEXT_PUBLIC_APP_URL to your production URL (e.g. https://c3esports.com).
 */
import { Resend } from "resend"

// Use your verified Resend domain in production.
// During development / before domain verification, use: "onboarding@resend.dev"
const FROM = process.env.EMAIL_FROM ?? "C3 Esports <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

// Lazy singleton — avoids throwing at module load time when RESEND_API_KEY is absent
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set. Add it to your environment variables.")
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function layout(content: string, previewText = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>C3 Esports</title>
</head>
<body style="margin:0;padding:0;background-color:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;&nbsp;‌&zwnj;</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#080808;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="
                    background: linear-gradient(135deg, #C41C35, #1e3a8a);
                    border-radius: 14px;
                    padding: 2px;
                  ">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="
                          background: #0d0d0d;
                          border-radius: 12px;
                          padding: 10px 20px;
                        ">
                          <span style="
                            font-size: 22px;
                            font-weight: 800;
                            letter-spacing: -0.5px;
                            color: #ffffff;
                            text-transform: uppercase;
                          ">C3 <span style="color:#C41C35;">ESPORTS</span></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background-color: #111111;
              border-radius: 16px;
              border: 1px solid rgba(255,255,255,0.07);
              overflow: hidden;
            ">
              <!-- Red top accent line -->
              <div style="
                height: 3px;
                background: linear-gradient(90deg, #C41C35 0%, #1e3a8a 60%, transparent 100%);
              "></div>

              <!-- Card body -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding: 36px 40px 40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;" align="center">
              <p style="margin:0 0 8px;font-size:12px;color:#4a4a4a;text-transform:uppercase;letter-spacing:0.1em;">
                Carolina Collegiate Clash
              </p>
              <p style="margin:0;font-size:11px;color:#333333;">
                <a href="${APP_URL}" style="color:#555555;text-decoration:none;">${APP_URL.replace(/^https?:\/\//, "")}</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/legal/privacy" style="color:#555555;text-decoration:none;">Privacy</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/legal/terms" style="color:#555555;text-decoration:none;">Terms</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function badge(text: string, color: "#C41C35" | "#1e3a8a" | "#16a34a" | "#d97706" = "#C41C35"): string {
  return `<span style="
    display:inline-block;
    padding:3px 10px;
    background:${color}22;
    border:1px solid ${color}55;
    border-radius:999px;
    font-size:11px;
    font-weight:600;
    color:${color};
    letter-spacing:0.05em;
    text-transform:uppercase;
    margin-bottom:16px;
  ">${text}</span>`
}

function heading(text: string): string {
  return `<h1 style="
    margin:0 0 12px;
    font-size:24px;
    font-weight:800;
    color:#ffffff;
    letter-spacing:-0.5px;
    line-height:1.2;
  ">${text}</h1>`
}

function bodyText(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#a1a1aa;">${text}</p>`
}

function actionButton(href: string, label: string): string {
  return `
  <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0 8px;">
    <tr>
      <td style="
        background: linear-gradient(135deg, #C41C35, #9b1c2e);
        border-radius: 10px;
        padding: 1px;
      ">
        <a href="${href}" style="
          display:inline-block;
          padding:13px 28px;
          background:linear-gradient(135deg, #C41C35, #9b1c2e);
          border-radius:9px;
          font-size:14px;
          font-weight:700;
          color:#ffffff;
          text-decoration:none;
          letter-spacing:0.02em;
        ">${label} →</a>
      </td>
    </tr>
  </table>`
}

function divider(): string {
  return `<div style="height:1px;background:rgba(255,255,255,0.06);margin:24px 0;"></div>`
}

function scoreBox(homeTeam: string, homeScore: number, awayScore: number, awayTeam: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    margin: 20px 0;
  ">
    <tr>
      <td align="center" style="padding: 20px 16px;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="right" style="padding-right:16px;">
              <p style="margin:0;font-size:13px;color:#71717a;font-weight:500;">${homeTeam}</p>
            </td>
            <td>
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="
                    background:#1a1a1a;
                    border:1px solid rgba(255,255,255,0.1);
                    border-radius:8px;
                    padding:8px 16px;
                    min-width:40px;
                    text-align:center;
                  ">
                    <span style="font-size:26px;font-weight:800;color:#ffffff;">${homeScore}</span>
                  </td>
                  <td style="padding:0 10px;">
                    <span style="font-size:14px;color:#4a4a4a;font-weight:600;">—</span>
                  </td>
                  <td style="
                    background:#1a1a1a;
                    border:1px solid rgba(255,255,255,0.1);
                    border-radius:8px;
                    padding:8px 16px;
                    min-width:40px;
                    text-align:center;
                  ">
                    <span style="font-size:26px;font-weight:800;color:#ffffff;">${awayScore}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td align="left" style="padding-left:16px;">
              <p style="margin:0;font-size:13px;color:#71717a;font-weight:500;">${awayTeam}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

function mutedNote(text: string): string {
  return `<p style="margin:16px 0 0;font-size:12px;color:#4a4a4a;line-height:1.5;">${text}</p>`
}

// ---------------------------------------------------------------------------
// Notification emails
// ---------------------------------------------------------------------------

export async function sendResultSubmittedEmail({
  to,
  recipientName,
  matchId,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
}: {
  to: string
  recipientName: string
  matchId: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
}) {
  const matchUrl = `${APP_URL}/matches/${matchId}`
  const winner = homeScore > awayScore ? homeTeam : awayTeam

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Match result submitted — ${homeTeam} vs ${awayTeam}`,
    html: layout(`
      ${badge("Match Result")}
      ${heading("Scores Submitted")}
      ${bodyText(`Hey ${recipientName}, scores have been submitted for your match.`)}
      ${scoreBox(homeTeam, homeScore, awayScore, awayTeam)}
      ${bodyText(`<strong style="color:#ffffff;">${winner}</strong> takes the win. If these scores look incorrect, you have a window to file a dispute from the match page.`)}
      ${actionButton(matchUrl, "View Match")}
      ${divider()}
      ${mutedNote("Disputes must be filed within 24 hours of score submission. Attach screenshots or replay links as evidence.")}
    `, `Match result: ${homeTeam} ${homeScore}–${awayScore} ${awayTeam}`),
  })
}

export async function sendDisputeOpenedEmail({
  to,
  recipientName,
  matchId,
  homeTeam,
  awayTeam,
  filedByTeam,
}: {
  to: string
  recipientName: string
  matchId: string
  homeTeam: string
  awayTeam: string
  filedByTeam: string
}) {
  const matchUrl = `${APP_URL}/matches/${matchId}`
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Dispute opened — ${homeTeam} vs ${awayTeam}`,
    html: layout(`
      ${badge("Dispute", "#d97706")}
      ${heading("Match Dispute Opened")}
      ${bodyText(`Hey ${recipientName},`)}
      ${bodyText(`<strong style="color:#ffffff;">${filedByTeam}</strong> has filed a dispute for the match <strong style="color:#ffffff;">${homeTeam} vs ${awayTeam}</strong>.`)}
      ${bodyText(`Staff will review the submitted evidence and issue a decision. You may be contacted for additional information.`)}
      ${actionButton(matchUrl, "View Match")}
      ${divider()}
      ${mutedNote("Admin decisions on disputes are final. If you have additional evidence to submit, do so through the match page.")}
    `, `${filedByTeam} has opened a dispute for ${homeTeam} vs ${awayTeam}`),
  })
}

export async function sendParseFailedEmail({
  to,
  recipientName,
  matchId,
  homeTeam,
  awayTeam,
  filename,
}: {
  to: string
  recipientName: string
  matchId: string
  homeTeam: string
  awayTeam: string
  filename: string
}) {
  const matchUrl = `${APP_URL}/matches/${matchId}`
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Replay parse failed — ${homeTeam} vs ${awayTeam}`,
    html: layout(`
      ${badge("Action Required", "#C41C35")}
      ${heading("Replay Parse Failed")}
      ${bodyText(`Hey ${recipientName},`)}
      ${bodyText(`We were unable to parse the replay file for <strong style="color:#ffffff;">${homeTeam} vs ${awayTeam}</strong>.`)}
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="
        background:rgba(196,28,53,0.06);
        border:1px solid rgba(196,28,53,0.2);
        border-radius:10px;
        margin:16px 0;
      ">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0;font-size:12px;color:#71717a;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;">Failed file</p>
            <p style="margin:4px 0 0;font-size:14px;color:#fca5a5;font-family:monospace;">${filename}</p>
          </td>
        </tr>
      </table>
      ${bodyText(`Please re-upload a valid <code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:13px;color:#e4e4e7;">.replay</code> file from the match page.`)}
      ${actionButton(matchUrl, "Re-upload Replay")}
      ${divider()}
      ${mutedNote("If the issue persists after re-uploading, contact a staff member via Discord.")}
    `, `Replay parse failed for ${homeTeam} vs ${awayTeam}`),
  })
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function sendPasswordResetEmail({
  to,
  recipientName,
  resetUrl,
}: {
  to: string
  recipientName: string
  resetUrl: string
}): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Reset your C3 Esports password",
    html: layout(`
      ${badge("Account Security")}
      ${heading("Password Reset")}
      ${bodyText(`Hi ${recipientName},`)}
      ${bodyText(`Someone requested a password reset for your C3 Esports account. If this was you, click below — the link expires in <strong style="color:#ffffff;">1 hour</strong>.`)}
      ${actionButton(resetUrl, "Reset Password")}
      ${divider()}
      ${mutedNote("If you didn't request this, you can safely ignore this email. Your password won't change.")}
    `, "Reset your C3 Esports account password"),
  })
}

// ---------------------------------------------------------------------------
// Edu verification
// ---------------------------------------------------------------------------

export async function sendEduVerificationEmail({
  to,
  token,
  name,
}: {
  to: string
  token: string  // raw (un-hashed) token
  name: string
}) {
  const verifyUrl = `${APP_URL}/api/edu-verify/confirm?token=${token}`

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Verify your college email — C3 Esports",
    html: layout(`
      ${badge("Verification", "#16a34a")}
      ${heading("Confirm Your College Email")}
      ${bodyText(`Hey ${name},`)}
      ${bodyText(`Click below to verify your college email address and confirm your eligibility to compete in C3 Esports. The link expires in <strong style="color:#ffffff;">24 hours</strong>.`)}
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="
        background:rgba(255,255,255,0.03);
        border:1px solid rgba(255,255,255,0.07);
        border-radius:10px;
        margin:16px 0;
      ">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0;font-size:12px;color:#71717a;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;">Verifying address</p>
            <p style="margin:4px 0 0;font-size:14px;color:#a1a1aa;">${to}</p>
          </td>
        </tr>
      </table>
      ${actionButton(verifyUrl, "Verify College Email")}
      ${divider()}
      ${mutedNote("If you did not request this, you can safely ignore this email.")}
    `, `Verify your college email for C3 Esports`),
  })
}

// ---------------------------------------------------------------------------
// Account email verification
// ---------------------------------------------------------------------------

export async function sendEmailVerificationEmail(
  to: string,
  name: string | null | undefined,
  token: string,
) {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`
  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Verify your C3 Esports account",
    html: layout(`
      ${heading("Confirm your email address")}
      ${bodyText(`Hey${name ? ` ${name}` : ""},`)}
      ${bodyText("Click the button below to verify your email address and unlock full access to C3 Esports — including editing your profile and joining teams.")}
      ${actionButton(verifyUrl, "Verify Email Address")}
      ${divider()}
      ${mutedNote("This link expires in 24 hours. If you didn't create a C3 Esports account, you can safely ignore this email.")}
    `, "Verify your C3 Esports account"),
  })
}
