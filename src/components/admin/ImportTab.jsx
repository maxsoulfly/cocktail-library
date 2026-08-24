import { ImportIngredientsBatch } from "@/components/admin/ImportIngredientsBatch"
import { ImportIngredientsSingle } from "@/components/admin/ImportIngredientsSingle"
import { ImportProducts } from "@/components/admin/ImportProducts"
import { ImportRecipes } from "@/components/admin/ImportRecipes"

const ENTITIES = [
  { id: "ingredients", label: "Ingredients" },
  { id: "recipes", label: "Recipes" },
  { id: "products", label: "Products" },
]

const INGREDIENT_MODES = [
  { id: "single", label: "Single Ingredient" },
  { id: "batch", label: "Batch Import (AI)" },
]

// Batch Import covers three entities - "ingredients" (with its own
// single/batch sub-modes), "recipes", and "products" (both batch/AI only,
// since they already have a member-facing equivalent for one-off creation).
// Almost all of this tab's state stays lifted in the AdminScreen shell
// rather than becoming local here - `startSingleAddFromRequest` (Requests
// and Ingredient Types tabs deep-link into the single-ingredient form) reads
// and writes several of these same fields from outside this tab entirely,
// so keeping them here would just mean threading a second copy back up.
export function ImportTab(props) {
  const {
    catalog,
    importEntity,
    setImportEntity,
    importMode,
    setImportMode,
    importSuccessMessage,
    setImportSuccessMessage,
    setSingleFromRequestId,
  } = props

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div
        style={{
          display: "flex",
          background: "var(--surface)",
          border: "1px solid var(--border-s)",
          borderRadius: "var(--r-sm)",
          overflow: "hidden",
        }}
      >
        {ENTITIES.map((e) => (
          <button
            key={e.id}
            onClick={() => {
              setSingleFromRequestId(null)
              setImportEntity(e.id)
            }}
            style={{
              flex: 1,
              padding: "10px",
              background:
                importEntity === e.id ? "rgba(34,211,238,0.12)" : "none",
              border: "none",
              cursor: "pointer",
              color: importEntity === e.id ? "var(--cyan)" : "var(--text2)",
              fontFamily: "var(--font-display)",
              fontWeight: importEntity === e.id ? 700 : 400,
              fontSize: 13,
              transition: "all 0.15s",
            }}
          >
            {e.label}
          </button>
        ))}
      </div>

      {importEntity === "ingredients" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {importSuccessMessage && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--green)" }}>
              {importSuccessMessage}
            </p>
          )}

          <div
            style={{
              display: "flex",
              background: "var(--surface)",
              border: "1px solid var(--border-s)",
              borderRadius: "var(--r-sm)",
              overflow: "hidden",
            }}
          >
            {INGREDIENT_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setImportSuccessMessage(null)
                  setSingleFromRequestId(null)
                  setImportMode(m.id)
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background:
                    importMode === m.id ? "rgba(167,139,250,0.12)" : "none",
                  border: "none",
                  cursor: "pointer",
                  color: importMode === m.id ? "var(--violet)" : "var(--text2)",
                  fontFamily: "var(--font-display)",
                  fontWeight: importMode === m.id ? 700 : 400,
                  fontSize: 13,
                  transition: "all 0.15s",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {importMode === "single" && (
            <ImportIngredientsSingle
              catalog={catalog}
              singleName={props.singleName}
              setSingleName={props.setSingleName}
              singleCategoryId={props.singleCategoryId}
              setSingleCategoryId={props.setSingleCategoryId}
              singleParentTypeId={props.singleParentTypeId}
              setSingleParentTypeId={props.setSingleParentTypeId}
              singleBarPriority={props.singleBarPriority}
              setSingleBarPriority={props.setSingleBarPriority}
              singleColor={props.singleColor}
              setSingleColor={props.setSingleColor}
              singleDescription={props.singleDescription}
              setSingleDescription={props.setSingleDescription}
              singleSaving={props.singleSaving}
              singleError={props.singleError}
              onAddSingle={props.onAddSingle}
            />
          )}

          {importMode === "batch" && (
            <ImportIngredientsBatch
              batchPhase={props.batchPhase}
              setBatchPhase={props.setBatchPhase}
              importPrompt={props.importPrompt}
              promptCopied={props.promptCopied}
              onCopyPrompt={props.onCopyImportPrompt}
              importJson={props.importJson}
              setImportJson={props.setImportJson}
              onValidate={props.onRunImportValidation}
              importResult={props.importResult}
              setImportResult={props.setImportResult}
              importing={props.importing}
              onCommit={props.onCommitImport}
            />
          )}
        </div>
      )}

      {importEntity === "recipes" && (
        <ImportRecipes
          catalog={catalog}
          recipeImportSuccessMessage={props.recipeImportSuccessMessage}
          recipeBatchPhase={props.recipeBatchPhase}
          setRecipeBatchPhase={props.setRecipeBatchPhase}
          recipeImportPrompt={props.recipeImportPrompt}
          recipePromptCopied={props.recipePromptCopied}
          onCopyPrompt={props.onCopyRecipeImportPrompt}
          recipeImportJson={props.recipeImportJson}
          setRecipeImportJson={props.setRecipeImportJson}
          onValidate={props.onRunRecipeImportValidation}
          recipeImportResult={props.recipeImportResult}
          setRecipeImportResult={props.setRecipeImportResult}
          recipeImporting={props.recipeImporting}
          onCommit={props.onCommitRecipeImport}
          addIngredientDraft={props.addIngredientDraft}
          setAddIngredientDraft={props.setAddIngredientDraft}
          onOpenAddIngredientDraft={props.onOpenAddIngredientDraft}
          addIngredientError={props.addIngredientError}
          addIngredientSaving={props.addIngredientSaving}
          onSaveAddIngredientDraft={props.onSaveAddIngredientDraft}
        />
      )}

      {importEntity === "products" && (
        <ImportProducts
          productImportSuccessMessage={props.productImportSuccessMessage}
          productBatchPhase={props.productBatchPhase}
          setProductBatchPhase={props.setProductBatchPhase}
          productImportPrompt={props.productImportPrompt}
          productPromptCopied={props.productPromptCopied}
          onCopyPrompt={props.onCopyProductImportPrompt}
          productImportJson={props.productImportJson}
          setProductImportJson={props.setProductImportJson}
          onValidate={props.onRunProductImportValidation}
          productImportResult={props.productImportResult}
          setProductImportResult={props.setProductImportResult}
          productImporting={props.productImporting}
          onCommit={props.onCommitProductImport}
        />
      )}
    </div>
  )
}
