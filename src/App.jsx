import { useEffect, useMemo, useState } from "react"
import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { BottomNav, SideNav } from "@/components/Nav"
import { COCKTAILS, ING_MAP, INITIAL_OWNED } from "@/data/mockData"
import { computeAvail } from "@/domain/availability"
import AddProductScreen from "@/screens/AddProductScreen"
import AdminScreen from "@/screens/AdminScreen"
import DetailScreen from "@/screens/DetailScreen"
import EditorScreen from "@/screens/EditorScreen"
import HomeScreen from "@/screens/HomeScreen"
import LibraryScreen from "@/screens/LibraryScreen"
import ListsScreen from "@/screens/ListsScreen"
import MoreScreen from "@/screens/MoreScreen"
import MyBarScreen from "@/screens/MyBarScreen"
import SignInScreen from "@/screens/SignInScreen"
import WelcomeScreen from "@/screens/WelcomeScreen"

function toggleInSet(setter) {
  return (id) =>
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
}

// Wraps every authenticated screen: side/bottom nav plus the shared app state
// (inventory, lists, unit/theme prefs) handed down via router Outlet context.
// Real auth/roles land in Phase 1 — isAdmin is a mock true until then.
function AppShell() {
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

  const isAdmin = true

  const outletContext = {
    computed,
    owned, toggleOwned: toggleInSet(setOwned),
    favorites, toggleFav: toggleInSet(setFavorites),
    wantToMake, toggleWtm: toggleInSet(setWantToMake),
    unit, setUnit,
    theme, setTheme,
    isAdmin,
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
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/signin" element={<SignInScreen />} />
      <Route element={<AppShell />}>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
