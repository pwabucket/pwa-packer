import { Navigate, Outlet, useLocation } from "react-router";
import { usePassword } from "../hooks/usePassword";

const ProtectedRoutes = () => {
  const isAuthenticated = usePassword() !== null;
  const location = useLocation();
  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
};

export { ProtectedRoutes };
