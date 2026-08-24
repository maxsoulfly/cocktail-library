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
    <div className="col-span-full border border-bdr rounded-lg bg-white/2 pt-2.5 px-2.5 pb-3 flex flex-col gap-2">
      <div className="text-[10px] font-bold text-tx3 uppercase tracking-[0.06em] font-display">
        {parent.name} family
      </div>
      <div className="flex flex-wrap gap-2">
        {editingTypeId !== parent.id && (
          <div className="w-26">{renderCard(parent, false)}</div>
        )}
        {children.map(
          (child) =>
            editingTypeId !== child.id && (
              <div key={child.id} className="w-24">
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
