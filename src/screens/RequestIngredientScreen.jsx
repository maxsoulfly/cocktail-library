import { useEffect, useState } from "react"
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom"
import { IconTrash } from "@/components/icons"
import { TopBar } from "@/components/Nav"
import { Btn, Card, Input } from "@/components/primitives"
import { resolveIngredientType } from "@/domain/ingredientResolution"
import {
  createIngredientRequest,
  deleteMyIngredientRequest,
  fetchMyIngredientRequests,
} from "@/services/ingredientRequests"

const STATUS_LABELS = {
  pending: { label: "Pending", color: "var(--amber)" },
  fulfilled: { label: "Fulfilled", color: "var(--green)" },
  dismissed: { label: "Dismissed", color: "var(--text3)" },
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

export default function RequestIngredientScreen() {
  const navigate = useNavigate()
  const { userId, catalog } = useOutletContext()
  const [searchParams] = useSearchParams()
  // Set when arriving via a recipe/product form's "Request it" link (see
  // EditorScreen.jsx, AddProductScreen.jsx) - lets the confirmation screen
  // send the member straight back to what they were doing instead of a
  // generic history-based "Back" that's easy to miss or navigate past.
  // Real bug this fixed: a member's in-progress recipe read as "lost" after
  // requesting an ingredient, because nothing pointed them back to it - the
  // recipe itself was safe (auto-saved locally), but there was no obvious
  // way back to see that.
  const returnTo = searchParams.get("returnTo")
  const [name, setName] = useState(searchParams.get("name") ?? "")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  // A member could submit a request but never see it again, or withdraw one
  // while it was still pending, even though the RLS policy for exactly that
  // has existed since the table was created - fetchMyIngredientRequests()
  // just had no caller.
  const [myRequests, setMyRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const loadMyRequests = () => {
    if (!userId) return
    setRequestsLoading(true)
    fetchMyIngredientRequests(userId).then((data) => {
      setMyRequests(data)
      setRequestsLoading(false)
    })
  }

  useEffect(() => {
    loadMyRequests()
  }, [userId])

  const handleSubmit = async () => {
    setError(null)
    const trimmedName = name.trim()

    // Same exact-name-or-alias resolver used everywhere else - no fuzzy
    // matching, so this only blocks a genuine duplicate, never a
    // near-miss guess.
    const existingType = resolveIngredientType(trimmedName, {
      types: catalog.types,
      aliases: catalog.aliases,
    })
    if (existingType) {
      setError(`"${existingType.name}" is already in the catalog.`)
      return
    }
    const duplicatePending = myRequests.find(
      (r) =>
        r.status === "pending" &&
        r.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    )
    if (duplicatePending) {
      setError(
        `You already have a pending request for "${duplicatePending.name}".`,
      )
      return
    }

    setSaving(true)
    try {
      await createIngredientRequest({ name: trimmedName, note: note.trim() })
      setSent(true)
      loadMyRequests()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const handleWithdraw = async (id) => {
    setDeletingId(id)
    try {
      await deleteMyIngredientRequest(id)
      loadMyRequests()
    } finally {
      setDeletingId(null)
    }
  }

  if (sent) {
    return (
      <div
        style={{
          paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <TopBar title="Request an Ingredient" onBack={() => navigate(-1)} />
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
            color: "var(--text2)",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 16,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Request sent
          </p>
          <p style={{ margin: "0 0 20px", fontSize: 14 }}>
            An admin will review "{name}" and add it to the catalog if it fits.
            {returnTo &&
              " Whatever you were working on is still there, unsaved changes and all."}
          </p>
          {returnTo ? (
            <Btn
              variant="primary"
              small
              onClick={() => navigate(returnTo, { replace: true })}
            >
              Back to what I was doing
            </Btn>
          ) : (
            <Btn variant="ghost" small onClick={() => navigate(-1)}>
              Back
            </Btn>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <TopBar title="Request an Ingredient" onBack={() => navigate(-1)} />
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--text2)",
            lineHeight: 1.5,
          }}
        >
          Missing an ingredient type - a juice, a garnish, anything else? Only
          admins can add new types to the catalog, but you can ask for one here.
        </p>
        <Input
          label="Ingredient name"
          placeholder="e.g. Passionfruit Juice"
          value={name}
          onChange={setName}
        />
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text2)",
              fontFamily: "var(--font-display)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "block",
              marginBottom: 6,
            }}
          >
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's it for, or which category do you think it belongs in?"
            rows={3}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-s)",
              borderRadius: "var(--r-sm)",
              padding: "10px 14px",
              color: "var(--text)",
              fontSize: 14,
              fontFamily: "var(--font-body)",
              width: "100%",
              resize: "vertical",
            }}
          />
        </div>
        {error && (
          <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
            {error}
          </p>
        )}
        <Btn
          variant="primary"
          full
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
        >
          Send Request
        </Btn>

        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-display)",
              marginBottom: 8,
            }}
          >
            Your Requests
          </div>
          {requestsLoading ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text3)" }}>
              Loading...
            </p>
          ) : myRequests.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text3)" }}>
              You haven't requested anything yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myRequests.map((r) => (
                <Card key={r.id} style={{ padding: "12px 14px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 14, color: "var(--text)" }}>
                          {r.name}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            color: STATUS_LABELS[r.status].color,
                          }}
                        >
                          {STATUS_LABELS[r.status].label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>
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
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleWithdraw(r.id)}
                        disabled={deletingId === r.id}
                        title="Withdraw request"
                        style={{
                          background: "rgba(251,113,133,0.1)",
                          border: "1px solid rgba(251,113,133,0.25)",
                          borderRadius: 6,
                          padding: "6px 8px",
                          cursor: "pointer",
                          color: "var(--coral)",
                          flexShrink: 0,
                        }}
                      >
                        <IconTrash size={14} />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
