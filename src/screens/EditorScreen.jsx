import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { IconGlobe, IconLock, IconPlus, IconX } from "@/components/icons"
import { TopBar } from "@/components/Nav"
import { Btn, FilterChip, Input } from "@/components/primitives"
import { GLASSES, TASTE_FILTERS } from "@/data/constants"
import { INGS } from "@/data/mockData"

export default function EditorScreen() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [glass, setGlass] = useState("coupe")
  const [visibility, setVisibility] = useState("private")
  const [ings, setIngs] = useState([{ ingId: "", amount: "", unit: "ml", role: "required" }])
  const [steps, setSteps] = useState([""])
  const [taste, setTaste] = useState([])

  const addIng = () => setIngs([...ings, { ingId: "", amount: "", unit: "ml", role: "required" }])
  const removeIng = (i) => setIngs(ings.filter((_, idx) => idx !== i))
  const updateIng = (i, k, v) => setIngs(ings.map((ing, idx) => (idx === i ? { ...ing, [k]: v } : ing)))

  const addStep = () => setSteps([...steps, ""])
  const removeStep = (i) => setSteps(steps.filter((_, idx) => idx !== i))
  const updateStep = (i, v) => setSteps(steps.map((s, idx) => (idx === i ? v : s)))

  const toggleTaste = (t) => setTaste(taste.includes(t) ? taste.filter((x) => x !== t) : [...taste, t])

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
            {GLASSES.map((g) => (
              <button key={g} onClick={() => setGlass(g)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${glass === g ? "var(--cyan)" : "var(--border-s)"}`, background: glass === g ? "rgba(34,211,238,0.1)" : "var(--surface)", color: glass === g ? "var(--cyan)" : "var(--text2)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 500, textTransform: "capitalize", transition: "all 0.15s" }}>
                {g}
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
            {ings.map((ing, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ flex: 2, position: "relative" }}>
                  <input list="ing-types-editor" placeholder="Ingredient type" value={ing.ingId} onChange={(e) => updateIng(i, "ingId", e.target.value)} style={{ background: "var(--surface)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", padding: "8px 10px", color: "var(--text)", fontSize: 13, fontFamily: "var(--font-body)", width: "100%" }} />
                  <datalist id="ing-types-editor">{INGS.map((ii) => <option key={ii.id} value={ii.name} />)}</datalist>
                </div>
                <input placeholder="amt" value={ing.amount} onChange={(e) => updateIng(i, "amount", e.target.value)} style={{ width: 50, background: "var(--surface)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", padding: "8px 8px", color: "var(--text)", fontSize: 13, textAlign: "center", fontFamily: "var(--font-mono)" }} />
                <select value={ing.unit} onChange={(e) => updateIng(i, "unit", e.target.value)} style={{ background: "var(--surface)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", padding: "8px 6px", color: "var(--text2)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                  <option>ml</option><option>oz</option><option>dash</option><option>sprig</option><option>slice</option>
                </select>
                <select value={ing.role} onChange={(e) => updateIng(i, "role", e.target.value)} style={{ background: "var(--surface)", border: "1px solid var(--border-s)", borderRadius: "var(--r-sm)", padding: "8px 6px", color: "var(--text2)", fontSize: 12, fontFamily: "var(--font-display)" }}>
                  <option value="required">Required</option><option value="optional">Optional</option><option value="garnish">Garnish</option>
                </select>
                {ings.length > 1 && (
                  <button onClick={() => removeIng(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4 }}><IconX size={14} /></button>
                )}
              </div>
            ))}
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
            {TASTE_FILTERS.map((t) => <FilterChip key={t} label={t} active={taste.includes(t)} onClick={() => toggleTaste(t)} />)}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Visibility</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["private", "shared"].map((v) => (
              <button key={v} onClick={() => setVisibility(v)} style={{ flex: 1, padding: "10px", borderRadius: "var(--r-sm)", border: `1px solid ${visibility === v ? "var(--cyan)" : "var(--border-s)"}`, background: visibility === v ? "rgba(34,211,238,0.1)" : "var(--surface)", color: visibility === v ? "var(--cyan)" : "var(--text2)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}>
                {v === "private" ? <IconLock size={14} /> : <IconGlobe size={14} />} {v === "private" ? "Private" : "Share with community"}
              </button>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
            {visibility === "private" ? "Only you can see this recipe." : "Published recipes are visible to all members and can be moderated by admins."}
          </p>
        </div>

        <Btn variant="primary" full onClick={() => navigate("/library")} disabled={!name}>Save Recipe</Btn>
      </div>
    </div>
  )
}
