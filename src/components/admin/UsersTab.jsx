import { useState } from "react"
import clsx from "clsx"
import { Btn, Card, Input, Select } from "@/components/primitives"
import { setMembershipRevoked, setUserRole } from "@/services/membership"

// Extensible on purpose: a role select + a "Confirm change" button that only
// activates once the selection differs from the row's current role, rather
// than a hardcoded pairwise toggle - the user's own design call, chosen
// specifically so a future 4th level needs no new button combinatorics. The
// deliberate select-then-click is the confirmation step itself; no separate
// popup panel layered on top.
const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin" },
]

// Block/unblock is a separate, admin-gated SECURITY DEFINER function - see
// 20260823100000_admin_user_management.sql. Block gets an inline confirm
// since it cuts off real access immediately; unblock doesn't, matching the
// app's existing "grants confirm, revocations don't" pattern. Neither role
// changes nor block/unblock ever render for the signed-in admin's own row -
// the backend already refuses a self-target, but there's no reason to show
// a control that can only ever fail.
export function UsersTab({
  users,
  usersLoading,
  currentUserId,
  onUsersChanged,
}) {
  const [userQuery, setUserQuery] = useState("")
  const [userActionId, setUserActionId] = useState(null)
  const [userActionError, setUserActionError] = useState(null)
  const [roleSelections, setRoleSelections] = useState({})
  const [confirmBlockId, setConfirmBlockId] = useState(null)

  const filteredUsers = users.filter((u) =>
    (u.display_name ?? "").toLowerCase().includes(userQuery.toLowerCase()),
  )

  const handleChangeRole = async (u, newRole) => {
    setUserActionId(u.id)
    setUserActionError(null)
    try {
      await setUserRole(u.id, newRole)
      onUsersChanged()
      setRoleSelections((s) => {
        const next = { ...s }
        delete next[u.id]
        return next
      })
    } catch (err) {
      setUserActionError({ userId: u.id, message: err.message })
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
      setConfirmBlockId(null)
    } catch (err) {
      setUserActionError({ userId: u.id, message: err.message })
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
          const selectedRole = roleSelections[u.id] ?? u.role
          const roleChanged = selectedRole !== u.role
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
                  <div className="flex items-center gap-2">
                    <div className="w-28">
                      <Select
                        small
                        value={selectedRole}
                        onChange={(newRole) =>
                          setRoleSelections((s) => ({ ...s, [u.id]: newRole }))
                        }
                        options={ROLE_OPTIONS}
                      />
                    </div>
                    <Btn
                      variant="primary"
                      small
                      disabled={!roleChanged || userActionId === u.id}
                      onClick={() => handleChangeRole(u, selectedRole)}
                    >
                      Confirm
                    </Btn>
                    {u.membership && (
                      <button
                        onClick={() =>
                          isBlocked
                            ? handleToggleBlocked(u)
                            : setConfirmBlockId(u.id)
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
              {userActionError?.userId === u.id && confirmBlockId !== u.id && (
                <p className="mt-2 text-xs text-coral">
                  {userActionError.message}
                </p>
              )}
              {confirmBlockId === u.id && (
                <div className="mt-3 p-3 rounded-sm border bg-coral/8 border-coral/25">
                  <p className="mb-2.5 text-[13px] text-tx2">
                    {userActionError?.userId === u.id
                      ? userActionError.message
                      : `Block "${u.display_name ?? "this user"}"? They lose all access immediately until unblocked.`}
                  </p>
                  <div className="flex gap-2">
                    <Btn
                      variant="danger"
                      small
                      disabled={userActionId === u.id}
                      onClick={() => handleToggleBlocked(u)}
                    >
                      Block
                    </Btn>
                    <Btn
                      variant="ghost"
                      small
                      onClick={() => {
                        setConfirmBlockId(null)
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
