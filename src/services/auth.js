import { supabase } from "@/lib/supabaseClient"

const PENDING_INVITE_CODE_KEY = "cocktailLibrary.pendingInviteCode"

// Carries an invite code across a full-page redirect (Google OAuth, email
// confirmation) since in-memory/router state doesn't survive that.
export function storePendingInviteCode(code) {
  sessionStorage.setItem(PENDING_INVITE_CODE_KEY, code)
}

export function takePendingInviteCode() {
  const code = sessionStorage.getItem(PENDING_INVITE_CODE_KEY)
  sessionStorage.removeItem(PENDING_INVITE_CODE_KEY)
  return code
}

export function clearPendingInviteCode() {
  sessionStorage.removeItem(PENDING_INVITE_CODE_KEY)
}

// displayName becomes raw_user_meta_data.full_name, which handle_new_user()
// (the auth.users -> profiles trigger) prefers over its bare "New Member"
// fallback - collecting it here is what keeps a fresh signup's profile from
// ever defaulting to their email address as a public display name.
export async function signUpWithEmail(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: displayName } },
  })
  if (error) throw error
  return data
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signInWithGoogle(redirectTo) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  })
  if (error) throw error
}

export async function sendPasswordReset(email, redirectTo) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
  if (error) throw error
}

export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Maps to the redeem_invitation(invitation_code text) SECURITY DEFINER
// function - the only way a memberships row is ever created.
export async function redeemInvitation(code) {
  const { error } = await supabase.rpc("redeem_invitation", {
    invitation_code: code,
  })
  if (error) throw error
}
