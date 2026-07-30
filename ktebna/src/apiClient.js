import axios from "axios";

// Base URL of the Spring Boot backend. Configure per environment via .env:
// VITE_API_URL=http://localhost:8080
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Attach the JWT (if present) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ktebna_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend says the token is invalid/expired, clear it so the app
// falls back to the logged-out state instead of looping on 401s.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("ktebna_token");
    }
    return Promise.reject(error);
  },
);

export const API_BASE_URL = API_URL;
export default apiClient;
