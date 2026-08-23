import { useEffect, useState } from "react"
import { fetchMembership, fetchProfile } from "@/services/membership"

export function useMembership(userId) {
  const [state, setState] = useState({
    loading: true,
    profile: null,
    isMember: false,
    isRevoked: false,
  })
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    if (!userId) {
      setState({
        loading: false,
        profile: null,
        isMember: false,
        isRevoked: false,
      })
      return
    }
    let active = true
    setState((prev) => ({ ...prev, loading: true }))
    Promise.all([fetchProfile(userId), fetchMembership(userId)])
      .then(([profile, membership]) => {
        if (active)
          setState({
            loading: false,
            profile,
            isMember: Boolean(membership) && !membership.revoked_at,
            isRevoked: Boolean(membership?.revoked_at),
          })
      })
      .catch(() => {
        if (active)
          setState({
            loading: false,
            profile: null,
            isMember: false,
            isRevoked: false,
          })
      })
    return () => {
      active = false
    }
  }, [userId, refreshToken])

  return { ...state, refetch: () => setRefreshToken((t) => t + 1) }
}
