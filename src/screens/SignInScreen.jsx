import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { IconBack, IconLock } from "@/components/icons"
import { Btn, Card, Input } from "@/components/primitives"
import {
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/services/auth"

// mode=join (arrived from the Welcome screen with an invite code pending in
// sessionStorage) shows a signup form; anything else is a plain sign-in.
// Either way, once Supabase actually establishes a session, the App-level
// auth listener takes over routing - this screen never navigates on success
// itself, only on error/back.
export default function SignInScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode") === "join" ? "join" : "signin"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [view, setView] = useState("form") // form | recover
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  const redirectTo = `${window.location.origin}/signin`

  const handleGoogle = async () => {
    setError(null)
    try {
      await signInWithGoogle(redirectTo)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEmailSubmit = async () => {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === "join") {
        const data = await signUpWithEmail(email, password, displayName.trim())
        if (!data.session) {
          setInfo(
            "Check your email to confirm your account, then come back and sign in.",
          )
        }
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleRecover = async () => {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      await sendPasswordReset(email, redirectTo)
      setInfo("If that email has an account, a reset link is on its way.")
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const heading =
    view === "recover"
      ? "Reset password"
      : mode === "join"
        ? "Create your account"
        : "Welcome back"
  const subheading =
    view === "recover"
      ? "Enter your email and we'll send a reset link."
      : mode === "join"
        ? "Set a password to finish joining Cocktail Library."
        : "Sign in to your Cocktail Library account."

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center py-8 px-6">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 60% 30%, rgba(167,139,250,0.07) 0%, transparent 50%)",
        }}
      />
      <div className="relative w-full max-w-100 flex flex-col gap-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-tx2 text-sm p-0"
        >
          <IconBack size={16} /> Back
        </button>
        <div>
          <h1 className="mb-1.5 font-display font-extrabold text-[28px] text-tx tracking-[-0.02em]">
            {heading}
          </h1>
          <p className="text-tx2 text-sm">{subheading}</p>
        </div>
        <Card className="p-6 flex flex-col gap-3.5">
          {view === "form" ? (
            <>
              <button
                onClick={handleGoogle}
                className="flex items-center justify-center gap-2.5 bg-surface3 border border-bdr rounded-sm py-[11px] px-4 cursor-pointer text-tx text-sm font-display font-semibold w-full"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-2.5">
                <div className="flex-1 h-px bg-bdr" />
                <span className="text-xs text-tx3">or</span>
                <div className="flex-1 h-px bg-bdr" />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleEmailSubmit()
                }}
                className="flex flex-col gap-3.5"
              >
                {mode === "join" && (
                  <Input
                    label="Display Name"
                    placeholder="What other members will see you as"
                    value={displayName}
                    onChange={setDisplayName}
                    autoComplete="name"
                  />
                )}
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  autoComplete="email"
                />
                <Input
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  type="password"
                  autoComplete={
                    mode === "join" ? "new-password" : "current-password"
                  }
                />
                {error && <p className="text-xs text-coral">{error}</p>}
                {info && <p className="text-xs text-cyan">{info}</p>}
                <Btn
                  type="submit"
                  variant="primary"
                  full
                  disabled={
                    busy ||
                    !email ||
                    !password ||
                    (mode === "join" && !displayName.trim())
                  }
                >
                  {mode === "join" ? "Create account" : "Sign in"}
                </Btn>
              </form>
              {mode !== "join" && (
                <button
                  onClick={() => {
                    setView("recover")
                    setError(null)
                    setInfo(null)
                  }}
                  className="bg-transparent border-none cursor-pointer text-cyan text-[13px] p-0 text-center"
                >
                  Forgot your password?
                </button>
              )}
            </>
          ) : (
            <>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                type="email"
              />
              {error && <p className="text-xs text-coral">{error}</p>}
              {info && <p className="text-xs text-cyan">{info}</p>}
              <Btn
                variant="primary"
                full
                disabled={busy || !email}
                onClick={handleRecover}
              >
                Send reset link
              </Btn>
              <button
                onClick={() => {
                  setView("form")
                  setError(null)
                  setInfo(null)
                }}
                className="bg-transparent border-none cursor-pointer text-tx2 text-[13px] p-0 text-center"
              >
                Back to sign in
              </button>
            </>
          )}
        </Card>
        <p className="text-center text-xs text-tx3">
          <IconLock size={12} className="inline align-middle mr-1" />
          Cocktail Library is invite-only. No accounts without an invitation.
        </p>
      </div>
    </div>
  )
}
