import { useEffect, useState } from "react"
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom"
import { IconCheck, IconCopy, IconPlus, IconX } from "@/components/icons"
import { TopBar } from "@/components/Nav"
import {
  Btn,
  ColorSwatchPicker,
  FilterChip,
  Input,
  Select,
} from "@/components/primitives"
import { LIQUID_COLORS, NON_VOLUME_UNITS } from "@/data/constants"
import { resolveIngredientType } from "@/domain/ingredientResolution"
import { buildRecipeImportPrompt } from "@/schemas/recipeImport"
import { parseRecipePaste } from "@/schemas/recipePaste"
import { createRecipe, updateRecipe } from "@/services/recipes"

// Reverses createRecipe's amount/unitLabel encoding (see services/recipes.js)
// so an existing component can prefill the amount+unit inputs.
function unitLabelToForm(ri) {
  if (ri.unitLabel === "ml") return { amount: String(ri.amount), unit: "ml" }
  const [amount, ...rest] = ri.unitLabel.split(" ")
  return { amount: amount ?? "", unit: rest.join(" ") || NON_VOLUME_UNITS[0] }
}

export default function EditorScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(id)
  // Cloning (?clone=<id>, linked from DetailScreen's "Clone as My Own
  // Recipe") is a plain new-recipe creation, not editing - it prefills the
  // form from another visible recipe (classic or someone else's community
  // one) so a member doesn't have to retype every ingredient/step to build
  // their own variant, but saving still goes through createRecipe() and
  // makes an ordinary private recipe they own outright.
  const cloneSourceId = !isEditing ? searchParams.get("clone") : null
  const { catalog, computed, userId, isAdmin, refetchRecipes } =
    useOutletContext()
  const {
    types,
    glasses,
    families,
    tasteTags,
    loading: catalogLoading,
  } = catalog

  const existing = isEditing ? computed.find((item) => item.id === id) : null
  const cloneSource = cloneSourceId
    ? computed.find((item) => item.id === cloneSourceId)
    : null
  // Spec §4: owners edit their own recipe (any state); admins edit only the
  // ownerless classic catalog. Same rule the DB now enforces (see
  // supabase/migrations/20260815231800_tighten_recipe_edit_scope.sql) -
  // this is just the UI-side reflection of it, not the source of truth.
  const canEditExisting =
    existing &&
    (existing.ownerId === userId || (isAdmin && existing.source === "classic"))

  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [glassName, setGlassName] = useState("")
  const [familyId, setFamilyId] = useState("")
  const [liquidColor, setLiquidColor] = useState(LIQUID_COLORS[0].value)
  const [ings, setIngs] = useState([
    { ingredientName: "", amount: "", unit: "ml", role: "required" },
  ])
  const [steps, setSteps] = useState([""])
  const [tasteTagIds, setTasteTagIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [prefilled, setPrefilled] = useState(!isEditing && !cloneSourceId)

  useEffect(() => {
    const source = isEditing ? existing : cloneSource
    if (prefilled || !source || catalogLoading) return
    setName(isEditing ? source.name : `${source.name} (My Version)`)
    setDesc(source.description ?? "")
    setGlassName(source.glass)
    setLiquidColor(source.liquidColor)
    const family = families.find((f) => f.name === source.family)
    setFamilyId(family?.id ?? "")
    setIngs(
      source.ings.map((ri) => ({
        ingredientName: ri.name ?? "",
        ...unitLabelToForm(ri),
        role: ri.role,
        alternativeNames: (ri.alternativeIds ?? [])
          .map((altId) => types.find((t) => t.id === altId)?.name)
          .filter(Boolean),
      })),
    )
    setSteps(source.steps.length > 0 ? source.steps : [""])
    setTasteTagIds(
      source.taste
        .map((name) => tasteTags.find((t) => t.name === name)?.id)
        .filter(Boolean),
    )
    setPrefilled(true)
  }, [
    isEditing,
    prefilled,
    existing,
    cloneSource,
    catalogLoading,
    families,
    tasteTags,
    types,
  ])

  // Member-facing "paste a recipe, app fills in the form" - only offered
  // for a genuinely blank new recipe (not editing, not cloning, both of
  // which already have their own prefill source above). Backlog #3: the
  // actual ask behind the pineapple whisky sour recipe pasted earlier -
  // reuses the exact same AI-formatting prompt and ingredient/alias
  // resolution as admin batch import, but deliberately lenient
  // (parseRecipePaste) rather than all-or-nothing, since the result always
  // lands in this same form for the member to review before saving, not a
  // direct commit.
  const showPasteOption = !isEditing && !cloneSourceId
  const [entryMode, setEntryMode] = useState("scratch")
  const [pasteJson, setPasteJson] = useState("")
  const [pasteError, setPasteError] = useState(null)
  const [promptCopied, setPromptCopied] = useState(false)

  const pastePrompt = buildRecipeImportPrompt({
    types,
    glasses,
    families,
    tasteTags,
    aliases: catalog.aliases,
  })

  const copyPastePrompt = () => {
    navigator.clipboard.writeText(pastePrompt).catch(() => {})
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  const handleFillFromPaste = () => {
    setPasteError(null)
    let parsed
    try {
      parsed = JSON.parse(pasteJson)
    } catch (err) {
      setPasteError(`Couldn't parse that as JSON: ${err.message}`)
      return
    }
    const result = parseRecipePaste(parsed, {
      types,
      glasses,
      families,
      tasteTags,
      aliases: catalog.aliases,
    })
    if (!result) {
      setPasteError(
        "That doesn't look like a recipe - expected an object with a name, glass, steps, and components.",
      )
      return
    }
    setName(result.name)
    setDesc(result.description)
    setGlassName(result.glassName)
    setFamilyId(result.familyId)
    if (result.liquidColor) setLiquidColor(result.liquidColor)
    setTasteTagIds(result.tasteTagIds)
    setSteps(result.steps)
    setIngs(result.ings)
    setEntryMode("scratch")
  }

  const effectiveGlassName = glassName || glasses[0]?.name || ""

  const addIng = () =>
    setIngs([
      ...ings,
      { ingredientName: "", amount: "", unit: "ml", role: "required" },
    ])
  const removeIng = (i) => setIngs(ings.filter((_, idx) => idx !== i))
  const updateIng = (i, k, v) =>
    setIngs(ings.map((ing, idx) => (idx === i ? { ...ing, [k]: v } : ing)))

  // Substitution groups ("gin OR vodka") - the availability engine already
  // treats any one owned alternative as satisfying the slot
  // (src/domain/availability.js), this is just the first UI that can ever
  // create one. Resolved the same way the main ingredient field is (exact
  // name or alias, no fuzzy matching) - committed as a chip only once it
  // resolves to a real type, so the stored list is always valid ids by the
  // time Save runs.
  const commitAlternativeDraft = (i) => {
    const ing = ings[i]
    const draft = (ing.altDraft ?? "").trim()
    if (!draft) return
    const resolved = resolveIngredientType(draft, {
      types,
      aliases: catalog.aliases,
    })
    if (!resolved) return
    const existing = ing.alternativeNames ?? []
    if (
      resolved.name.toLowerCase() === ing.ingredientName.trim().toLowerCase() ||
      existing.some((n) => n.toLowerCase() === resolved.name.toLowerCase())
    ) {
      updateIng(i, "altDraft", "")
      return
    }
    setIngs(
      ings.map((row, idx) =>
        idx === i
          ? {
              ...row,
              alternativeNames: [...existing, resolved.name],
              altDraft: "",
            }
          : row,
      ),
    )
  }
  const removeAlternative = (i, altIndex) =>
    setIngs(
      ings.map((row, idx) =>
        idx === i
          ? {
              ...row,
              alternativeNames: (row.alternativeNames ?? []).filter(
                (_, ai) => ai !== altIndex,
              ),
            }
          : row,
      ),
    )

  const addStep = () => setSteps([...steps, ""])
  const removeStep = (i) => setSteps(steps.filter((_, idx) => idx !== i))
  const updateStep = (i, v) =>
    setSteps(steps.map((s, idx) => (idx === i ? v : s)))

  const toggleTaste = (tagId) =>
    setTasteTagIds(
      tasteTagIds.includes(tagId)
        ? tasteTagIds.filter((x) => x !== tagId)
        : [...tasteTagIds, tagId],
    )

  // Non-empty rows must match a real ingredient type - same rule as Add
  // Product, since a member can't create a new ingredient type either way.
  const nonEmptyIngs = ings.filter(
    (i) => i.ingredientName.trim() || i.amount.trim(),
  )
  const resolvedIngs = nonEmptyIngs.map((i) => ({
    ...i,
    matchedType: resolveIngredientType(i.ingredientName, {
      types,
      aliases: catalog.aliases,
    }),
  }))
  const hasUnmatchedIng = resolvedIngs.some((i) => !i.matchedType)
  const canSave =
    name.trim() &&
    effectiveGlassName &&
    resolvedIngs.length > 0 &&
    !hasUnmatchedIng &&
    !saving &&
    (!isEditing || canEditExisting)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const glass = glasses.find((g) => g.name === effectiveGlassName)
      const components = resolvedIngs.map((i) => {
        const isVolume = i.unit === "ml"
        const alternativeIds = (i.alternativeNames ?? [])
          .map(
            (altName) =>
              resolveIngredientType(altName, {
                types,
                aliases: catalog.aliases,
              })?.id,
          )
          .filter(Boolean)
        return {
          ingredientTypeId: i.matchedType.id,
          amount: isVolume ? Number(i.amount) || 0 : 0,
          unitLabel: isVolume ? "ml" : `${i.amount} ${i.unit}`.trim(),
          role: i.role,
          alternativeIds,
        }
      })
      const payload = {
        name: name.trim(),
        description: desc.trim(),
        glassId: glass.id,
        familyId: familyId || null,
        liquidColor,
        steps: steps.map((s) => s.trim()).filter(Boolean),
        components,
        tasteTagIds,
      }
      const recipe = isEditing
        ? await updateRecipe(id, payload)
        : await createRecipe(payload)
      await refetchRecipes() // so the change is in `computed` before DetailScreen looks for it
      navigate(`/library/${recipe.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (catalogLoading || (isEditing && !prefilled)) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text2)",
          fontSize: 14,
        }}
      >
        Loading...
      </div>
    )
  }

  if (isEditing && !existing) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text3)",
        }}
      >
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 16,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
          }}
        >
          Cocktail not found
        </p>
        <Btn variant="ghost" small onClick={() => navigate("/library")}>
          Back to library
        </Btn>
      </div>
    )
  }

  if (isEditing && !canEditExisting) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text3)",
        }}
      >
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 16,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
          }}
        >
          You can't edit this recipe
        </p>
        <p style={{ margin: "0 0 12px", fontSize: 13 }}>
          Only the recipe's owner, or an admin for classic recipes, can make
          changes.
        </p>
        <Btn variant="ghost" small onClick={() => navigate(`/library/${id}`)}>
          Back to recipe
        </Btn>
      </div>
    )
  }

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <TopBar
        title={
          isEditing
            ? "Edit Recipe"
            : cloneSourceId
              ? "Clone Recipe"
              : "New Recipe"
        }
        onBack={() => navigate(-1)}
      />
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {showPasteOption && (
          <div
            style={{
              display: "flex",
              background: "var(--surface)",
              border: "1px solid var(--border-s)",
              borderRadius: "var(--r-sm)",
              overflow: "hidden",
            }}
          >
            {[
              { id: "scratch", label: "Start from Scratch" },
              { id: "paste", label: "Paste a Recipe (AI)" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setEntryMode(m.id)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background:
                    entryMode === m.id ? "rgba(167,139,250,0.12)" : "none",
                  border: "none",
                  cursor: "pointer",
                  color: entryMode === m.id ? "var(--violet)" : "var(--text2)",
                  fontFamily: "var(--font-display)",
                  fontWeight: entryMode === m.id ? 700 : 400,
                  fontSize: 13,
                  transition: "all 0.15s",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {entryMode === "paste" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
              Copy this prompt into an AI chat along with the recipe you want to
              add (a link, a screenshot description, whatever you have), then
              paste its JSON output below to fill in the form. You'll still
              review and save it yourself - nothing is added until you hit Save.
            </p>
            <textarea
              readOnly
              value={pastePrompt}
              rows={12}
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
            <Btn variant="ghost" small onClick={copyPastePrompt}>
              {promptCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}{" "}
              {promptCopied ? "Copied" : "Copy Prompt"}
            </Btn>
            <textarea
              value={pasteJson}
              onChange={(e) => setPasteJson(e.target.value)}
              placeholder="Paste the AI's JSON output here..."
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
            {pasteError && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
                {pasteError}
              </p>
            )}
            <Btn
              variant="primary"
              full
              disabled={!pasteJson.trim()}
              onClick={handleFillFromPaste}
            >
              Fill Form
            </Btn>
          </div>
        ) : (
          <>
            <Input
              label="Recipe Name"
              placeholder="My Signature Cocktail"
              value={name}
              onChange={setName}
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
                Description
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What makes this cocktail special?"
                rows={3}
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
                  marginBottom: 8,
                }}
              >
                Glass
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {glasses.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGlassName(g.name)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: `1px solid ${
                        effectiveGlassName === g.name
                          ? "var(--cyan)"
                          : "var(--border-s)"
                      }`,
                      background:
                        effectiveGlassName === g.name
                          ? "rgba(34,211,238,0.1)"
                          : "var(--surface)",
                      color:
                        effectiveGlassName === g.name
                          ? "var(--cyan)"
                          : "var(--text2)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                      textTransform: "capitalize",
                      transition: "all 0.15s",
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
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
                  marginBottom: 8,
                }}
              >
                Family (optional)
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => setFamilyId("")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: `1px solid ${
                      !familyId ? "var(--cyan)" : "var(--border-s)"
                    }`,
                    background: !familyId
                      ? "rgba(34,211,238,0.1)"
                      : "var(--surface)",
                    color: !familyId ? "var(--cyan)" : "var(--text2)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                  }}
                >
                  None
                </button>
                {families.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFamilyId(f.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: `1px solid ${
                        familyId === f.id ? "var(--cyan)" : "var(--border-s)"
                      }`,
                      background:
                        familyId === f.id
                          ? "rgba(34,211,238,0.1)"
                          : "var(--surface)",
                      color: familyId === f.id ? "var(--cyan)" : "var(--text2)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                    }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
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
                  marginBottom: 8,
                }}
              >
                Liquid Color
              </label>
              <ColorSwatchPicker
                value={liquidColor}
                onChange={setLiquidColor}
              />
            </div>

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
                  onClick={addIng}
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
                    ? resolveIngredientType(trimmedName, {
                        types,
                        aliases: catalog.aliases,
                      })
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
                              updateIng(i, "ingredientName", e.target.value)
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
                            {catalog.aliases.map((a) => (
                              <option key={a.id} value={a.alias} />
                            ))}
                          </datalist>
                        </div>
                        <input
                          name={`ingredient-amount-${i}`}
                          placeholder="amt"
                          value={ing.amount}
                          onChange={(e) =>
                            updateIng(i, "amount", e.target.value)
                          }
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
                            onChange={(v) => updateIng(i, "unit", v)}
                            options={["ml", ...NON_VOLUME_UNITS]}
                          />
                        </div>
                        <div style={{ width: 92, flexShrink: 0 }}>
                          <Select
                            small
                            value={ing.role}
                            onChange={(v) => updateIng(i, "role", v)}
                            options={[
                              { value: "required", label: "Required" },
                              { value: "optional", label: "Optional" },
                              { value: "garnish", label: "Garnish" },
                            ]}
                          />
                        </div>
                        {ings.length > 1 && (
                          <button
                            onClick={() => removeIng(i)}
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
                          Doesn't match an existing ingredient type - new types
                          require admin approval.{" "}
                          <Link
                            to={`/request-ingredient?name=${encodeURIComponent(trimmedName)}`}
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
                                onClick={() => removeAlternative(i, ai)}
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
                            onChange={(e) =>
                              updateIng(i, "altDraft", e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                commitAlternativeDraft(i)
                              }
                            }}
                            onBlur={() => commitAlternativeDraft(i)}
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
            </div>

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
                  Preparation Steps
                </label>
                <button
                  onClick={addStep}
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
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {steps.map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--surface3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        color: "var(--cyan)",
                        flexShrink: 0,
                        marginTop: 8,
                      }}
                    >
                      {i + 1}
                    </span>
                    <textarea
                      value={step}
                      onChange={(e) => updateStep(i, e.target.value)}
                      placeholder={`Step ${i + 1}`}
                      rows={2}
                      style={{
                        flex: 1,
                        background: "var(--surface)",
                        border: "1px solid var(--border-s)",
                        borderRadius: "var(--r-sm)",
                        padding: "8px 12px",
                        color: "var(--text)",
                        fontSize: 13,
                        fontFamily: "var(--font-body)",
                        resize: "vertical",
                      }}
                    />
                    {steps.length > 1 && (
                      <button
                        onClick={() => removeStep(i)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text3)",
                          padding: "8px 4px",
                        }}
                      >
                        <IconX size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
                  marginBottom: 8,
                }}
              >
                Taste Tags
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {tasteTags.map((t) => (
                  <FilterChip
                    key={t.id}
                    label={t.name}
                    active={tasteTagIds.includes(t.id)}
                    onClick={() => toggleTaste(t.id)}
                  />
                ))}
              </div>
            </div>

            {!isEditing && (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "var(--text3)",
                  lineHeight: 1.5,
                }}
              >
                New recipes start private to you. You can publish to the
                community from the recipe page once it's saved.
              </p>
            )}

            {error && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
                {error}
              </p>
            )}

            <Btn
              variant="primary"
              full
              onClick={handleSave}
              disabled={!canSave}
            >
              {isEditing ? "Save Changes" : "Save Recipe"}
            </Btn>
          </>
        )}
      </div>
    </div>
  )
}
