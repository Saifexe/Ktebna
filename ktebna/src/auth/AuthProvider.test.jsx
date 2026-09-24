import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useContext } from "react";
import apiClient, { SESSION_EXPIRED_EVENT } from "../apiClient";
import { AuthContext, AuthProvider } from "./AuthProvider";

vi.mock("../apiClient", () => import("../test/apiClientMock"));

let auth;
let queryClient;
const Probe = () => {
  auth = useContext(AuthContext);
  return <p>{auth.loading ? "loading" : auth.user?.name || "signed out"}</p>;
};
const mount = () => {
  queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
};
const httpError = (status) => Object.assign(new Error(String(status)), { response: { status } });

describe("AuthProvider", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.useRealTimers());

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

  it("drops a token the backend rejects with 401", async () => {
    localStorage.setItem("ktebna_token", "expired");
    apiClient.get.mockRejectedValue(httpError(401));
    mount();
    expect(await screen.findByText("signed out")).toBeInTheDocument();
    expect(localStorage.getItem("ktebna_token")).toBeNull();
  });

  it("keeps the session through a backend restart and retries", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.setItem("ktebna_token", "valid");
    apiClient.get
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockRejectedValueOnce(httpError(502))
      .mockResolvedValue({ data: { id: 3, name: "Saif" } });
    mount();

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem("ktebna_token")).toBe("valid");
    expect(screen.getByText("loading")).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(2000));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(await screen.findByText("Saif")).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem("ktebna_token")).toBe("valid");
  });

  it("signs out on screen when any request reports the session expired", async () => {
    localStorage.setItem("ktebna_token", "valid");
    apiClient.get.mockResolvedValue({ data: { id: 3, name: "Saif" } });
    mount();
    await screen.findByText("Saif");
    queryClient.setQueryData(["conversations", 3], [{ id: 1 }]);

    act(() => window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT)));

    expect(await screen.findByText("signed out")).toBeInTheDocument();
    expect(queryClient.getQueryData(["conversations", 3])).toBeUndefined();
  });

  it("logs in, stores the token, then logs out and forgets cached data", async () => {
    apiClient.post.mockResolvedValue({ data: { token: "t1", user: { id: 3, name: "Saif" } } });
    mount();
    await screen.findByText("signed out");

    await act(() => auth.login({ email: "saif@example.com", password: "secret123" }));
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/login", { email: "saif@example.com", password: "secret123" });
    expect(localStorage.getItem("ktebna_token")).toBe("t1");
    expect(screen.getByText("Saif")).toBeInTheDocument();
    queryClient.setQueryData(["conversations", 3], [{ id: 1 }]);

    await act(() => auth.logout());
    expect(localStorage.getItem("ktebna_token")).toBeNull();
    expect(screen.getByText("signed out")).toBeInTheDocument();
    expect(queryClient.getQueryData(["conversations", 3])).toBeUndefined();
  });

  it("logs out of every device through the backend", async () => {
    localStorage.setItem("ktebna_token", "valid");
    apiClient.get.mockResolvedValue({ data: { id: 3, name: "Saif" } });
    apiClient.post.mockResolvedValue({ data: null });
    mount();
    await screen.findByText("Saif");

    await act(() => auth.logoutEverywhere());

    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/logout-everywhere");
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
