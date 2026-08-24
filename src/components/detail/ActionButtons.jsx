import { useNavigate } from "react-router-dom"
import {
  IconCopy,
  IconEdit,
  IconGlobe,
  IconLock,
  IconTrash,
} from "@/components/icons"
import { Btn } from "@/components/primitives"

export function ActionButtons({
  c,
  isOwner,
  canEdit,
  canManage,
  onTogglePublish,
  onRequestDelete,
  onRequestUnpublish,
}) {
  const navigate = useNavigate()

  return (
    <>
      {canEdit && (
        <Btn
          variant="ghost"
          full
          onClick={() => navigate(`/library/${c.id}/edit`)}
        >
          <IconEdit size={15} /> Edit Recipe
        </Btn>
      )}

      {/* Classics (and other people's community recipes) can't be edited
          directly - spec §4 says "no" to editing someone else's recipe by
          default, and only admins manage the classic catalog. Cloning
          gives any member their own private, fully editable copy instead,
          prefilled so they don't retype every ingredient/step from
          scratch - see EditorScreen.jsx's ?clone= handling. */}
      {!isOwner && (
        <Btn
          variant="ghost"
          full
          onClick={() => navigate(`/library/new?clone=${c.id}`)}
        >
          <IconCopy size={15} /> Clone as My Own Recipe
        </Btn>
      )}

      {c.source === "private" && isOwner && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onTogglePublish}
            style={{
              flex: 1,
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.25)",
              borderRadius: "var(--r)",
              padding: "10px 16px",
              cursor: "pointer",
              color: "var(--cyan)",
              fontSize: 14,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <IconGlobe size={15} /> Publish
          </button>
          <Btn variant="danger" onClick={onRequestDelete}>
            <IconTrash size={15} /> Delete
          </Btn>
        </div>
      )}

      {c.source === "community" && canManage && (
        <button
          onClick={onRequestUnpublish}
          style={{
            background: "var(--surface3)",
            border: "1px solid var(--border-s)",
            borderRadius: "var(--r)",
            padding: "10px 16px",
            cursor: "pointer",
            color: "var(--text2)",
            fontSize: 14,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <IconLock size={15} /> Unpublish
        </button>
      )}
    </>
  )
}
