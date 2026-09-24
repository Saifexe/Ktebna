import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import apiClient, { SESSION_EXPIRED_EVENT, TOKEN_KEY } from "../apiClient";

const AuthContext = createContext();

// Waits between retries of /me while the backend is unreachable.
const RETRY_MS = [2000, 5000, 10000, 30000];

const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const retry = useRef({ attempt: 0, timer: null });

  // Signed out, locally: forget the token and everything cached for this
  // account, so the next person on this browser never sees it.
  const endSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const loadCurrentUser = useCallback(async () => {
    clearTimeout(retry.current.timer);
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.get("/api/auth/me");
      retry.current.attempt = 0;
      setUser(data); // { id, name, email, profilePicture }
      setLoading(false);
    } catch (error) {
      if (error?.response?.status === 401) {
        // The backend rejected the token (expired, revoked or forged).
        endSession();
        setLoading(false);
        return;
      }
      // Backend restarting or network down: that says nothing about the
      // token, so keep it and try again instead of signing the user out.
      const wait = RETRY_MS[Math.min(retry.current.attempt, RETRY_MS.length - 1)];
      retry.current.attempt += 1;
      retry.current.timer = setTimeout(loadCurrentUser, wait);
    }
  }, [endSession]);

  useEffect(() => {
    loadCurrentUser();
    const timers = retry.current;
    return () => clearTimeout(timers.timer);
  }, [loadCurrentUser]);

  // Any request answered 401 with our token (see apiClient) ends the session
  // on screen too, instead of leaving a signed-in page whose calls all fail.
  useEffect(() => {
    const onExpired = () => {
      endSession();
      setLoading(false);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [endSession]);

  const startSession = (data) => {
    queryClient.clear();
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async ({ name, email, password }) => {
    const { data } = await apiClient.post("/api/auth/register", {
      name,
      email,
      password,
    });
    return startSession(data);
  };

  const login = async ({ email, password }) => {
    const { data } = await apiClient.post("/api/auth/login", {
      email,
      password,
    });
    return startSession(data);
  };

  const logout = async () => {
    endSession();
  };

  // Revokes this account's tokens on every device (a lost phone, a shared
  // computer), then signs out here as well.
  const logoutEverywhere = async () => {
    await apiClient.post("/api/auth/logout-everywhere");
    endSession();
  };

  const refreshUser = () => loadCurrentUser();

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, logoutEverywhere, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
