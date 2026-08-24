import { Btn } from "@/components/primitives"

export function OtherDraftsPicker({
  drafts,
  maxDrafts,
  onContinue,
  onDiscard,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: "rgba(34,211,238,0.08)",
        border: "1px solid rgba(34,211,238,0.25)",
        borderRadius: "var(--r-sm)",
        padding: "10px 14px",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text2)" }}>
        You have {drafts.length} unsaved draft{drafts.length === 1 ? "" : "s"}{" "}
        on this browser (max {maxDrafts}) - continue one, or just start typing
        below for a new one.
      </span>
      {drafts.map((d) => (
        <div
          key={d.id}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 13,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {d.name}
          </span>
          <Btn variant="primary" small onClick={() => onContinue(d.id)}>
            Continue
          </Btn>
          <Btn variant="ghost" small onClick={() => onDiscard(d.id)}>
            Discard
          </Btn>
        </div>
      ))}
    </div>
  )
}
