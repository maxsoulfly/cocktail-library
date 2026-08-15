import { useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IconPlus, IconX } from "@/components/icons"
import { TopBar } from "@/components/Nav"
import { Btn, FilterChip, Input, Select } from "@/components/primitives"
import { createRecipe } from "@/services/recipes"

const NON_VOLUME_UNITS = ["dash", "barspoon", "piece", "slice", "wedge", "top-up"]

export default function EditorScreen() {
  const navigate = useNavigate()
  const { catalog, refetchRecipes } = useOutletContext()
  const { types, glasses, families, tasteTags, loading: catalogLoading } = catalog

  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [glassName, setGlassName] = useState("")
  const [familyId, setFamilyId] = useState("")
  const [ings, setIngs] = useState([{ ingredientName: "", amount: "", unit: "ml", role: "required" }])
  const [steps, setSteps] = useState([""])
  const [tasteTagIds, setTasteTagIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const effectiveGlassName = glassName || glasses[0]?.name || ""

  const addIng = () => setIngs([...ings, { ingredientName: "", amount: "", unit: "ml", role: "required" }])
  const removeIng = (i) => setIngs(ings.filter((_, idx) => idx !== i))
  const updateIng = (i, k, v) => setIngs(ings.map((ing, idx) => (idx === i ? { ...ing, [k]: v } : ing)))

  const addStep = () => setSteps([...steps, ""])
  const removeStep = (i) => setSteps(steps.filter((_, idx) => idx !== i))
  const updateStep = (i, v) => setSteps(steps.map((s, idx) => (idx === i ? v : s)))

  const toggleTaste = (tagId) => setTasteTagIds(tasteTagIds.includes(tagId) ? tasteTagIds.filter((x) => x !== tagId) : [...tasteTagIds, tagId])

  // Non-empty rows must match a real ingredient type - same rule as Add
  // Product, since a member can't create a new ingredient type either way.
  const nonEmptyIngs = ings.filter((i) => i.ingredientName.trim() || i.amount.trim())
  const resolvedIngs = nonEmptyIngs.map((i) => ({
    ...i,
    matchedType: types.find((t) => t.name.toLowerCase() === i.ingredientName.trim().toLowerCase()),
  }))
  const hasUnmatchedIng = resolvedIngs.some((i) => !i.matchedType)
  const canSave = name.trim() && effectiveGlassName && resolvedIngs.length > 0 && !hasUnmatchedIng && !saving

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const glass = glasses.find((g) => g.name === effectiveGlassName)
      const components = resolvedIngs.map((i) => {
        const isVolume = i.unit === "ml"
        return {
          ingredientTypeId: i.matchedType.id,
          amount: isVolume ? Number(i.amount) || 0 : 0,
          unitLabel: isVolume ? "ml" : `${i.amount} ${i.unit}`.trim(),
          role: i.role,
        }
      })
      const recipe = await createRecipe({
        name: name.trim(),
        description: desc.trim(),
        glassId: glass.id,
        familyId: familyId || null,
        steps: steps.map((s) => s.trim()).filter(Boolean),
        components,
        tasteTagIds,
      })
      await refetchRecipes() // so the new recipe is in `computed` before DetailScreen looks for it
      navigate(`/library/${recipe.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (catalogLoading) {
    return <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text2)", fontSize: 14 }}>Loading...</div>
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <TopBar title="New Recipe" onBack={() => navigate(-1)} />
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
        <Input label="Recipe Name" placeholder="My Signature Cocktail" value={name} onChange={setName} />

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Description</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What makes this cocktail special?" rows={3} style={{ background: "var(--surface)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", padding: "10px 14px", color: "var(--text)", fontSize: 14, fontFamily: "var(--font-body)", width: "100%", resize: "vertical" }} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Glass</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {glasses.map((g) => (
              <button key={g.id} onClick={() => setGlassName(g.name)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${effectiveGlassName === g.name ? "var(--cyan)" : "var(--border-s)"}`, background: effectiveGlassName === g.name ? "rgba(34,211,238,0.1)" : "var(--surface)", color: effectiveGlassName === g.name ? "var(--cyan)" : "var(--text2)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 500, textTransform: "capitalize", transition: "all 0.15s" }}>
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Family (optional)</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setFamilyId("")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${!familyId ? "var(--cyan)" : "var(--border-s)"}`, background: !familyId ? "rgba(34,211,238,0.1)" : "var(--surface)", color: !familyId ? "var(--cyan)" : "var(--text2)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 500 }}>None</button>
            {families.map((f) => (
              <button key={f.id} onClick={() => setFamilyId(f.id)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${familyId === f.id ? "var(--cyan)" : "var(--border-s)"}`, background: familyId === f.id ? "rgba(34,211,238,0.1)" : "var(--surface)", color: familyId === f.id ? "var(--cyan)" : "var(--text2)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 500 }}>
                {f.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ingredients</label>
            <button onClick={addIng} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cyan)", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <IconPlus size={14} /> Add
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ings.map((ing, i) => {
              const trimmedName = ing.ingredientName.trim()
              const matched = trimmedName && types.some((t) => t.name.toLowerCase() === trimmedName.toLowerCase())
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ flex: 2, position: "relative" }}>
                      <input list="ing-types-editor" placeholder="Ingredient type" value={ing.ingredientName} onChange={(e) => updateIng(i, "ingredientName", e.target.value)} style={{ background: "var(--surface)", border: `1px solid ${trimmedName && !matched ? "var(--coral)" : "var(--border-s)"}`, borderRadius: "var(--r-sm)", padding: "8px 10px", color: "var(--text)", fontSize: 13, fontFamily: "var(--font-body)", width: "100%" }} />
                      <datalist id="ing-types-editor">{types.map((t) => <option key={t.id} value={t.name} />)}</datalist>
                    </div>
                    <input
                      name={`ingredient-amount-${i}`}
                      placeholder="amt"
                      value={ing.amount}
                      onChange={(e) => updateIng(i, "amount", e.target.value)}
                      autoComplete="off"
                      inputMode="decimal"
                      style={{ width: 50, background: "var(--surface)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", padding: "8px 8px", color: "var(--text)", fontSize: 13, textAlign: "center", fontFamily: "var(--font-mono)" }}
                    />
                    <div style={{ width: 68, flexShrink: 0 }}>
                      <Select small value={ing.unit} onChange={(v) => updateIng(i, "unit", v)} options={["ml", ...NON_VOLUME_UNITS]} />
                    </div>
                    <div style={{ width: 92, flexShrink: 0 }}>
                      <Select small value={ing.role} onChange={(v) => updateIng(i, "role", v)} options={[{ value: "required", label: "Required" }, { value: "optional", label: "Optional" }, { value: "garnish", label: "Garnish" }]} />
                    </div>
                    {ings.length > 1 && (
                      <button onClick={() => removeIng(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4 }}><IconX size={14} /></button>
                    )}
                  </div>
                  {trimmedName && !matched && (
                    <span style={{ fontSize: 11, color: "var(--coral)" }}>Doesn't match an existing ingredient type - new types require admin approval.</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Preparation Steps</label>
            <button onClick={addStep} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cyan)", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <IconPlus size={14} /> Add
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--cyan)", flexShrink: 0, marginTop: 8 }}>{i + 1}</span>
                <textarea value={step} onChange={(e) => updateStep(i, e.target.value)} placeholder={`Step ${i + 1}`} rows={2} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", padding: "8px 12px", color: "var(--text)", fontSize: 13, fontFamily: "var(--font-body)", resize: "vertical" }} />
                {steps.length > 1 && <button onClick={() => removeStep(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: "8px 4px" }}><IconX size={14} /></button>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Taste Tags</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tasteTags.map((t) => <FilterChip key={t.id} label={t.name} active={tasteTagIds.includes(t.id)} onClick={() => toggleTaste(t.id)} />)}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
          Recipes you create are private to you. Publishing to the community isn't available yet.
        </p>

        {error && <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>{error}</p>}

        <Btn variant="primary" full onClick={handleSave} disabled={!canSave}>Save Recipe</Btn>
      </div>
    </div>
  )
}
