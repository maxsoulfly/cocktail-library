import { Link, useLocation } from "react-router-dom"
import {
  IconBack,
  IconBottle,
  IconCrown,
  IconGlass,
  IconHeart,
  IconHome,
  IconMenu,
} from "@/components/icons"

const NAV_ITEMS = [
  { path: "/home", label: "Home", Icon: IconHome },
  { path: "/library", label: "Cocktails", Icon: IconGlass },
  { path: "/bar", label: "My Bar", Icon: IconBottle },
  { path: "/lists", label: "Lists", Icon: IconHeart },
  { path: "/more", label: "More", Icon: IconMenu },
]

// "More" also lights up on /admin, since that's where the admin dashboard is reached from.
function isNavItemActive(pathname, itemPath) {
  if (itemPath === "/more")
    return pathname.startsWith("/more") || pathname.startsWith("/admin")
  return pathname.startsWith(itemPath)
}

export function BottomNav() {
  const location = useLocation()
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "var(--bg2)",
        borderTop: "1px solid var(--border-s)",
        display: "flex",
        alignItems: "stretch",
        zIndex: 100,
        backdropFilter: "blur(12px)",
      }}
    >
      {NAV_ITEMS.map(({ path, label, Icon }) => {
        const isActive = isNavItemActive(location.pathname, path)
        return (
          <Link
            key={path}
            to={path}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              textDecoration: "none",
              color: isActive ? "var(--cyan)" : "var(--text3)",
              transition: "color 0.15s",
            }}
          >
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  width: 28,
                  height: 2,
                  borderRadius: 1,
                  marginTop: -52,
                }}
                className="line-glow-cyan"
              />
            )}
            <Icon size={20} />
            <span
              style={{
                fontSize: 10,
                fontFamily: "var(--font-display)",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export function SideNav({ isAdmin }) {
  const location = useLocation()
  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: "var(--bg2)",
        borderRight: "1px solid var(--border-s)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 12px",
        gap: 4,
      }}
    >
      <div
        style={{
          padding: "0 12px 20px",
          marginBottom: 4,
          borderBottom: "1px solid var(--border-s)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--cyan)",
            letterSpacing: "-0.02em",
          }}
        >
          Cocktail Library
        </span>
      </div>
      {NAV_ITEMS.map(({ path, label, Icon }) => {
        const isActive = isNavItemActive(location.pathname, path)
        return (
          <Link
            key={path}
            to={path}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: "var(--r-sm)",
              background: isActive ? "rgba(34,211,238,0.1)" : "none",
              color: isActive ? "var(--cyan)" : "var(--text2)",
              textDecoration: "none",
              fontSize: 14,
              fontFamily: "var(--font-display)",
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.15s",
              boxShadow: isActive ? "0 0 10px rgba(34,211,238,0.15)" : "none",
            }}
          >
            <Icon size={18} /> {label}
          </Link>
        )
      })}
      {isAdmin && (
        <Link
          to="/admin"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: "var(--r-sm)",
            background: location.pathname.startsWith("/admin")
              ? "rgba(167,139,250,0.12)"
              : "none",
            color: location.pathname.startsWith("/admin")
              ? "var(--violet)"
              : "var(--text2)",
            textDecoration: "none",
            fontSize: 14,
            fontFamily: "var(--font-display)",
            fontWeight: location.pathname.startsWith("/admin") ? 600 : 400,
            transition: "all 0.15s",
            marginTop: "auto",
          }}
        >
          <IconCrown size={18} /> Admin
        </Link>
      )}
    </aside>
  )
}

export function TopBar({ title, onBack, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px 20px",
        gap: 12,
        borderBottom: "1px solid var(--border-s)",
        background: "var(--bg2)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text2)",
            padding: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <IconBack size={20} />
        </button>
      )}
      <h1
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: "var(--text)",
          flex: 1,
        }}
      >
        {title}
      </h1>
      {right}
    </div>
  )
}
