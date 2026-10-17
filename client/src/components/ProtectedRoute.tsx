import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/auth-context";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading…</p>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}