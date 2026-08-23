import { supabase } from "@/lib/supabaseClient"

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  if (error) throw error
  return data
}

export async function fetchMembership(userId) {
  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, granted_at, revoked_at")
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw error
  return data
}

// Only display_name/unit_preference/theme_preference are grantable to
// authenticated (see the profiles migration) - role and everything else is
// deliberately not updatable through this path.
export async function updateProfile(userId, updates) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
  if (error) throw error
}

// Admin User Management (Admin tab): profiles and memberships don't
// reference each other via FK (both independently reference auth.users), so
// there's no PostgREST embed to lean on - two admin-readable queries merged
// client-side instead of adding a new FK just to enable an embed.
export async function fetchAllUsers() {
  const [profilesResult, membershipsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, role, created_at")
      .order("created_at"),
    supabase.from("memberships").select("user_id, granted_at, revoked_at"),
  ])
  if (profilesResult.error) throw profilesResult.error
  if (membershipsResult.error) throw membershipsResult.error
  const membershipByUserId = new Map(
    membershipsResult.data.map((m) => [m.user_id, m]),
  )
  return profilesResult.data.map((p) => ({
    ...p,
    membership: membershipByUserId.get(p.id) ?? null,
  }))
}

// Both run through admin-gated SECURITY DEFINER functions, not a direct
// table write - see 20260823100000_admin_user_management.sql for why (a
// direct client grant on profiles.role would ride through the existing
// "update own" RLS policy and let anyone self-promote).
export async function setUserRole(targetUserId, newRole) {
  const { data, error } = await supabase.rpc("admin_set_user_role", {
    target_user_id: targetUserId,
    new_role: newRole,
  })
  if (error) throw error
  return data
}

export async function setMembershipRevoked(targetUserId, revoked) {
  const { data, error } = await supabase.rpc("admin_set_membership_revoked", {
    target_user_id: targetUserId,
    revoked,
  })
  if (error) throw error
  return data
}
