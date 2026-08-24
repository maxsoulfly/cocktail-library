import { NamedRowManager } from "@/components/admin/NamedRowManager"
import {
  createCocktailFamily,
  createGlass,
  createIngredientCategory,
  createLiquidColor,
  createTasteTag,
  deleteCocktailFamily,
  deleteGlass,
  deleteIngredientCategory,
  deleteLiquidColor,
  deleteTasteTag,
  updateCocktailFamily,
  updateGlass,
  updateIngredientCategory,
  updateLiquidColor,
  updateTasteTag,
} from "@/services/catalog"

// Glasses, taste tags, cocktail families, liquid colors, and ingredient
// categories - the lookup lists recipes and ingredient types reference. All
// five share the identical "member read, admin write" shape, hence one
// NamedRowManager instance per table instead of five near-duplicate forms.
export function CatalogTab({ catalog }) {
  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
        Glasses, taste tags, cocktail families, and ingredient categories - the
        lookup lists recipes and ingredient types reference. A row in use by a
        recipe or ingredient type can't be deleted (the database rejects it);
        rename or add new ones instead.
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--text3)" }}>
        Glasses and cocktail families each pick one of a handful of built-in
        pictograms (whichever one looks closest) - a new glass or family name
        works immediately, no code change needed. A genuinely new silhouette
        none of these resemble still needs a developer to draw it.
      </p>
      <NamedRowManager
        title="Glasses"
        singular="glass"
        items={catalog.glasses}
        shapeKind="glass"
        onCreate={async ({ name, shape }) => {
          await createGlass(name, shape)
          await catalog.refetch()
        }}
        onUpdate={async (id, { name, shape }) => {
          await updateGlass(id, name, shape)
          await catalog.refetch()
        }}
        onDelete={async (id) => {
          await deleteGlass(id)
          await catalog.refetch()
        }}
      />
      <NamedRowManager
        title="Taste Tags"
        singular="taste tag"
        items={catalog.tasteTags}
        onCreate={async (name) => {
          await createTasteTag(name)
          await catalog.refetch()
        }}
        onUpdate={async (id, name) => {
          await updateTasteTag(id, name)
          await catalog.refetch()
        }}
        onDelete={async (id) => {
          await deleteTasteTag(id)
          await catalog.refetch()
        }}
      />
      <NamedRowManager
        title="Cocktail Families"
        singular="family"
        items={catalog.families}
        shapeKind="family"
        onCreate={async ({ name, shape }) => {
          await createCocktailFamily(name, shape)
          await catalog.refetch()
        }}
        onUpdate={async (id, { name, shape }) => {
          await updateCocktailFamily(id, name, shape)
          await catalog.refetch()
        }}
        onDelete={async (id) => {
          await deleteCocktailFamily(id)
          await catalog.refetch()
        }}
      />
      <NamedRowManager
        title="Liquid Colors"
        singular="color"
        items={catalog.liquidColors}
        colorField
        onCreate={async ({ name, hex }) => {
          await createLiquidColor(name, hex)
          await catalog.refetch()
        }}
        onUpdate={async (id, { name, hex }) => {
          await updateLiquidColor(id, name, hex)
          await catalog.refetch()
        }}
        onDelete={async (id) => {
          await deleteLiquidColor(id)
          await catalog.refetch()
        }}
      />
      <NamedRowManager
        title="Ingredient Categories"
        singular="category"
        items={catalog.categories}
        showSortOrder
        onCreate={async ({ name, sortOrder }) => {
          await createIngredientCategory({ name, sortOrder })
          await catalog.refetch()
        }}
        onUpdate={async (id, { name, sortOrder }) => {
          await updateIngredientCategory(id, { name, sortOrder })
          await catalog.refetch()
        }}
        onDelete={async (id) => {
          await deleteIngredientCategory(id)
          await catalog.refetch()
        }}
      />
    </div>
  )
}
