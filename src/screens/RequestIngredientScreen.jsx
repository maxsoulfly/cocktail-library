import { useEffect, useState } from "react"
import clsx from "clsx"
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
  pending: { label: "Pending", tone: "text-amber" },
  fulfilled: { label: "Fulfilled", tone: "text-green" },
  dismissed: { label: "Dismissed", tone: "text-tx3" },
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
      <div className="pb-[calc(96px_+_env(safe-area-inset-bottom,0px))]">
        <TopBar title="Request an Ingredient" onBack={() => navigate(-1)} />
        <div className="py-15 px-6 text-center text-tx2">
          <p className="mb-3 text-base font-display font-semibold text-tx">
            Request sent
          </p>
          <p className="mb-5 text-sm">
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
    <div className="pb-[calc(96px_+_env(safe-area-inset-bottom,0px))]">
      <TopBar title="Request an Ingredient" onBack={() => navigate(-1)} />
      <div className="p-5 flex flex-col gap-5">
        <p className="text-[13px] text-tx2 leading-normal">
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
          <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em] block mb-1.5">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's it for, or which category do you think it belongs in?"
            rows={3}
            className="bg-surface border border-bdr rounded-sm py-2.5 px-3.5 text-tx text-sm font-body w-full resize-y"
          />
        </div>
        {error && <p className="text-xs text-coral">{error}</p>}
        <Btn
          variant="primary"
          full
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
        >
          Send Request
        </Btn>

        <div>
          <div className="text-xs font-bold text-tx3 uppercase tracking-[0.06em] font-display mb-2">
            Your Requests
          </div>
          {requestsLoading ? (
            <p className="text-[13px] text-tx3">Loading...</p>
          ) : myRequests.length === 0 ? (
            <p className="text-[13px] text-tx3">
              You haven't requested anything yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {myRequests.map((r) => (
                <Card key={r.id} className="py-3 px-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-tx">{r.name}</span>
                        <span
                          className={clsx(
                            "text-[11px] font-mono",
                            STATUS_LABELS[r.status].tone,
                          )}
                        >
                          {STATUS_LABELS[r.status].label}
                        </span>
                      </div>
                      <div className="text-xs text-tx3">
                        {formatDate(r.created_at)}
                      </div>
                      {r.note && (
                        <p className="mt-1.5 text-[13px] text-tx2">{r.note}</p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleWithdraw(r.id)}
                        disabled={deletingId === r.id}
                        title="Withdraw request"
                        className="bg-coral/10 border border-coral/25 rounded-[6px] py-1.5 px-2 cursor-pointer text-coral shrink-0"
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
