import clsx from "clsx"
import { FamilyIcon } from "@/components/FamilyIcon"

export function FamilyPicker({ families, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em] block mb-2">
        Family (optional)
      </label>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onChange("")}
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
            onClick={() => onChange(f.id)}
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
    </div>
  )
}
