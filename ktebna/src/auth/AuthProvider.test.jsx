import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import apiClient from "../apiClient";
import { AuthContext, AuthProvider } from "./AuthProvider";

vi.mock("../apiClient", () => import("../test/apiClientMock"));

let auth;
const Probe = () => {
  auth = useContext(AuthContext);
  return <p>{auth.loading ? "loading" : auth.user?.name || "signed out"}</p>;
};
const mount = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

describe("AuthProvider", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts signed out when there is no saved token", async () => {
    mount();
    expect(await screen.findByText("signed out")).toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("restores the session from a saved token", async () => {
    localStorage.setItem("ktebna_token", "valid");
    apiClient.get.mockResolvedValue({ data: { id: 3, name: "Saif" } });
    mount();
    expect(await screen.findByText("Saif")).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith("/api/auth/me");
  });

  it("drops a token the backend no longer accepts", async () => {
    localStorage.setItem("ktebna_token", "expired");
    apiClient.get.mockRejectedValue(new Error("401"));
    mount();
    expect(await screen.findByText("signed out")).toBeInTheDocument();
    expect(localStorage.getItem("ktebna_token")).toBeNull();
  });

  it("logs in, stores the token, then logs out", async () => {
    apiClient.post.mockResolvedValue({ data: { token: "t1", user: { id: 3, name: "Saif" } } });
    mount();
    await screen.findByText("signed out");

    await act(() => auth.login({ email: "saif@example.com", password: "secret123" }));
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/login", { email: "saif@example.com", password: "secret123" });
    expect(localStorage.getItem("ktebna_token")).toBe("t1");
    expect(screen.getByText("Saif")).toBeInTheDocument();

    await act(() => auth.logout());
    expect(localStorage.getItem("ktebna_token")).toBeNull();
    expect(screen.getByText("signed out")).toBeInTheDocument();
  });

  it("registers a new account and signs it in", async () => {
    apiClient.post.mockResolvedValue({ data: { token: "t2", user: { id: 4, name: "Amira" } } });
    mount();
    await screen.findByText("signed out");
    await act(() => auth.register({ name: "Amira", email: "a@example.com", password: "secret123" }));
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/register", { name: "Amira", email: "a@example.com", password: "secret123" });
    expect(screen.getByText("Amira")).toBeInTheDocument();
  });

  it("reloads the user after a profile change", async () => {
    localStorage.setItem("ktebna_token", "valid");
    apiClient.get.mockResolvedValueOnce({ data: { id: 3, name: "Saif" } });
    mount();
    await screen.findByText("Saif");
    apiClient.get.mockResolvedValueOnce({ data: { id: 3, name: "Saif Eddine" } });
    await act(() => auth.refreshUser());
    await waitFor(() => expect(screen.getByText("Saif Eddine")).toBeInTheDocument());
  });
});
