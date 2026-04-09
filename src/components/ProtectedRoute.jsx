import { Navigate, Outlet } from "react-router-dom";

function getFallbackRouteForRole(role) {
  if (role === "MANAGER") {
    return "/manager";
  }
  if (role === "MR") {
    return "/mr";
  }
  return "/";
}

export default function ProtectedRoute({ allowedRoles }) {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getFallbackRouteForRole(role)} replace />;
  }

  return <Outlet />;
}
