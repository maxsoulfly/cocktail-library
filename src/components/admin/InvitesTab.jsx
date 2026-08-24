import { useState } from "react"
import clsx from "clsx"
import { IconCheck, IconCopy, IconPlus, IconTrash } from "@/components/icons"
import { Btn, Card } from "@/components/primitives"
import {
  deriveInvitationStatus,
  generateInvitation,
  revokeInvitation,
} from "@/services/invitations"

const STATUS_TONE = {
  active: "text-green",
  redeemed: "text-cyan",
  expired: "text-unavail",
  revoked: "text-coral",
}
const STATUS_DOTS = {
  active: "●",
  redeemed: "◎",
  expired: "○",
  revoked: "⊘",
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

export function InvitesTab({ invites, setInvites, invitesLoading }) {
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [revokingInviteId, setRevokingInviteId] = useState(null)
  const [inviteError, setInviteError] = useState(null)
  const [copied, setCopied] = useState(null)

  const generateInvite = async () => {
    setGeneratingInvite(true)
    setInviteError(null)
    try {
      const created = await generateInvitation()
      setInvites([{ ...created, redeemed_by_profile: null }, ...invites])
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setGeneratingInvite(false)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const revokeInvite = async (id) => {
    setRevokingInviteId(id)
    setInviteError(null)
    try {
      const revoked = await revokeInvitation(id)
      setInvites(invites.map((i) => (i.id === id ? revoked : i)))
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setRevokingInviteId(null)
    }
  }

  return (
    <div className="fade-in flex flex-col gap-3.5">
      <Btn
        variant="primary"
        disabled={generatingInvite}
        onClick={generateInvite}
      >
        <IconPlus size={15} />{" "}
        {generatingInvite ? "Generating..." : "Generate Invitation"}
      </Btn>
      {inviteError && <p className="text-xs text-coral">{inviteError}</p>}
      {invitesLoading ? (
        <p className="text-sm text-tx3">Loading...</p>
      ) : invites.length === 0 ? (
        <p className="text-sm text-tx3">No invitations yet.</p>
      ) : (
        invites.map((inv) => {
          const status = deriveInvitationStatus(inv)
          return (
            <Card key={inv.id} className="py-3.5 px-4">
              <div className="flex items-start gap-2.5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-sm text-tx tracking-[0.06em]">
                      {inv.code}
                    </span>
                    <span
                      className={clsx(
                        "text-[11px] font-mono",
                        STATUS_TONE[status],
                      )}
                    >
                      {STATUS_DOTS[status]} {status}
                    </span>
                  </div>
                  <div className="text-xs text-tx3">
                    Created {formatDate(inv.created_at)} · Expires{" "}
                    {formatDate(inv.expires_at)}
                  </div>
                  {inv.redeemed_by_profile && (
                    <div className="text-xs text-cyan mt-0.5">
                      Redeemed by{" "}
                      {inv.redeemed_by_profile.display_name ?? "a member"}
                    </div>
                  )}
                </div>
                {status === "active" && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => copyCode(inv.code)}
                      className={clsx(
                        "border border-bdr rounded-[6px] py-[5px] px-2.5 cursor-pointer text-xs flex items-center gap-1",
                        copied === inv.code
                          ? "bg-green/15 text-green"
                          : "bg-surface3 text-tx2",
                      )}
                    >
                      {copied === inv.code ? (
                        <IconCheck size={12} />
                      ) : (
                        <IconCopy size={12} />
                      )}
                    </button>
                    <button
                      onClick={() => revokeInvite(inv.id)}
                      disabled={revokingInviteId === inv.id}
                      className="bg-coral/10 border border-coral/25 rounded-[6px] py-[5px] px-2.5 cursor-pointer text-coral text-xs"
                    >
                      <IconTrash size={12} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}
