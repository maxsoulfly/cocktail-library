import { useEffect, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import {
  IconCheck,
  IconCopy,
  IconLock,
  IconPlus,
  IconTrash,
  IconX,
} from "@/components/icons"
import { TopBar } from "@/components/Nav"
import { Btn, Card } from "@/components/primitives"
import {
  buildIngredientImportPrompt,
  validateIngredientImport,
} from "@/schemas/ingredientImport"
import { COCKTAILS, MOCK_INVITES } from "@/data/mockData"
import { createIngredientTypes } from "@/services/catalog"
import {
  fetchPendingIngredientRequests,
  resolveIngredientRequest,
} from "@/services/ingredientRequests"
import { fetchCommunityRecipes, unpublishRecipe } from "@/services/recipes"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "invites", label: "Invitations" },
  { id: "moderation", label: "Moderation" },
  { id: "requests", label: "Requests" },
  { id: "import", label: "Batch Import" },
]

const STATUS_COLORS = {
  active: "var(--green)",
  redeemed: "var(--cyan)",
  expired: "var(--unavail)",
}
const STATUS_DOTS = { active: "●", redeemed: "◎", expired: "○" }

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

export default function AdminScreen() {
  const navigate = useNavigate()
  const { catalog } = useOutletContext()
  const [tab, setTab] = useState("overview")
  // Invites are still mock UI - real invite generation/revocation is step
  // 12's remaining scope, not this pass (which covers ingredient batch
  // import and ingredient requests instead).
  const [invites, setInvites] = useState(MOCK_INVITES)
  const [copied, setCopied] = useState(null)

  // Batch import: only "ingredients" is real. "classics"/"products" stay
  // visible but disabled - they're real roadmap items (recipe/product
  // import), not something to fake a result for now that ingredients is
  // real and the contrast would be misleading.
  const [importStep, setImportStep] = useState(0)
  const [importType, setImportType] = useState("ingredients")
  const [importJson, setImportJson] = useState("")
  const [importResult, setImportResult] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importSuccessMessage, setImportSuccessMessage] = useState(null)
  const [promptCopied, setPromptCopied] = useState(false)

  // Moderation is real: currently-published community recipes, with an
  // Unpublish action. There's no pre-publish review queue in the spec
  // (publishing is immediate) - the original mock's "pending/approve/reject"
  // flow didn't map to anything real and has been dropped rather than faked.
  const [communityRecipes, setCommunityRecipes] = useState([])
  const [communityLoading, setCommunityLoading] = useState(true)
  const [confirmUnpublish, setConfirmUnpublish] = useState(null)
  const [unpublishing, setUnpublishing] = useState(false)

  const loadCommunityRecipes = () => {
    setCommunityLoading(true)
    fetchCommunityRecipes().then((data) => {
      setCommunityRecipes(data)
      setCommunityLoading(false)
    })
  }

  useEffect(() => {
    loadCommunityRecipes()
  }, [])

  const handleUnpublish = async (id) => {
    setUnpublishing(true)
    try {
      await unpublishRecipe(id)
      loadCommunityRecipes()
    } finally {
      setUnpublishing(false)
      setConfirmUnpublish(null)
    }
  }

  // Requests: members' suggestions for missing ingredient types (see
  // RequestIngredientScreen.jsx). Fulfilling one doesn't auto-create the
  // type - the admin still goes through Batch Import for that, since a
  // request is just a name/note, not a validated category+hierarchy.
  const [pendingRequests, setPendingRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [resolvingRequestId, setResolvingRequestId] = useState(null)

  const loadPendingRequests = () => {
    setRequestsLoading(true)
    fetchPendingIngredientRequests().then((data) => {
      setPendingRequests(data)
      setRequestsLoading(false)
    })
  }

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const handleResolveRequest = async (id, status) => {
    setResolvingRequestId(id)
    try {
      await resolveIngredientRequest(id, status)
      loadPendingRequests()
    } finally {
      setResolvingRequestId(null)
    }
  }

  const generateInvite = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const seg = (n) =>
      Array.from(
        { length: n },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join("")
    const code = `CL-${seg(5)}-${seg(3)}`
    const now = new Date()
    const exp = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const fmt = (d) =>
      d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    setInvites([
      { code, status: "active", created: fmt(now), expires: fmt(exp) },
      ...invites,
    ])
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const revokeInvite = (code) =>
    setInvites(
      invites.map((i) => (i.code === code ? { ...i, status: "expired" } : i)),
    )

  const importPrompt = buildIngredientImportPrompt({
    categories: catalog.categories,
    types: catalog.types,
  })

  const copyImportPrompt = () => {
    navigator.clipboard.writeText(importPrompt).catch(() => {})
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  const runImportValidation = () => {
    let parsed
    try {
      parsed = JSON.parse(importJson)
      if (!Array.isArray(parsed)) throw new Error("Expected a JSON array")
    } catch (err) {
      setImportResult({ parseError: err.message })
      setImportStep(3)
      return
    }
    const validation = validateIngredientImport(parsed, {
      categories: catalog.categories,
      types: catalog.types,
    })
    setImportResult(validation)
    setImportStep(3)
  }

  const handleCommitImport = async () => {
    if (!importResult?.results) return
    const rows = importResult.results
      .filter((r) => r.valid)
      .map((r) => r.resolved)
    if (rows.length === 0) return
    setImporting(true)
    try {
      await createIngredientTypes(rows)
      await catalog.refetch()
      setImportSuccessMessage(
        `Imported ${rows.length} ingredient type${
          rows.length === 1 ? "" : "s"
        }.`,
      )
      setImportStep(0)
      setImportJson("")
      setImportResult(null)
    } catch (err) {
      setImportResult({ ...importResult, commitError: err.message })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <TopBar title="Admin Dashboard" onBack={() => navigate(-1)} />

      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--border-s)",
          background: "var(--bg2)",
          overflowX: "auto",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${
                tab === t.id ? "var(--violet)" : "transparent"
              }`,
              color: tab === t.id ? "var(--violet)" : "var(--text2)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "var(--font-display)",
              fontWeight: tab === t.id ? 700 : 400,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {t.label}
            {t.id === "requests" && pendingRequests.length > 0
              ? ` (${pendingRequests.length})`
              : ""}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px" }}>
        {tab === "overview" && (
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
              {[
                {
                  label: "Classic Recipes",
                  val: COCKTAILS.filter((c) => c.source === "classic").length,
                  color: "var(--violet)",
                },
                {
                  label: "Community Recipes",
                  val: communityRecipes.length,
                  color: "var(--cyan)",
                },
                {
                  label: "Ingredient Types",
                  val: catalog.types.length,
                  color: "var(--green)",
                },
                {
                  label: "Active Invitations",
                  val: invites.filter((i) => i.status === "active").length,
                  color: "var(--amber)",
                },
              ].map(({ label, val, color }) => (
                <Card
                  key={label}
                  style={{ padding: "16px", textAlign: "center" }}
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
              "Community Recipes" and "Ingredient Types" are real; "Classic
              Recipes" and "Active Invitations" are still placeholder counts
              pending the rest of admin catalog tools.
            </p>
          </div>
        )}

        {tab === "invites" && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <Btn variant="primary" onClick={generateInvite}>
              <IconPlus size={15} /> Generate Invitation
            </Btn>
            {invites.map((inv) => (
              <Card key={inv.code} style={{ padding: "14px 16px" }}>
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          fontSize: 14,
                          color: "var(--text)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {inv.code}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: STATUS_COLORS[inv.status],
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {STATUS_DOTS[inv.status]} {inv.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>
                      Created {inv.created} · Expires {inv.expires}
                    </div>
                    {inv.redeemedBy && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--cyan)",
                          marginTop: 2,
                        }}
                      >
                        Redeemed by {inv.redeemedBy}
                      </div>
                    )}
                  </div>
                  {inv.status === "active" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => copyCode(inv.code)}
                        style={{
                          background:
                            copied === inv.code
                              ? "rgba(52,211,153,0.15)"
                              : "var(--surface3)",
                          border: "1px solid var(--border-s)",
                          borderRadius: 6,
                          padding: "5px 10px",
                          cursor: "pointer",
                          color:
                            copied === inv.code
                              ? "var(--green)"
                              : "var(--text2)",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {copied === inv.code ? (
                          <IconCheck size={12} />
                        ) : (
                          <IconCopy size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => revokeInvite(inv.code)}
                        style={{
                          background: "rgba(251,113,133,0.1)",
                          border: "1px solid rgba(251,113,133,0.25)",
                          borderRadius: 6,
                          padding: "5px 10px",
                          cursor: "pointer",
                          color: "var(--coral)",
                          fontSize: 12,
                        }}
                      >
                        <IconTrash size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "moderation" && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
              Published community recipes. Unpublishing returns a recipe to its
              owner's private list without deleting it.
            </p>
            {communityLoading ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
                Loading...
              </p>
            ) : communityRecipes.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>
                No published community recipes.
              </p>
            ) : (
              communityRecipes.map((c) => (
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
                        {c.owner?.display_name ?? "the owner"}'s private list —
                        their copy won't be deleted.
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
        )}

        {tab === "requests" && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
              Ingredients members have asked for. Fulfilling one is just
              bookkeeping - use Batch Import to actually add the type.
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
                        onClick={() => handleResolveRequest(r.id, "fulfilled")}
                        disabled={resolvingRequestId === r.id}
                        title="Mark fulfilled"
                        style={{
                          background: "rgba(52,211,153,0.1)",
                          border: "1px solid rgba(52,211,153,0.25)",
                          borderRadius: 6,
                          padding: "6px 8px",
                          cursor: "pointer",
                          color: "var(--green)",
                        }}
                      >
                        <IconCheck size={14} />
                      </button>
                      <button
                        onClick={() => handleResolveRequest(r.id, "dismissed")}
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
        )}

        {tab === "import" && (
          <div
            className="fade-in"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {importSuccessMessage && (
              <p style={{ margin: 0, fontSize: 13, color: "var(--green)" }}>
                {importSuccessMessage}
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: 0,
                background: "var(--surface)",
                border: "1px solid var(--border-s)",
                borderRadius: "var(--r-sm)",
                overflow: "hidden",
              }}
            >
              {[0, 1, 2, 3].map((step) => (
                <div
                  key={step}
                  style={{
                    flex: 1,
                    height: 4,
                    background:
                      step <= importStep ? "var(--violet)" : "transparent",
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>

            {importStep === 0 && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Select Import Type
                </h3>
                {[
                  {
                    id: "classics",
                    label: "Classic Recipes",
                    desc: "Shared recipe catalog",
                    disabled: true,
                  },
                  {
                    id: "ingredients",
                    label: "Ingredient Types",
                    desc: "Generic ingredient catalog",
                    disabled: false,
                  },
                  {
                    id: "products",
                    label: "Products",
                    desc: "Branded products and homemade items",
                    disabled: true,
                  },
                ].map((t) => (
                  <Card
                    key={t.id}
                    style={{
                      padding: "14px 16px",
                      cursor: t.disabled ? "default" : "pointer",
                      opacity: t.disabled ? 0.5 : 1,
                      border: `1px solid ${
                        importType === t.id
                          ? "var(--violet)"
                          : "var(--border-s)"
                      }`,
                      background:
                        importType === t.id
                          ? "rgba(167,139,250,0.08)"
                          : "var(--surface)",
                    }}
                    onClick={() => !t.disabled && setImportType(t.id)}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${
                            importType === t.id
                              ? "var(--violet)"
                              : "var(--border-s)"
                          }`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {importType === t.id && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "var(--violet)",
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {t.label}
                          {t.disabled && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: 11,
                                color: "var(--text3)",
                                fontWeight: 400,
                              }}
                            >
                              Coming soon
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>
                          {t.desc}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                <Btn
                  variant="primary"
                  full
                  onClick={() => {
                    setImportSuccessMessage(null)
                    setImportStep(1)
                  }}
                >
                  Next
                </Btn>
              </div>
            )}

            {importStep === 1 && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Format with AI, then Paste JSON
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
                  Copy this prompt into an AI chat along with what you want to
                  add (e.g. "Passionfruit Juice, Yuzu, Grapefruit"), then paste
                  its JSON output below. The prompt is generated from the live
                  catalog, so it always lists the current categories and types.
                </p>
                <Card
                  style={{
                    padding: "14px",
                    background: "var(--surface2)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--text3)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {importPrompt}
                </Card>
                <Btn variant="ghost" small onClick={copyImportPrompt}>
                  {promptCopied ? (
                    <IconCheck size={14} />
                  ) : (
                    <IconCopy size={14} />
                  )}{" "}
                  {promptCopied ? "Copied" : "Copy Prompt"}
                </Btn>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="Paste your JSON here..."
                  rows={8}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-s)",
                    borderRadius: "var(--r-sm)",
                    padding: "12px 14px",
                    color: "var(--text)",
                    fontSize: 13,
                    fontFamily: "var(--font-mono)",
                    resize: "vertical",
                    width: "100%",
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" small onClick={() => setImportStep(0)}>
                    Back
                  </Btn>
                  <Btn variant="primary" full onClick={runImportValidation}>
                    Validate
                  </Btn>
                </div>
              </div>
            )}

            {importStep === 3 && importResult && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Validation Results
                </h3>
                {importResult.parseError ? (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--coral)" }}>
                    Couldn't parse that as a JSON array:{" "}
                    {importResult.parseError}
                  </p>
                ) : (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 8,
                      }}
                    >
                      {[
                        {
                          label: "Ready to import",
                          val: importResult.validCount,
                          color: "var(--green)",
                        },
                        {
                          label: "Errors",
                          val: importResult.errorCount,
                          color: "var(--coral)",
                        },
                      ].map(({ label, val, color }) => (
                        <Card
                          key={label}
                          style={{ padding: "12px", textAlign: "center" }}
                        >
                          <div
                            style={{
                              fontSize: 24,
                              fontFamily: "var(--font-display)",
                              fontWeight: 800,
                              color,
                              marginBottom: 2,
                            }}
                          >
                            {val}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text2)" }}>
                            {label}
                          </div>
                        </Card>
                      ))}
                    </div>
                    <Card style={{ padding: "12px 14px" }}>
                      {importResult.results.map((row, i, arr) => (
                        <div
                          key={row.index}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            padding: "8px 0",
                            borderBottom:
                              i < arr.length - 1
                                ? "1px solid var(--border-s)"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              flexShrink: 0,
                              marginTop: 6,
                              background: row.valid
                                ? "var(--green)"
                                : "var(--coral)",
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <span
                              style={{ fontSize: 13, color: "var(--text)" }}
                            >
                              {row.name ?? `Row ${row.index + 1}`}
                            </span>
                            {!row.valid && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--coral)",
                                  marginTop: 2,
                                }}
                              >
                                {row.errors.join("; ")}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </Card>
                    {importResult.commitError && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "var(--coral)",
                        }}
                      >
                        {importResult.commitError}
                      </p>
                    )}
                  </>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn
                    variant="ghost"
                    small
                    onClick={() => {
                      setImportStep(0)
                      setImportJson("")
                      setImportResult(null)
                    }}
                  >
                    Cancel
                  </Btn>
                  {!importResult.parseError && (
                    <Btn
                      variant="primary"
                      full
                      disabled={importing || importResult.validCount === 0}
                      onClick={handleCommitImport}
                    >
                      {importing
                        ? "Importing..."
                        : `Import ${importResult.validCount} Ingredient${
                            importResult.validCount === 1 ? "" : "s"
                          }`}
                    </Btn>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
