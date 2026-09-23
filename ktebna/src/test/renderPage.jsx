/* eslint-disable react-refresh/only-export-components -- test helper, not a component module */
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../auth/AuthProvider";
import { LoginPromptContext } from "../context/loginPrompt";

// Prints the current URL so tests can assert on navigation.
const CurrentUrl = () => {
  const { pathname, search } = useLocation();
  return <output data-testid="url">{pathname + search}</output>;
};

// Renders one page the way App.jsx mounts it: a router at `path` matched
// against `route`, the signed-in `user` (or none), and a fresh query cache.
export const renderPage = (page, { path = "/", route = "/", user = null } = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const promptLogin = vi.fn();
  const requireAuth = (action) => {
    if (user) {
      action?.();
      return true;
    }
    promptLogin();
    return false;
  };
  const refreshUser = vi.fn();

  const view = render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={{ user, loading: false, refreshUser, logout: vi.fn() }}>
        <LoginPromptContext.Provider value={requireAuth}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path={route} element={page} />
              <Route path="*" element={null} />
            </Routes>
            <CurrentUrl />
          </MemoryRouter>
        </LoginPromptContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return { ...view, promptLogin, refreshUser, client };
};

// Answers apiClient.get by URL, e.g. { "/api/posts/7": post }. Unknown URLs reject.
export const routeGets = (routes) => (url) => {
  const match = Object.entries(routes).find(([pattern]) => pattern === url);
  if (!match) return Promise.reject(new Error(`Unexpected GET ${url}`));
  const value = typeof match[1] === "function" ? match[1]() : match[1];
  return value instanceof Error ? Promise.reject(value) : Promise.resolve({ data: value });
};
