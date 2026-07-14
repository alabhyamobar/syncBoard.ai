import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-white p-10">Loading...</div>;
  }

  if (!user) {
    if (window.location.pathname.startsWith("/accept-invite/")) {
      localStorage.setItem("redirect_after_login", window.location.pathname);
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;