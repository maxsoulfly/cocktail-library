import { Btn } from "@/components/primitives"

export function DraftRestoreBanner({ draft, onRestore, onDiscard }) {
  return (
    <div className="flex items-center gap-2.5 bg-cyan/8 border border-cyan/25 rounded-sm py-2.5 px-3.5">
      <span className="flex-1 text-xs text-tx2">
        You have an unsaved draft, "{draft.name?.trim() || "Untitled draft"}" -
        saved on this browser only.
      </span>
      <Btn variant="primary" small onClick={onRestore}>
        Restore
      </Btn>
      <Btn variant="ghost" small onClick={onDiscard}>
        Discard
      </Btn>
    </div>
  )
}
