import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill in your Supabase project's URL and publishable key.",
  )
}

// Client-safe: the publishable key only works within whatever Row Level Security
// policies apply to the current session. Never import the secret key here.
export const supabase = createClient(url, publishableKey)
