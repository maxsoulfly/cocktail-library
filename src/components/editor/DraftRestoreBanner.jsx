import { Btn } from "@/components/primitives"

export function DraftRestoreBanner({ draft, onRestore, onDiscard }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(34,211,238,0.08)",
        border: "1px solid rgba(34,211,238,0.25)",
        borderRadius: "var(--r-sm)",
        padding: "10px 14px",
      }}
    >
      <span style={{ flex: 1, fontSize: 12, color: "var(--text2)" }}>
        You have an unsaved draft, "{draft.name?.trim() || "Untitled draft"}" -
        saved on this browser only.
      </span>
      <Btn variant="primary" small onClick={onRestore}>
        Restore
      </Btn>
      <Btn variant="ghost" small onClick={onDiscard}>
        Discard
      </Btn>
    </div>
  )
}
