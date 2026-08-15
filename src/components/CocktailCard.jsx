import { GlassSvg } from "@/components/GlassSvg"
import { AVAIL_CFG, Card, SourceBadge, TasteTag } from "@/components/primitives"

export function CocktailCard({ c, onClick }) {
  const cfg = AVAIL_CFG[c.avail]
  return (
    <Card
      style={{
        cursor: "pointer",
        overflow: "hidden",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      className="fade-in"
      onClick={onClick}
    >
      <div
        style={{
          padding: "16px 16px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <GlassSvg
          type={c.glass}
          liquidColor={c.liquidColor}
          size={60}
          avail={c.avail}
        />
        <div style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 4,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text)",
                lineHeight: 1.2,
              }}
            >
              {c.name}
            </span>
            <SourceBadge source={c.source} />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 8,
            }}
          >
            {c.taste.slice(0, 2).map((t) => (
              <TasteTag key={t} label={t} />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                color: cfg.color,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>{cfg.icon}</span> {cfg.label}
            </span>
            {c.avail === "almost" && c.missingRequired[0] && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--almost)",
                  background: "rgba(251,191,36,0.1)",
                  borderRadius: 4,
                  padding: "2px 6px",
                  maxWidth: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                −{c.missingRequired[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export function SmallCard({ c, onClick }) {
  return (
    <Card
      style={{
        cursor: "pointer",
        minWidth: 150,
        maxWidth: 160,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        transition: "transform 0.15s",
      }}
      onClick={onClick}
    >
      <GlassSvg
        type={c.glass}
        liquidColor={c.liquidColor}
        size={48}
        avail={c.avail}
      />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 13,
          textAlign: "center",
          color: "var(--text)",
          lineHeight: 1.2,
        }}
      >
        {c.name}
      </span>
      {c.avail === "almost" && c.missingRequired[0] && (
        <span
          style={{
            fontSize: 10,
            color: "var(--almost)",
            background: "rgba(251,191,36,0.1)",
            borderRadius: 4,
            padding: "2px 6px",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          needs {c.missingRequired[0]}
        </span>
      )}
    </Card>
  )
}
