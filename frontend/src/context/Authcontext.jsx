import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import api from "../api";
import { setToken, setRefreshToken, getRefreshToken } from "../util";
import { Navigate, useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 🔥 important
  const navigate = useNavigate();

  const login = ({ accessToken, refreshToken, user }) => {
    setAccessToken(accessToken);
    setUser(user);
    setToken(accessToken);
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }
  };


  const logout = async () => {
    try {
      await api.post("/auth/logout"); 
    } catch (err) {
      console.log("Logout error:", err.message);
    }

    setAccessToken(null);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    navigate("/");
  };

  const logoutAll = async () => {
    try {
      await api.post("/auth/logout-all");
    } catch (err) {
      console.log("Logout all error:", err.message);
    }

    setAccessToken(null);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    navigate("/");
  };


  useEffect(() => {
    const restoreSession = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        let token = params.get("token");
        let rToken = params.get("refreshToken");

        if (token && rToken) {
          setToken(token);
          setRefreshToken(rToken);
          setAccessToken(token);
          // Remove token from query string
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // Normal refresh flow
          const localRefreshToken = getRefreshToken();
          // If no token at all, skip calling /auth/refresh to prevent useless 401 console logs
          if (!localRefreshToken) {
            setLoading(false);
            return;
          }

          const res = await api.post("/auth/refresh", { refreshToken: localRefreshToken }, {
            headers: { "x-refresh-token": localRefreshToken }
          });
          token = res.data.accessToken;
          setAccessToken(token);
          setToken(token);
        }

        const userRes = await api.get("/user/me");
        setUser(userRes.data.data);
      } catch (err) {
        // If it's a 401, it is expected when session is expired or not authenticated
        if (err.response?.status !== 401) {
          console.error("Session restoration failed:", err);
        }
        setToken(null);
        setRefreshToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        login,
        logout,
        logoutAll,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};