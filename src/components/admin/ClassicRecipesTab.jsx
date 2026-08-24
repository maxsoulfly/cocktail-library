import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { IconEdit, IconTrash } from "@/components/icons"
import { Btn, Card, Input } from "@/components/primitives"
import { deleteRecipe } from "@/services/recipes"

// The ownerless classic catalog, split out from Community (published member
// recipes) into its own admin list per the user's request -
// browsing/editing/deleting classics through Library/Detail worked, but
// reads and feels like a member screen, not an admin one, and there was no
// way to delete a classic at all despite the RLS "recipes: delete" policy
// already allowing it for owner_id is null rows.
//
// Demote (a classic promoted from a community recipe, back to its original
// author) is the one action here that crosses into the Moderation tab's own
// data - onDemote/confirmDemoteId/demoting/demoteError all come from the
// AdminScreen shell rather than being local to this tab, since a successful
// demote needs to refresh the shell-owned communityRecipes list too.
export function ClassicRecipesTab({
  classicRecipes,
  refetchRecipes,
  confirmDemoteId,
  demoting,
  demoteError,
  onSetConfirmDemote,
  onDemote,
}) {
  const navigate = useNavigate()
  const [classicQuery, setClassicQuery] = useState("")
  const [confirmDeleteClassicId, setConfirmDeleteClassicId] = useState(null)
  const [deletingClassic, setDeletingClassic] = useState(false)

  const filtered = classicRecipes.filter((r) =>
    r.name.toLowerCase().includes(classicQuery.toLowerCase()),
  )

  const handleDeleteClassic = async (id) => {
    setDeletingClassic(true)
    try {
      await deleteRecipe(id)
      await refetchRecipes()
    } finally {
      setDeletingClassic(false)
      setConfirmDeleteClassicId(null)
    }
  }

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
        The ownerless classic catalog. Edit any of these directly, or delete one
        - that's permanent, unlike unpublishing a community recipe. A classic
        promoted from a community recipe (via the Moderation tab) can be demoted
        back to its original author.
      </p>
      <Input
        placeholder="Search classic recipes..."
        value={classicQuery}
        onChange={setClassicQuery}
      />
      {filtered.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
          {classicQuery
            ? "No classic recipes match."
            : "No classic recipes yet."}
        </p>
      ) : (
        filtered.map((r) => (
          <Card key={r.id} style={{ padding: "14px 16px" }}>
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
                  {r.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>
                  {r.family ?? "No family"} · {r.glass}
                  {r.originalOwnerId &&
                    ` · originally by ${r.author ?? "a member"}`}
                </div>
              </div>
              <button
                onClick={() => navigate(`/library/${r.id}/edit`)}
                style={{
                  background: "rgba(34,211,238,0.1)",
                  border: "1px solid rgba(34,211,238,0.25)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                  color: "var(--cyan)",
                  fontSize: 12,
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <IconEdit size={12} /> Edit
              </button>
              <button
                onClick={() => setConfirmDeleteClassicId(r.id)}
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
                <IconTrash size={12} /> Delete
              </button>
              {r.originalOwnerId && (
                <button
                  onClick={() => onSetConfirmDemote(r.id)}
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
                  Demote to Community
                </button>
              )}
            </div>
            {confirmDemoteId === r.id && (
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
                  {demoteError
                    ? demoteError
                    : `Demote "${r.name}" back to a community recipe owned by ${r.author ?? "its original author"}?`}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn
                    variant="primary"
                    small
                    disabled={demoting}
                    onClick={() => onDemote(r.id)}
                  >
                    Demote
                  </Btn>
                  <Btn
                    variant="ghost"
                    small
                    onClick={() => onSetConfirmDemote(null)}
                  >
                    Cancel
                  </Btn>
                </div>
              </div>
            )}
            {confirmDeleteClassicId === r.id && (
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
                  Delete "{r.name}"? This removes it from the catalog for every
                  member and can't be undone.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn
                    variant="danger"
                    small
                    disabled={deletingClassic}
                    onClick={() => handleDeleteClassic(r.id)}
                  >
                    Delete
                  </Btn>
                  <Btn
                    variant="ghost"
                    small
                    onClick={() => setConfirmDeleteClassicId(null)}
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
