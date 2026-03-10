/**
 * Email utility — powered by Resend.
 * Set RESEND_API_KEY in your environment variables.
 * Set NEXT_PUBLIC_APP_URL to your production URL (e.g. https://c3esports.gg).
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
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:8px">College Email Verification</h2>
        <p>Hey ${name},</p>
        <p>
          Click the button below to verify <strong>${to}</strong> as your college email
          for C3 Esports. This link expires in <strong>24 hours</strong>.
        </p>
        <a
          href="${verifyUrl}"
          style="
            display:inline-block;
            margin:16px 0;
            padding:12px 24px;
            background:#7c3aed;
            color:#fff;
            border-radius:8px;
            text-decoration:none;
            font-weight:600;
          "
        >
          Verify College Email
        </a>
        <p style="color:#666;font-size:13px">
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="color:#999;font-size:12px">C3 Esports — Carolina Collegiate Clash</p>
      </div>
    `,
  })
}
