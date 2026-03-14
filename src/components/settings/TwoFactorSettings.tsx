"use client"

import { useState } from "react"
import QRCode from "qrcode"

interface Props {
  twoFactorEnabled: boolean
  hasPassword: boolean // 2FA only available for credentials accounts
}

export function TwoFactorSettings({ twoFactorEnabled, hasPassword }: Props) {
  const [step, setStep]         = useState<"idle" | "setup" | "confirm" | "disable">("idle")
  const [qrDataUrl, setQrUrl]   = useState<string | null>(null)
  const [secret, setSecret]     = useState<string | null>(null)
  const [totp, setTotp]         = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [enabled, setEnabled]   = useState(twoFactorEnabled)

  if (!hasPassword) {
    return (
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
        Two-factor authentication is only available for email/password accounts.
      </p>
    )
  }

  async function startSetup() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch("/api/auth/2fa/setup", { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      const url = await QRCode.toDataURL(data.otpauthUrl)
      setQrUrl(url)
      setSecret(data.secret)
      setStep("setup")
    } catch {
      setError("Failed to start 2FA setup.")
    } finally {
      setLoading(false)
    }
  }

  async function confirmEnable() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totp }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setEnabled(true)
      setStep("idle")
      setTotp("")
      setQrUrl(null)
      setSecret(null)
    } catch {
      setError("Failed to enable 2FA.")
    } finally {
      setLoading(false)
    }
  }

  async function confirmDisable() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totp }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setEnabled(false)
      setStep("idle")
      setTotp("")
    } catch {
      setError("Failed to disable 2FA.")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.85)",
    borderRadius: "0.75rem",
    padding: "0.625rem 0.875rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    letterSpacing: "0.15em",
    textAlign: "center" as const,
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
            Two-factor authentication
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {enabled
              ? "Your account is protected with an authenticator app."
              : "Add a second layer of security to your account."}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={
            enabled
              ? { background: "rgba(22,163,74,0.15)", color: "rgba(134,239,172,0.9)" }
              : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }
          }
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {error && (
        <p
          className="text-xs rounded-lg px-3 py-2"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "rgba(252,165,165,0.9)" }}
        >
          {error}
        </p>
      )}

      {/* ── Setup flow ───────────────────────────────────────────────────── */}
      {step === "idle" && !enabled && (
        <button
          onClick={startSetup}
          disabled={loading}
          className="self-start text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 disabled:opacity-50"
          style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "rgba(147,197,253,0.9)" }}
        >
          {loading ? "Setting up…" : "Enable 2FA"}
        </button>
      )}

      {step === "setup" && qrDataUrl && (
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Scan this QR code with Google Authenticator, Authy, or any TOTP app:
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="2FA QR code" className="w-40 h-40 rounded-xl self-start" />
          {secret && (
            <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
              Can&apos;t scan? Enter manually: <span style={{ color: "rgba(255,255,255,0.6)" }}>{secret}</span>
            </p>
          )}
          <div className="flex flex-col gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={inputStyle}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmEnable}
                disabled={loading || totp.length < 6}
                className="flex-1 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 disabled:opacity-50"
                style={{ background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", color: "rgba(134,239,172,0.9)" }}
              >
                {loading ? "Verifying…" : "Confirm & Enable"}
              </button>
              <button
                onClick={() => { setStep("idle"); setQrUrl(null); setSecret(null); setTotp(""); setError(null) }}
                className="text-sm px-4 py-2 rounded-xl transition-all duration-150"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Disable flow ─────────────────────────────────────────────────── */}
      {step === "idle" && enabled && (
        <button
          onClick={() => setStep("disable")}
          className="self-start text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "rgba(252,165,165,0.7)" }}
        >
          Disable 2FA
        </button>
      )}

      {step === "disable" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Enter your current 2FA code to confirm:
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter 6-digit code"
            value={totp}
            onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={inputStyle}
          />
          <div className="flex gap-2">
            <button
              onClick={confirmDisable}
              disabled={loading || totp.length < 6}
              className="flex-1 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 disabled:opacity-50"
              style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", color: "rgba(252,165,165,0.9)" }}
            >
              {loading ? "Disabling…" : "Confirm Disable"}
            </button>
            <button
              onClick={() => { setStep("idle"); setTotp(""); setError(null) }}
              className="text-sm px-4 py-2 rounded-xl transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
