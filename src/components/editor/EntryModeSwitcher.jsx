import clsx from "clsx"

const MODES = [
  { id: "scratch", label: "Start from Scratch" },
  { id: "paste", label: "Paste a Recipe (AI)" },
]

export function EntryModeSwitcher({ mode, onModeChange }) {
  return (
    <div className="flex bg-surface border border-bdr rounded-sm overflow-hidden">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          className={clsx(
            "flex-1 p-2.5 border-none cursor-pointer font-display text-[13px] transition-all duration-150",
            mode === m.id
              ? "bg-violet/12 text-violet font-bold"
              : "text-tx2 font-normal",
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
