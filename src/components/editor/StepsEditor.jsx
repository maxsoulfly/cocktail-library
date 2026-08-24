import { IconPlus, IconX } from "@/components/icons"

export function StepsEditor({ steps, onAdd, onRemove, onUpdate }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text2)",
            fontFamily: "var(--font-display)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Preparation Steps
        </label>
        <button
          onClick={onAdd}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--cyan)",
            fontSize: 13,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <IconPlus size={14} /> Add
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--surface3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--cyan)",
                flexShrink: 0,
                marginTop: 8,
              }}
            >
              {i + 1}
            </span>
            <textarea
              value={step}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder={`Step ${i + 1}`}
              rows={2}
              style={{
                flex: 1,
                background: "var(--surface)",
                border: "1px solid var(--border-s)",
                borderRadius: "var(--r-sm)",
                padding: "8px 12px",
                color: "var(--text)",
                fontSize: 13,
                fontFamily: "var(--font-body)",
                resize: "vertical",
              }}
            />
            {steps.length > 1 && (
              <button
                onClick={() => onRemove(i)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text3)",
                  padding: "8px 4px",
                }}
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
