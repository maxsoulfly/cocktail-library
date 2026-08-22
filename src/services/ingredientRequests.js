import { supabase } from "@/lib/supabaseClient"

export async function createIngredientRequest({ name, note }) {
  const { error } = await supabase
    .from("ingredient_requests")
    .insert({ name, note: note || null })
  if (error) throw error
}

export async function fetchMyIngredientRequests(userId) {
  const { data, error } = await supabase
    .from("ingredient_requests")
    .select("id, name, note, status, admin_note, created_at")
    .eq("requested_by", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

// Admin only - RLS otherwise limits rows to the caller's own requests.
export async function fetchPendingIngredientRequests() {
  const { data, error } = await supabase
    .from("ingredient_requests")
    .select(
      "id, name, note, status, created_at, requester:profiles(display_name)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })
  if (error) throw error
  return data
}

// Own-while-pending only, per the "ingredient_requests: owner deletes while
// pending" RLS policy - once an admin has resolved a request, the record
// belongs to their review history and this will correctly fail.
export async function deleteMyIngredientRequest(id) {
  const { error } = await supabase
    .from("ingredient_requests")
    .delete()
    .eq("id", id)
  if (error) throw error
}

export async function resolveIngredientRequest(id, status, adminNote) {
  const { error } = await supabase
    .from("ingredient_requests")
    .update({
      status,
      admin_note: adminNote || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw error
}
