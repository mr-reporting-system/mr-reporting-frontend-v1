import { createContext, useState, useEffect } from "react";

// Create the context
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // When the app loads, check if we already have a token saved in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("mr_token");
    const savedUser = localStorage.getItem("mr_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Function to call when login is successful
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("mr_token", jwtToken);
    localStorage.setItem("mr_user", JSON.stringify(userData));
  };

  // Function to call when logging out
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("mr_token");
    localStorage.removeItem("mr_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}