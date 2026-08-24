// A parent type with children renders as its own bordered "family" cluster
// spanning the full grid width, instead of relying on card size alone to
// suggest the relationship - that read as too subtle once there were 10+
// cards in a row. `renderCard`/`renderEditForm`/`renderExpanded` come from
// the screen shell so the same per-type dispatch logic used for a
// standalone (non-clustered) type isn't duplicated here - this component
// only owns the cluster's box/layout.
export function FamilyCluster({
  parent,
  children,
  editingTypeId,
  renderCard,
  renderEditForm,
  renderExpanded,
}) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        border: "1px solid var(--border-s)",
        borderRadius: "var(--r-lg)",
        background: "rgba(255,255,255,0.02)",
        padding: "10px 10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--text3)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: "var(--font-display)",
        }}
      >
        {parent.name} family
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {editingTypeId !== parent.id && (
          <div style={{ width: 104 }}>{renderCard(parent, false)}</div>
        )}
        {children.map(
          (child) =>
            editingTypeId !== child.id && (
              <div key={child.id} style={{ width: 96 }}>
                {renderCard(child, true)}
              </div>
            ),
        )}
      </div>
      {[parent, ...children].map(
        (t) =>
          editingTypeId === t.id && (
            <div key={`edit-${t.id}`}>{renderEditForm(t)}</div>
          ),
      )}
      {[parent, ...children].map((t) => (
        <div key={`expanded-${t.id}`}>{renderExpanded(t)}</div>
      ))}
    </div>
  )
}
