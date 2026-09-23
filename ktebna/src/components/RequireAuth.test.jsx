import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthContext } from "../auth/AuthProvider";
import RequireAuth from "./RequireAuth";

const LoginPage = () => {
  const { search } = useLocation();
  return <p>login page {search}</p>;
};

const renderAt = (path, auth) =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/messages" element={<p>inbox</p>} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("RequireAuth", () => {
  it("lets a logged-in reader through", () => {
    renderAt("/messages", { user: { id: 1 }, loading: false });
    expect(screen.getByText("inbox")).toBeInTheDocument();
  });

  it("sends visitors to login and remembers where they were going", () => {
    renderAt("/messages?with=3", { user: null, loading: false });
    expect(screen.getByText(/login page/)).toHaveTextContent(
      `?next=${encodeURIComponent("/messages?with=3")}`,
    );
  });

  it("waits for the session check instead of redirecting too early", () => {
    renderAt("/messages", { user: null, loading: true });
    expect(screen.queryByText(/login page/)).not.toBeInTheDocument();
    expect(screen.queryByText("inbox")).not.toBeInTheDocument();
  });
});
