import { useState } from "react"
import clsx from "clsx"
import { useNavigate, useOutletContext } from "react-router-dom"
import {
  IconChevR,
  IconCrown,
  IconGlass,
  IconInfo,
  IconLock,
  IconPlus,
  IconUser,
  IconX,
} from "@/components/icons"
import { Btn, Card, Input, SectionTitle } from "@/components/primitives"
import { changePassword } from "@/services/auth"
import { updateProfile } from "@/services/membership"

function Row({ icon, label, right, onClick, danger }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 py-3.5 px-4 border-b border-bdr",
        onClick ? "cursor-pointer" : "cursor-default",
        danger ? "text-coral" : "text-tx",
      )}
    >
      <span className={clsx("shrink-0", danger ? "text-coral" : "text-tx2")}>
        {icon}
      </span>
      <span className="flex-1 text-[15px] font-body font-medium">{label}</span>
      {right ?? (onClick && <IconChevR size={16} className="text-tx3" />)}
    </div>
  )
}

export default function MoreScreen() {
  const navigate = useNavigate()
  const {
    unit,
    setUnit,
    theme,
    setTheme,
    isAdmin,
    profile,
    email,
    userId,
    signOut,
  } = useOutletContext()

  // profile is a prop handed down from App.jsx with no refetch plumbed
  // through this far - the same reason theme/unit are tracked as their own
  // local AppShell state rather than read live off profile. display_name
  // doesn't need that broader treatment for a one-off edit like this: an
  // optimistic local override is enough, and a real page load picks up the
  // saved value from the database anyway.
  const [displayNameOverride, setDisplayNameOverride] = useState(null)
  const displayName =
    displayNameOverride ?? profile?.display_name ?? email ?? "Member"
  const initial = displayName.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    // App-level auth listener picks up the cleared session and routes to Welcome.
  }

  const [editingProfile, setEditingProfile] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState("")
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileError, setProfileError] = useState(null)

  const openProfileForm = () => {
    setNewDisplayName(displayName)
    setProfileError(null)
    setEditingProfile(true)
  }
  const closeProfileForm = () => {
    setEditingProfile(false)
    setProfileError(null)
  }

  const handleSaveProfile = async () => {
    const trimmed = newDisplayName.trim()
    if (!trimmed) {
      setProfileError("Display name can't be empty.")
      return
    }
    setProfileBusy(true)
    setProfileError(null)
    try {
      await updateProfile(userId, { display_name: trimmed })
      setDisplayNameOverride(trimmed)
      setEditingProfile(false)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setProfileBusy(false)
    }
  }

  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState(null)
  const [pwInfo, setPwInfo] = useState(null)

  const closePasswordForm = () => {
    setChangingPassword(false)
    setNewPassword("")
    setConfirmPassword("")
    setPwError(null)
    setPwInfo(null)
  }

  const handleChangePassword = async () => {
    setPwError(null)
    setPwInfo(null)
    if (newPassword.length < 6) {
      setPwError("Password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords don't match.")
      return
    }
    setPwBusy(true)
    try {
      await changePassword(newPassword)
      setNewPassword("")
      setConfirmPassword("")
      setPwInfo("Password updated.")
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwBusy(false)
    }
  }

  return (
    <div className="pb-[calc(96px_+_env(safe-area-inset-bottom,0px))]">
      <div className="pt-5 px-5 pb-4 border-b border-bdr bg-bg2">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-full bg-linear-to-br from-cyan to-violet flex items-center justify-center">
            <span className="text-xl font-display font-bold text-[#07091a]">
              {initial}
            </span>
          </div>
          <div>
            <div className="text-lg font-display font-extrabold text-tx tracking-[-0.01em]">
              {displayName}
            </div>
            {email && <div className="text-[13px] text-tx2">{email}</div>}
          </div>
        </div>
      </div>

      <div className="p-5">
        <SectionTitle>Preferences</SectionTitle>
        <Card className="mb-5 overflow-hidden">
          <div className="flex items-center gap-3 py-3.5 px-4 border-b border-bdr">
            <span className="text-tx2 shrink-0">
              <IconGlass size={18} />
            </span>
            <span className="flex-1 text-[15px] font-body font-medium text-tx">
              Measurement
            </span>
            <div className="flex bg-surface3 border border-bdr rounded-sm overflow-hidden">
              {["ml", "oz"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={clsx(
                    "py-[5px] px-3.5 border-none cursor-pointer text-[13px] font-mono font-bold transition-all duration-150",
                    unit === u ? "bg-cyan text-[#07091a]" : "text-tx2",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 py-3.5 px-4">
            <span className="text-tx2 shrink-0">
              <IconInfo size={18} />
            </span>
            <span className="flex-1 text-[15px] font-body font-medium text-tx">
              Theme
            </span>
            <div className="flex bg-surface3 border border-bdr rounded-sm overflow-hidden">
              {["dark", "light"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={clsx(
                    "py-[5px] px-3.5 border-none cursor-pointer text-[13px] font-display font-semibold capitalize transition-all duration-150",
                    theme === t
                      ? clsx(
                          "text-[#07091a]",
                          t === "dark" ? "bg-violet" : "bg-amber",
                        )
                      : "text-tx2",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {isAdmin && (
          <>
            <SectionTitle>Admin</SectionTitle>
            <Card className="mb-5 overflow-hidden">
              <Row
                icon={<IconCrown size={18} />}
                label="Admin Dashboard"
                onClick={() => navigate("/admin")}
              />
            </Card>
          </>
        )}

        <SectionTitle>Catalog</SectionTitle>
        <Card className="mb-5 overflow-hidden">
          <Row
            icon={<IconPlus size={18} />}
            label="Request an Ingredient"
            onClick={() => navigate("/request-ingredient")}
          />
        </Card>

        <SectionTitle>Account</SectionTitle>
        <Card className="overflow-hidden">
          <Row
            icon={<IconUser size={18} />}
            label="Edit Profile"
            onClick={editingProfile ? closeProfileForm : openProfileForm}
          />
          {editingProfile && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveProfile()
              }}
              className="flex flex-col gap-3 py-3.5 px-4 border-b border-bdr"
            >
              <Input
                label="Display Name"
                placeholder="What other members will see you as"
                value={newDisplayName}
                onChange={setNewDisplayName}
                autoComplete="name"
              />
              {profileError && (
                <p className="text-xs text-coral">{profileError}</p>
              )}
              <div className="flex gap-2.5">
                <Btn
                  type="submit"
                  variant="primary"
                  disabled={profileBusy || !newDisplayName.trim()}
                >
                  Save
                </Btn>
                <Btn variant="ghost" onClick={closeProfileForm}>
                  Cancel
                </Btn>
              </div>
            </form>
          )}
          <Row
            icon={<IconLock size={18} />}
            label="Change Password"
            onClick={() =>
              changingPassword ? closePasswordForm() : setChangingPassword(true)
            }
          />
          {changingPassword && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleChangePassword()
              }}
              className="flex flex-col gap-3 py-3.5 px-4 border-b border-bdr"
            >
              {/* Hidden username field gives browser password managers the
                  account context they expect for a "new password" form -
                  without it Chrome's generator heuristic is less reliable. */}
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={email || ""}
                readOnly
                hidden
              />
              <Input
                label="New Password"
                placeholder="••••••••"
                value={newPassword}
                onChange={setNewPassword}
                type="password"
                name="new-password"
                autoComplete="new-password"
              />
              <Input
                label="Confirm New Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                name="confirm-password"
                autoComplete="new-password"
              />
              {pwError && <p className="text-xs text-coral">{pwError}</p>}
              {pwInfo && <p className="text-xs text-cyan">{pwInfo}</p>}
              <div className="flex gap-2.5">
                <Btn
                  type="submit"
                  variant="primary"
                  disabled={pwBusy || !newPassword || !confirmPassword}
                >
                  Save
                </Btn>
                <Btn variant="ghost" onClick={closePasswordForm}>
                  Cancel
                </Btn>
              </div>
            </form>
          )}
          <Row
            icon={<IconX size={18} />}
            label="Sign Out"
            onClick={handleSignOut}
            danger
          />
        </Card>
      </div>
    </div>
  )
}
