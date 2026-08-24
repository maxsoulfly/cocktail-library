import { SectionTitle } from "@/components/primitives"

export function StepsSection({ steps }) {
  return (
    <div>
      <SectionTitle>Preparation</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--surface3)",
                border: "1px solid var(--border-s)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--cyan)",
                fontWeight: 600,
              }}
            >
              {i + 1}
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--text)",
                lineHeight: 1.55,
              }}
            >
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
