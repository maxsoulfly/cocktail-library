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
        <div className="flex gap-2">
          <button
            onClick={onTogglePublish}
            className="flex-1 bg-cyan/10 border border-cyan/25 rounded py-2.5 px-4 cursor-pointer text-cyan text-sm font-display font-semibold flex items-center justify-center gap-1.5"
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
          className="bg-surface3 border border-bdr rounded py-2.5 px-4 cursor-pointer text-tx2 text-sm font-display font-semibold flex items-center justify-center gap-1.5"
        >
          <IconLock size={15} /> Unpublish
        </button>
      )}
    </>
  )
}
