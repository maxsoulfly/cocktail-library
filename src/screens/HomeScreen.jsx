import { useMemo } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import {
  IconBookmark,
  IconBottle,
  IconCheck,
  IconChevR,
  IconHeart,
  IconSearch,
} from "@/components/icons"
import { GlassSvg } from "@/components/GlassSvg"
import { SmallCard } from "@/components/CocktailCard"
import { Card, SectionTitle } from "@/components/primitives"
import { rankPurchaseRecommendations } from "@/domain/recommendations"

export default function HomeScreen() {
  const navigate = useNavigate()
  const {
    computed,
    favorites,
    wantToMake,
    profile,
    email,
    ingredientTypesById,
    inventory,
  } = useOutletContext()
  const firstName = (profile?.display_name || email || "there").split(
    /[\s@]/,
  )[0]

  const perfect = computed.filter((c) => c.avail === "perfect")
  const good = computed.filter((c) => c.avail === "good")
  const almost = computed.filter((c) => c.avail === "almost")

  const buyNext = useMemo(
    () =>
      rankPurchaseRecommendations({
        computed,
        ingredientTypesById,
        favoriteIds: favorites,
        wantToMakeIds: wantToMake,
        limit: 2,
      }),
    [computed, ingredientTypesById, favorites, wantToMake],
  )

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        style={{
          padding: "20px 20px 0",
          background: "var(--bg2)",
          borderBottom: "1px solid var(--border-s)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--text2)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {greeting}
            </p>
            <h1
              style={{
                margin: "2px 0 0",
                fontSize: 24,
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                color: "var(--text)",
                letterSpacing: "-0.02em",
              }}
            >
              {firstName}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate("/lists")}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-s)",
                borderRadius: "var(--r-sm)",
                padding: "6px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--coral)",
                fontSize: 12,
                fontFamily: "var(--font-display)",
                fontWeight: 600,
              }}
            >
              <IconHeart size={14} /> {favorites.size}
            </button>
            <button
              onClick={() => navigate("/lists")}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-s)",
                borderRadius: "var(--r-sm)",
                padding: "6px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--violet)",
                fontSize: 12,
                fontFamily: "var(--font-display)",
                fontWeight: 600,
              }}
            >
              <IconBookmark size={14} /> {wantToMake.size}
            </button>
          </div>
        </div>
        <button
          onClick={() => navigate("/library")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--surface)",
            border: "1px solid var(--border-s)",
            borderRadius: "var(--r)",
            padding: "10px 14px",
            width: "100%",
            cursor: "text",
            marginBottom: 16,
          }}
        >
          <IconSearch size={16} style={{ color: "var(--text3)" }} />
          <span
            style={{
              color: "var(--text3)",
              fontSize: 14,
              fontFamily: "var(--font-body)",
            }}
          >
            Search cocktails...
          </span>
        </button>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {perfect.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <SectionTitle>Ready to Pour</SectionTitle>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--perfect)",
                }}
              >
                ✦ {perfect.length}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              {perfect.map((c) => (
                <SmallCard
                  key={c.id}
                  c={c}
                  onClick={() => navigate(`/library/${c.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {good.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <SectionTitle>Good Enough</SectionTitle>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--good)",
                }}
              >
                ◎ {good.length}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              {good.map((c) => (
                <SmallCard
                  key={c.id}
                  c={c}
                  onClick={() => navigate(`/library/${c.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {almost.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <SectionTitle>Almost There</SectionTitle>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--almost)",
                }}
              >
                ◐ {almost.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {almost.map((c) => (
                <Card
                  key={c.id}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                  onClick={() => navigate(`/library/${c.id}`)}
                >
                  <GlassSvg
                    type={c.glassShape}
                    liquidColor={c.liquidColor}
                    size={40}
                    avail="almost"
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        color: "var(--text)",
                        marginBottom: 2,
                      }}
                    >
                      {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      Missing:{" "}
                      <span style={{ color: "var(--almost)", fontWeight: 600 }}>
                        {c.missingRequired[0]}
                      </span>
                    </div>
                  </div>
                  <IconChevR size={16} style={{ color: "var(--text3)" }} />
                </Card>
              ))}
            </div>
          </div>
        )}

        {buyNext.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle>Buy Next</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {buyNext.map((candidate) => {
                const ing = ingredientTypesById.get(candidate.ingredientTypeId)
                return (
                  <Card
                    key={candidate.ingredientTypeId}
                    style={{
                      padding: "14px 16px",
                      border: "1px solid rgba(251,191,36,0.25)",
                      background: "rgba(251,191,36,0.05)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: ing
                            ? `${ing.color}30`
                            : "var(--surface3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: ing
                            ? `1px solid ${ing.color}50`
                            : "1px solid var(--border-s)",
                          flexShrink: 0,
                        }}
                      >
                        <IconBottle
                          size={18}
                          style={{ color: ing?.color ?? "var(--text2)" }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            color: "var(--text)",
                            marginBottom: 2,
                          }}
                        >
                          {candidate.name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text2)" }}>
                          {candidate.reason}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--almost)",
                            fontFamily: "var(--font-mono)",
                            marginTop: 4,
                          }}
                        >
                          +{candidate.unlockCount}{" "}
                          {candidate.unlockCount === 1
                            ? "cocktail"
                            : "cocktails"}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          inventory.toggleType(candidate.ingredientTypeId)
                        }
                        title="Mark as owned in My Bar"
                        style={{
                          background: "var(--surface3)",
                          border: "1px solid var(--border-s)",
                          borderRadius: "var(--r-sm)",
                          width: 36,
                          height: 36,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "var(--green)",
                        }}
                      >
                        <IconCheck size={16} />
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
