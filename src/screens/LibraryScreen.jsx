import { useEffect, useMemo, useRef, useState } from "react"
import clsx from "clsx"
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom"
import { CocktailCard } from "@/components/CocktailCard"
import {
  IconChevD,
  IconFilter,
  IconGlass,
  IconPlus,
  IconSearch,
} from "@/components/icons"
import {
  AVAIL_CFG,
  AVAIL_TONE,
  BottomSheet,
  Btn,
  FilterChip,
  SectionTitle,
} from "@/components/primitives"
import { AVAIL_FILTERS, SOURCE_FILTERS } from "@/data/constants"

// "Show my cocktails" (Build Your Bar) deep-links here with ?sort=availability
// - prioritizes real matches without hiding anything, unlike a filter: an
// almost-match stays visible immediately as a useful fallback the moment
// there aren't many complete ones yet, and "Browse cocktails" (plain
// /library, no param) stays byte-for-byte the existing unsorted experience.
// Grouped rendering below supersedes a flat sort entirely - real section
// breaks communicate the same "available first" priority more clearly than
// ordering alone did (Stage 3), so there's no separate sort step to keep in
// sync with this order.
const AVAIL_GROUP_ORDER = ["perfect", "good", "almost", "unavail"]
// Matches HomeScreen.jsx's own section names exactly, for the same
// availability tiers - AVAIL_CFG's own `label` ("Perfect", not "Ready to
// Pour") is a different, shorter string used on the per-card badge, kept
// as-is; these are the group headings specifically.
const AVAIL_GROUP_LABEL = {
  perfect: "Ready to Pour",
  good: "Good Enough",
  almost: "Almost There",
  unavail: "Unavailable",
}

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
  // No interactive UI toggles this within Library itself (unlike the
  // filters below), so it's just read directly each render rather than
  // captured into its own state - the URL won't change mid-visit outside
  // a manual address-bar edit.
  const sortByAvailability = searchParams.get("sort") === "availability"
  const [query, setQuery] = useState("")
  const searchInputRef = useRef(null)
  // Home's own search bar is just a styled button, not a real input (it
  // can't own text entry across a route change) - it links here with
  // ?focus=1 instead, and this is the other half: focus the real input on
  // arrival so a search-cocktails tap doesn't cost a second tap to actually
  // start typing.
  useEffect(() => {
    if (searchParams.get("focus")) searchInputRef.current?.focus()
  }, [searchParams])
  const [availFilter, setAvailFilter] = useState("all")
  const [sourceFilters, setSourceFilters] = useState(
    initialSource && SOURCE_FILTERS.some((f) => f.key === initialSource)
      ? [initialSource]
      : [],
  )
  const [tasteFilters, setTasteFilters] = useState([])
  const [showFilters, setShowFilters] = useState(Boolean(sourceFilters.length))
  const [availPickerOpen, setAvailPickerOpen] = useState(false)
  const availTriggerRef = useRef(null)
  const currentAvail = AVAIL_FILTERS.find((f) => f.key === availFilter)

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

  // Grouped rendering only ever applies on top of the already-filtered set
  // above - search/availFilter/sourceFilters/tasteFilters all still run
  // first, exactly as they do for plain Browse. Empty tiers are dropped
  // entirely (not rendered as an empty heading) rather than filtered out of
  // `filtered` itself, so the "No cocktails found" empty state below still
  // only fires when there's truly nothing to show, grouped or not.
  const groups = useMemo(() => {
    if (!sortByAvailability) return null
    const byTier = { perfect: [], good: [], almost: [], unavail: [] }
    filtered.forEach((c) => byTier[c.avail]?.push(c))
    return AVAIL_GROUP_ORDER.map((tier) => ({
      tier,
      items: byTier[tier],
    })).filter((g) => g.items.length > 0)
  }, [filtered, sortByAvailability])

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
              ref={searchInputRef}
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
        <div className="flex flex-wrap items-center gap-1.5 pb-3">
          <button
            ref={availTriggerRef}
            type="button"
            onClick={() => setAvailPickerOpen(true)}
            className="flex items-center gap-2 py-2 px-3 bg-surface border border-bdr rounded-full cursor-pointer w-fit"
          >
            <span className="text-[13px] text-cyan">{currentAvail.label}</span>
            <IconChevD size={14} className="text-tx3" />
          </button>
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
      <BottomSheet
        open={availPickerOpen}
        onClose={() => setAvailPickerOpen(false)}
        title="Filter by availability"
        anchorRef={availTriggerRef}
      >
        <div className="flex gap-2 flex-wrap">
          {AVAIL_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={availFilter === f.key}
              onClick={() => {
                setAvailFilter(f.key)
                setAvailPickerOpen(false)
              }}
            />
          ))}
        </div>
      </BottomSheet>

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
      ) : groups ? (
        <div className="p-4 flex flex-col gap-6">
          {groups.map(({ tier, items }) => (
            <div key={tier}>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>{AVAIL_GROUP_LABEL[tier]}</SectionTitle>
                <span
                  className={clsx(
                    "text-xs font-mono flex items-center gap-1",
                    AVAIL_TONE[tier],
                  )}
                >
                  {AVAIL_CFG[tier].icon} {items.length}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {items.map((c) => (
                  <CocktailCard
                    key={c.id}
                    c={c}
                    onClick={() => navigate(`/library/${c.id}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
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
