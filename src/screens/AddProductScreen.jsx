import { useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { IconAlert, IconCheck, IconInfo } from "@/components/icons"
import { TopBar } from "@/components/Nav"
import { Btn, Card, Input, OwnedToggle } from "@/components/primitives"
import { createProduct } from "@/services/catalog"

export default function AddProductScreen() {
  const navigate = useNavigate()
  const { catalog, inventory } = useOutletContext()
  const { types } = catalog
  const [name, setName] = useState("")
  const [ingType, setIngType] = useState("")
  const [brand, setBrand] = useState("")
  const [homemade, setHomemade] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const matchedType = types.find(
    (t) => t.name.toLowerCase() === ingType.toLowerCase(),
  )

  const handleAdd = async () => {
    if (!matchedType) return
    setBusy(true)
    setError(null)
    try {
      const product = await createProduct({
        name,
        ingredientTypeId: matchedType.id,
        brand: brand || null,
        isHomemade: homemade,
      })
      await inventory.ownProduct(product.id)
      await catalog.refetch() // pick up the new product row for MyBarScreen's productsByType map
      navigate("/bar")
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <TopBar title="Add Product" onBack={() => navigate(-1)} />
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Card
          style={{
            padding: "12px 16px",
            border: "1px solid rgba(34,211,238,0.2)",
            background: "rgba(34,211,238,0.04)",
            display: "flex",
            gap: 10,
          }}
        >
          <IconInfo
            size={16}
            style={{ color: "var(--cyan)", flexShrink: 0, marginTop: 1 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--text2)",
              lineHeight: 1.5,
            }}
          >
            Adding a product tells Cocktail Library which generic ingredient it
            represents. New ingredient types require admin approval.
          </p>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Product Name"
            placeholder="e.g. Hendrick's Gin"
            value={name}
            onChange={setName}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
              Ingredient Type
            </label>
            <div style={{ position: "relative" }}>
              <input
                list="ing-types"
                placeholder="Select ingredient type..."
                value={ingType}
                onChange={(e) => setIngType(e.target.value)}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-s)",
                  borderRadius: "var(--r-sm)",
                  padding: "10px 14px",
                  color: "var(--text)",
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  width: "100%",
                }}
              />
              <datalist id="ing-types">
                {types.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>
            {matchedType && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  background: "rgba(52,211,153,0.08)",
                  borderRadius: 6,
                  border: "1px solid rgba(52,211,153,0.2)",
                }}
              >
                <IconCheck size={14} style={{ color: "var(--green)" }} />
                <span style={{ fontSize: 13, color: "var(--green)" }}>
                  Matches catalog ingredient:{" "}
                  <strong>{matchedType.name}</strong>
                </span>
              </div>
            )}
            {ingType && !matchedType && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  background: "rgba(251,191,36,0.08)",
                  borderRadius: 6,
                  border: "1px solid rgba(251,191,36,0.2)",
                }}
              >
                <IconAlert size={14} style={{ color: "var(--amber)" }} />
                <span style={{ fontSize: 13, color: "var(--amber)" }}>
                  Doesn't match an existing ingredient type - new types require
                  admin approval, so this can't be added yet.
                </span>
              </div>
            )}
          </div>

          <Input
            label="Brand / Maker (optional)"
            placeholder="e.g. Hendrick's"
            value={brand}
            onChange={setBrand}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0",
              borderTop: "1px solid var(--border-s)",
              borderBottom: "1px solid var(--border-s)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  color: "var(--text)",
                }}
              >
                Homemade
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>
                Mark as a homemade product
              </div>
            </div>
            <OwnedToggle owned={homemade} onChange={setHomemade} />
          </div>

          {matchedType && (
            <Card
              style={{
                padding: "14px",
                border: "1px solid var(--border-s)",
                background: "var(--surface2)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                  fontFamily: "var(--font-display)",
                }}
              >
                Preview
              </div>
              <div
                style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}
              >
                <strong style={{ color: "var(--text)" }}>
                  {name || "Your Product"}
                </strong>{" "}
                will satisfy the{" "}
                <strong style={{ color: "var(--cyan)" }}>
                  {matchedType.name}
                </strong>{" "}
                requirement in recipes.
              </div>
            </Card>
          )}

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
              {error}
            </p>
          )}
        </div>

        <Btn
          variant="primary"
          full
          onClick={handleAdd}
          disabled={busy || !name || !matchedType}
        >
          Add to My Bar
        </Btn>
      </div>
    </div>
  )
}
