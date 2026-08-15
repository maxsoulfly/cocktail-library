import { useEffect, useMemo, useState } from "react"
import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { BottomNav, SideNav } from "@/components/Nav"
import { computeAvail } from "@/domain/availability"
import { useCatalog } from "@/hooks/useCatalog"
import { useInventory } from "@/hooks/useInventory"
import { useMembership } from "@/hooks/useMembership"
import { useRecipes } from "@/hooks/useRecipes"
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
// handed down via router Outlet context. As of step 6, everything here is
// real: catalog + inventory (step 5) feed a resolved "owned ingredient type
// ids" set (generic ownership OR an owned product mapped to that type), fed
// into the same computeAvail() used since the mock-data days - it only ever
// needed a Set<string> and a name resolver, so it didn't need to change.
// MyBarScreen/AddProductScreen fetch their own catalog/inventory copies
// rather than sharing these instances - mildly redundant network-wise, but
// avoids a shared cache/context layer that isn't needed at this app's scale.
// Favorites/Want to Make are still local-only mock state - Supabase in step 9.
function AppShell({ profile, session }) {
  const userId = session?.user?.id
  const [theme, setTheme] = useState("dark")
  const [unit, setUnit] = useState("ml")
  const [favorites, setFavorites] = useState(() => new Set())
  const [wantToMake, setWantToMake] = useState(() => new Set())

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light")
  }, [theme])

  const { types, products, loading: catalogLoading } = useCatalog()
  const { ownedTypeIds, ownedProductIds, loading: inventoryLoading } = useInventory(userId)
  const { recipes, loading: recipesLoading } = useRecipes()

  const ingredientTypesById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types])

  const resolvedOwned = useMemo(() => {
    const set = new Set(ownedTypeIds)
    products.forEach((p) => {
      if (ownedProductIds.has(p.id)) set.add(p.ingredient_type_id)
    })
    return set
  }, [ownedTypeIds, ownedProductIds, products])

  const computed = useMemo(
    () => recipes.map((r) => ({ ...r, ...computeAvail(r, resolvedOwned, (id) => ingredientTypesById.get(id)?.name ?? id) })),
    [recipes, resolvedOwned, ingredientTypesById],
  )

  const isAdmin = profile?.role === "admin"
  const isLoading = catalogLoading || inventoryLoading || recipesLoading

  const outletContext = {
    computed,
    owned: resolvedOwned,
    ingredientTypesById,
    favorites, toggleFav: toggleInSet(setFavorites),
    wantToMake, toggleWtm: toggleInSet(setWantToMake),
    unit, setUnit,
    theme, setTheme,
    isAdmin,
    profile,
    userId,
    email: session?.user?.email,
    signOut,
  }

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ display: "none" }} className="lg-sidebar">
        <SideNav isAdmin={isAdmin} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {isLoading ? <LoadingScreen /> : <Outlet context={outletContext} />}
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
