const MODES = [
  { id: "scratch", label: "Start from Scratch" },
  { id: "paste", label: "Paste a Recipe (AI)" },
]

export function EntryModeSwitcher({ mode, onModeChange }) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--surface)",
        border: "1px solid var(--border-s)",
        borderRadius: "var(--r-sm)",
        overflow: "hidden",
      }}
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          style={{
            flex: 1,
            padding: "10px",
            background: mode === m.id ? "rgba(167,139,250,0.12)" : "none",
            border: "none",
            cursor: "pointer",
            color: mode === m.id ? "var(--violet)" : "var(--text2)",
            fontFamily: "var(--font-display)",
            fontWeight: mode === m.id ? 700 : 400,
            fontSize: 13,
            transition: "all 0.15s",
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
