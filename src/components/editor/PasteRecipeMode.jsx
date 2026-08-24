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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
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
        style={{
          background: "var(--surface2)",
          border: "1px solid var(--border-s)",
          borderRadius: "var(--r-sm)",
          padding: "14px",
          color: "var(--text2)",
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          lineHeight: 1.6,
          resize: "vertical",
          width: "100%",
        }}
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
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-s)",
          borderRadius: "var(--r-sm)",
          padding: "12px 14px",
          color: "var(--text)",
          fontSize: 13,
          fontFamily: "var(--font-mono)",
          resize: "vertical",
          width: "100%",
        }}
      />
      {pasteError && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
          {pasteError}
        </p>
      )}
      <Btn variant="primary" full disabled={!pasteJson.trim()} onClick={onFill}>
        Fill Form
      </Btn>
    </div>
  )
}
