import React, {
    createContext,
    useContext,
    useState,
    useEffect,
  } from "react";
  import api from "../api/axios.js";
  import { setToken } from "../util/tokenManager.js";
  
  const AuthContext = createContext();
  
  export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // 🔥 important
  

    const login = ({ accessToken, user }) => {
      setAccessToken(accessToken);
      setUser(user);
      setToken(accessToken); 
    };
  

    const logout = async () => {
      try {
        await api.post("/auth/logout"); // optional (revoke session)
      } catch (err) {
        console.log("Logout error:", err.message);
      }
  
      setAccessToken(null);
      setUser(null);
      setToken(null);
    };
  

    useEffect(() => {
      const restoreSession = async () => {
        try {
          const res = await api.post("/auth/refresh");
          const newAccessToken = res.data.accessToken;
          setAccessToken(newAccessToken);
          setToken(newAccessToken);
          const userRes = await api.get("/user/me");
          setUser(userRes.data.user);
  
        } catch (err) {
          console.log("No active session");
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
          loading,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  };
  
  export const useAuth = () => useContext(AuthContext);