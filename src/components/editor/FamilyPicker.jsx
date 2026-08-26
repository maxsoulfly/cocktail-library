import { useRef, useState } from "react"
import clsx from "clsx"
import { IconChevD } from "@/components/icons"
import { FamilyIcon } from "@/components/FamilyIcon"
import { BottomSheet } from "@/components/primitives"

// Was an always-expanded family grid - same fix as GlassPicker, the same
// compact-trigger + BottomSheet pattern the admin shape/color pickers use.
export function FamilyPicker({ families, value, onChange }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const current = families.find((f) => f.id === value)
  return (
    <div>
      <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em] block mb-2">
        Family (optional)
      </label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 py-1.5 px-2.5 bg-surface border border-bdr rounded-sm cursor-pointer w-fit"
      >
        {current && (
          <FamilyIcon shape={current.shape} size={24} color="var(--cyan)" />
        )}
        <span className="text-[13px] text-tx">{current?.name ?? "None"}</span>
        <IconChevD size={12} className="text-tx3" />
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Choose a family"
        anchorRef={triggerRef}
      >
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
            className={clsx(
              "pt-2 px-3.5 pb-1.5 rounded-sm border cursor-pointer text-[13px] font-display font-medium",
              !value
                ? "border-cyan bg-cyan/10 text-cyan"
                : "border-bdr bg-surface text-tx2",
            )}
          >
            None
          </button>
          {families.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                onChange(f.id)
                setOpen(false)
              }}
              className={clsx(
                "pt-2 px-3.5 pb-1.5 rounded-sm border cursor-pointer text-[13px] font-display font-medium flex flex-col items-center gap-0.5",
                value === f.id
                  ? "border-cyan bg-cyan/10 text-cyan"
                  : "border-bdr bg-surface text-tx2",
              )}
            >
              <FamilyIcon shape={f.shape} size={24} />
              {f.name}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
