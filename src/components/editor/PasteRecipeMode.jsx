import { IconCheck, IconCopy } from "@/components/icons"
import { Btn } from "@/components/primitives"

export function PasteRecipeMode({
  prompt,
  promptCopied,
  onCopyPrompt,
  pasteJson,
  onPasteJsonChange,
  pasteError,
  onFill,
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-tx2">
        Copy this prompt into an AI chat along with the recipe you want to add
        (a link, a screenshot description, whatever you have), then paste its
        JSON output below to fill in the form. You'll still review and save it
        yourself - nothing is added until you hit Save.
      </p>
      <textarea
        readOnly
        value={prompt}
        rows={12}
        onFocus={(e) => e.target.select()}
        className="bg-surface2 border border-bdr rounded-sm p-3.5 text-tx2 text-xs font-mono leading-[1.6] resize-y w-full"
      />
      <Btn variant="ghost" small onClick={onCopyPrompt}>
        {promptCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}{" "}
        {promptCopied ? "Copied" : "Copy Prompt"}
      </Btn>
      <textarea
        value={pasteJson}
        onChange={(e) => onPasteJsonChange(e.target.value)}
        placeholder="Paste the AI's JSON output here..."
        rows={8}
        className="bg-surface border border-bdr rounded-sm py-3 px-3.5 text-tx text-[13px] font-mono resize-y w-full"
      />
      {pasteError && <p className="text-xs text-coral">{pasteError}</p>}
      <Btn variant="primary" full disabled={!pasteJson.trim()} onClick={onFill}>
        Fill Form
      </Btn>
    </div>
  )
}
