import { Link } from "react-router-dom"
import { IconPlus, IconX } from "@/components/icons"
import { Select } from "@/components/primitives"
import { NON_VOLUME_UNITS } from "@/data/constants"
import { resolveIngredientType } from "@/domain/ingredientResolution"

export function IngredientRowsEditor({
  ings,
  types,
  aliases,
  onAdd,
  onRemove,
  onUpdate,
  onCommitAlternative,
  onRemoveAlternative,
  hasUnmatchedIng,
  isDraftable,
  returnTo,
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text2)",
            fontFamily: "var(--font-display)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Ingredients
        </label>
        <button
          onClick={onAdd}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--cyan)",
            fontSize: 13,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <IconPlus size={14} /> Add
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ings.map((ing, i) => {
          const trimmedName = ing.ingredientName.trim()
          const matchedType = trimmedName
            ? resolveIngredientType(trimmedName, { types, aliases })
            : null
          const matched = Boolean(matchedType)
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 2, position: "relative" }}>
                  <input
                    list="ing-types-editor"
                    placeholder="Ingredient type"
                    value={ing.ingredientName}
                    onChange={(e) =>
                      onUpdate(i, "ingredientName", e.target.value)
                    }
                    style={{
                      background: "var(--surface)",
                      border: `1px solid ${
                        trimmedName && !matched
                          ? "var(--coral)"
                          : "var(--border-s)"
                      }`,
                      borderRadius: "var(--r-sm)",
                      padding: "8px 10px",
                      color: "var(--text)",
                      fontSize: 13,
                      fontFamily: "var(--font-body)",
                      width: "100%",
                    }}
                  />
                  <datalist id="ing-types-editor">
                    {types.map((t) => (
                      <option key={t.id} value={t.name} />
                    ))}
                    {aliases.map((a) => (
                      <option key={a.id} value={a.alias} />
                    ))}
                  </datalist>
                </div>
                <input
                  name={`ingredient-amount-${i}`}
                  placeholder="amt"
                  value={ing.amount}
                  onChange={(e) => onUpdate(i, "amount", e.target.value)}
                  autoComplete="off"
                  inputMode="decimal"
                  style={{
                    width: 50,
                    background: "var(--surface)",
                    border: "1px solid var(--border-s)",
                    borderRadius: "var(--r-sm)",
                    padding: "8px 8px",
                    color: "var(--text)",
                    fontSize: 13,
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                  }}
                />
                <div style={{ width: 68, flexShrink: 0 }}>
                  <Select
                    small
                    value={ing.unit}
                    onChange={(v) => onUpdate(i, "unit", v)}
                    options={["ml", "oz", ...NON_VOLUME_UNITS]}
                  />
                </div>
                <div style={{ width: 92, flexShrink: 0 }}>
                  <Select
                    small
                    value={ing.role}
                    onChange={(v) => onUpdate(i, "role", v)}
                    options={[
                      { value: "required", label: "Required" },
                      { value: "optional", label: "Optional" },
                      { value: "garnish", label: "Garnish" },
                    ]}
                  />
                </div>
                {ings.length > 1 && (
                  <button
                    onClick={() => onRemove(i)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text3)",
                      padding: 4,
                    }}
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>
              {trimmedName && !matched && (
                <span style={{ fontSize: 11, color: "var(--coral)" }}>
                  Doesn't match an existing ingredient type - new types require
                  admin approval.{" "}
                  <Link
                    to={`/request-ingredient?name=${encodeURIComponent(trimmedName)}&returnTo=${encodeURIComponent(returnTo)}`}
                    style={{ color: "var(--cyan)" }}
                  >
                    Request it
                  </Link>
                </span>
              )}
              {matched && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    alignItems: "center",
                    paddingLeft: 2,
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>
                    Substitutes:
                  </span>
                  {(ing.alternativeNames ?? []).map((altName, ai) => (
                    <span
                      key={altName}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "var(--surface2)",
                        border: "1px solid var(--border-s)",
                        borderRadius: 12,
                        padding: "2px 6px 2px 10px",
                        fontSize: 11,
                        color: "var(--text2)",
                      }}
                    >
                      {altName}
                      <button
                        onClick={() => onRemoveAlternative(i, ai)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text3)",
                          padding: 2,
                          display: "flex",
                        }}
                      >
                        <IconX size={9} />
                      </button>
                    </span>
                  ))}
                  <input
                    list="ing-types-editor"
                    placeholder="+ add substitute"
                    value={ing.altDraft ?? ""}
                    onChange={(e) => onUpdate(i, "altDraft", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        onCommitAlternative(i)
                      }
                    }}
                    onBlur={() => onCommitAlternative(i)}
                    style={{
                      width: 130,
                      background: "var(--surface)",
                      border: "1px solid var(--border-s)",
                      borderRadius: 6,
                      padding: "3px 8px",
                      fontSize: 11,
                      color: "var(--text)",
                      fontFamily: "var(--font-body)",
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {hasUnmatchedIng && isDraftable && (
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 11,
            color: "var(--text3)",
          }}
        >
          This recipe can't save yet until every ingredient matches, but nothing
          is lost - it's auto-saved to this browser as you go. Come back once
          the requested ingredient is approved to finish it.
        </p>
      )}
    </div>
  )
}
