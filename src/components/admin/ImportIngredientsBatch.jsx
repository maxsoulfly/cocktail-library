import clsx from "clsx"
import { IconCheck, IconCopy } from "@/components/icons"
import { Btn, Card } from "@/components/primitives"

export function ImportIngredientsBatch({
  batchPhase,
  setBatchPhase,
  importPrompt,
  promptCopied,
  onCopyPrompt,
  importJson,
  setImportJson,
  onValidate,
  importResult,
  setImportResult,
  importing,
  onCommit,
}) {
  if (batchPhase === "paste") {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-[17px] font-bold text-tx">
          Format with AI, then Paste JSON
        </h3>
        <p className="text-[13px] text-tx2">
          Copy this prompt into an AI chat along with what you want to add (e.g.
          "Passionfruit Juice, Yuzu, Grapefruit"), then paste its JSON output
          below. The prompt is generated from the live catalog, so it always
          lists the current categories and types.
        </p>
        <textarea
          readOnly
          value={importPrompt}
          rows={14}
          onFocus={(e) => e.target.select()}
          className="bg-surface2 border border-bdr rounded-sm p-3.5 text-tx2 text-xs font-mono leading-[1.6] resize-y w-full"
        />
        <Btn variant="ghost" small onClick={onCopyPrompt}>
          {promptCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}{" "}
          {promptCopied ? "Copied" : "Copy Prompt"}
        </Btn>
        <textarea
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder="Paste your JSON here..."
          rows={8}
          className="bg-surface border border-bdr rounded-sm py-3 px-3.5 text-tx text-[13px] font-mono resize-y w-full"
        />
        <Btn variant="primary" full onClick={onValidate}>
          Validate
        </Btn>
      </div>
    )
  }

  if (batchPhase === "results" && importResult) {
    return (
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-[17px] font-bold text-tx">
          Validation Results
        </h3>
        {importResult.parseError ? (
          <p className="text-[13px] text-coral">
            Couldn't parse that as a JSON array: {importResult.parseError}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Ready to import",
                  val: importResult.validCount,
                  tone: "text-green",
                },
                {
                  label: "Errors",
                  val: importResult.errorCount,
                  tone: "text-coral",
                },
              ].map(({ label, val, tone }) => (
                <Card key={label} className="p-3 text-center">
                  <div
                    className={clsx(
                      "text-2xl font-display font-extrabold mb-0.5",
                      tone,
                    )}
                  >
                    {val}
                  </div>
                  <div className="text-[11px] text-tx2">{label}</div>
                </Card>
              ))}
            </div>
            <Card className="py-3 px-3.5">
              {importResult.results.map((row, i, arr) => (
                <div
                  key={row.index}
                  className={clsx(
                    "flex items-start gap-2.5 py-2",
                    i < arr.length - 1 && "border-b border-bdr",
                  )}
                >
                  <div
                    className={clsx(
                      "w-1.5 h-1.5 rounded-full shrink-0 mt-1.5",
                      row.valid ? "bg-green" : "bg-coral",
                    )}
                  />
                  <div className="flex-1">
                    <span className="text-[13px] text-tx">
                      {row.name ?? `Row ${row.index + 1}`}
                    </span>
                    {!row.valid && (
                      <div className="text-[11px] text-coral mt-0.5">
                        {row.errors.join("; ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </Card>
            {importResult.commitError && (
              <p className="text-xs text-coral">{importResult.commitError}</p>
            )}
          </>
        )}
        <div className="flex gap-2">
          <Btn
            variant="ghost"
            small
            onClick={() => {
              setBatchPhase("paste")
              setImportJson("")
              setImportResult(null)
            }}
          >
            Cancel
          </Btn>
          {!importResult.parseError && (
            <Btn
              variant="primary"
              full
              disabled={importing || importResult.validCount === 0}
              onClick={onCommit}
            >
              {importing
                ? "Importing..."
                : `Import ${importResult.validCount} Ingredient${
                    importResult.validCount === 1 ? "" : "s"
                  }`}
            </Btn>
          )}
        </div>
      </div>
    )
  }

  return null
}
