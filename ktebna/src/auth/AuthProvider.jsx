import { createContext, useEffect, useState } from "react";
import apiClient from "../apiClient";

const AuthContext = createContext();

const TOKEN_KEY = "ktebna_token";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.get("/api/auth/me");
      setUser(data); // { id, name, email, profilePicture }
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const register = async ({ name, email, password }) => {
    const { data } = await apiClient.post("/api/auth/register", {
      name,
      email,
      password,
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async ({ email, password }) => {
    const { data } = await apiClient.post("/api/auth/login", {
      email,
      password,
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const refreshUser = () => loadCurrentUser();

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
