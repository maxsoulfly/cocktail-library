import { useEffect, useState } from "react"
import clsx from "clsx"
import { IconLock } from "@/components/icons"
import { Btn, Card } from "@/components/primitives"
import {
  redeemInvitation,
  signOut,
  takePendingInviteCode,
} from "@/services/auth"

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
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center py-8 px-6">
      <div className="w-full max-w-100 flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[18px] bg-amber/10 border border-amber/25 mb-4">
            <IconLock size={28} className="text-almost" />
          </div>
          <h1 className="mb-2 font-display font-extrabold text-2xl text-tx">
            Invitation needed
          </h1>
          <p className="text-tx2 text-sm leading-normal">
            You're signed in, but Rusty Pipes is invite-only. Enter a valid
            invitation code to get access.
          </p>
        </div>

        <Card className="p-6 flex flex-col gap-3.5">
          {status === "checking" || status === "redeeming" ? (
            <p className="text-center text-tx2 text-sm">
              Checking your invitation...
            </p>
          ) : (
            <>
              <input
                placeholder="CL-XXXXX-XXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && code.trim() && attemptRedeem(code.trim())
                }
                className={clsx(
                  "bg-surface2 border rounded-sm py-3 px-3.5 text-tx text-[15px] font-mono w-full tracking-[0.08em] uppercase",
                  error ? "border-coral" : "border-bdr",
                )}
              />
              {error && <p className="text-xs text-coral">{error}</p>}
              <Btn
                variant="primary"
                full
                disabled={!code.trim()}
                onClick={() => attemptRedeem(code.trim())}
              >
                Redeem invitation
              </Btn>
            </>
          )}
          <Btn variant="ghost" full onClick={() => signOut()}>
            Sign out
          </Btn>
        </Card>
      </div>
    </div>
  )
}
