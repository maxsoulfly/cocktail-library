import { useRef, useState } from "react"
import clsx from "clsx"
import { IconChevD } from "@/components/icons"
import { GlassSvg } from "@/components/GlassSvg"
import { BottomSheet } from "@/components/primitives"

// Was an always-expanded 19-glass grid - the same "list of everything"
// problem the admin shape/color pickers had before they moved to this
// compact-trigger + BottomSheet pattern, just never applied here yet.
export function GlassPicker({ glasses, value, onChange }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const current = glasses.find((g) => g.name === value)
  return (
    <div>
      <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em] block mb-2">
        Glass
      </label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 py-1.5 px-2.5 bg-surface border border-bdr rounded-sm cursor-pointer w-fit"
      >
        {current && (
          <GlassSvg
            type={current.shape ?? current.name.toLowerCase()}
            size={28}
            color="var(--cyan)"
          />
        )}
        <span className="text-[13px] text-tx capitalize">
          {value || "Choose a glass"}
        </span>
        <IconChevD size={12} className="text-tx3" />
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Choose a glass"
        anchorRef={triggerRef}
      >
        <div className="flex gap-2 flex-wrap">
          {glasses.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                onChange(g.name)
                setOpen(false)
              }}
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
      </BottomSheet>
    </div>
  )
}
