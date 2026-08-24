import { IconBottle } from "@/components/icons"

export function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "40px 0",
        color: "var(--text3)",
      }}
    >
      <IconBottle size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontFamily: "var(--font-display)",
          fontWeight: 600,
        }}
      >
        Nothing here
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 13 }}>
        Try clearing your filters.
      </p>
    </div>
  )
}
