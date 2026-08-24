import { Card } from "@/components/primitives"

export function OverviewTab({
  classicCount,
  communityCount,
  pendingRequestsCount,
  ingredientTypesCount,
  activeInvitesCount,
  onGoToTab,
}) {
  const cards = [
    {
      label: "Classic Recipes",
      val: classicCount,
      color: "var(--violet)",
      onClick: () => onGoToTab("recipes"),
    },
    {
      label: "Community Recipes",
      val: communityCount,
      color: "var(--cyan)",
      onClick: () => onGoToTab("moderation"),
    },
    {
      label: "Pending Requests",
      val: pendingRequestsCount,
      color: "var(--coral)",
      onClick: () => onGoToTab("requests"),
    },
    {
      label: "Ingredient Types",
      val: ingredientTypesCount,
      color: "var(--green)",
      onClick: () => onGoToTab("types"),
    },
    {
      label: "Active Invitations",
      val: activeInvitesCount,
      color: "var(--amber)",
      onClick: () => onGoToTab("invites"),
    },
  ]

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
        }}
      >
        {cards.map(({ label, val, color, onClick }, i, arr) => (
          <Card
            key={label}
            onClick={onClick}
            style={{
              padding: "16px",
              textAlign: "center",
              cursor: "pointer",
              gridColumn:
                i === arr.length - 1 && arr.length % 2 === 1
                  ? "1 / -1"
                  : undefined,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                color,
                marginBottom: 4,
              }}
            >
              {val}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text2)",
                fontFamily: "var(--font-body)",
              }}
            >
              {label}
            </div>
          </Card>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
        All five counts are real - tap any card to jump to its detail.
      </p>
    </div>
  )
}
