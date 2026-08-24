// Plain hex text input + live swatch preview, for managing a Liquid Colors
// palette entry itself. Deliberately not ColorSwatchPicker - that component
// picks *from* this palette, it can't also be how the palette's own rows get
// their hex value (there's nothing to pick from yet while creating one).
export function HexColorField({ value, onChange }) {
  return (
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#rrggbb"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-s)",
          borderRadius: "var(--r-sm)",
          padding: "10px 8px",
          color: "var(--text)",
          fontSize: 14,
          fontFamily: "var(--font-mono)",
          width: 120,
        }}
      />
    </div>
  )
}
