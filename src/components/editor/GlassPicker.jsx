import clsx from "clsx"
import { GlassSvg } from "@/components/GlassSvg"

export function GlassPicker({ glasses, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em] block mb-2">
        Glass
      </label>
      <div className="flex gap-2 flex-wrap">
        {glasses.map((g) => (
          <button
            key={g.id}
            onClick={() => onChange(g.name)}
            className={clsx(
              "pt-2 px-3.5 pb-1.5 rounded-sm border cursor-pointer text-[13px] font-display font-medium capitalize transition-all duration-150 flex flex-col items-center gap-0.5",
              value === g.name
                ? "border-cyan bg-cyan/10 text-cyan"
                : "border-bdr bg-surface text-tx2",
            )}
          >
            <GlassSvg
              type={g.shape ?? g.name.toLowerCase()}
              size={28}
              color={value === g.name ? "var(--cyan)" : "var(--text2)"}
            />
            {g.name}
          </button>
        ))}
      </div>
    </div>
  )
}
