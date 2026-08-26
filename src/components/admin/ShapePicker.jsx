import { useRef, useState } from "react"
import clsx from "clsx"
import { IconChevD } from "@/components/icons"
import { FamilyIcon } from "@/components/FamilyIcon"
import { GlassSvg } from "@/components/GlassSvg"
import { IngredientIcon } from "@/components/IngredientIcon"
import { BottomSheet } from "@/components/primitives"
import {
  FAMILY_SHAPES,
  GLASS_SHAPES,
  INGREDIENT_SHAPES,
} from "@/data/constants"

// `kind` picks the shape list and icon component; "glass" -> GlassSvg (which
// takes its shape via a `type` prop, not `shape` - the one naming mismatch
// this file has to route around), "family" -> FamilyIcon, "ingredient" ->
// IngredientIcon.
function ShapeIcon({ kind, shape, size, color }) {
  if (kind === "family")
    return <FamilyIcon shape={shape} size={size} color={color} />
  if (kind === "ingredient")
    return <IngredientIcon shape={shape} size={size} color={color} />
  return <GlassSvg type={shape} size={size} color={color} />
}

// Which built-in pictogram a row uses - see GLASS_SHAPES/FAMILY_SHAPES/
// INGREDIENT_SHAPES' comments for why this exists instead of the icon being
// tied to the name.
//
// Renders as a compact current-icon+name trigger that opens the full grid
// in a BottomSheet - the grid used to render fully expanded inline
// everywhere (glasses alone has 19 shapes), which was the single biggest
// contributor to Admin's catalog-management screens feeling oversized on
// mobile. Picking a shape closes the sheet immediately.
export function ShapePicker({ kind, value, onChange }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const shapes =
    kind === "family"
      ? FAMILY_SHAPES
      : kind === "ingredient"
        ? INGREDIENT_SHAPES
        : GLASS_SHAPES
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 py-1.5 px-2.5 bg-surface border border-bdr rounded-sm cursor-pointer w-fit"
      >
        <ShapeIcon kind={kind} shape={value} size={28} color="var(--cyan)" />
        <span className="text-[13px] text-tx capitalize">
          {value.replace(/_/g, " ")}
        </span>
        <IconChevD size={12} className="text-tx3" />
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Choose an icon"
        anchorRef={triggerRef}
      >
        <div className="flex gap-2 flex-wrap">
          {shapes.map((shape) => {
            const active = value === shape
            const iconColor = active ? "var(--cyan)" : "var(--text2)"
            return (
              <button
                key={shape}
                type="button"
                onClick={() => {
                  onChange(shape)
                  setOpen(false)
                }}
                title={shape}
                className={clsx(
                  "pt-1.5 px-2.5 pb-1 rounded-sm border cursor-pointer flex flex-col items-center gap-0.5",
                  active ? "border-cyan bg-cyan/12" : "border-bdr bg-surface",
                )}
              >
                <ShapeIcon
                  kind={kind}
                  shape={shape}
                  size={24}
                  color={iconColor}
                />
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
      </BottomSheet>
    </>
  )
}
