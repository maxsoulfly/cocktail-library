import { IconPlus, IconX } from "@/components/icons"

export function StepsEditor({ steps, onAdd, onRemove, onUpdate }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-xs font-bold text-tx2 font-display uppercase tracking-[0.06em]">
          Preparation Steps
        </label>
        <button
          onClick={onAdd}
          className="bg-transparent border-none cursor-pointer text-cyan text-[13px] font-display font-semibold flex items-center gap-1"
        >
          <IconPlus size={14} /> Add
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="w-5.5 h-5.5 rounded-full bg-surface3 flex items-center justify-center text-[11px] font-mono text-cyan shrink-0 mt-2">
              {i + 1}
            </span>
            <textarea
              value={step}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder={`Step ${i + 1}`}
              rows={2}
              className="flex-1 bg-surface border border-bdr rounded-sm py-2 px-3 text-tx text-[13px] font-body resize-y"
            />
            {steps.length > 1 && (
              <button
                onClick={() => onRemove(i)}
                aria-label={`Remove step ${i + 1}`}
                className="bg-transparent border-none cursor-pointer text-tx3 py-2 px-1"
              >
                <IconX size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
