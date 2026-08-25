import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function useSupabaseSession() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    session: null,
  })

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active)
          setState({ loading: false, error: null, session: data.session })
      })
      .catch((err) => {
        if (active)
          setState((prev) => ({ ...prev, loading: false, error: err.message }))
      })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) setState({ loading: false, error: null, session })
      },
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return state
}
