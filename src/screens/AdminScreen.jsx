import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { IconCheck, IconCopy, IconPlus, IconTrash } from "@/components/icons"
import { TopBar } from "@/components/Nav"
import { Btn, Card } from "@/components/primitives"
import { COCKTAILS, INGS, MOCK_COMMUNITY, MOCK_INVITES } from "@/data/mockData"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "invites", label: "Invitations" },
  { id: "moderation", label: "Moderation" },
  { id: "import", label: "Batch Import" },
]

const STATUS_COLORS = { active: "var(--green)", redeemed: "var(--cyan)", expired: "var(--unavail)" }
const STATUS_DOTS = { active: "●", redeemed: "◎", expired: "○" }

export default function AdminScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("overview")
  const [invites, setInvites] = useState(MOCK_INVITES)
  const [community, setCommunity] = useState(MOCK_COMMUNITY)
  const [confirmUnpublish, setConfirmUnpublish] = useState(null)
  const [copied, setCopied] = useState(null)
  const [importStep, setImportStep] = useState(0)
  const [importType, setImportType] = useState("classics")
  const [importJson, setImportJson] = useState("")
  const [importResult, setImportResult] = useState(null)

  const generateInvite = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    const code = `CL-${seg(5)}-${seg(3)}`
    const now = new Date()
    const exp = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    setInvites([{ code, status: "active", created: fmt(now), expires: fmt(exp) }, ...invites])
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const revokeInvite = (code) => setInvites(invites.map((i) => (i.code === code ? { ...i, status: "expired" } : i)))

  const unpublish = (id) => {
    setCommunity(community.map((c) => (c.id === id ? { ...c, status: "unpublished" } : c)))
    setConfirmUnpublish(null)
  }

  const runImportValidation = () => {
    setImportResult({ additions: 3, updates: 1, duplicates: 1 })
    setImportStep(3)
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <TopBar title="Admin Dashboard" onBack={() => navigate(-1)} />

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border-s)", background: "var(--bg2)", overflowX: "auto" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "var(--violet)" : "transparent"}`, color: tab === t.id ? "var(--violet)" : "var(--text2)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: tab === t.id ? 700 : 400, whiteSpace: "nowrap", transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px" }}>
        {tab === "overview" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {[
                { label: "Classic Recipes", val: COCKTAILS.filter((c) => c.source === "classic").length, color: "var(--violet)" },
                { label: "Community Recipes", val: COCKTAILS.filter((c) => c.source === "community").length, color: "var(--cyan)" },
                { label: "Ingredient Types", val: INGS.length, color: "var(--green)" },
                { label: "Active Invitations", val: invites.filter((i) => i.status === "active").length, color: "var(--amber)" },
              ].map(({ label, val, color }) => (
                <Card key={label} style={{ padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontFamily: "var(--font-display)", fontWeight: 800, color, marginBottom: 4 }}>{val}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--font-body)" }}>{label}</div>
                </Card>
              ))}
            </div>
            <Card style={{ padding: "16px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-display)", marginBottom: 10 }}>Pending Review</div>
              {community.filter((c) => c.status === "pending").length === 0 ? (
                <p style={{ margin: 0, fontSize: 14, color: "var(--text3)" }}>Nothing pending — you are all caught up.</p>
              ) : community.filter((c) => c.status === "pending").map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-s)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontFamily: "var(--font-body)", color: "var(--text)", fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>by {c.author} · {c.submitted}</div>
                  </div>
                  <button onClick={() => setTab("moderation")} style={{ background: "none", border: "1px solid var(--border-s)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "var(--text2)", fontSize: 12, fontFamily: "var(--font-display)" }}>Review</button>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === "invites" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Btn variant="primary" onClick={generateInvite}><IconPlus size={15} /> Generate Invitation</Btn>
            {invites.map((inv) => (
              <Card key={inv.code} style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14, color: "var(--text)", letterSpacing: "0.06em" }}>{inv.code}</span>
                      <span style={{ fontSize: 11, color: STATUS_COLORS[inv.status], fontFamily: "var(--font-mono)" }}>{STATUS_DOTS[inv.status]} {inv.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>Created {inv.created} · Expires {inv.expires}</div>
                    {inv.redeemedBy && <div style={{ fontSize: 12, color: "var(--cyan)", marginTop: 2 }}>Redeemed by {inv.redeemedBy}</div>}
                  </div>
                  {inv.status === "active" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => copyCode(inv.code)} style={{ background: copied === inv.code ? "rgba(52,211,153,0.15)" : "var(--surface3)", border: "1px solid var(--border-s)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: copied === inv.code ? "var(--green)" : "var(--text2)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        {copied === inv.code ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      </button>
                      <button onClick={() => revokeInvite(inv.code)} style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.25)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: "var(--coral)", fontSize: 12 }}>
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
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>Community-submitted recipes. Published recipes are visible to all members.</p>
            {community.map((c) => (
              <Card key={c.id} style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>by {c.author} · submitted {c.submitted}</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: c.status === "published" ? "var(--green)" : c.status === "pending" ? "var(--amber)" : "var(--unavail)", border: "1px solid currentColor", borderRadius: 4, padding: "2px 6px" }}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                  {c.status === "published" && (
                    <button onClick={() => setConfirmUnpublish(c.id)} style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.25)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "var(--coral)", fontSize: 12, fontFamily: "var(--font-display)", fontWeight: 600 }}>Unpublish</button>
                  )}
                  {c.status === "pending" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn variant="primary" small onClick={() => setCommunity(community.map((r) => (r.id === c.id ? { ...r, status: "published" } : r)))}>Approve</Btn>
                      <Btn variant="danger" small onClick={() => setConfirmUnpublish(c.id)}>Reject</Btn>
                    </div>
                  )}
                </div>
                {confirmUnpublish === c.id && (
                  <div style={{ marginTop: 12, padding: "12px", background: "rgba(251,113,133,0.08)", borderRadius: 8, border: "1px solid rgba(251,113,133,0.25)" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text2)" }}>
                      {c.status === "pending" ? `Reject "${c.name}"? The author will be notified.` : `Unpublish "${c.name}"? It will be hidden from all members but not deleted.`}
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn variant="danger" small onClick={() => unpublish(c.id)}>{c.status === "pending" ? "Reject" : "Unpublish"}</Btn>
                      <Btn variant="ghost" small onClick={() => setConfirmUnpublish(null)}>Cancel</Btn>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {tab === "import" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 0, background: "var(--surface)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
              {[0, 1, 2, 3].map((step) => (
                <div key={step} style={{ flex: 1, height: 4, background: step <= importStep ? "var(--violet)" : "transparent", transition: "background 0.3s" }} />
              ))}
            </div>

            {importStep === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Select Import Type</h3>
                {[{ id: "classics", label: "Classic Recipes", desc: "Shared recipe catalog" }, { id: "ingredients", label: "Ingredient Types", desc: "Generic ingredient catalog" }, { id: "products", label: "Products", desc: "Branded products and homemade items" }].map((t) => (
                  <Card key={t.id} style={{ padding: "14px 16px", cursor: "pointer", border: `1px solid ${importType === t.id ? "var(--violet)" : "var(--border-s)"}`, background: importType === t.id ? "rgba(167,139,250,0.08)" : "var(--surface)" }} onClick={() => setImportType(t.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${importType === t.id ? "var(--violet)" : "var(--border-s)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {importType === t.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--violet)" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text)" }}>{t.label}</div>
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>{t.desc}</div>
                      </div>
                    </div>
                  </Card>
                ))}
                <Btn variant="primary" full onClick={() => setImportStep(1)}>Next</Btn>
              </div>
            )}

            {importStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Paste JSON Data</h3>
                <Card style={{ padding: "14px", background: "var(--surface2)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text3)", lineHeight: 1.6 }}>
                  {`// Expected format for ${importType}:\n[\n  {\n    "name": "Cocktail Name",\n    "source": "classic",\n    "glass": "rocks",\n    "ingredients": [...]\n  }\n]`}
                </Card>
                <textarea value={importJson} onChange={(e) => setImportJson(e.target.value)} placeholder="Paste your JSON here..." rows={8} style={{ background: "var(--surface)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", padding: "12px 14px", color: "var(--text)", fontSize: 13, fontFamily: "var(--font-mono)", resize: "vertical", width: "100%" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" small onClick={() => setImportStep(0)}>Back</Btn>
                  <Btn variant="primary" full onClick={runImportValidation}>Validate</Btn>
                </div>
              </div>
            )}

            {importStep === 3 && importResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Validation Results</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {[{ label: "Additions", val: importResult.additions, color: "var(--green)" }, { label: "Updates", val: importResult.updates, color: "var(--amber)" }, { label: "Duplicates", val: importResult.duplicates, color: "var(--unavail)" }].map(({ label, val, color }) => (
                    <Card key={label} style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontFamily: "var(--font-display)", fontWeight: 800, color, marginBottom: 2 }}>{val}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>{label}</div>
                    </Card>
                  ))}
                </div>
                <Card style={{ padding: "12px 14px" }}>
                  {[{ name: "Clover Club", action: "add", status: "ok" }, { name: "Aviation", action: "add", status: "ok" }, { name: "Sidecar", action: "add", status: "ok" }, { name: "Negroni", action: "update", status: "warn" }, { name: "Mojito", action: "duplicate", status: "skip" }].map((row, i, arr) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border-s)" : "none" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: row.status === "ok" ? "var(--green)" : row.status === "warn" ? "var(--amber)" : "var(--unavail)" }} />
                      <span style={{ flex: 1, fontSize: 13, color: "var(--text)" }}>{row.name}</span>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: row.status === "ok" ? "var(--green)" : row.status === "warn" ? "var(--amber)" : "var(--unavail)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{row.action}</span>
                    </div>
                  ))}
                </Card>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" small onClick={() => { setImportStep(0); setImportJson(""); setImportResult(null) }}>Cancel</Btn>
                  <Btn variant="primary" full onClick={() => { setImportStep(0); setImportJson(""); setImportResult(null) }}>Confirm Import</Btn>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
