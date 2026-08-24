// Plain hex text input + live swatch preview, for managing a Liquid Colors
// palette entry itself. Deliberately not ColorSwatchPicker - that component
// picks *from* this palette, it can't also be how the palette's own rows get
// their hex value (there's nothing to pick from yet while creating one).
export function HexColorField({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-full border border-bdr shrink-0"
        style={{ background: value || "transparent" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#rrggbb"
        className="bg-surface border border-bdr rounded-sm py-2.5 px-2 text-tx text-sm font-mono w-30"
      />
    </div>
  )
}
