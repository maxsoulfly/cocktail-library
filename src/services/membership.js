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
    .select("user_id, granted_at")
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
