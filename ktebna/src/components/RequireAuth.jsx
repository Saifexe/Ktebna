import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../auth/AuthProvider";
import Spinner from "../ui/Spinner";

// Route guard for account-only pages; sends visitors to /login and back again.
const RequireAuth = () => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <Spinner className="py-24" />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
};

export default RequireAuth;
