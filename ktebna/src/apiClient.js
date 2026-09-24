import axios from "axios";

// Base URL of the Spring Boot backend. Configure per environment via .env:
// VITE_API_URL=http://localhost:8080
const API_URL = import.meta.env.VITE_API_URL || "";

export const TOKEN_KEY = "ktebna_token";
// Fired when the backend rejects our token; AuthProvider signs out on it.
export const SESSION_EXPIRED_EVENT = "ktebna:session-expired";

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Attach the JWT (if present) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 on a request that carried our token means the token is no longer
// valid (expired, or revoked by "log out everywhere"). A 401 without one,
// such as a wrong password at login, is not about the session.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

export const API_BASE_URL = API_URL;

// Uploaded images are stored as relative "/uploads/..." paths. Behind nginx they
// are same-origin; with the Vite dev server they live on the API host instead.
export const mediaUrl = (path) =>
  typeof path === "string" && path.startsWith("/uploads/") ? `${API_URL}${path}` : path;
export default apiClient;
