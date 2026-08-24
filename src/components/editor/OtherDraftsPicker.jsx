import { Btn } from "@/components/primitives"

export function OtherDraftsPicker({
  drafts,
  maxDrafts,
  onContinue,
  onDiscard,
}) {
  return (
    <div className="flex flex-col gap-2 bg-cyan/8 border border-cyan/25 rounded-sm py-2.5 px-3.5">
      <span className="text-xs text-tx2">
        You have {drafts.length} unsaved draft{drafts.length === 1 ? "" : "s"}{" "}
        on this browser (max {maxDrafts}) - continue one, or just start typing
        below for a new one.
      </span>
      {drafts.map((d) => (
        <div key={d.id} className="flex items-center gap-2">
          <span className="flex-1 text-[13px] text-tx overflow-hidden text-ellipsis whitespace-nowrap">
            {d.name}
          </span>
          <Btn variant="primary" small onClick={() => onContinue(d.id)}>
            Continue
          </Btn>
          <Btn variant="ghost" small onClick={() => onDiscard(d.id)}>
            Discard
          </Btn>
        </div>
      ))}
    </div>
  )
}
