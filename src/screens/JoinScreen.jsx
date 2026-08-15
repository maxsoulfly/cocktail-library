import { useEffect, useState } from "react"
import { IconLock } from "@/components/icons"
import { Btn, Card } from "@/components/primitives"
import { redeemInvitation, signOut, takePendingInviteCode } from "@/services/auth"

// Shown when a Supabase session exists but no memberships row does -
// authentication alone never grants app access. If the user arrived via the
// Welcome screen's invite-code flow, a code is waiting in sessionStorage and
// gets redeemed automatically; otherwise (e.g. they signed in directly, or a
// previous attempt failed) they can enter/retry a code here.
export default function JoinScreen({ onRedeemed }) {
  const [status, setStatus] = useState("checking") // checking | form | redeeming
  const [code, setCode] = useState("")
  const [error, setError] = useState(null)

  useEffect(() => {
    const pending = takePendingInviteCode()
    if (pending) {
      attemptRedeem(pending)
    } else {
      setStatus("form")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const attemptRedeem = async (value) => {
    setStatus("redeeming")
    setError(null)
    try {
      await redeemInvitation(value)
      onRedeemed()
    } catch (err) {
      setError(err.message || "That invitation code didn't work.")
      setStatus("form")
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 18, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", marginBottom: 16 }}>
            <IconLock size={28} style={{ color: "var(--almost)" }} />
          </div>
          <h1 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "var(--text)" }}>Invitation needed</h1>
          <p style={{ margin: 0, color: "var(--text2)", fontSize: 14, lineHeight: 1.5 }}>
            You're signed in, but Cocktail Library is invite-only. Enter a valid invitation code to get access.
          </p>
        </div>

        <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {status === "checking" || status === "redeeming" ? (
            <p style={{ margin: 0, textAlign: "center", color: "var(--text2)", fontSize: 14 }}>Checking your invitation...</p>
          ) : (
            <>
              <input
                placeholder="CL-XXXXX-XXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && code.trim() && attemptRedeem(code.trim())}
                style={{ background: "var(--surface2)", border: `1px solid ${error ? "var(--coral)" : "var(--border-s)"}`, borderRadius: "var(--r-sm)", padding: "12px 14px", color: "var(--text)", fontSize: 15, fontFamily: "var(--font-mono)", width: "100%", letterSpacing: "0.08em", textTransform: "uppercase" }}
              />
              {error && <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>{error}</p>}
              <Btn variant="primary" full disabled={!code.trim()} onClick={() => attemptRedeem(code.trim())}>Redeem invitation</Btn>
            </>
          )}
          <Btn variant="ghost" full onClick={() => signOut()}>Sign out</Btn>
        </Card>
      </div>
    </div>
  )
}
