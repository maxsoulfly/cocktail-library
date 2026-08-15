import { useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { CocktailCard } from "@/components/CocktailCard"
import { IconBookmark, IconHeart } from "@/components/icons"
import { FilterChip } from "@/components/primitives"
import { AVAIL_FILTERS } from "@/data/constants"

export default function ListsScreen() {
  const navigate = useNavigate()
  const { computed, favorites, wantToMake } = useOutletContext()
  const [tab, setTab] = useState("favorites") // favorites | wantToMake
  const [availFilter, setAvailFilter] = useState("all")

  const listIds = tab === "favorites" ? favorites : wantToMake
  const filtered = computed.filter(
    (c) =>
      listIds.has(c.id) && (availFilter === "all" || c.avail === availFilter),
  )

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        style={{
          background: "var(--bg2)",
          borderBottom: "1px solid var(--border-s)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", padding: "16px 16px 0" }}>
          {["favorites", "wantToMake"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom: `2px solid ${
                  tab === t ? "var(--cyan)" : "transparent"
                }`,
                color: tab === t ? "var(--cyan)" : "var(--text2)",
                fontFamily: "var(--font-display)",
                fontWeight: tab === t ? 700 : 400,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.15s",
              }}
            >
              {t === "favorites" ? (
                <>
                  <IconHeart size={16} /> Favorites{" "}
                  <span
                    style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
                  >
                    ({favorites.size})
                  </span>
                </>
              ) : (
                <>
                  <IconBookmark size={16} /> Want to Make{" "}
                  <span
                    style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
                  >
                    ({wantToMake.size})
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "10px 16px",
            overflowX: "auto",
          }}
        >
          {AVAIL_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={availFilter === f.key}
              onClick={() => setAvailFilter(f.key)}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 24px",
            gap: 12,
            color: "var(--text3)",
          }}
        >
          {tab === "favorites" ? (
            <IconHeart size={40} style={{ opacity: 0.3 }} />
          ) : (
            <IconBookmark size={40} style={{ opacity: 0.3 }} />
          )}
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              color: "var(--text2)",
            }}
          >
            {listIds.size === 0
              ? tab === "favorites"
                ? "No favorites yet"
                : "Nothing saved yet"
              : "No results for this filter"}
          </p>
          <p style={{ margin: 0, fontSize: 13, textAlign: "center" }}>
            {listIds.size === 0
              ? "Tap the heart or bookmark icon on any cocktail to add it here."
              : "Try a different availability filter."}
          </p>
        </div>
      ) : (
        <div
          style={{
            padding: "16px",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
          }}
        >
          {filtered.map((c) => (
            <CocktailCard
              key={c.id}
              c={c}
              onClick={() => navigate(`/library/${c.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
