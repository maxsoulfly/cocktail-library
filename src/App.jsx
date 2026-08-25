import { useEffect, useMemo, useState } from "react"
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useOutletContext,
} from "react-router-dom"
import { BottomNav, SideNav } from "@/components/Nav"
import {
  computeAvail,
  resolveOwnedIngredientTypes,
} from "@/domain/availability"
import { useCatalog } from "@/hooks/useCatalog"
import { useInventory } from "@/hooks/useInventory"
import { useLists } from "@/hooks/useLists"
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
import RequestIngredientScreen from "@/screens/RequestIngredientScreen"
import SignInScreen from "@/screens/SignInScreen"
import WelcomeScreen from "@/screens/WelcomeScreen"
import { signOut } from "@/services/auth"
import { updateProfile } from "@/services/membership"

// The /admin route itself had no gate at all - isAdmin only ever hid the
// SideNav link, so any authenticated member could reach the Admin screen
// directly by URL. RLS already default-denies the actual reads/writes
// underneath, but the screen shouldn't be reachable at all - a wrapper
// rather than a check inside AdminScreen itself, since AdminScreen calls
// dozens of hooks unconditionally and an early return before them would
// violate the rules of hooks.
//
// Renamed from RequireAdmin: a moderator can also reach /admin now (a
// scoped-down view of it - see AdminScreen.jsx's tab filtering), so this
// gate checks isStaff (admin OR moderator). Finer-grained admin-only
// actions inside stay gated by isAdmin specifically.
function RequireStaff({ children }) {
  const { isStaff } = useOutletContext()
  return isStaff ? children : <Navigate to="/home" replace />
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center text-tx2 font-display text-sm">
      Loading...
    </div>
  )
}

// A blocked member has a real memberships row (revoked_at set), unlike
// someone who's never joined at all - showing JoinScreen's "enter an invite
// code" form here would be actively misleading, since redeem_invitation()
// rejects a user who already has a membership row regardless of revoked
// status. This is a distinct, deliberately blunt dead end instead.
function RevokedScreen() {
  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-display font-bold text-lg text-tx">
        Your access has been revoked
      </p>
      <p className="text-tx2 text-sm">
        Contact an administrator if you think this is a mistake.
      </p>
      <button
        onClick={() => signOut()}
        className="mt-2 bg-transparent border border-bdr rounded-sm py-2 px-4 cursor-pointer text-tx2 text-[13px] font-display"
      >
        Sign Out
      </button>
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
// `computed` = real recipes run through computeAvail(), fed a resolved
// "owned ingredient type ids" set from resolveOwnedIngredientTypes() (src/
// domain/availability.js) - generic ownership, owned products' mapped
// types, and parent/child hierarchy, all expanded once up front so
// computeAvail() itself only ever needs a plain Set membership check.
// Favorites/Want to Make are real too as of step 9 (src/hooks/useLists.js),
// same optimistic-update + "call once, share via context" discipline as
// catalog/inventory/recipes above.
function AppShell({ profile, session }) {
  const userId = session?.user?.id
  // profiles.theme_preference defaults to 'system' for new signups, but there's
  // no OS-preference detection implemented - treat anything but an explicit
  // 'light' as dark, so the More screen's toggle always has a coherent
  // selected state instead of showing neither button active.
  const [theme, setThemeState] = useState(() =>
    profile?.theme_preference === "light" ? "light" : "dark",
  )
  const [unit, setUnitState] = useState(() => profile?.unit_preference ?? "ml")

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light")
  }, [theme])

  // Wrapped so every change is felt instantly (local state) and remembered
  // across sessions (persisted to profiles) - fire-and-forget, since a rare
  // failed preference save isn't worth interrupting the user over.
  const setTheme = (value) => {
    setThemeState(value)
    if (userId)
      updateProfile(userId, { theme_preference: value }).catch((err) =>
        console.error("Failed to save theme preference:", err),
      )
  }
  const setUnit = (value) => {
    setUnitState(value)
    if (userId)
      updateProfile(userId, { unit_preference: value }).catch((err) =>
        console.error("Failed to save unit preference:", err),
      )
  }

  const catalog = useCatalog()
  const inventory = useInventory(userId)
  const lists = useLists(userId)
  const recipesQuery = useRecipes()
  const {
    recipes,
    loading: recipesLoading,
    refetch: refetchRecipes,
  } = recipesQuery

  const ingredientTypesById = useMemo(
    () => new Map(catalog.types.map((t) => [t.id, t])),
    [catalog.types],
  )

  const resolvedOwned = useMemo(
    () =>
      resolveOwnedIngredientTypes({
        ownedTypeIds: inventory.ownedTypeIds,
        ownedProductIds: inventory.ownedProductIds,
        products: catalog.products,
        ingredientTypes: catalog.types,
      }),
    [
      inventory.ownedTypeIds,
      inventory.ownedProductIds,
      catalog.products,
      catalog.types,
    ],
  )

  const computed = useMemo(
    () =>
      recipes.map((r) => ({
        ...r,
        ...computeAvail(
          r,
          resolvedOwned,
          (id) => ingredientTypesById.get(id)?.name ?? id,
        ),
      })),
    [recipes, resolvedOwned, ingredientTypesById],
  )

  const isAdmin = profile?.role === "admin"
  const isModerator = profile?.role === "moderator"
  const isStaff = isAdmin || isModerator
  const isLoading =
    catalog.loading || inventory.loading || recipesLoading || lists.loading

  const outletContext = {
    computed,
    refetchRecipes,
    owned: resolvedOwned,
    ingredientTypesById,
    catalog,
    inventory,
    favorites: lists.favoriteIds,
    toggleFav: lists.toggleFavorite,
    wantToMake: lists.wantToMakeIds,
    toggleWtm: lists.toggleWantToMake,
    unit,
    setUnit,
    theme,
    setTheme,
    isAdmin,
    isModerator,
    isStaff,
    profile,
    userId,
    email: session?.user?.email,
    signOut,
  }

  return (
    <div className="flex h-dvh bg-bg">
      {/* height (not minHeight) is required here: a flex row with only
          minHeight has no definite height, so the overflowY:auto child below
          can never establish a bounded box to scroll within - it just grows
          to fit its content instead, and nothing ever scrolls. */}
      <div className="hidden xl:flex">
        <SideNav isStaff={isStaff} />
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading ? <LoadingScreen /> : <Outlet context={outletContext} />}
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const { loading: authLoading, session } = useSupabaseSession()
  const userId = session?.user?.id
  const {
    loading: memberLoading,
    isMember,
    isRevoked,
    profile,
    refetch,
  } = useMembership(userId)

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

  if (isRevoked) {
    return <RevokedScreen />
  }

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
        <Route path="/library/:id/edit" element={<EditorScreen />} />
        <Route path="/bar" element={<MyBarScreen />} />
        <Route path="/bar/add" element={<AddProductScreen />} />
        <Route
          path="/request-ingredient"
          element={<RequestIngredientScreen />}
        />
        <Route path="/lists" element={<ListsScreen />} />
        <Route path="/more" element={<MoreScreen />} />
        <Route
          path="/admin"
          element={
            <RequireStaff>
              <AdminScreen />
            </RequireStaff>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
