import { useMemo, useState } from "react"
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom"
import { CocktailCard } from "@/components/CocktailCard"
import { IconFilter, IconGlass, IconPlus, IconSearch } from "@/components/icons"
import { Btn, FilterChip } from "@/components/primitives"
import { AVAIL_FILTERS, SOURCE_FILTERS } from "@/data/constants"

export default function LibraryScreen() {
  const navigate = useNavigate()
  const { computed, catalog } = useOutletContext()
  const { tasteTags } = catalog
  const [searchParams] = useSearchParams()
  // Deep-link support (?source=classic) for the Admin dashboard's stat
  // cards - read once on mount as the initial filter state, not kept in
  // sync afterward, so a member adjusting filters here doesn't fight with
  // the URL on every click.
  const initialSource = searchParams.get("source")
  const [query, setQuery] = useState("")
  const [availFilter, setAvailFilter] = useState("all")
  const [sourceFilters, setSourceFilters] = useState(
    initialSource && SOURCE_FILTERS.some((f) => f.key === initialSource)
      ? [initialSource]
      : [],
  )
  const [tasteFilters, setTasteFilters] = useState([])
  const [showFilters, setShowFilters] = useState(Boolean(sourceFilters.length))

  const toggleArr = (arr, val, set) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])

  const filtered = useMemo(
    () =>
      computed.filter((c) => {
        if (
          query &&
          !c.name.toLowerCase().includes(query.toLowerCase()) &&
          !c.taste.some((t) => t.toLowerCase().includes(query.toLowerCase()))
        )
          return false
        if (availFilter !== "all" && c.avail !== availFilter) return false
        if (sourceFilters.length && !sourceFilters.includes(c.source))
          return false
        if (
          tasteFilters.length &&
          !tasteFilters.some((t) => c.taste.includes(t))
        )
          return false
        return true
      }),
    [computed, query, availFilter, sourceFilters, tasteFilters],
  )

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        style={{
          padding: "16px 16px 0",
          background: "var(--bg2)",
          borderBottom: "1px solid var(--border-s)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <IconSearch
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text3)",
              }}
            />
            <input
              placeholder="Search cocktails, tastes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-s)",
                borderRadius: "var(--r-sm)",
                padding: "9px 12px 9px 36px",
                color: "var(--text)",
                fontSize: 14,
                fontFamily: "var(--font-body)",
                width: "100%",
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: showFilters
                ? "rgba(34,211,238,0.12)"
                : "var(--surface)",
              border: `1px solid ${
                showFilters ? "var(--cyan)" : "var(--border-s)"
              }`,
              borderRadius: "var(--r-sm)",
              padding: "0 12px",
              cursor: "pointer",
              color: showFilters ? "var(--cyan)" : "var(--text2)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <IconFilter size={16} />{" "}
            <span
              style={{
                fontSize: 13,
                fontFamily: "var(--font-display)",
                fontWeight: 600,
              }}
            >
              Filter
            </span>
          </button>
          <button
            onClick={() => navigate("/library/new")}
            style={{
              background: "var(--cyan)",
              border: "none",
              borderRadius: "var(--r-sm)",
              width: 40,
              height: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#07091a",
              flexShrink: 0,
            }}
            className="glow-cyan"
          >
            <IconPlus size={18} />
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 12,
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
        <div style={{ display: "flex", gap: 6, paddingBottom: 12 }}>
          {SOURCE_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={sourceFilters.includes(f.key)}
              onClick={() => toggleArr(sourceFilters, f.key, setSourceFilters)}
            />
          ))}
        </div>
        {showFilters && (
          <div style={{ paddingBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text3)",
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Taste
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tasteTags.map((t) => (
                <FilterChip
                  key={t.id}
                  label={t.name}
                  active={tasteFilters.includes(t.name)}
                  onClick={() =>
                    toggleArr(tasteFilters, t.name, setTasteFilters)
                  }
                />
              ))}
            </div>
          </div>
        )}
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
          <IconGlass size={40} style={{ opacity: 0.3 }} />
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
            }}
          >
            No cocktails found
          </p>
          <p style={{ margin: 0, fontSize: 13, textAlign: "center" }}>
            Try adjusting your filters or search term.
          </p>
          <Btn
            variant="ghost"
            small
            onClick={() => {
              setQuery("")
              setAvailFilter("all")
              setSourceFilters([])
              setTasteFilters([])
            }}
          >
            Clear filters
          </Btn>
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
