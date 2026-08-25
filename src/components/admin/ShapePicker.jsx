import clsx from "clsx"
import { FamilyIcon } from "@/components/FamilyIcon"
import { GlassSvg } from "@/components/GlassSvg"
import { IngredientIcon } from "@/components/IngredientIcon"
import {
  FAMILY_SHAPES,
  GLASS_SHAPES,
  INGREDIENT_SHAPES,
} from "@/data/constants"

// Which built-in pictogram a row uses - see GLASS_SHAPES/FAMILY_SHAPES/
// INGREDIENT_SHAPES' comments for why this exists instead of the icon being
// tied to the name. `kind` picks the shape list and icon component;
// "glass" -> GlassSvg, "family" -> FamilyIcon, "ingredient" -> IngredientIcon.
export function ShapePicker({ kind, value, onChange }) {
  const shapes =
    kind === "family"
      ? FAMILY_SHAPES
      : kind === "ingredient"
        ? INGREDIENT_SHAPES
        : GLASS_SHAPES
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
            ) : kind === "ingredient" ? (
              <IngredientIcon shape={shape} size={24} color={iconColor} />
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
