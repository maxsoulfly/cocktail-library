import { useState } from "react"
import { useNavigate, useOutletContext, useParams } from "react-router-dom"
import { IconBookmark, IconHeart } from "@/components/icons"
import { TopBar } from "@/components/Nav"
import { ActionButtons } from "@/components/detail/ActionButtons"
import { HeroCard } from "@/components/detail/HeroCard"
import { IngredientsSection } from "@/components/detail/IngredientsSection"
import { StepsSection } from "@/components/detail/StepsSection"
import { Btn, ConfirmPanel } from "@/components/primitives"
import {
  deleteRecipe,
  publishRecipe,
  unpublishRecipe,
} from "@/services/recipes"

export default function DetailScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const {
    computed,
    unit,
    setUnit,
    favorites,
    wantToMake,
    toggleFav,
    toggleWtm,
    owned,
    userId,
    isAdmin,
    refetchRecipes,
  } = useOutletContext()
  const [showConfirmShare, setShowConfirmShare] = useState(false)
  const [showConfirmUnpublish, setShowConfirmUnpublish] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  const [actionError, setActionError] = useState(null)

  const c = computed.find((item) => item.id === id)

  if (!c) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text3)",
        }}
      >
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 16,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
          }}
        >
          Cocktail not found
        </p>
        <Btn variant="ghost" small onClick={() => navigate("/library")}>
          Back to library
        </Btn>
      </div>
    )
  }

  const isFav = favorites.has(c.id)
  const isWtm = wantToMake.has(c.id)
  const isOwner = c.ownerId === userId
  const canManage = isOwner || isAdmin
  // Spec §4: owners can edit their own recipe; admins are limited to the
  // classic catalog (owner_id null) - matches the DB-enforced rule in
  // supabase/migrations/20260815231800_tighten_recipe_edit_scope.sql.
  const canEdit = isOwner || (isAdmin && c.source === "classic")

  const handlePublish = async () => {
    setPublishing(true)
    setActionError(null)
    try {
      await publishRecipe(c.id)
      await refetchRecipes()
      setShowConfirmShare(false)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    setUnpublishing(true)
    setActionError(null)
    try {
      await unpublishRecipe(c.id)
      await refetchRecipes()
      setShowConfirmUnpublish(false)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setUnpublishing(false)
    }
  }

  return (
    <div
      style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <TopBar
        title={c.name}
        onBack={() => navigate(-1)}
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => toggleFav(c.id)}
              style={{
                background: isFav ? "rgba(251,113,133,0.15)" : "var(--surface)",
                border: `1px solid ${
                  isFav ? "var(--coral)" : "var(--border-s)"
                }`,
                borderRadius: "var(--r-sm)",
                width: 36,
                height: 36,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isFav ? "var(--coral)" : "var(--text2)",
              }}
            >
              <IconHeart size={16} />
            </button>
            <button
              onClick={() => toggleWtm(c.id)}
              style={{
                background: isWtm ? "rgba(167,139,250,0.15)" : "var(--surface)",
                border: `1px solid ${
                  isWtm ? "var(--violet)" : "var(--border-s)"
                }`,
                borderRadius: "var(--r-sm)",
                width: 36,
                height: 36,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isWtm ? "var(--violet)" : "var(--text2)",
              }}
            >
              <IconBookmark size={16} />
            </button>
          </div>
        }
      />

      <div
        style={{
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <HeroCard c={c} />

        <div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--text2)",
              lineHeight: 1.6,
            }}
          >
            {c.description}
          </p>
        </div>

        <IngredientsSection
          ings={c.ings}
          substitutions={c.substitutions}
          missingOptional={c.missingOptional}
          owned={owned}
          unit={unit}
          setUnit={setUnit}
        />

        <StepsSection steps={c.steps} />

        <ActionButtons
          c={c}
          isOwner={isOwner}
          canEdit={canEdit}
          canManage={canManage}
          onTogglePublish={() => setShowConfirmShare(!showConfirmShare)}
          onRequestDelete={() => setConfirmDelete(true)}
          onRequestUnpublish={() => setShowConfirmUnpublish(true)}
        />

        {showConfirmShare && (
          <ConfirmPanel
            borderTone="cyan"
            confirmVariant="primary"
            confirmLabel="Publish"
            message="Publishing makes this recipe visible to all Cocktail Library members. You can unpublish it later from your profile."
            error={actionError}
            busy={publishing}
            onConfirm={handlePublish}
            onCancel={() => setShowConfirmShare(false)}
          />
        )}
        {showConfirmUnpublish && (
          <ConfirmPanel
            borderTone="neutral"
            confirmVariant="danger"
            confirmLabel="Unpublish"
            message={
              isOwner
                ? "Make this recipe private again? Only you will be able to see it."
                : `Unpublish "${c.name}"? It returns to ${c.author ?? "the owner"}'s private list - their copy won't be deleted.`
            }
            error={actionError}
            busy={unpublishing}
            onConfirm={handleUnpublish}
            onCancel={() => setShowConfirmUnpublish(false)}
          />
        )}
        {confirmDelete && (
          <ConfirmPanel
            borderTone="coral"
            confirmVariant="danger"
            confirmLabel="Delete"
            message={`Delete "${c.name}"? This can't be undone.`}
            busy={deleting}
            onConfirm={async () => {
              setDeleting(true)
              await deleteRecipe(c.id)
              await refetchRecipes()
              navigate("/library")
            }}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </div>
    </div>
  )
}
