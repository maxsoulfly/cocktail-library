import { useMemo, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IconBottle, IconPlus, IconSearch } from "@/components/icons"
import { Card, FilterChip, OwnedToggle } from "@/components/primitives"

export default function MyBarScreen() {
  const navigate = useNavigate()
  const { catalog, inventory } = useOutletContext()
  const { loading: catalogLoading, categories, types, products } = catalog
  const {
    loading: inventoryLoading,
    ownedTypeIds,
    ownedProductIds,
    toggleType,
  } = inventory

  const [query, setQuery] = useState("")
  const [cat, setCat] = useState("All")
  const [ownedOnly, setOwnedOnly] = useState(false)

  const productsByType = useMemo(() => {
    const map = new Map()
    products.forEach((p) => {
      if (!ownedProductIds.has(p.id)) return
      if (!map.has(p.ingredient_type_id)) map.set(p.ingredient_type_id, [])
      map.get(p.ingredient_type_id).push(p)
    })
    return map
  }, [products, ownedProductIds])

  // "Owned" for display combines generic ownership and any owned product
  // mapped to the type, per the spec ("owning a product satisfies its
  // mapped generic type"). The toggle itself only ever writes the generic
  // row - see useInventory.js.
  const isOwned = (typeId) =>
    ownedTypeIds.has(typeId) || productsByType.has(typeId)

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )
  const cats = ["All", ...categories.map((c) => c.name)]

  // Some types are mid-level groupings for a category (e.g. "Rum", "Whiskey"
  // under Spirit - see supabase/migrations/20260816010047) rather than
  // things anyone would search for by name - see childrenByParentId below.
  const childrenByParentId = useMemo(() => {
    const map = new Map()
    types.forEach((t) => {
      if (!t.parent_type_id) return
      if (!map.has(t.parent_type_id)) map.set(t.parent_type_id, [])
      map.get(t.parent_type_id).push(t)
    })
    return map
  }, [types])

  const filtered = types.filter((t) => {
    if (ownedOnly && !isOwned(t.id)) return false
    if (cat !== "All" && categoryNameById.get(t.category_id) !== cat)
      return false
    if (query && !t.name.toLowerCase().includes(query.toLowerCase()))
      return false
    return true
  })

  // Renders parent types followed immediately by their (filtered) children,
  // indented - a child whose parent didn't pass the filter (e.g. searching
  // "dark" matches "Dark Rum" but not "Rum") still shows, just flat, so
  // grouping never hides a real search match.
  const buildRows = (items) => {
    const filteredIds = new Set(items.map((t) => t.id))
    const topLevel = items.filter((t) => !t.parent_type_id)
    const orphanChildren = items.filter(
      (t) => t.parent_type_id && !filteredIds.has(t.parent_type_id),
    )
    const rows = []
    topLevel.forEach((t) => {
      rows.push({ type: t, isChild: false })
      ;(childrenByParentId.get(t.id) ?? [])
        .filter((child) => filteredIds.has(child.id))
        .forEach((child) => rows.push({ type: child, isChild: true }))
    })
    orphanChildren.forEach((t) => rows.push({ type: t, isChild: false }))
    return rows
  }

  const grouped = categories.reduce((acc, c) => {
    const items = filtered.filter((t) => t.category_id === c.id)
    if (items.length) acc[c.name] = buildRows(items)
    return acc
  }, {})

  if (catalogLoading || inventoryLoading) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text2)",
          fontSize: 14,
        }}
      >
        Loading your bar...
      </div>
    )
  }

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        style={{
          padding: "16px 16px 0",
          background: "var(--bg2)",
          borderBottom: "1px solid var(--border-s)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <IconSearch
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text3)",
              }}
            />
            <input
              placeholder="Search ingredients..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-s)",
                borderRadius: "var(--r-sm)",
                padding: "9px 12px 9px 36px",
                color: "var(--text)",
                fontSize: 14,
                fontFamily: "var(--font-body)",
                width: "100%",
              }}
            />
          </div>
          <button
            onClick={() => navigate("/bar/add")}
            style={{
              background: "var(--cyan)",
              border: "none",
              borderRadius: "var(--r-sm)",
              width: 40,
              height: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#07091a",
              flexShrink: 0,
            }}
            className="glow-cyan"
          >
            <IconPlus size={18} />
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <FilterChip
            label="Owned only"
            active={ownedOnly}
            onClick={() => setOwnedOnly(!ownedOnly)}
          />
          <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto" }}>
            {cats.map((c) => (
              <FilterChip
                key={c}
                label={c}
                active={cat === c}
                onClick={() => setCat(c)}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {Object.entries(grouped).map(([categoryName, rows]) => (
          <div key={categoryName} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text3)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "var(--font-display)",
                marginBottom: 8,
              }}
            >
              {categoryName}
            </div>
            <Card>
              {rows.map(({ type, isChild }, idx) => {
                const owned = isOwned(type.id)
                const ownedProducts = productsByType.get(type.id) ?? []
                // A parent type's own toggle only reflects direct/generic
                // ownership of it specifically - it can show "off" even
                // though the availability engine already treats an owned
                // child (e.g. Dark Rum) as satisfying it, via the same
                // parent-walk in resolveOwnedIngredientTypes(). Surface that
                // here so the toggle being off doesn't read as a
                // contradiction.
                const coveringChildren =
                  !owned && !isChild
                    ? (childrenByParentId.get(type.id) ?? []).filter((c) =>
                        isOwned(c.id),
                      )
                    : []
                return (
                  <div
                    key={type.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: isChild ? "9px 14px 9px 34px" : "11px 14px",
                      borderBottom:
                        idx < rows.length - 1
                          ? "1px solid var(--border-s)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: isChild ? 26 : 34,
                        height: isChild ? 26 : 34,
                        borderRadius: 8,
                        background: `${type.color ?? "#4e6680"}25`,
                        border: `1px solid ${type.color ?? "#4e6680"}40`,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: isChild ? 13 : 14,
                          fontFamily: "var(--font-body)",
                          fontWeight: isChild ? 400 : 500,
                          color: owned ? "var(--text)" : "var(--text3)",
                          transition: "color 0.15s",
                        }}
                      >
                        {type.name}
                      </div>
                      {ownedProducts.length > 0 && (
                        <div style={{ fontSize: 12, color: "var(--text3)" }}>
                          {ownedProducts.map((p) => p.name).join(", ")}
                        </div>
                      )}
                      {coveringChildren.length > 0 && (
                        <div style={{ fontSize: 12, color: "var(--cyan)" }}>
                          Covered by{" "}
                          {coveringChildren.map((c) => c.name).join(", ")}
                        </div>
                      )}
                    </div>
                    <OwnedToggle
                      owned={owned}
                      onChange={() => toggleType(type.id)}
                    />
                  </div>
                )
              })}
            </Card>
          </div>
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "var(--text3)",
            }}
          >
            <IconBottle size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontFamily: "var(--font-display)",
                fontWeight: 600,
              }}
            >
              Nothing here
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              Try clearing your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
