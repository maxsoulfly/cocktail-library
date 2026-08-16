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
import { Card, SectionTitle } from "@/components/primitives"

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
  const { unit, setUnit, theme, setTheme, isAdmin, profile, email, signOut } =
    useOutletContext()

  const displayName = profile?.display_name || email || "Member"
  const initial = displayName.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    // App-level auth listener picks up the cleared session and routes to Welcome.
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
            onClick={() => {}}
          />
          <Row
            icon={<IconLock size={18} />}
            label="Change Password"
            onClick={() => {}}
          />
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
