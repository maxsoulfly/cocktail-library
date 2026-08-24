import { useState } from "react"
import { IconPlus, IconX } from "@/components/icons"
import { Card } from "@/components/primitives"
import { resolveIngredientRequest } from "@/services/ingredientRequests"

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

// Members' suggestions for missing ingredient types (see
// RequestIngredientScreen.jsx). Fulfilling one doesn't auto-create the type
// - the admin still goes through Batch Import for that (onAddToCatalog,
// which lives in the AdminScreen shell since it also jumps to the Batch
// Import tab), since a request is just a name/note, not a validated
// category+hierarchy.
export function RequestsTab({
  pendingRequests,
  requestsLoading,
  onRequestsChanged,
  onAddToCatalog,
}) {
  const [resolvingRequestId, setResolvingRequestId] = useState(null)

  // The only remaining manual resolution - "fulfilled" now only ever
  // happens as a side effect of successfully adding the ingredient, never
  // as its own button, so there's nothing left to accidentally mark done
  // without actually creating the type.
  const handleDismissRequest = async (id) => {
    setResolvingRequestId(id)
    try {
      await resolveIngredientRequest(id, "dismissed")
      onRequestsChanged()
    } finally {
      setResolvingRequestId(null)
    }
  }

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
        Ingredients members have asked for. "+" adds it to the catalog and marks
        the request fulfilled in one step; "×" dismisses a request without
        adding anything.
      </p>
      {requestsLoading ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
          Loading...
        </p>
      ) : pendingRequests.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
          No pending requests.
        </p>
      ) : (
        pendingRequests.map((r) => (
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
                  by {r.requester?.display_name ?? "unknown"} ·{" "}
                  {formatDate(r.created_at)}
                </div>
                {r.note && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 13,
                      color: "var(--text2)",
                    }}
                  >
                    {r.note}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => onAddToCatalog(r.name, r.id)}
                  title="Add to catalog"
                  style={{
                    background: "rgba(34,211,238,0.1)",
                    border: "1px solid rgba(34,211,238,0.25)",
                    borderRadius: 6,
                    padding: "6px 8px",
                    cursor: "pointer",
                    color: "var(--cyan)",
                  }}
                >
                  <IconPlus size={14} />
                </button>
                <button
                  onClick={() => handleDismissRequest(r.id)}
                  disabled={resolvingRequestId === r.id}
                  title="Dismiss"
                  style={{
                    background: "rgba(251,113,133,0.1)",
                    border: "1px solid rgba(251,113,133,0.25)",
                    borderRadius: 6,
                    padding: "6px 8px",
                    cursor: "pointer",
                    color: "var(--coral)",
                  }}
                >
                  <IconX size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
