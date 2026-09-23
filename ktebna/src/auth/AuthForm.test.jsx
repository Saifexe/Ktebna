import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthProvider";
import AuthForm from "./AuthForm";

vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderForm = (auth, onSuccess = vi.fn()) => {
  render(
    <AuthContext.Provider value={auth}>
      <AuthForm onSuccess={onSuccess} />
    </AuthContext.Provider>,
  );
  return onSuccess;
};

const fill = async (label, value) => userEvent.type(screen.getByLabelText(label), value);

describe("AuthForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("logs in with email and password only", async () => {
    const login = vi.fn().mockResolvedValue({ id: 1 });
    const onSuccess = renderForm({ login, register: vi.fn() });

    expect(screen.queryByLabelText("Full name")).not.toBeInTheDocument();
    await fill("Email", "reader@example.com");
    await fill("Password", "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(login).toHaveBeenCalledWith({ email: "reader@example.com", password: "secret123" });
    expect(toast.success).toHaveBeenCalledWith("Welcome back!");
    expect(onSuccess).toHaveBeenCalled();
  });

  it("switches to sign-up and sends the name too", async () => {
    const register = vi.fn().mockResolvedValue({ id: 2 });
    renderForm({ login: vi.fn(), register });

    await userEvent.click(screen.getByRole("button", { name: "New to Ktebna? Create an account" }));
    await fill("Full name", "Amira");
    await fill("Email", "amira@example.com");
    await fill("Password", "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(register).toHaveBeenCalledWith({
      name: "Amira",
      email: "amira@example.com",
      password: "secret123",
    });
    expect(toast.success).toHaveBeenCalledWith("Account created!");
  });

  it("shows the backend's message when login fails and stays open", async () => {
    const login = vi.fn().mockRejectedValue({ response: { data: { error: "Invalid email or password" } } });
    const onSuccess = renderForm({ login, register: vi.fn() });

    await fill("Email", "reader@example.com");
    await fill("Password", "wrong-pass");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });

  it("falls back to a generic error when the server gives no reason", async () => {
    renderForm({ login: vi.fn().mockRejectedValue(new Error("offline")), register: vi.fn() });
    await fill("Email", "reader@example.com");
    await fill("Password", "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try again.");
  });
});
