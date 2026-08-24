import {
  Btn,
  CategoryPicker,
  ColorSwatchPicker,
  Input,
  Select,
} from "@/components/primitives"
import { BAR_PRIORITIES } from "@/schemas/ingredientImport"

const FIELD_LABEL =
  "text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em] block mb-1.5"

export function ImportIngredientsSingle({
  catalog,
  singleName,
  setSingleName,
  singleCategoryId,
  setSingleCategoryId,
  singleParentTypeId,
  setSingleParentTypeId,
  singleBarPriority,
  setSingleBarPriority,
  singleColor,
  setSingleColor,
  singleDescription,
  setSingleDescription,
  singleSaving,
  singleError,
  onAddSingle,
}) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Name"
        placeholder="e.g. Passionfruit Juice"
        value={singleName}
        onChange={setSingleName}
      />
      <div>
        <label className={FIELD_LABEL}>Category</label>
        <CategoryPicker
          categories={catalog.categories}
          value={singleCategoryId}
          onChange={(v) => {
            setSingleCategoryId(v)
            setSingleParentTypeId("")
          }}
        />
      </div>
      {singleCategoryId && (
        <div>
          <label className={FIELD_LABEL}>Parent type (optional)</label>
          <Select
            value={singleParentTypeId}
            onChange={setSingleParentTypeId}
            options={[
              { value: "", label: "None" },
              ...catalog.types
                .filter((t) => t.category_id === singleCategoryId)
                .map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        </div>
      )}
      <div>
        <label className={FIELD_LABEL}>Bar priority</label>
        <Select
          value={singleBarPriority}
          onChange={setSingleBarPriority}
          options={BAR_PRIORITIES.map((p) => ({
            value: p,
            label: p[0].toUpperCase() + p.slice(1),
          }))}
        />
      </div>
      <div>
        <label className={FIELD_LABEL}>Color (optional)</label>
        <ColorSwatchPicker
          value={singleColor}
          onChange={setSingleColor}
          colors={catalog.liquidColors}
        />
      </div>
      <div>
        <label className={FIELD_LABEL}>Description (optional)</label>
        <textarea
          value={singleDescription}
          onChange={(e) => setSingleDescription(e.target.value)}
          rows={2}
          className="bg-surface border border-bdr rounded-sm py-2.5 px-3.5 text-tx text-sm font-body w-full resize-y"
        />
      </div>
      {singleError && <p className="text-xs text-coral">{singleError}</p>}
      <Btn
        variant="primary"
        full
        disabled={!singleName.trim() || !singleCategoryId || singleSaving}
        onClick={onAddSingle}
      >
        {singleSaving ? "Adding..." : "Add Ingredient"}
      </Btn>
    </div>
  )
}
