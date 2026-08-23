import { useState } from "react"
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
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        cursor: onClick ? "pointer" : "default",
        borderBottom: "1px solid var(--border-s)",
        color: danger ? "var(--coral)" : "var(--text)",
      }}
    >
      <span
        style={{
          color: danger ? "var(--coral)" : "var(--text2)",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 15,
          fontFamily: "var(--font-body)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      {right ??
        (onClick && <IconChevR size={16} style={{ color: "var(--text3)" }} />)}
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
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border-s)",
          background: "var(--bg2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--cyan) 0%, var(--violet) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "#07091a",
              }}
            >
              {initial}
            </span>
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              {displayName}
            </div>
            {email && (
              <div style={{ fontSize: 13, color: "var(--text2)" }}>{email}</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        <SectionTitle>Preferences</SectionTitle>
        <Card style={{ marginBottom: 20, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderBottom: "1px solid var(--border-s)",
            }}
          >
            <span style={{ color: "var(--text2)", flexShrink: 0 }}>
              <IconGlass size={18} />
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 15,
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                color: "var(--text)",
              }}
            >
              Measurement
            </span>
            <div
              style={{
                display: "flex",
                background: "var(--surface3)",
                border: "1px solid var(--border-s)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {["ml", "oz"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  style={{
                    padding: "5px 14px",
                    background: unit === u ? "var(--cyan)" : "none",
                    color: unit === u ? "#07091a" : "var(--text2)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    transition: "all 0.15s",
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
            }}
          >
            <span style={{ color: "var(--text2)", flexShrink: 0 }}>
              <IconInfo size={18} />
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 15,
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                color: "var(--text)",
              }}
            >
              Theme
            </span>
            <div
              style={{
                display: "flex",
                background: "var(--surface3)",
                border: "1px solid var(--border-s)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {["dark", "light"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  style={{
                    padding: "5px 14px",
                    background:
                      theme === t
                        ? t === "dark"
                          ? "var(--violet)"
                          : "var(--amber)"
                        : "none",
                    color: theme === t ? "#07091a" : "var(--text2)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    textTransform: "capitalize",
                    transition: "all 0.15s",
                  }}
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
            <Card style={{ marginBottom: 20, overflow: "hidden" }}>
              <Row
                icon={<IconCrown size={18} />}
                label="Admin Dashboard"
                onClick={() => navigate("/admin")}
              />
            </Card>
          </>
        )}

        <SectionTitle>Catalog</SectionTitle>
        <Card style={{ marginBottom: 20, overflow: "hidden" }}>
          <Row
            icon={<IconPlus size={18} />}
            label="Request an Ingredient"
            onClick={() => navigate("/request-ingredient")}
          />
        </Card>

        <SectionTitle>Account</SectionTitle>
        <Card style={{ overflow: "hidden" }}>
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
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "14px 16px",
                borderBottom: "1px solid var(--border-s)",
              }}
            >
              <Input
                label="Display Name"
                placeholder="What other members will see you as"
                value={newDisplayName}
                onChange={setNewDisplayName}
                autoComplete="name"
              />
              {profileError && (
                <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
                  {profileError}
                </p>
              )}
              <div style={{ display: "flex", gap: 10 }}>
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
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "14px 16px",
                borderBottom: "1px solid var(--border-s)",
              }}
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
              {pwError && (
                <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
                  {pwError}
                </p>
              )}
              {pwInfo && (
                <p style={{ margin: 0, fontSize: 12, color: "var(--cyan)" }}>
                  {pwInfo}
                </p>
              )}
              <div style={{ display: "flex", gap: 10 }}>
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
