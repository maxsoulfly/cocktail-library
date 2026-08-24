import { useEffect, useRef, useState } from "react"
import clsx from "clsx"
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

export const AVAIL_TONE = {
  perfect: "text-perfect border-perfect",
  good: "text-good border-good",
  almost: "text-almost border-almost",
  unavail: "text-unavail border-unavail",
}

export function AvailBadge({ avail, small }) {
  const c = AVAIL_CFG[avail]
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border font-mono font-medium",
        AVAIL_TONE[avail],
        small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-[3px] text-xs",
        avail === "unavail" && "opacity-60",
      )}
    >
      <span className={small ? "text-[10px]" : "text-[11px]"}>{c.icon}</span>
      {c.label}
    </span>
  )
}

const SOURCE_CFG = {
  classic: { label: "Classic", tone: "text-violet bg-violet/12" },
  community: { label: "Community", tone: "text-cyan bg-cyan/10" },
  private: { label: "Private", tone: "text-tx3 bg-tx3/10" },
}

export function SourceBadge({ source }) {
  const cfg = SOURCE_CFG[source]
  return (
    <span
      className={clsx(
        "rounded-[6px] px-2 py-0.5 text-[11px] font-semibold font-display tracking-[0.02em]",
        cfg.tone,
      )}
    >
      {cfg.label}
    </span>
  )
}

export function TasteTag({ label }) {
  return (
    <span className="bg-surface3 text-tx2 border border-bdr rounded-[6px] px-2 py-0.5 text-[11px] font-body">
      {label}
    </span>
  )
}

export function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full px-3.5 py-[5px] text-[13px] font-display whitespace-nowrap transition-all duration-150 border cursor-pointer",
        active
          ? "font-semibold border-cyan bg-cyan/12 text-cyan shadow-[0_0_10px_rgba(34,211,238,0.2)]"
          : "font-normal border-bdr bg-surface text-tx2",
      )}
    >
      {label}
    </button>
  )
}

export function OwnedToggle({ owned, onChange }) {
  return (
    <button
      onClick={() => onChange(!owned)}
      className={clsx(
        "w-11 h-6 rounded-full border-none relative shrink-0 cursor-pointer transition-colors duration-200",
        owned ? "bg-cyan shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "bg-surface3",
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center transition-[left] duration-[180ms]",
          owned ? "left-[22px]" : "left-0.5",
        )}
      >
        {owned && <IconCheck size={12} className="text-cyan" />}
      </span>
    </button>
  )
}

const BTN_VARIANT = {
  primary:
    "bg-cyan text-[#07091a] shadow-[0_0_16px_rgba(34,211,238,0.35)] border-none",
  secondary: "bg-surface3 text-tx border border-bdr",
  ghost: "bg-transparent text-tx2 border border-bdr",
  danger: "bg-coral/15 text-coral border border-coral/30",
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
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "rounded font-display font-semibold inline-flex items-center justify-center gap-1.5 transition-[opacity,box-shadow] duration-150",
        BTN_VARIANT[variant],
        small ? "px-3.5 py-1.5 text-[13px]" : "px-5 py-2.5 text-sm",
        full && "w-full",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      )}
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
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-tx2 font-display uppercase tracking-[0.06em]">
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
        className="bg-surface border border-bdr rounded-sm px-3.5 py-2.5 text-tx text-sm font-body w-full"
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "bg-surface border border-bdr rounded-sm text-tx2 font-mono cursor-pointer flex items-center gap-1 whitespace-nowrap w-full justify-between",
          small ? "p-2 text-xs" : "px-3.5 py-2.5 text-sm",
        )}
      >
        {current?.label ?? value}
        <IconChevD size={12} className="shrink-0 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-[calc(100%_+_4px)] left-0 z-20 bg-surface2 border border-bdr rounded-sm shadow-[0_8px_24px_rgba(0,0,0,0.35)] min-w-full overflow-hidden">
          {normalized.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={clsx(
                "block w-full text-left py-2 px-3 border-none cursor-pointer text-[13px] font-body whitespace-nowrap",
                o.value === value ? "bg-cyan/12 text-cyan" : "text-tx",
              )}
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
    <div className="flex gap-2 flex-wrap">
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={clsx(
            "py-2 px-3 rounded-sm border text-[13px] font-body cursor-pointer",
            value === c.id
              ? "border-cyan bg-cyan/12 text-cyan"
              : "border-bdr bg-surface text-tx2",
          )}
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
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2.5 flex-wrap">
        {colors.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.hex)}
            title={c.name}
            className={clsx(
              "w-8 h-8 rounded-full cursor-pointer border-2",
              value === c.hex
                ? "border-tx shadow-[0_0_0_2px_var(--bg),0_0_0_3px_var(--cyan)]"
                : "border-bdr",
            )}
            style={{ background: c.hex }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full border border-bdr shrink-0"
          style={{ background: value || "transparent" }}
        />
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or type any hex, e.g. #6b21a8"
          className="bg-surface border border-bdr rounded-sm py-1.5 px-2.5 text-tx text-[13px] font-mono w-40"
        />
      </div>
    </div>
  )
}

export function Card({ children, style, className, onClick }) {
  return (
    <div
      className={clsx("bg-surface border border-bdr rounded-lg", className)}
      onClick={onClick}
      style={style}
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
// Kept as inline style rather than a className: Card's own base classes
// already set border-color via `border-bdr`, so a second border-color
// *class* here would compete with Card's for the same property at equal
// specificity, with the winner decided by Tailwind's generated stylesheet
// order rather than by which one was meant to override. An inline style
// always wins deterministically over any class regardless of source order.
const CONFIRM_BORDER = {
  cyan: "rgba(34,211,238,0.25)",
  neutral: "var(--border-s)",
  coral: "rgba(251,113,133,0.3)",
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
      <div className="flex items-center gap-2.5" style={style}>
        <span className="flex-1 text-xs text-coral">{message}</span>
        {buttons}
      </div>
    )
  }

  if (layout === "stack") {
    return (
      <div className="flex flex-col gap-2" style={style}>
        <p className="m-0 text-[13px] text-coral">{message}</p>
        <div className="flex gap-2">{buttons}</div>
      </div>
    )
  }

  return (
    <Card
      className="p-4"
      style={{ borderColor: CONFIRM_BORDER[borderTone], ...style }}
    >
      <p className="mb-3 text-sm text-tx2">{message}</p>
      {error && <p className="mb-3 text-xs text-coral">{error}</p>}
      <div className="flex gap-2">{buttons}</div>
    </Card>
  )
}

export function SectionTitle({ children }) {
  return (
    <h2 className="mb-3 text-[13px] font-bold font-display text-tx2 uppercase tracking-[0.08em]">
      {children}
    </h2>
  )
}
