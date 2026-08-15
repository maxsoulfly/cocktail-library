import { useEffect, useMemo, useState } from "react"
import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { BottomNav, SideNav } from "@/components/Nav"
import { COCKTAILS, ING_MAP, INITIAL_OWNED } from "@/data/mockData"
import { computeAvail } from "@/domain/availability"
import { useMembership } from "@/hooks/useMembership"
import { useSupabaseSession } from "@/hooks/useSupabaseSession"
import AddProductScreen from "@/screens/AddProductScreen"
import AdminScreen from "@/screens/AdminScreen"
import DetailScreen from "@/screens/DetailScreen"
import EditorScreen from "@/screens/EditorScreen"
import HomeScreen from "@/screens/HomeScreen"
import JoinScreen from "@/screens/JoinScreen"
import LibraryScreen from "@/screens/LibraryScreen"
import ListsScreen from "@/screens/ListsScreen"
import MoreScreen from "@/screens/MoreScreen"
import MyBarScreen from "@/screens/MyBarScreen"
import SignInScreen from "@/screens/SignInScreen"
import WelcomeScreen from "@/screens/WelcomeScreen"
import { signOut } from "@/services/auth"

function toggleInSet(setter) {
  return (id) =>
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)", fontFamily: "var(--font-display)", fontSize: 14 }}>
      Loading...
    </div>
  )
}

// Wraps every authenticated screen: side/bottom nav plus the shared app state
// handed down via router Outlet context. profile/isAdmin/userId are real
// (step 4); My Bar is real too as of step 5 (see src/hooks/useCatalog.js and
// useInventory.js, used directly by MyBarScreen/AddProductScreen rather than
// through this context). `owned` below is a SEPARATE, still-mock Set used
// only by the still-mock COCKTAILS recipe demo on Home/Library/Detail - it
// is unrelated to the real user_inventory system and gets replaced once
// step 6 wires up real recipes against real ingredient_type ids.
// Favorites/Want to Make are still mock too - Supabase in step 9.
function AppShell({ profile, session }) {
  const [theme, setTheme] = useState("dark")
  const [unit, setUnit] = useState("ml")
  const [owned, setOwned] = useState(() => new Set(INITIAL_OWNED))
  const [favorites, setFavorites] = useState(() => new Set(["negroni", "daiquiri", "manhattan"]))
  const [wantToMake, setWantToMake] = useState(() => new Set(["mojito", "dirty-martini"]))

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light")
  }, [theme])

  const computed = useMemo(
    () => COCKTAILS.map((c) => ({ ...c, ...computeAvail(c, owned, (id) => ING_MAP[id]?.name ?? id) })),
    [owned],
  )

  const isAdmin = profile?.role === "admin"

  const outletContext = {
    computed,
    owned, toggleOwned: toggleInSet(setOwned),
    favorites, toggleFav: toggleInSet(setFavorites),
    wantToMake, toggleWtm: toggleInSet(setWantToMake),
    unit, setUnit,
    theme, setTheme,
    isAdmin,
    profile,
    userId: session?.user?.id,
    email: session?.user?.email,
    signOut,
  }

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ display: "none" }} className="lg-sidebar">
        <SideNav isAdmin={isAdmin} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <Outlet context={outletContext} />
      </div>
      <BottomNav />
      <style>{`
        @media (min-width: 1280px) {
          .lg-sidebar { display: flex !important; }
          body { overflow: hidden; }
        }
        @media (min-width: 768px) {
          .cocktail-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (min-width: 1280px) {
          .cocktail-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const { loading: authLoading, session } = useSupabaseSession()
  const userId = session?.user?.id
  const { loading: memberLoading, isMember, profile, refetch } = useMembership(userId)

  if (authLoading) return <LoadingScreen />

  if (!session) {
    return (
      <Routes>
        <Route path="/signin" element={<SignInScreen />} />
        <Route path="*" element={<WelcomeScreen />} />
      </Routes>
    )
  }

  if (memberLoading) return <LoadingScreen />

  if (!isMember) {
    return <JoinScreen onRedeemed={refetch} />
  }

  return (
    <Routes>
      <Route element={<AppShell profile={profile} session={session} />}>
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/library" element={<LibraryScreen />} />
        <Route path="/library/new" element={<EditorScreen />} />
        <Route path="/library/:id" element={<DetailScreen />} />
        <Route path="/bar" element={<MyBarScreen />} />
        <Route path="/bar/add" element={<AddProductScreen />} />
        <Route path="/lists" element={<ListsScreen />} />
        <Route path="/more" element={<MoreScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
