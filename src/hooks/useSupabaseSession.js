import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function useSupabaseSession() {
  const [state, setState] = useState({ loading: true, session: null })

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ loading: false, session: data.session })
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) setState({ loading: false, session })
      },
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return state
}
