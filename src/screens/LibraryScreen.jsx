import { useMemo, useState } from "react"
import clsx from "clsx"
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
    <div className="pb-[calc(96px_+_env(safe-area-inset-bottom,0px))]">
      <div className="pt-4 px-4 pb-0 bg-bg2 border-b border-bdr sticky top-0 z-10 backdrop-blur-md">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <IconSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-tx3"
            />
            <input
              placeholder="Search cocktails, tastes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-surface border border-bdr rounded-sm py-[9px] pl-9 pr-3 text-tx text-sm font-body w-full"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "rounded-sm px-3 cursor-pointer flex items-center gap-1.5 border",
              showFilters
                ? "bg-cyan/12 border-cyan text-cyan"
                : "bg-surface border-bdr text-tx2",
            )}
          >
            <IconFilter size={16} />{" "}
            <span className="text-[13px] font-display font-semibold">
              Filter
            </span>
          </button>
          <button
            onClick={() => navigate("/library/new")}
            className="glow-cyan bg-cyan border-none rounded-sm w-10 h-10 cursor-pointer flex items-center justify-center text-[#07091a] shrink-0"
          >
            <IconPlus size={18} />
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-3">
          {AVAIL_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={availFilter === f.key}
              onClick={() => setAvailFilter(f.key)}
            />
          ))}
        </div>
        <div className="flex gap-1.5 pb-3">
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
          <div className="pb-3">
            <div className="text-[11px] font-bold text-tx3 font-display uppercase tracking-[0.06em] mb-1.5">
              Taste
            </div>
            <div className="flex gap-1.5 flex-wrap">
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
        <div className="flex flex-col items-center justify-center py-15 px-6 gap-3 text-tx3">
          <IconGlass size={40} className="opacity-30" />
          <p className="text-base font-display font-semibold">
            No cocktails found
          </p>
          <p className="text-[13px] text-center">
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
        <div className="p-4 grid grid-cols-2 gap-2.5">
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
