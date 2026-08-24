import clsx from "clsx"
import { FamilyIcon } from "@/components/FamilyIcon"
import { GlassSvg } from "@/components/GlassSvg"
import { FAMILY_SHAPES, GLASS_SHAPES } from "@/data/constants"

// Which built-in pictogram a row uses - see GLASS_SHAPES/FAMILY_SHAPES'
// comments for why this exists instead of the icon being tied to the name.
// `kind` picks the shape list and icon component; "glass" -> GlassSvg,
// "family" -> FamilyIcon.
export function ShapePicker({ kind, value, onChange }) {
  const shapes = kind === "family" ? FAMILY_SHAPES : GLASS_SHAPES
  return (
    <div className="flex gap-2 flex-wrap">
      {shapes.map((shape) => {
        const active = value === shape
        const iconColor = active ? "var(--cyan)" : "var(--text2)"
        return (
          <button
            key={shape}
            type="button"
            onClick={() => onChange(shape)}
            title={shape}
            className={clsx(
              "pt-1.5 px-2.5 pb-1 rounded-sm border cursor-pointer flex flex-col items-center gap-0.5",
              active ? "border-cyan bg-cyan/12" : "border-bdr bg-surface",
            )}
          >
            {kind === "family" ? (
              <FamilyIcon shape={shape} size={24} color={iconColor} />
            ) : (
              <GlassSvg type={shape} size={24} color={iconColor} />
            )}
            <span
              className={clsx(
                "text-[10px] capitalize",
                active ? "text-cyan" : "text-tx2",
              )}
            >
              {shape.replace(/_/g, " ")}
            </span>
          </button>
        )
      })}
    </div>
  )
}
