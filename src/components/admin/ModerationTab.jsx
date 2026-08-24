import { useState } from "react"
import { IconLock } from "@/components/icons"
import { Btn, Card, Input } from "@/components/primitives"
import { unpublishRecipe } from "@/services/recipes"

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

// Currently-published community recipes, with Unpublish and Promote to
// Classic actions. Promote crosses into the Classic Recipes tab's data (it
// nulls owner_id via admin_promote_recipe_to_classic()), so
// onPromote/confirmPromote/promoting come from the AdminScreen shell rather
// than being local to this tab - a successful promote needs to refresh both
// this tab's communityRecipes list and the shared `computed` recipes the
// Classic Recipes tab derives from.
export function ModerationTab({
  communityRecipes,
  communityLoading,
  onCommunityRecipesChanged,
  confirmPromote,
  promoting,
  onSetConfirmPromote,
  onPromote,
}) {
  const [communityQuery, setCommunityQuery] = useState("")
  const [confirmUnpublish, setConfirmUnpublish] = useState(null)
  const [unpublishing, setUnpublishing] = useState(false)

  const filtered = communityRecipes.filter((c) =>
    c.name.toLowerCase().includes(communityQuery.toLowerCase()),
  )

  const handleUnpublish = async (id) => {
    setUnpublishing(true)
    try {
      await unpublishRecipe(id)
      onCommunityRecipesChanged()
    } finally {
      setUnpublishing(false)
      setConfirmUnpublish(null)
    }
  }

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
        Published community recipes. Unpublishing returns a recipe to its
        owner's private list without deleting it.
      </p>
      <Input
        placeholder="Search community recipes..."
        value={communityQuery}
        onChange={setCommunityQuery}
      />
      {communityLoading ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
          Loading...
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
          {communityQuery
            ? "No community recipes match."
            : "No published community recipes."}
        </p>
      ) : (
        filtered.map((c) => (
          <Card key={c.id} style={{ padding: "14px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 3,
                  }}
                >
                  {c.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>
                  by {c.owner?.display_name ?? "unknown"}
                  {c.published_at &&
                    ` · published ${formatDate(c.published_at)}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => onSetConfirmPromote(c.id)}
                  style={{
                    background: "rgba(167,139,250,0.1)",
                    border: "1px solid rgba(167,139,250,0.25)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "var(--violet)",
                    fontSize: 12,
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                  }}
                >
                  Promote to Classic
                </button>
                <button
                  onClick={() => setConfirmUnpublish(c.id)}
                  style={{
                    background: "rgba(251,113,133,0.1)",
                    border: "1px solid rgba(251,113,133,0.25)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "var(--coral)",
                    fontSize: 12,
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <IconLock size={12} /> Unpublish
                </button>
              </div>
            </div>
            {confirmPromote === c.id && (
              <div
                style={{
                  marginTop: 12,
                  padding: "12px",
                  background: "rgba(167,139,250,0.08)",
                  borderRadius: 8,
                  border: "1px solid rgba(167,139,250,0.25)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 13,
                    color: "var(--text2)",
                  }}
                >
                  Promote "{c.name}" to the classic catalog? It becomes
                  ownerless/admin-managed, but stays credited to{" "}
                  {c.owner?.display_name ?? "its author"} - this can be reversed
                  from the Classic Recipes tab.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn
                    variant="primary"
                    small
                    disabled={promoting}
                    onClick={() => onPromote(c.id)}
                  >
                    Promote
                  </Btn>
                  <Btn
                    variant="ghost"
                    small
                    onClick={() => onSetConfirmPromote(null)}
                  >
                    Cancel
                  </Btn>
                </div>
              </div>
            )}
            {confirmUnpublish === c.id && (
              <div
                style={{
                  marginTop: 12,
                  padding: "12px",
                  background: "rgba(251,113,133,0.08)",
                  borderRadius: 8,
                  border: "1px solid rgba(251,113,133,0.25)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 13,
                    color: "var(--text2)",
                  }}
                >
                  Unpublish "{c.name}"? It returns to{" "}
                  {c.owner?.display_name ?? "the owner"}'s private list — their
                  copy won't be deleted.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn
                    variant="danger"
                    small
                    disabled={unpublishing}
                    onClick={() => handleUnpublish(c.id)}
                  >
                    Unpublish
                  </Btn>
                  <Btn
                    variant="ghost"
                    small
                    onClick={() => setConfirmUnpublish(null)}
                  >
                    Cancel
                  </Btn>
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  )
}
