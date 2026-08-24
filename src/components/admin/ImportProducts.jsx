import { IconCheck, IconCopy } from "@/components/icons"
import { Btn, Card } from "@/components/primitives"

export function ImportProducts({
  productImportSuccessMessage,
  productBatchPhase,
  setProductBatchPhase,
  productImportPrompt,
  productPromptCopied,
  onCopyPrompt,
  productImportJson,
  setProductImportJson,
  onValidate,
  productImportResult,
  setProductImportResult,
  productImporting,
  onCommit,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {productImportSuccessMessage && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--green)" }}>
          {productImportSuccessMessage}
        </p>
      )}

      {productBatchPhase === "paste" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            Format with AI, then Paste JSON
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text2)" }}>
            Copy this prompt into an AI chat along with what branded or homemade
            products you want to add, then paste its JSON output below. The
            prompt is generated from the live ingredient types, so the AI can
            only map products onto things that actually exist.
          </p>
          <textarea
            readOnly
            value={productImportPrompt}
            rows={14}
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
            {productPromptCopied ? (
              <IconCheck size={14} />
            ) : (
              <IconCopy size={14} />
            )}{" "}
            {productPromptCopied ? "Copied" : "Copy Prompt"}
          </Btn>
          <textarea
            value={productImportJson}
            onChange={(e) => setProductImportJson(e.target.value)}
            placeholder="Paste your JSON here..."
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
          <Btn variant="primary" full onClick={onValidate}>
            Validate
          </Btn>
        </div>
      )}

      {productBatchPhase === "results" && productImportResult && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            Validation Results
          </h3>
          {productImportResult.parseError ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--coral)" }}>
              Couldn't parse that as a JSON array:{" "}
              {productImportResult.parseError}
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 8,
                }}
              >
                {[
                  {
                    label: "Ready to import",
                    val: productImportResult.validCount,
                    color: "var(--green)",
                  },
                  {
                    label: "Errors",
                    val: productImportResult.errorCount,
                    color: "var(--coral)",
                  },
                ].map(({ label, val, color }) => (
                  <Card
                    key={label}
                    style={{ padding: "12px", textAlign: "center" }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        color,
                        marginBottom: 2,
                      }}
                    >
                      {val}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>
                      {label}
                    </div>
                  </Card>
                ))}
              </div>
              <Card style={{ padding: "12px 14px" }}>
                {productImportResult.results.map((row, i, arr) => (
                  <div
                    key={row.index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom:
                        i < arr.length - 1
                          ? "1px solid var(--border-s)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        flexShrink: 0,
                        marginTop: 6,
                        background: row.valid ? "var(--green)" : "var(--coral)",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: "var(--text)" }}>
                        {row.name ?? `Row ${row.index + 1}`}
                      </span>
                      {!row.valid && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--coral)",
                            marginTop: 2,
                          }}
                        >
                          {row.errors.join("; ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
              {productImportResult.commitError && (
                <p style={{ margin: 0, fontSize: 12, color: "var(--coral)" }}>
                  {productImportResult.commitError}
                </p>
              )}
            </>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              variant="ghost"
              small
              onClick={() => {
                setProductBatchPhase("paste")
                setProductImportJson("")
                setProductImportResult(null)
              }}
            >
              Cancel
            </Btn>
            {!productImportResult.parseError && (
              <Btn
                variant="primary"
                full
                disabled={
                  productImporting || productImportResult.validCount === 0
                }
                onClick={onCommit}
              >
                {productImporting
                  ? "Importing..."
                  : `Import ${productImportResult.validCount} Product${
                      productImportResult.validCount === 1 ? "" : "s"
                    }`}
              </Btn>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
