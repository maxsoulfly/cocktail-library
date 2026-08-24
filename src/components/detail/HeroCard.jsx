import { GlassSvg } from "@/components/GlassSvg"
import { AvailBadge, SourceBadge, TasteTag } from "@/components/primitives"

export function HeroCard({ c }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: "20px",
        background: "var(--surface)",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--border-s)",
      }}
    >
      <GlassSvg
        type={c.glassShape}
        liquidColor={c.liquidColor}
        size={96}
        avail={c.avail}
      />
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <SourceBadge source={c.source} />
          {c.author && (
            <span
              style={{
                fontSize: 12,
                color: "var(--text3)",
                lineHeight: 1.8,
              }}
            >
              by {c.author}
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {c.taste.map((t) => (
            <TasteTag key={t} label={t} />
          ))}
        </div>
      </div>
      <AvailBadge avail={c.avail} />
      {c.avail === "almost" && c.missingRequired[0] && (
        <div
          style={{
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.3)",
            borderRadius: "var(--r-sm)",
            padding: "8px 14px",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--almost)" }}>
            Missing: <strong>{c.missingRequired.join(", ")}</strong>
          </span>
        </div>
      )}
      {c.family && (
        <span
          style={{
            fontSize: 12,
            color: "var(--text3)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Family: {c.family}
        </span>
      )}
    </div>
  )
}
