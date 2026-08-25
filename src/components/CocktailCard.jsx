import clsx from "clsx"
import { GlassSvg } from "@/components/GlassSvg"
import {
  AVAIL_CFG,
  AVAIL_TONE,
  Card,
  SourceBadge,
  TasteTag,
} from "@/components/primitives"

export function CocktailCard({ c, onClick }) {
  const cfg = AVAIL_CFG[c.avail]
  return (
    <Card
      className="fade-in cursor-pointer overflow-hidden transition-[transform,box-shadow] duration-150"
      onClick={onClick}
    >
      <div className="pt-4 px-4 pb-3 flex flex-col items-center gap-2.5">
        <GlassSvg
          type={c.glassShape}
          liquidColor={c.liquidColor}
          liquidColor2={c.liquidColor2}
          size={60}
          avail={c.avail}
        />
        <div className="w-full">
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className="font-display font-bold text-sm text-tx leading-[1.2]">
              {c.name}
            </span>
            <SourceBadge source={c.source} />
          </div>
          {c.author && (
            <div className="text-[11px] text-tx3 mb-1.5">by {c.author}</div>
          )}
          <div className="flex flex-wrap gap-1 mb-2">
            {c.taste.slice(0, 2).map((t) => (
              <TasteTag key={t} label={t} />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span
              className={clsx(
                "text-xs font-mono flex items-center gap-1",
                AVAIL_TONE[c.avail],
              )}
            >
              <span>{cfg.icon}</span> {cfg.label}
            </span>
            {c.avail === "almost" && c.missingRequired[0] && (
              <span className="text-[11px] text-almost bg-almost/10 rounded-[4px] py-0.5 px-1.5 max-w-25 overflow-hidden text-ellipsis whitespace-nowrap">
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
      className="cursor-pointer min-w-[150px] max-w-[160px] p-3 flex flex-col items-center gap-2 shrink-0 transition-transform duration-150"
      onClick={onClick}
    >
      <GlassSvg
        type={c.glassShape}
        liquidColor={c.liquidColor}
        liquidColor2={c.liquidColor2}
        size={48}
        avail={c.avail}
      />
      <span className="font-display font-semibold text-[13px] text-center text-tx leading-[1.2]">
        {c.name}
      </span>
      {c.avail === "almost" && c.missingRequired[0] && (
        <span className="text-[10px] text-almost bg-almost/10 rounded-[4px] py-0.5 px-1.5 text-center leading-[1.3]">
          needs {c.missingRequired[0]}
        </span>
      )}
    </Card>
  )
}
