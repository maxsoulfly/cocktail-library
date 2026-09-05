import { useMemo, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IngredientIcon } from "@/components/IngredientIcon"
import { IngredientTypeEditor } from "@/components/IngredientTypeEditor"
import { EmptyState } from "@/components/myBar/EmptyState"
import { ExpandedProducts } from "@/components/myBar/ExpandedProducts"
import { FamilyCluster } from "@/components/myBar/FamilyCluster"
import { SearchFilterHeader } from "@/components/myBar/SearchFilterHeader"
import { TypeCard } from "@/components/myBar/TypeCard"

// Within a category, order by real-world "how likely is this on a bar" -
// bar_priority already exists on every type (currently only consumed by
// src/domain/recommendations.js for purchase suggestions), name as
// tiebreaker. Previously pure alphabetical, which put e.g. Absinthe ahead
// of Gin purely on spelling - no relationship to which one an actual bar
// would stock.
const PRIORITY_RANK = { essential: 0, common: 1, specialized: 2, niche: 3 }
const byPriorityThenName = (a, b) =>
  (PRIORITY_RANK[a.bar_priority] ?? 99) -
    (PRIORITY_RANK[b.bar_priority] ?? 99) || a.name.localeCompare(b.name)

export default function MyBarScreen() {
  const navigate = useNavigate()
  const { catalog, inventory, isAdmin, isStaff } = useOutletContext()
  const {
    loading: catalogLoading,
    categories,
    types,
    products,
    aliases,
  } = catalog
  const {
    loading: inventoryLoading,
    ownedTypeIds,
    ownedProductIds,
    toggleType,
    toggleProduct,
  } = inventory

  const [query, setQuery] = useState("")
  const [cat, setCat] = useState("All")
  const [ownedOnly, setOwnedOnly] = useState(false)

  // Ingredient-type correction - once a type was created (Single Ingredient,
  // batch import, or a live data fix), nothing could ever edit it again, not
  // even an admin. The form itself is IngredientTypeEditor, shared with
  // Admin's own Ingredient Types tab - here we just track which type (if
  // any) is currently being edited.
  const [editingTypeId, setEditingTypeId] = useState(null)

  // Which type rows have their full product list expanded - separate from
  // ownership, since browsing what's in the shared catalog (e.g. products an
  // admin just batch-imported) is the only way to then claim one without
  // retyping its name into Add Product and creating a duplicate row.
  const [expandedTypeIds, setExpandedTypeIds] = useState(new Set())
  const toggleExpanded = (typeId) =>
    setExpandedTypeIds((prev) => {
      const next = new Set(prev)
      if (next.has(typeId)) next.delete(typeId)
      else next.add(typeId)
      return next
    })

  const productsByType = useMemo(() => {
    const map = new Map()
    products.forEach((p) => {
      if (!ownedProductIds.has(p.id)) return
      if (!map.has(p.ingredient_type_id)) map.set(p.ingredient_type_id, [])
      map.get(p.ingredient_type_id).push(p)
    })
    return map
  }, [products, ownedProductIds])

  // Every catalog product under a type, owned or not - what the expanded
  // browse list renders, as opposed to productsByType above (owned-only,
  // used for the collapsed subtitle).
  const allProductsByType = useMemo(() => {
    const map = new Map()
    products.forEach((p) => {
      if (!map.has(p.ingredient_type_id)) map.set(p.ingredient_type_id, [])
      map.get(p.ingredient_type_id).push(p)
    })
    return map
  }, [products])

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
  const categoryShapeByName = useMemo(
    () => new Map(categories.map((c) => [c.name, c.shape])),
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
    map.forEach((children) => children.sort(byPriorityThenName))
    return map
  }, [types])

  // "Wodka" -> Vodka: an alias is exactly a stand-in name for its type, so
  // search should match it too, not just the canonical name - a member who
  // added an alias for their own language/brand slang would otherwise never
  // be able to find the thing they just named. Substring search against a
  // known, explicit alias list, not fuzzy matching - AGENTS.md's "no fuzzy
  // ingredient-name matching" rule is about availability/import resolution
  // inferring a match on its own, not a search box filtering by literal text
  // the user (or an admin) already typed in.
  const aliasesByTypeId = useMemo(() => {
    const map = new Map()
    aliases.forEach((a) => {
      if (!map.has(a.ingredient_type_id)) map.set(a.ingredient_type_id, [])
      map.get(a.ingredient_type_id).push(a.alias)
    })
    return map
  }, [aliases])

  const filtered = types.filter((t) => {
    if (ownedOnly && !isOwned(t.id)) return false
    if (cat !== "All" && categoryNameById.get(t.category_id) !== cat)
      return false
    if (query) {
      const q = query.toLowerCase()
      const matchesName = t.name.toLowerCase().includes(q)
      const matchesAlias = (aliasesByTypeId.get(t.id) ?? []).some((a) =>
        a.toLowerCase().includes(q),
      )
      if (!matchesName && !matchesAlias) return false
    }
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

  // Groups buildRows()'s flat [{type, isChild}] list into
  // [{parent, children}] clusters, one per top-level type - lets the render
  // below box a parent + its children together (a "family" cluster) instead
  // of relying on card size alone to suggest the relationship, which tested
  // as too subtle to notice.
  const buildClusters = (items) => {
    const clusters = []
    buildRows(items).forEach(({ type, isChild }) => {
      if (!isChild) clusters.push({ parent: type, children: [] })
      else clusters[clusters.length - 1].children.push(type)
    })
    return clusters
  }

  const grouped = categories.reduce((acc, c) => {
    const items = filtered
      .filter((t) => t.category_id === c.id)
      .sort(byPriorityThenName)
    if (items.length) acc[c.name] = buildClusters(items)
    return acc
  }, {})

  const renderCard = (type, isChild) => {
    const owned = isOwned(type.id)
    const ownedProducts = productsByType.get(type.id) ?? []
    const allProducts = allProductsByType.get(type.id) ?? []
    const expanded = expandedTypeIds.has(type.id)
    // A parent type's own toggle only reflects direct/generic ownership of
    // it specifically - it can show "off" even though the availability
    // engine already treats an owned child (e.g. Dark Rum) as satisfying
    // it, via the same parent-walk in resolveOwnedIngredientTypes(). Surface
    // that here so the toggle being off doesn't read as a contradiction.
    const coveringChildren =
      !owned && !isChild
        ? (childrenByParentId.get(type.id) ?? []).filter((c) => isOwned(c.id))
        : []
    return (
      <TypeCard
        type={type}
        isChild={isChild}
        owned={owned}
        ownedProducts={ownedProducts}
        allProducts={allProducts}
        expanded={expanded}
        onToggleExpand={() => toggleExpanded(type.id)}
        coveringChildren={coveringChildren}
        isStaff={isStaff}
        onEditType={() => setEditingTypeId(type.id)}
        // Tap-to-view, not tap-to-select - the one deliberate difference
        // from Build Your Bar's own use of this same shared card (see
        // current-context.md's Stage 4 chunk). Only the dedicated
        // checkmark button changes ownership here.
        onCardClick={() => navigate(`/bar/type/${type.id}`)}
        onToggleOwned={() => toggleType(type.id)}
      />
    )
  }

  const renderEditForm = (type, style) => (
    <IngredientTypeEditor
      type={type}
      categories={categories}
      types={types}
      aliases={aliases}
      liquidColors={catalog.liquidColors}
      onAliasesChanged={catalog.refetch}
      style={style}
      onSaved={async () => {
        await catalog.refetch()
        setEditingTypeId(null)
      }}
      onCancel={() => setEditingTypeId(null)}
    />
  )

  const renderExpanded = (type, style) => {
    if (!expandedTypeIds.has(type.id)) return null
    const allProducts = allProductsByType.get(type.id) ?? []
    return (
      <ExpandedProducts
        typeName={type.name}
        products={allProducts}
        types={types}
        aliases={aliases}
        ownedProductIds={ownedProductIds}
        isAdmin={isAdmin}
        onToggleProduct={toggleProduct}
        onProductsChanged={catalog.refetch}
        onViewProduct={(productId) => navigate(`/bar/product/${productId}`)}
        style={style}
      />
    )
  }

  if (catalogLoading || inventoryLoading) {
    return (
      <div className="py-15 px-6 text-center text-tx2 text-sm">
        Loading your bar...
      </div>
    )
  }

  return (
    <div className="pb-[calc(96px_+_env(safe-area-inset-bottom,0px))]">
      <SearchFilterHeader
        query={query}
        onQueryChange={setQuery}
        onAddClick={() => navigate("/bar/add")}
        ownedOnly={ownedOnly}
        onToggleOwnedOnly={() => setOwnedOnly(!ownedOnly)}
        cats={cats}
        cat={cat}
        onCatChange={setCat}
        categoryShapeByName={categoryShapeByName}
      />

      <div className="p-4">
        {Object.entries(grouped).map(([categoryName, clusters]) => (
          <div key={categoryName} className="mb-5">
            <div className="flex items-center gap-1.5 mb-2">
              <IngredientIcon
                shape={categoryShapeByName.get(categoryName) ?? "spirit_bottle"}
                size={16}
                color="var(--text3)"
              />
              <div className="text-[11px] font-bold text-tx3 uppercase tracking-[0.08em] font-display">
                {categoryName}
              </div>
            </div>
            {/* Singles render as one contiguous block before any family
                cluster, not interleaved by priority/name order with them.
                FamilyCluster is `col-span-full` (a real grid-row break, not
                just a wider card), so a single sandwiched between two
                clusters in sort order could never actually share a row with
                any other single - exactly the "Tequila stranded alone,
                Absinthe+Mezcal stranded alone" layout bug a live screenshot
                surfaced. Splitting singles from clusters (each half keeping
                its own priority/name order from `clusters`) fixes that
                without changing the sort itself. */}
            <div className="flex flex-col gap-2">
              {clusters.some(({ children }) => children.length === 0) && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
                  {clusters
                    .filter(({ children }) => children.length === 0)
                    .map(({ parent }) => (
                      // display:"contents" makes this wrapper invisible to
                      // the grid, so the card and (if expanded) its
                      // full-width product panel both participate as direct
                      // grid items instead of being nested inside one grid
                      // cell. A standalone card already has its own border
                      // via Card's own base style - a childless single
                      // doesn't need FamilyCluster's extra grouping
                      // wrapper+label, since there's no group to indicate
                      // (and giving it one would force it to the full row
                      // width instead of flowing alongside other cards).
                      <div key={parent.id} className="contents">
                        {editingTypeId === parent.id
                          ? renderEditForm(parent, { gridColumn: "1 / -1" })
                          : renderCard(parent, false)}
                        {renderExpanded(parent, { gridColumn: "1 / -1" })}
                      </div>
                    ))}
                </div>
              )}
              {clusters
                .filter(({ children }) => children.length > 0)
                .map(({ parent, children }) => (
                  <FamilyCluster
                    key={parent.id}
                    parent={parent}
                    children={children}
                    editingTypeId={editingTypeId}
                    renderCard={renderCard}
                    renderEditForm={(t) => renderEditForm(t, { width: "100%" })}
                    renderExpanded={(t) => renderExpanded(t, { width: "100%" })}
                  />
                ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState />}
      </div>
    </div>
  )
}
