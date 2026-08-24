import {
  Btn,
  CategoryPicker,
  ColorSwatchPicker,
  Input,
  Select,
} from "@/components/primitives"
import { BAR_PRIORITIES } from "@/schemas/ingredientImport"

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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input
        label="Name"
        placeholder="e.g. Passionfruit Juice"
        value={singleName}
        onChange={setSingleName}
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
          Category
        </label>
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
            Parent type (optional)
          </label>
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
          Bar priority
        </label>
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
          Color (optional)
        </label>
        <ColorSwatchPicker
          value={singleColor}
          onChange={setSingleColor}
          colors={catalog.liquidColors}
        />
      </div>
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
          Description (optional)
        </label>
        <textarea
          value={singleDescription}
          onChange={(e) => setSingleDescription(e.target.value)}
          rows={2}
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
      {singleError && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "var(--coral)",
          }}
        >
          {singleError}
        </p>
      )}
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
