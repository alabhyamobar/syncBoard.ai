import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import api from "../api";
import { setToken } from "../util";
import { Navigate, useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 🔥 important
  const navigate = useNavigate();
  const login = ({ accessToken, user }) => {
    setAccessToken(accessToken);
    setUser(user);
    setToken(accessToken);
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
    navigate("/");
  };


  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.post("/auth/refresh");

        const newAccessToken = res.data.accessToken;

        setAccessToken(newAccessToken);
        setToken(newAccessToken);
        const userRes = await api.get("/user/me");
        console.log(userRes)
        console.log("USER RESPONSE:", userRes.data);
        setUser(userRes.data.data);
        console.log("BEFORE NAVIGATE");
        console.log("CURRENT USER:", userRes.data.data);
        console.log("AFTER NAVIGATE");
      } catch (err) {
        console.log("ERROR:", err);
        console.log("STATUS:", err.response?.status);
        console.log("DATA:", err.response?.data);
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