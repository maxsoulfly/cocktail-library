import clsx from "clsx"
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
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em]">
          Ingredients
        </label>
        <button
          onClick={onAdd}
          className="bg-transparent border-none cursor-pointer text-cyan text-[13px] font-display font-semibold flex items-center gap-1"
        >
          <IconPlus size={14} /> Add
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {ings.map((ing, i) => {
          const trimmedName = ing.ingredientName.trim()
          const matchedType = trimmedName
            ? resolveIngredientType(trimmedName, { types, aliases })
            : null
          const matched = Boolean(matchedType)
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex gap-1.5 items-center">
                <div className="flex-[2] relative">
                  <input
                    list="ing-types-editor"
                    placeholder="Ingredient type"
                    value={ing.ingredientName}
                    onChange={(e) =>
                      onUpdate(i, "ingredientName", e.target.value)
                    }
                    className={clsx(
                      "bg-surface border rounded-sm py-2 px-2.5 text-tx text-[13px] font-body w-full",
                      trimmedName && !matched ? "border-coral" : "border-bdr",
                    )}
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
                  className="w-12.5 bg-surface border border-bdr rounded-sm p-2 text-tx text-[13px] text-center font-mono"
                />
                <div className="w-17 shrink-0">
                  <Select
                    small
                    value={ing.unit}
                    onChange={(v) => onUpdate(i, "unit", v)}
                    options={["ml", "oz", ...NON_VOLUME_UNITS]}
                  />
                </div>
                <div className="w-23 shrink-0">
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
                    aria-label={`Remove ingredient ${i + 1}`}
                    className="bg-transparent border-none cursor-pointer text-tx3 p-1"
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>
              {trimmedName && !matched && (
                <span className="text-[11px] text-coral">
                  Doesn't match an existing ingredient type - new types require
                  admin approval.{" "}
                  <Link
                    to={`/request-ingredient?name=${encodeURIComponent(trimmedName)}&returnTo=${encodeURIComponent(returnTo)}`}
                    className="text-cyan"
                  >
                    Request it
                  </Link>
                </span>
              )}
              {matched && (
                <div className="flex flex-wrap gap-1.5 items-center pl-0.5">
                  <span className="text-[11px] text-tx3">Substitutes:</span>
                  {(ing.alternativeNames ?? []).map((altName, ai) => (
                    <span
                      key={altName}
                      className="flex items-center gap-1 bg-surface2 border border-bdr rounded py-0.5 pr-1.5 pl-2.5 text-[11px] text-tx2"
                    >
                      {altName}
                      <button
                        onClick={() => onRemoveAlternative(i, ai)}
                        aria-label={`Remove substitute ${altName}`}
                        className="bg-transparent border-none cursor-pointer text-tx3 p-0.5 flex"
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
                    className="w-32.5 bg-surface border border-bdr rounded-[6px] py-[3px] px-2 text-[11px] text-tx font-body"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {hasUnmatchedIng && isDraftable && (
        <p className="mt-2 text-[11px] text-tx3">
          This recipe can't save yet until every ingredient matches, but nothing
          is lost - it's auto-saved to this browser as you go. Come back once
          the requested ingredient is approved to finish it.
        </p>
      )}
    </div>
  )
}
