import { useEffect, useRef, useState } from "react"
import { IconCheck, IconChevD } from "@/components/icons"

export const AVAIL_CFG = {
  perfect: {
    label: "Perfect",
    color: "var(--perfect)",
    icon: "✦",
    glow: "glow-green",
  },
  good: {
    label: "Good Enough",
    color: "var(--good)",
    icon: "◎",
    glow: "glow-cyan",
  },
  almost: {
    label: "Almost",
    color: "var(--almost)",
    icon: "◐",
    glow: "glow-amber",
  },
  unavail: {
    label: "Unavailable",
    color: "var(--unavail)",
    icon: "○",
    glow: "",
  },
}

export function AvailBadge({ avail, small }) {
  const c = AVAIL_CFG[avail]
  return (
    <span
      style={{
        color: c.color,
        border: `1px solid ${c.color}`,
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: small ? "2px 8px" : "3px 10px",
        fontSize: small ? 11 : 12,
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        opacity: avail === "unavail" ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: small ? 10 : 11 }}>{c.icon}</span>
      {c.label}
    </span>
  )
}

const SOURCE_CFG = {
  classic: {
    label: "Classic",
    color: "var(--violet)",
    bg: "rgba(167,139,250,0.12)",
  },
  community: {
    label: "Community",
    color: "var(--cyan)",
    bg: "rgba(34,211,238,0.1)",
  },
  private: {
    label: "Private",
    color: "var(--text3)",
    bg: "rgba(100,120,160,0.1)",
  },
}

export function SourceBadge({ source }) {
  const cfg = SOURCE_CFG[source]
  return (
    <span
      style={{
        color: cfg.color,
        background: cfg.bg,
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "var(--font-display)",
        letterSpacing: "0.02em",
      }}
    >
      {cfg.label}
    </span>
  )
}

export function TasteTag({ label }) {
  return (
    <span
      style={{
        background: "var(--surface3)",
        color: "var(--text2)",
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 11,
        fontFamily: "var(--font-body)",
        border: "1px solid var(--border-s)",
      }}
    >
      {label}
    </span>
  )
}

export function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: "5px 14px",
        fontSize: 13,
        fontFamily: "var(--font-display)",
        fontWeight: active ? 600 : 400,
        border: `1px solid ${active ? "var(--cyan)" : "var(--border-s)"}`,
        background: active ? "rgba(34,211,238,0.12)" : "var(--surface)",
        color: active ? "var(--cyan)" : "var(--text2)",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        boxShadow: active ? "0 0 10px rgba(34,211,238,0.2)" : "none",
      }}
    >
      {label}
    </button>
  )
}

export function OwnedToggle({ owned, onChange }) {
  return (
    <button
      onClick={() => onChange(!owned)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: owned ? "var(--cyan)" : "var(--surface3)",
        transition: "background 0.2s",
        position: "relative",
        flexShrink: 0,
        boxShadow: owned ? "0 0 8px rgba(34,211,238,0.4)" : "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: owned ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.18s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {owned && <IconCheck size={12} style={{ color: "var(--cyan)" }} />}
      </span>
    </button>
  )
}

export function Btn({
  children,
  variant = "primary",
  onClick,
  full,
  small,
  disabled,
  type = "button",
}) {
  const styles = {
    primary: {
      background: "var(--cyan)",
      color: "#07091a",
      boxShadow: "0 0 16px rgba(34,211,238,0.35)",
    },
    secondary: {
      background: "var(--surface3)",
      color: "var(--text)",
      border: "1px solid var(--border-s)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text2)",
      border: "1px solid var(--border-s)",
    },
    danger: {
      background: "rgba(251,113,133,0.15)",
      color: "var(--coral)",
      border: "1px solid rgba(251,113,133,0.3)",
    },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: "var(--r)",
        padding: small ? "6px 14px" : "10px 20px",
        fontSize: small ? 13 : 14,
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : undefined,
        border: styles[variant].border ?? "none",
        opacity: disabled ? 0.5 : 1,
        transition: "opacity 0.15s, box-shadow 0.15s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {children}
    </button>
  )
}

export function Input({
  placeholder,
  value,
  onChange,
  type = "text",
  label,
  autoComplete,
  name,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text2)",
            fontFamily: "var(--font-display)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-s)",
          borderRadius: "var(--r-sm)",
          padding: "10px 14px",
          color: "var(--text)",
          fontSize: 14,
          fontFamily: "var(--font-body)",
          width: "100%",
        }}
      />
    </div>
  )
}

// Native <select> popups render via the browser/OS, not the page's CSS, so
// they always show up unthemed regardless of what's set on the <select>
// element itself. This is a small custom dropdown for the handful of short,
// fixed option lists in the app (ingredient unit/role) that need to match
// the rest of the UI instead.
export function Select({ value, onChange, options, small }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  )
  const current = normalized.find((o) => o.value === value)

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-s)",
          borderRadius: "var(--r-sm)",
          padding: small ? "8px 8px" : "10px 14px",
          color: "var(--text2)",
          fontSize: small ? 12 : 14,
          fontFamily: "var(--font-mono)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          whiteSpace: "nowrap",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        {current?.label ?? value}
        <IconChevD size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 20,
            background: "var(--surface2)",
            border: "1px solid var(--border-s)",
            borderRadius: "var(--r-sm)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            minWidth: "100%",
            overflow: "hidden",
          }}
        >
          {normalized.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                background:
                  o.value === value ? "rgba(34,211,238,0.12)" : "none",
                border: "none",
                cursor: "pointer",
                color: o.value === value ? "var(--cyan)" : "var(--text)",
                fontSize: 13,
                fontFamily: "var(--font-body)",
                whiteSpace: "nowrap",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Ingredient categories (~10-12 options) are chosen rarely enough per-flow
// that a visible chip grid beats hiding them behind the Select's closed
// button - on mobile a collapsed dropdown reads as inert label text rather
// than something tappable, and the option list should be discoverable
// without a second tap.
export function CategoryPicker({ categories, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          style={{
            padding: "8px 12px",
            borderRadius: "var(--r-sm)",
            border: `1px solid ${
              value === c.id ? "var(--cyan)" : "var(--border-s)"
            }`,
            background:
              value === c.id ? "rgba(34,211,238,0.12)" : "var(--surface)",
            color: value === c.id ? "var(--cyan)" : "var(--text2)",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
          }}
        >
          {c.name}
        </button>
      ))}
    </div>
  )
}

// Shared between EditorScreen (recipe liquid_color) and the ingredient-type
// forms (AdminScreen, IngredientTypeEditor) - same "pick a drink-appropriate
// color, no hex knowledge required" idea in both places. `colors` is the
// live liquid_colors catalog (admin-managed - see Admin → Catalog), not a
// hardcoded list, so the swatches on offer can grow over time. The free hex
// input alongside them means a color missing from the curated list is never
// a hard blocker either - stored recipes/ingredient types have always just
// been a plain hex string, this table only supplies the picker's suggestions.
export function ColorSwatchPicker({ value, onChange, colors }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {colors.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.hex)}
            title={c.name}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: c.hex,
              border: `2px solid ${
                value === c.hex ? "var(--text)" : "var(--border-s)"
              }`,
              boxShadow:
                value === c.hex
                  ? "0 0 0 2px var(--bg), 0 0 0 3px var(--cyan)"
                  : "none",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: value || "transparent",
            border: "1px solid var(--border-s)",
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or type any hex, e.g. #6b21a8"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-s)",
            borderRadius: "var(--r-sm)",
            padding: "6px 10px",
            color: "var(--text)",
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            width: 160,
          }}
        />
      </div>
    </div>
  )
}

export function Card({ children, style, className, onClick }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-s)",
        borderRadius: "var(--r-lg)",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Shared "are you sure?" panel - message + confirm/cancel buttons, with an
// optional separate error line. Consolidates 3 independently-duplicated
// confirm implementations (DetailScreen's publish/unpublish/delete panels,
// MyBarScreen's product-delete row, AdminScreen's NamedRowManager
// delete-confirm) that differ only in container shape, not in the underlying
// pattern. `layout="card"` wraps in a bordered Card (DetailScreen's shape,
// `borderTone` picked independently of `confirmVariant` - e.g. Unpublish is
// danger-styled but neutral-bordered); `layout="row"` is a single horizontal
// flex row with no Card and no separate error line (MyBarScreen's shape -
// callers supply their own row padding/border/background via `style`);
// `layout="stack"` is an unwrapped vertical flex column, one message
// paragraph, no separate error line (AdminScreen's shape - pass an
// already-combined message string rather than a separate `error`, matching
// the single-paragraph output it always had).
const CONFIRM_BORDER = {
  cyan: "1px solid rgba(34,211,238,0.25)",
  neutral: "1px solid var(--border-s)",
  coral: "1px solid rgba(251,113,133,0.3)",
}

export function ConfirmPanel({
  message,
  error,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  busy,
  layout = "card",
  borderTone = "neutral",
  style,
}) {
  const buttons = (
    <>
      <Btn variant={confirmVariant} small disabled={busy} onClick={onConfirm}>
        {confirmLabel}
      </Btn>
      <Btn variant="ghost" small onClick={onCancel}>
        {cancelLabel}
      </Btn>
    </>
  )

  if (layout === "row") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, ...style }}>
        <span style={{ flex: 1, fontSize: 12, color: "var(--coral)" }}>
          {message}
        </span>
        {buttons}
      </div>
    )
  }

  if (layout === "stack") {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}
      >
        <p style={{ margin: 0, fontSize: 13, color: "var(--coral)" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 8 }}>{buttons}</div>
      </div>
    )
  }

  return (
    <Card style={{ padding: 16, border: CONFIRM_BORDER[borderTone], ...style }}>
      <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--text2)" }}>
        {message}
      </p>
      {error && (
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--coral)" }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 8 }}>{buttons}</div>
    </Card>
  )
}

export function SectionTitle({ children }) {
  return (
    <h2
      style={{
        margin: "0 0 12px",
        fontSize: 13,
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        color: "var(--text2)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </h2>
  )
}
