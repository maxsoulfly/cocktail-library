import { useState } from "react"
import clsx from "clsx"
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
    <div className="fade-in flex flex-col gap-3">
      <p className="text-[13px] text-tx2">
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
        <p className="text-sm text-tx3">Loading...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-sm text-tx3">No matching users.</p>
      ) : (
        filteredUsers.map((u) => {
          const isSelf = u.id === currentUserId
          const isBlocked = Boolean(u.membership?.revoked_at)
          const statusLabel = !u.membership
            ? "Not a member"
            : isBlocked
              ? "Blocked"
              : "Active"
          const statusTone = !u.membership
            ? "text-tx3"
            : isBlocked
              ? "text-coral"
              : "text-green"
          return (
            <Card key={u.id} className="py-3.5 px-4">
              <div className="flex items-start gap-2.5">
                <div className="flex-1">
                  <div className="text-[15px] font-display font-bold text-tx mb-[3px]">
                    {u.display_name ?? "Unnamed"}
                    {isSelf && (
                      <span className="text-tx3 font-normal"> (you)</span>
                    )}
                  </div>
                  <div className="text-xs text-tx3 flex items-center gap-1.5">
                    <span className="capitalize">{u.role}</span>
                    <span>·</span>
                    <span className={statusTone}>{statusLabel}</span>
                  </div>
                </div>
                {!isSelf && (
                  <div className="flex gap-2">
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
                      className="bg-violet/10 border border-violet/25 rounded-sm py-1.5 px-3 cursor-pointer text-violet text-xs font-display font-semibold"
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
                        className={clsx(
                          "border rounded-sm py-1.5 px-3 cursor-pointer text-xs font-display font-semibold",
                          isBlocked
                            ? "bg-green/10 border-green/25 text-green"
                            : "bg-coral/10 border-coral/25 text-coral",
                        )}
                      >
                        {isBlocked ? "Unblock" : "Block"}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {confirmAction?.userId === u.id && (
                <div
                  className={clsx(
                    "mt-3 p-3 rounded-sm border",
                    confirmAction.type === "block"
                      ? "bg-coral/8 border-coral/25"
                      : "bg-violet/8 border-violet/25",
                  )}
                >
                  <p className="mb-2.5 text-[13px] text-tx2">
                    {userActionError
                      ? userActionError
                      : confirmAction.type === "block"
                        ? `Block "${u.display_name ?? "this user"}"? They lose all access immediately until unblocked.`
                        : `Make "${u.display_name ?? "this user"}" an admin? They'll get full Admin dashboard access.`}
                  </p>
                  <div className="flex gap-2">
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
