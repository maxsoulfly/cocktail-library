import { useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IconBottle, IconPlus, IconSearch } from "@/components/icons"
import { Card, FilterChip, OwnedToggle } from "@/components/primitives"
import { ING_CATEGORIES, INGS } from "@/data/mockData"

export default function MyBarScreen() {
  const navigate = useNavigate()
  const { owned, toggleOwned } = useOutletContext()
  const [query, setQuery] = useState("")
  const [cat, setCat] = useState("All")
  const [ownedOnly, setOwnedOnly] = useState(false)

  const cats = ["All", ...ING_CATEGORIES]
  const filtered = INGS.filter((i) => {
    if (ownedOnly && !owned.has(i.id)) return false
    if (cat !== "All" && i.category !== cat) return false
    if (query && !i.name.toLowerCase().includes(query.toLowerCase()) && !(i.brand ?? "").toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const grouped = ING_CATEGORIES.reduce((acc, c) => {
    const items = filtered.filter((i) => i.category === c)
    if (items.length) acc[c] = items
    return acc
  }, {})

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: "16px 16px 0", background: "var(--bg2)", borderBottom: "1px solid var(--border-s)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <IconSearch size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
            <input placeholder="Search ingredients or brands..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ background: "var(--surface)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", padding: "9px 12px 9px 36px", color: "var(--text)", fontSize: 14, fontFamily: "var(--font-body)", width: "100%" }} />
          </div>
          <button onClick={() => navigate("/bar/add")} style={{ background: "var(--cyan)", border: "none", borderRadius: "var(--r-sm)", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#07091a", flexShrink: 0 }} className="glow-cyan">
            <IconPlus size={18} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <FilterChip label="Owned only" active={ownedOnly} onClick={() => setOwnedOnly(!ownedOnly)} />
          <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto" }}>
            {cats.map((c) => <FilterChip key={c} label={c} active={cat === c} onClick={() => setCat(c)} />)}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {Object.entries(grouped).map(([category, ings]) => (
          <div key={category} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-display)", marginBottom: 8 }}>{category}</div>
            <Card>
              {ings.map((ing, idx) => {
                const isOwned = owned.has(ing.id)
                return (
                  <div key={ing.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: idx < ings.length - 1 ? "1px solid var(--border-s)" : "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${ing.color}25`, border: `1px solid ${ing.color}40`, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontFamily: "var(--font-body)", fontWeight: 500, color: isOwned ? "var(--text)" : "var(--text3)", transition: "color 0.15s" }}>{ing.name}</div>
                      {ing.brand && <div style={{ fontSize: 12, color: "var(--text3)" }}>{ing.brand}</div>}
                    </div>
                    <OwnedToggle owned={isOwned} onChange={() => toggleOwned(ing.id)} />
                  </div>
                )
              })}
            </Card>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)" }}>
            <IconBottle size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 15, fontFamily: "var(--font-display)", fontWeight: 600 }}>Nothing here</p>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>Try clearing your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
