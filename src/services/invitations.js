import { supabase } from "@/lib/supabaseClient"

// Status is derived from timestamp columns rather than stored, matching the
// invitations table's own design (see its migration comment) - one less
// place for a status field to drift out of sync with the timestamps.
export function deriveInvitationStatus(inv) {
  if (inv.revoked_at) return "revoked"
  if (inv.redeemed_at) return "redeemed"
  if (new Date(inv.expires_at) <= new Date()) return "expired"
  return "active"
}

// Admin only - RLS ("invitations: admin manages") limits this to admins.
export async function fetchInvitations() {
  const { data, error } = await supabase
    .from("invitations")
    .select(
      "id, code, created_at, expires_at, redeemed_at, revoked_at, redeemed_by_profile:profiles!invitations_redeemed_by_fkey(display_name)",
    )
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

// Generation runs as SECURITY DEFINER (see create_invitation migration) -
// not a direct client insert, so the code's randomness/uniqueness-retry
// stays server-side rather than trusted from the browser.
export async function generateInvitation() {
  const { data, error } = await supabase.rpc("create_invitation")
  if (error) throw error
  return data
}

// Admins already have full RLS access to this table ("invitations: admin
// manages"), so revocation is a direct guarded update rather than another
// SECURITY DEFINER function - same precedent as resolveIngredientRequest.
export async function revokeInvitation(id) {
  const { data, error } = await supabase
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null)
    .is("redeemed_at", null)
    .select()
  if (error) throw error
  if (data.length === 0) {
    throw new Error("Couldn't revoke - it may already be redeemed or revoked.")
  }
  return data[0]
}
