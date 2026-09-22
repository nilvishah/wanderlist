import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import Login from "./screens/Login";
import AppShell from "./components/AppShell";
import Home from "./screens/Home";
import Starred from "./screens/Starred";
import CategoryScreen from "./screens/CategoryScreen";
import PlaceScreen from "./screens/PlaceScreen";

function Splash() {
  return (
    <div className="min-h-dvh grid place-items-center">
      <p className="font-serif text-2xl text-muted">Wanderlist</p>
    </div>
  );
}

// Sends logged-out visitors to /login, remembering where they were headed
// (so widget deep links like /place/:id land on the right place after login).
function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/starred" element={<Starred />} />
        <Route path="/category/:id" element={<CategoryScreen />} />
        <Route path="/place/:id" element={<PlaceScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}