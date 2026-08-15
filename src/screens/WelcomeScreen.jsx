import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GlassSvg } from "@/components/GlassSvg"
import { Btn, Card } from "@/components/primitives"
import { clearPendingInviteCode, storePendingInviteCode } from "@/services/auth"

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const [code, setCode] = useState("")

  // Real validity (exists / not expired / not already used) can only be
  // checked server-side, and only for an authenticated caller - the
  // redeem_invitation() function requires auth.uid(). So this just carries
  // the code through account creation; the actual redemption + error
  // reporting happens in JoinScreen once a session exists.
  const handleSubmit = () => {
    const trimmed = code.trim()
    if (!trimmed) return
    storePendingInviteCode(trimmed)
    navigate("/signin?mode=join")
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(34,211,238,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(167,139,250,0.06) 0%, transparent 50%)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.25)",
              marginBottom: 20,
            }}
            className="glow-cyan"
          >
            <GlassSvg
              type="martini"
              liquidColor="#22d3ee"
              size={48}
              avail="perfect"
            />
          </div>
          <h1
            style={{
              margin: "0 0 8px",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 32,
              color: "var(--text)",
              letterSpacing: "-0.03em",
            }}
          >
            Cocktail Library
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--text2)",
              fontSize: 15,
              lineHeight: 1.5,
            }}
          >
            An invite-only collection of classic recipes and your personal bar —
            in one place.
          </p>
        </div>

        <Card
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text2)",
                marginBottom: 8,
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Invitation Code
            </div>
            <input
              placeholder="CL-XXXXX-XXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border-s)",
                borderRadius: "var(--r-sm)",
                padding: "12px 14px",
                color: "var(--text)",
                fontSize: 15,
                fontFamily: "var(--font-mono)",
                width: "100%",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            />
          </div>
          <Btn
            variant="primary"
            full
            disabled={!code.trim()}
            onClick={handleSubmit}
          >
            Continue with invitation
          </Btn>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{ flex: 1, height: 1, background: "var(--border-s)" }}
            />
            <span style={{ fontSize: 12, color: "var(--text3)" }}>or</span>
            <div
              style={{ flex: 1, height: 1, background: "var(--border-s)" }}
            />
          </div>
          <Btn
            variant="ghost"
            full
            onClick={() => {
              clearPendingInviteCode()
              navigate("/signin")
            }}
          >
            Sign in to existing account
          </Btn>
        </Card>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--text3)",
            margin: 0,
          }}
        >
          Cocktail Library is currently invite-only. <br />
          Each invitation is single-use.
        </p>
      </div>
    </div>
  )
}
