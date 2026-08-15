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
import { updateProfile } from "@/services/membership"

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
// handed down via router Outlet context.
//
// catalog/inventory/recipes are each fetched exactly ONCE here and shared via
// context - screens must not call useCatalog()/useInventory()/useRecipes()
// themselves. They did originally (one call per screen), which meant e.g.
// toggling an ingredient in My Bar updated My Bar's own copy of inventory
// state instantly but left this component's separate copy (the one feeding
// the availability badges) stale until a full page reload recreated
// everything from scratch. Sharing one instance fixes that: an optimistic
// update anywhere is immediately visible everywhere, since it's the same
// React state.
//
// `computed` = real recipes run through the unchanged computeAvail(), using
// a resolved "owned ingredient type ids" set (generic ownership OR an owned
// product's mapped type). Favorites/Want to Make are still local-only mock
// state - Supabase in step 9.
function AppShell({ profile, session }) {
  const userId = session?.user?.id
  // profiles.theme_preference defaults to 'system' for new signups, but there's
  // no OS-preference detection implemented - treat anything but an explicit
  // 'light' as dark, so the More screen's toggle always has a coherent
  // selected state instead of showing neither button active.
  const [theme, setThemeState] = useState(() => (profile?.theme_preference === "light" ? "light" : "dark"))
  const [unit, setUnitState] = useState(() => profile?.unit_preference ?? "ml")
  const [favorites, setFavorites] = useState(() => new Set())
  const [wantToMake, setWantToMake] = useState(() => new Set())

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light")
  }, [theme])

  // Wrapped so every change is felt instantly (local state) and remembered
  // across sessions (persisted to profiles) - fire-and-forget, since a rare
  // failed preference save isn't worth interrupting the user over.
  const setTheme = (value) => {
    setThemeState(value)
    if (userId) updateProfile(userId, { theme_preference: value }).catch((err) => console.error("Failed to save theme preference:", err))
  }
  const setUnit = (value) => {
    setUnitState(value)
    if (userId) updateProfile(userId, { unit_preference: value }).catch((err) => console.error("Failed to save unit preference:", err))
  }

  const catalog = useCatalog()
  const inventory = useInventory(userId)
  const recipesQuery = useRecipes()
  const { recipes, loading: recipesLoading, refetch: refetchRecipes } = recipesQuery

  const ingredientTypesById = useMemo(() => new Map(catalog.types.map((t) => [t.id, t])), [catalog.types])

  const resolvedOwned = useMemo(() => {
    const set = new Set(inventory.ownedTypeIds)
    catalog.products.forEach((p) => {
      if (inventory.ownedProductIds.has(p.id)) set.add(p.ingredient_type_id)
    })
    return set
  }, [inventory.ownedTypeIds, inventory.ownedProductIds, catalog.products])

  const computed = useMemo(
    () => recipes.map((r) => ({ ...r, ...computeAvail(r, resolvedOwned, (id) => ingredientTypesById.get(id)?.name ?? id) })),
    [recipes, resolvedOwned, ingredientTypesById],
  )

  const isAdmin = profile?.role === "admin"
  const isLoading = catalog.loading || inventory.loading || recipesLoading

  const outletContext = {
    computed,
    refetchRecipes,
    owned: resolvedOwned,
    ingredientTypesById,
    catalog,
    inventory,
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
