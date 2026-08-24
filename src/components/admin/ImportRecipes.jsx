import { IconCheck, IconCopy, IconPlus } from "@/components/icons"
import {
  Btn,
  Card,
  CategoryPicker,
  ColorSwatchPicker,
  Input,
  Select,
} from "@/components/primitives"
import { BAR_PRIORITIES } from "@/schemas/ingredientImport"

export function ImportRecipes({
  catalog,
  recipeImportSuccessMessage,
  recipeBatchPhase,
  setRecipeBatchPhase,
  recipeImportPrompt,
  recipePromptCopied,
  onCopyPrompt,
  recipeImportJson,
  setRecipeImportJson,
  onValidate,
  recipeImportResult,
  setRecipeImportResult,
  recipeImporting,
  onCommit,
  addIngredientDraft,
  setAddIngredientDraft,
  onOpenAddIngredientDraft,
  addIngredientError,
  addIngredientSaving,
  onSaveAddIngredientDraft,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {recipeImportSuccessMessage && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--green)" }}>
          {recipeImportSuccessMessage}
        </p>
      )}

      {recipeBatchPhase === "paste" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
            Copy this prompt into an AI chat along with what recipes you want to
            add, then paste its JSON output below. The prompt is generated from
            the live catalog (ingredients, glasses, families, taste tags), so
            the AI can only reference things that actually exist.
          </p>
          <textarea
            readOnly
            value={recipeImportPrompt}
            rows={14}
            onFocus={(e) => e.target.select()}
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border-s)",
              borderRadius: "var(--r-sm)",
              padding: "14px",
              color: "var(--text2)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              lineHeight: 1.6,
              resize: "vertical",
              width: "100%",
            }}
          />
          <Btn variant="ghost" small onClick={onCopyPrompt}>
            {recipePromptCopied ? (
              <IconCheck size={14} />
            ) : (
              <IconCopy size={14} />
            )}{" "}
            {recipePromptCopied ? "Copied" : "Copy Prompt"}
          </Btn>
          <textarea
            value={recipeImportJson}
            onChange={(e) => setRecipeImportJson(e.target.value)}
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
          <Btn variant="primary" full onClick={onValidate}>
            Validate
          </Btn>
        </div>
      )}

      {recipeBatchPhase === "results" && recipeImportResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          {recipeImportResult.parseError ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--coral)" }}>
              Couldn't parse that as a JSON array:{" "}
              {recipeImportResult.parseError}
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
                    val: recipeImportResult.validCount,
                    color: "var(--green)",
                  },
                  {
                    label: "Errors",
                    val: recipeImportResult.errorCount,
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
                {recipeImportResult.results.map((row, i, arr) => (
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
                        background: row.valid ? "var(--green)" : "var(--coral)",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: "var(--text)" }}>
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
                      {row.missingIngredientNames?.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginTop: 6,
                          }}
                        >
                          {row.missingIngredientNames.map((n) => (
                            <button
                              key={n}
                              onClick={() => onOpenAddIngredientDraft(n)}
                              style={{
                                background: "rgba(34,211,238,0.1)",
                                border: "1px solid rgba(34,211,238,0.25)",
                                borderRadius: 6,
                                padding: "3px 8px",
                                cursor: "pointer",
                                color: "var(--cyan)",
                                fontSize: 11,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <IconPlus size={10} /> Add "{n}"
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Card>

              {addIngredientDraft && (
                <Card
                  style={{
                    padding: "14px",
                    border: "1px solid rgba(34,211,238,0.25)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    Add ingredient
                  </div>
                  {/* The AI-flagged text isn't always a clean ingredient name
                      (e.g. "Fresh pineapple - 50 g", with the quantity/notes
                      still attached) - editable rather than a fixed label so
                      that can be cleaned up before creating the type. */}
                  <Input
                    label="Name"
                    value={addIngredientDraft.name}
                    onChange={(v) =>
                      setAddIngredientDraft({ ...addIngredientDraft, name: v })
                    }
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
                      value={addIngredientDraft.categoryId}
                      onChange={(v) =>
                        setAddIngredientDraft({
                          ...addIngredientDraft,
                          categoryId: v,
                          parentTypeId: "",
                        })
                      }
                    />
                  </div>
                  {addIngredientDraft.categoryId && (
                    <Select
                      value={addIngredientDraft.parentTypeId}
                      onChange={(v) =>
                        setAddIngredientDraft({
                          ...addIngredientDraft,
                          parentTypeId: v,
                        })
                      }
                      options={[
                        { value: "", label: "No parent type" },
                        ...catalog.types
                          .filter(
                            (t) =>
                              t.category_id === addIngredientDraft.categoryId,
                          )
                          .map((t) => ({ value: t.id, label: t.name })),
                      ]}
                    />
                  )}
                  <Select
                    value={addIngredientDraft.barPriority}
                    onChange={(v) =>
                      setAddIngredientDraft({
                        ...addIngredientDraft,
                        barPriority: v,
                      })
                    }
                    options={BAR_PRIORITIES.map((p) => ({
                      value: p,
                      label: p[0].toUpperCase() + p.slice(1),
                    }))}
                  />
                  <ColorSwatchPicker
                    value={addIngredientDraft.color}
                    onChange={(v) =>
                      setAddIngredientDraft({ ...addIngredientDraft, color: v })
                    }
                    colors={catalog.liquidColors}
                  />
                  {addIngredientError && (
                    <p
                      style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}
                    >
                      {addIngredientError}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn
                      variant="primary"
                      small
                      disabled={
                        !addIngredientDraft.name.trim() ||
                        !addIngredientDraft.categoryId ||
                        addIngredientSaving
                      }
                      onClick={onSaveAddIngredientDraft}
                    >
                      {addIngredientSaving ? "Adding..." : "Add & Re-validate"}
                    </Btn>
                    <Btn
                      variant="ghost"
                      small
                      onClick={() => setAddIngredientDraft(null)}
                    >
                      Cancel
                    </Btn>
                  </div>
                </Card>
              )}
              {recipeImportResult.commitError && (
                <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
                  {recipeImportResult.commitError}
                </p>
              )}
            </>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              variant="ghost"
              small
              onClick={() => {
                setRecipeBatchPhase("paste")
                setRecipeImportJson("")
                setRecipeImportResult(null)
              }}
            >
              Cancel
            </Btn>
            {!recipeImportResult.parseError && (
              <Btn
                variant="primary"
                full
                disabled={
                  recipeImporting || recipeImportResult.validCount === 0
                }
                onClick={onCommit}
              >
                {recipeImporting
                  ? "Importing..."
                  : `Import ${recipeImportResult.validCount} Recipe${
                      recipeImportResult.validCount === 1 ? "" : "s"
                    }`}
              </Btn>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
