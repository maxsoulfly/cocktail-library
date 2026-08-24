import clsx from "clsx"
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
    <div className="fade-in flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        {cards.map(({ label, val, color, onClick }, i, arr) => (
          <Card
            key={label}
            onClick={onClick}
            className={clsx(
              "p-4 text-center cursor-pointer",
              i === arr.length - 1 && arr.length % 2 === 1 && "col-span-full",
            )}
          >
            <div
              className="text-[28px] font-display font-extrabold mb-1"
              style={{ color }}
            >
              {val}
            </div>
            <div className="text-xs text-tx2 font-body">{label}</div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-tx3">
        All five counts are real - tap any card to jump to its detail.
      </p>
    </div>
  )
}
