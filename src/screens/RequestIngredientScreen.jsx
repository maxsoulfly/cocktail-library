import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { TopBar } from "@/components/Nav"
import { Btn, Input } from "@/components/primitives"
import { createIngredientRequest } from "@/services/ingredientRequests"

export default function RequestIngredientScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [name, setName] = useState(searchParams.get("name") ?? "")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      await createIngredientRequest({ name: name.trim(), note: note.trim() })
      setSent(true)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (sent) {
    return (
      <div
        style={{
          paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <TopBar title="Request an Ingredient" onBack={() => navigate(-1)} />
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
            color: "var(--text2)",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 16,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Request sent
          </p>
          <p style={{ margin: "0 0 20px", fontSize: 14 }}>
            An admin will review "{name}" and add it to the catalog if it fits.
          </p>
          <Btn variant="ghost" small onClick={() => navigate(-1)}>
            Back
          </Btn>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <TopBar title="Request an Ingredient" onBack={() => navigate(-1)} />
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--text2)",
            lineHeight: 1.5,
          }}
        >
          Missing an ingredient type - a juice, a garnish, anything else? Only
          admins can add new types to the catalog, but you can ask for one here.
        </p>
        <Input
          label="Ingredient name"
          placeholder="e.g. Passionfruit Juice"
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
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's it for, or which category do you think it belongs in?"
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
        {error && (
          <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
            {error}
          </p>
        )}
        <Btn
          variant="primary"
          full
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
        >
          Send Request
        </Btn>
      </div>
    </div>
  )
}
