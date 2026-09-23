import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { AuthContext } from "../auth/AuthProvider";
import { LoginPromptContext } from "./loginPrompt";
import { LoginPromptProvider } from "./LoginPromptContext";

const Action = ({ onRun }) => {
  const requireAuth = useContext(LoginPromptContext);
  return (
    <button type="button" onClick={() => requireAuth(onRun)}>
      save
    </button>
  );
};

const mount = (user, onRun) =>
  render(
    <AuthContext.Provider value={{ user, login: vi.fn(), register: vi.fn() }}>
      <LoginPromptProvider>
        <Action onRun={onRun} />
      </LoginPromptProvider>
    </AuthContext.Provider>,
  );

describe("LoginPromptProvider", () => {
  it("runs the action straight away for a logged-in reader", async () => {
    const onRun = vi.fn();
    mount({ id: 3 }, onRun);
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    expect(onRun).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the login dialog instead for a visitor, and closes it again", async () => {
    const onRun = vi.fn();
    mount(null, onRun);
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    expect(onRun).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("You must be logged in to perform this action.");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
