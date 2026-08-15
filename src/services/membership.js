import { supabase } from "@/lib/supabaseClient"

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
  if (error) throw error
  return data
}

export async function fetchMembership(userId) {
  const { data, error } = await supabase.from("memberships").select("user_id, granted_at").eq("user_id", userId).maybeSingle()
  if (error) throw error
  return data
}
