import { useState } from "react"
import { useNavigate, useOutletContext, useParams } from "react-router-dom"
import { GlassSvg } from "@/components/GlassSvg"
import {
  IconBookmark,
  IconEdit,
  IconGlobe,
  IconHeart,
  IconLock,
  IconTrash,
} from "@/components/icons"
import { TopBar } from "@/components/Nav"
import {
  AvailBadge,
  Btn,
  Card,
  SectionTitle,
  SourceBadge,
  TasteTag,
} from "@/components/primitives"
import { formatAmount } from "@/domain/availability"
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "20px",
            background: "var(--surface)",
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--border-s)",
          }}
        >
          <GlassSvg
            type={c.glass}
            liquidColor={c.liquidColor}
            size={96}
            avail={c.avail}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "flex",
                gap: 6,
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <SourceBadge source={c.source} />
              {c.author && (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text3)",
                    lineHeight: 1.8,
                  }}
                >
                  by {c.author}
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {c.taste.map((t) => (
                <TasteTag key={t} label={t} />
              ))}
            </div>
          </div>
          <AvailBadge avail={c.avail} />
          {c.avail === "almost" && c.missingRequired[0] && (
            <div
              style={{
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: "var(--r-sm)",
                padding: "8px 14px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--almost)" }}>
                Missing: <strong>{c.missingRequired.join(", ")}</strong>
              </span>
            </div>
          )}
          {c.family && (
            <span
              style={{
                fontSize: 12,
                color: "var(--text3)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Family: {c.family}
            </span>
          )}
        </div>

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

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <SectionTitle>Ingredients</SectionTitle>
            <div
              style={{
                display: "flex",
                background: "var(--surface)",
                border: "1px solid var(--border-s)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {["ml", "oz"].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  style={{
                    padding: "4px 12px",
                    background: unit === u ? "var(--cyan)" : "none",
                    color: unit === u ? "#07091a" : "var(--text2)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    transition: "all 0.15s",
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          {["required", "optional", "garnish"].map((role) => {
            const ings = c.ings.filter((i) => i.role === role)
            if (!ings.length) return null
            return (
              <div key={role} style={{ marginBottom: 12 }}>
                {role !== "required" && (
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 6,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {role}
                  </div>
                )}
                {ings.map((ri) => {
                  const isOwned = owned.has(ri.ingId)
                  return (
                    <div
                      key={ri.ingId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 0",
                        borderBottom: "1px solid var(--border-s)",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: isOwned
                            ? "var(--green)"
                            : ri.role === "required"
                              ? "var(--coral)"
                              : "var(--text3)",
                          flexShrink: 0,
                          boxShadow: isOwned
                            ? "0 0 6px rgba(52,211,153,0.6)"
                            : undefined,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 14,
                          color: "var(--text)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {ri.name ?? ri.ingId}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: "var(--font-mono)",
                          color: "var(--text2)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatAmount(ri, unit)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
          {c.missingOptional.length > 0 && (
            <p
              style={{ margin: "8px 0 0", fontSize: 12, color: "var(--text3)" }}
            >
              Optional/garnish: {c.missingOptional.join(", ")} not in your bar —
              still makeable.
            </p>
          )}
        </div>

        <div>
          <SectionTitle>Preparation</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {c.steps.map((step, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "var(--surface3)",
                    border: "1px solid var(--border-s)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "var(--cyan)",
                    fontWeight: 600,
                  }}
                >
                  {i + 1}
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "var(--text)",
                    lineHeight: 1.55,
                  }}
                >
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {canEdit && (
          <Btn
            variant="ghost"
            full
            onClick={() => navigate(`/library/${c.id}/edit`)}
          >
            <IconEdit size={15} /> Edit Recipe
          </Btn>
        )}

        {c.source === "private" && isOwner && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowConfirmShare(!showConfirmShare)}
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
            <Btn variant="danger" onClick={() => setConfirmDelete(true)}>
              <IconTrash size={15} /> Delete
            </Btn>
          </div>
        )}

        {c.source === "community" && canManage && (
          <button
            onClick={() => setShowConfirmUnpublish(true)}
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

        {showConfirmShare && (
          <Card
            style={{ padding: 16, border: "1px solid rgba(34,211,238,0.25)" }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                color: "var(--text2)",
              }}
            >
              Publishing makes this recipe visible to all Cocktail Library
              members. You can unpublish it later from your profile.
            </p>
            {actionError && (
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 12,
                  color: "var(--coral)",
                }}
              >
                {actionError}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                variant="primary"
                small
                disabled={publishing}
                onClick={handlePublish}
              >
                Publish
              </Btn>
              <Btn
                variant="ghost"
                small
                onClick={() => setShowConfirmShare(false)}
              >
                Cancel
              </Btn>
            </div>
          </Card>
        )}
        {showConfirmUnpublish && (
          <Card style={{ padding: 16, border: "1px solid var(--border-s)" }}>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                color: "var(--text2)",
              }}
            >
              {isOwner
                ? "Make this recipe private again? Only you will be able to see it."
                : `Unpublish "${c.name}"? It returns to ${c.author ?? "the owner"}'s private list - their copy won't be deleted.`}
            </p>
            {actionError && (
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 12,
                  color: "var(--coral)",
                }}
              >
                {actionError}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                variant="danger"
                small
                disabled={unpublishing}
                onClick={handleUnpublish}
              >
                Unpublish
              </Btn>
              <Btn
                variant="ghost"
                small
                onClick={() => setShowConfirmUnpublish(false)}
              >
                Cancel
              </Btn>
            </div>
          </Card>
        )}
        {confirmDelete && (
          <Card
            style={{ padding: 16, border: "1px solid rgba(251,113,133,0.3)" }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                color: "var(--text2)",
              }}
            >
              Delete "{c.name}"? This can't be undone.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                variant="danger"
                small
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  await deleteRecipe(c.id)
                  await refetchRecipes()
                  navigate("/library")
                }}
              >
                Delete
              </Btn>
              <Btn
                variant="ghost"
                small
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
