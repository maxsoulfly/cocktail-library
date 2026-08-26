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
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center py-8 px-6">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(34,211,238,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(167,139,250,0.06) 0%, transparent 50%)",
        }}
      />
      <div className="relative w-full max-w-100 flex flex-col gap-8">
        <div className="text-center">
          <div className="glow-cyan inline-flex items-center justify-center w-18 h-18 rounded-[20px] bg-cyan/10 border border-cyan/25 mb-5">
            <GlassSvg
              type="martini"
              liquidColor="#22d3ee"
              size={48}
              avail="perfect"
            />
          </div>
          <h1 className="mb-2 font-display font-extrabold text-[32px] text-tx tracking-[-0.03em]">
            Rusty Pipes
          </h1>
          <p className="text-tx2 text-[15px] leading-normal">
            An invite-only collection of classic recipes and your personal bar —
            in one place.
          </p>
        </div>

        <Card className="p-6 flex flex-col gap-4">
          <div>
            <div className="text-[13px] font-semibold text-tx2 mb-2 font-display uppercase tracking-[0.06em]">
              Invitation Code
            </div>
            <input
              placeholder="CL-XXXXX-XXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="bg-surface2 border border-bdr rounded-sm py-3 px-3.5 text-tx text-[15px] font-mono w-full tracking-[0.08em] uppercase"
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
          <div className="flex items-center gap-2.5">
            <div className="flex-1 h-px bg-bdr" />
            <span className="text-xs text-tx3">or</span>
            <div className="flex-1 h-px bg-bdr" />
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

        <p className="text-center text-xs text-tx3">
          Rusty Pipes is currently invite-only. <br />
          Each invitation is single-use.
        </p>
      </div>
    </div>
  )
}
