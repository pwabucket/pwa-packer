import { Navigate, Outlet } from "react-router";
import { usePassword } from "../hooks/usePassword";

const ProtectedRoutes = () => {
  const isAuthenticated = usePassword() !== null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export { ProtectedRoutes };
