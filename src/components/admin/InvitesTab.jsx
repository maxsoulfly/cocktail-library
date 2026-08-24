import { useState } from "react"
import { IconCheck, IconCopy, IconPlus, IconTrash } from "@/components/icons"
import { Btn, Card } from "@/components/primitives"
import {
  deriveInvitationStatus,
  generateInvitation,
  revokeInvitation,
} from "@/services/invitations"

const STATUS_COLORS = {
  active: "var(--green)",
  redeemed: "var(--cyan)",
  expired: "var(--unavail)",
  revoked: "var(--coral)",
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
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <Btn
        variant="primary"
        disabled={generatingInvite}
        onClick={generateInvite}
      >
        <IconPlus size={15} />{" "}
        {generatingInvite ? "Generating..." : "Generate Invitation"}
      </Btn>
      {inviteError && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
          {inviteError}
        </p>
      )}
      {invitesLoading ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
          Loading...
        </p>
      ) : invites.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
          No invitations yet.
        </p>
      ) : (
        invites.map((inv) => {
          const status = deriveInvitationStatus(inv)
          return (
            <Card key={inv.id} style={{ padding: "14px 16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--text)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {inv.code}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: STATUS_COLORS[status],
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {STATUS_DOTS[status]} {status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>
                    Created {formatDate(inv.created_at)} · Expires{" "}
                    {formatDate(inv.expires_at)}
                  </div>
                  {inv.redeemed_by_profile && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--cyan)",
                        marginTop: 2,
                      }}
                    >
                      Redeemed by{" "}
                      {inv.redeemed_by_profile.display_name ?? "a member"}
                    </div>
                  )}
                </div>
                {status === "active" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => copyCode(inv.code)}
                      style={{
                        background:
                          copied === inv.code
                            ? "rgba(52,211,153,0.15)"
                            : "var(--surface3)",
                        border: "1px solid var(--border-s)",
                        borderRadius: 6,
                        padding: "5px 10px",
                        cursor: "pointer",
                        color:
                          copied === inv.code ? "var(--green)" : "var(--text2)",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
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
                      style={{
                        background: "rgba(251,113,133,0.1)",
                        border: "1px solid rgba(251,113,133,0.25)",
                        borderRadius: 6,
                        padding: "5px 10px",
                        cursor: "pointer",
                        color: "var(--coral)",
                        fontSize: 12,
                      }}
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
