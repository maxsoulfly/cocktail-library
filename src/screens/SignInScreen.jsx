import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { IconBack, IconLock } from "@/components/icons"
import { Btn, Card, Input } from "@/components/primitives"

export default function SignInScreen() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [view, setView] = useState("signin") // signin | recover

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 60% 30%, rgba(167,139,250,0.07) 0%, transparent 50%)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 24 }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 14, padding: 0 }}>
          <IconBack size={16} /> Back
        </button>
        <div>
          <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--text)", letterSpacing: "-0.02em" }}>{view === "signin" ? "Welcome back" : "Reset password"}</h1>
          <p style={{ margin: 0, color: "var(--text2)", fontSize: 14 }}>{view === "signin" ? "Sign in to your Cocktail Library account." : "Enter your email and we'll send a reset link."}</p>
        </div>
        <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {view === "signin" ? (
            <>
              <button onClick={() => navigate("/home")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "var(--surface3)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", padding: "11px 16px", cursor: "pointer", color: "var(--text)", fontSize: 14, fontFamily: "var(--font-display)", fontWeight: 600, width: "100%" }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Continue with Google
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border-s)" }} />
                <span style={{ fontSize: 12, color: "var(--text3)" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "var(--border-s)" }} />
              </div>
              <Input label="Email" placeholder="you@example.com" value={email} onChange={setEmail} type="email" />
              <Input label="Password" placeholder="••••••••" value={password} onChange={setPassword} type="password" />
              <Btn variant="primary" full onClick={() => navigate("/home")}>Sign in</Btn>
              <button onClick={() => setView("recover")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cyan)", fontSize: 13, padding: 0, textAlign: "center" }}>Forgot your password?</button>
            </>
          ) : (
            <>
              <Input label="Email" placeholder="you@example.com" value={email} onChange={setEmail} type="email" />
              <Btn variant="primary" full onClick={() => setView("signin")}>Send reset link</Btn>
              <button onClick={() => setView("signin")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 13, padding: 0, textAlign: "center" }}>Back to sign in</button>
            </>
          )}
        </Card>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text3)", margin: 0 }}>
          <IconLock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
          Cocktail Library is invite-only. No accounts without an invitation.
        </p>
      </div>
    </div>
  )
}
