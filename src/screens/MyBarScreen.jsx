import { useMemo, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IngredientTypeEditor } from "@/components/IngredientTypeEditor"
import { EmptyState } from "@/components/myBar/EmptyState"
import { ExpandedProducts } from "@/components/myBar/ExpandedProducts"
import { FamilyCluster } from "@/components/myBar/FamilyCluster"
import { SearchFilterHeader } from "@/components/myBar/SearchFilterHeader"
import { TypeCard } from "@/components/myBar/TypeCard"

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
    const items = filtered.filter((t) => t.category_id === c.id)
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
        products={allProducts}
        types={types}
        aliases={aliases}
        ownedProductIds={ownedProductIds}
        isAdmin={isAdmin}
        onToggleProduct={toggleProduct}
        onProductsChanged={catalog.refetch}
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
      />

      <div className="p-4">
        {Object.entries(grouped).map(([categoryName, clusters]) => (
          <div key={categoryName} className="mb-5">
            <div className="text-[11px] font-bold text-tx3 uppercase tracking-[0.08em] font-display mb-2">
              {categoryName}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
              {clusters.map(({ parent, children }) => {
                if (children.length === 0)
                  return (
                    // display:"contents" makes this wrapper invisible to the
                    // grid, so the card and (if expanded) its full-width
                    // product panel both participate as direct grid items
                    // instead of being nested inside one grid cell.
                    <div key={parent.id} className="contents">
                      {editingTypeId === parent.id
                        ? renderEditForm(parent, { gridColumn: "1 / -1" })
                        : renderCard(parent, false)}
                      {renderExpanded(parent, { gridColumn: "1 / -1" })}
                    </div>
                  )
                return (
                  <FamilyCluster
                    key={parent.id}
                    parent={parent}
                    children={children}
                    editingTypeId={editingTypeId}
                    renderCard={renderCard}
                    renderEditForm={(t) => renderEditForm(t, { width: "100%" })}
                    renderExpanded={(t) => renderExpanded(t, { width: "100%" })}
                  />
                )
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState />}
      </div>
    </div>
  )
}
