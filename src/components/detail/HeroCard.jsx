import { GlassSvg } from "@/components/GlassSvg"
import { AvailBadge, SourceBadge, TasteTag } from "@/components/primitives"

export function HeroCard({ c }) {
  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-surface rounded-xl border border-bdr">
      <GlassSvg
        type={c.glassShape}
        liquidColor={c.liquidColor}
        liquidColor2={c.liquidColor2}
        size={96}
        avail={c.avail}
      />
      <div className="text-center">
        <div className="flex gap-1.5 justify-center mb-2">
          <SourceBadge source={c.source} />
          {c.author && (
            <span className="text-xs text-tx3 leading-[1.8]">
              by {c.author}
            </span>
          )}
        </div>
        <div className="flex gap-1.5 justify-center flex-wrap">
          {c.taste.map((t) => (
            <TasteTag key={t} label={t} />
          ))}
        </div>
      </div>
      <AvailBadge avail={c.avail} />
      {c.avail === "almost" && c.missingRequired[0] && (
        <div className="bg-almost/10 border border-almost/30 rounded-sm py-2 px-3.5 text-center">
          <span className="text-[13px] text-almost">
            Missing: <strong>{c.missingRequired.join(", ")}</strong>
          </span>
        </div>
      )}
      {c.family && (
        <span className="text-xs text-tx3 font-mono">Family: {c.family}</span>
      )}
    </div>
  )
}
