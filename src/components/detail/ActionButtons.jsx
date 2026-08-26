import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconGlobe,
  IconLock,
  IconTrash,
} from "@/components/icons"
import { Btn } from "@/components/primitives"
import { buildRecipeShareText } from "./recipeShareText"

export function ActionButtons({
  c,
  unit,
  isOwner,
  canEdit,
  canManage,
  onTogglePublish,
  onRequestDelete,
  onRequestUnpublish,
}) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const handleCopyRecipe = () => {
    navigator.clipboard.writeText(buildRecipeShareText(c, unit)).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/share/${c.id}`
    navigator.clipboard.writeText(url).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <>
      {/* Available on every recipe regardless of ownership - unlike Edit/
          Clone/Publish, copying a plain-text version to paste into a
          message or social post isn't an ownership-gated action. */}
      <Btn variant="ghost" full onClick={handleCopyRecipe}>
        {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
        {copied ? "Copied!" : "Copy Recipe"}
      </Btn>

      {/* Only classic/community recipes get a public link - matches
          get_shared_recipe()'s own "shared + active" filter exactly
          (20260826120000), so this button never offers a link that would
          actually come back empty for a private recipe. */}
      {c.source !== "private" && (
        <Btn variant="ghost" full onClick={handleCopyShareLink}>
          {linkCopied ? <IconCheck size={15} /> : <IconGlobe size={15} />}
          {linkCopied ? "Link copied!" : "Copy Public Link"}
        </Btn>
      )}

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
