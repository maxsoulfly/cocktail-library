import { useState } from "react"
import { Btn, Card, Input } from "@/components/primitives"
import { setMembershipRevoked, setUserRole } from "@/services/membership"

// Role changes and block/unblock, both admin-gated SECURITY DEFINER
// functions - see 20260823100000_admin_user_management.sql for why
// (profiles.role and memberships had no admin write path at all before
// this). confirmAction holds { userId, type: "block" | "promote" } -
// promoting to admin and blocking both get an inline confirm since they
// grant or cut off real access; demoting and unblocking don't, matching the
// app's existing pattern. Neither action ever renders for the signed-in
// admin's own row - the backend already refuses a self-target, but there's
// no reason to show a button that can only ever fail.
export function UsersTab({
  users,
  usersLoading,
  currentUserId,
  onUsersChanged,
}) {
  const [userQuery, setUserQuery] = useState("")
  const [userActionId, setUserActionId] = useState(null)
  const [userActionError, setUserActionError] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const filteredUsers = users.filter((u) =>
    (u.display_name ?? "").toLowerCase().includes(userQuery.toLowerCase()),
  )

  const handleToggleRole = async (u) => {
    setUserActionId(u.id)
    setUserActionError(null)
    try {
      await setUserRole(u.id, u.role === "admin" ? "member" : "admin")
      onUsersChanged()
      setConfirmAction(null)
    } catch (err) {
      setUserActionError(err.message)
    } finally {
      setUserActionId(null)
    }
  }

  const handleToggleBlocked = async (u) => {
    setUserActionId(u.id)
    setUserActionError(null)
    try {
      await setMembershipRevoked(u.id, !u.membership?.revoked_at)
      onUsersChanged()
      setConfirmAction(null)
    } catch (err) {
      setUserActionError(err.message)
    } finally {
      setUserActionId(null)
    }
  }

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
        Every registered user. Blocking cuts off access immediately
        (RLS-enforced) without deleting their account or data; unblock reverses
        it. You can't change your own role or block yourself.
      </p>
      <Input
        placeholder="Search users..."
        value={userQuery}
        onChange={setUserQuery}
      />
      {usersLoading ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
          Loading...
        </p>
      ) : filteredUsers.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
          No matching users.
        </p>
      ) : (
        filteredUsers.map((u) => {
          const isSelf = u.id === currentUserId
          const isBlocked = Boolean(u.membership?.revoked_at)
          const statusLabel = !u.membership
            ? "Not a member"
            : isBlocked
              ? "Blocked"
              : "Active"
          const statusColor = !u.membership
            ? "var(--text3)"
            : isBlocked
              ? "var(--coral)"
              : "var(--green)"
          return (
            <Card key={u.id} style={{ padding: "14px 16px" }}>
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
                      fontSize: 15,
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: 3,
                    }}
                  >
                    {u.display_name ?? "Unnamed"}
                    {isSelf && (
                      <span
                        style={{
                          color: "var(--text3)",
                          fontWeight: 400,
                        }}
                      >
                        {" "}
                        (you)
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text3)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ textTransform: "capitalize" }}>
                      {u.role}
                    </span>
                    <span>·</span>
                    <span style={{ color: statusColor }}>{statusLabel}</span>
                  </div>
                </div>
                {!isSelf && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() =>
                        u.role === "admin"
                          ? handleToggleRole(u)
                          : setConfirmAction({
                              userId: u.id,
                              type: "promote",
                            })
                      }
                      disabled={userActionId === u.id}
                      style={{
                        background: "rgba(167,139,250,0.1)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        cursor: "pointer",
                        color: "var(--violet)",
                        fontSize: 12,
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                      }}
                    >
                      {u.role === "admin" ? "Demote to Member" : "Make Admin"}
                    </button>
                    {u.membership && (
                      <button
                        onClick={() =>
                          isBlocked
                            ? handleToggleBlocked(u)
                            : setConfirmAction({
                                userId: u.id,
                                type: "block",
                              })
                        }
                        disabled={userActionId === u.id}
                        style={{
                          background: isBlocked
                            ? "rgba(52,211,153,0.1)"
                            : "rgba(251,113,133,0.1)",
                          border: `1px solid ${
                            isBlocked
                              ? "rgba(52,211,153,0.25)"
                              : "rgba(251,113,133,0.25)"
                          }`,
                          borderRadius: 8,
                          padding: "6px 12px",
                          cursor: "pointer",
                          color: isBlocked ? "var(--green)" : "var(--coral)",
                          fontSize: 12,
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                        }}
                      >
                        {isBlocked ? "Unblock" : "Block"}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {confirmAction?.userId === u.id && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px",
                    background:
                      confirmAction.type === "block"
                        ? "rgba(251,113,133,0.08)"
                        : "rgba(167,139,250,0.08)",
                    borderRadius: 8,
                    border: `1px solid ${
                      confirmAction.type === "block"
                        ? "rgba(251,113,133,0.25)"
                        : "rgba(167,139,250,0.25)"
                    }`,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontSize: 13,
                      color: "var(--text2)",
                    }}
                  >
                    {userActionError
                      ? userActionError
                      : confirmAction.type === "block"
                        ? `Block "${u.display_name ?? "this user"}"? They lose all access immediately until unblocked.`
                        : `Make "${u.display_name ?? "this user"}" an admin? They'll get full Admin dashboard access.`}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn
                      variant={
                        confirmAction.type === "block" ? "danger" : "primary"
                      }
                      small
                      disabled={userActionId === u.id}
                      onClick={() =>
                        confirmAction.type === "block"
                          ? handleToggleBlocked(u)
                          : handleToggleRole(u)
                      }
                    >
                      {confirmAction.type === "block" ? "Block" : "Make Admin"}
                    </Btn>
                    <Btn
                      variant="ghost"
                      small
                      onClick={() => {
                        setConfirmAction(null)
                        setUserActionError(null)
                      }}
                    >
                      Cancel
                    </Btn>
                  </div>
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
