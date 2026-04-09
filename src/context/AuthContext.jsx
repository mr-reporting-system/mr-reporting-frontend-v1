import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem("token");
    const savedRole = sessionStorage.getItem("role");

    if (savedToken) setToken(savedToken);
    if (savedRole) setUser({ role: savedRole });
  }, []);

  const login = (userData, jwtToken) => {
    const role =
      typeof userData === "string"
        ? userData
        : userData?.role || userData?.userRole || null;

    setToken(jwtToken || null);
    if (jwtToken) {
      sessionStorage.setItem("token", jwtToken);
    } else {
      sessionStorage.removeItem("token");
    }

    if (role) {
      const normalizedUser =
        typeof userData === "object" && userData !== null ? userData : { role };
      setUser(normalizedUser);
      sessionStorage.setItem("role", role);
    } else {
      setUser(null);
      sessionStorage.removeItem("role");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");

    // Optional cleanup of old keys
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("mr_token");
    sessionStorage.removeItem("mr_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
