import { SectionTitle } from "@/components/primitives"
import { formatAmount } from "@/domain/availability"

export function IngredientsSection({
  ings,
  substitutions,
  missingOptional,
  owned,
  unit,
  setUnit,
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <SectionTitle>Ingredients</SectionTitle>
        <div
          style={{
            display: "flex",
            background: "var(--surface)",
            border: "1px solid var(--border-s)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {["ml", "oz"].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              style={{
                padding: "4px 12px",
                background: unit === u ? "var(--cyan)" : "none",
                color: unit === u ? "#07091a" : "var(--text2)",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      {["required", "optional", "garnish"].map((role) => {
        const roleIngs = ings.filter((i) => i.role === role)
        if (!roleIngs.length) return null
        return (
          <div key={role} style={{ marginBottom: 12 }}>
            {role !== "required" && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                  fontFamily: "var(--font-display)",
                }}
              >
                {role}
              </div>
            )}
            {roleIngs.map((ri) => {
              const substitution = substitutions[ri.ingId]
              const isOwned = owned.has(ri.ingId) || Boolean(substitution)
              return (
                <div
                  key={ri.ingId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border-s)",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: isOwned
                        ? "var(--green)"
                        : ri.role === "required"
                          ? "var(--coral)"
                          : "var(--text3)",
                      flexShrink: 0,
                      boxShadow: isOwned
                        ? "0 0 6px rgba(52,211,153,0.6)"
                        : undefined,
                    }}
                  />
                  <span style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: 14,
                        color: "var(--text)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {ri.name ?? ri.ingId}
                    </span>
                    {substitution && (
                      <span
                        style={{
                          display: "block",
                          fontSize: 11,
                          color: "var(--text3)",
                        }}
                      >
                        Substituting: {substitution.matchedName}
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontFamily: "var(--font-mono)",
                      color: "var(--text2)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatAmount(ri, unit)}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
      {missingOptional.length > 0 && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text3)" }}>
          Optional/garnish: {missingOptional.join(", ")} not in your bar — still
          makeable.
        </p>
      )}
    </div>
  )
}
