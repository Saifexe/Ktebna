import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "../i18n";
import { MobileFiltersContext } from "../context/MobileFiltersContext";
import { NotificationsContext } from "../context/notifications";
import { renderPage } from "../test/renderPage";
import Header from "./Header";

const open = ({ user = null, unread = 0 } = {}) => {
  const setMobileMenuOpen = vi.fn();
  const view = renderPage(
    <MobileFiltersContext.Provider value={{ setMobileMenuOpen }}>
      <NotificationsContext.Provider value={{ total: unread, countFor: () => 0, markRead: vi.fn() }}>
        <Header />
      </NotificationsContext.Provider>
    </MobileFiltersContext.Provider>,
    { path: "/books", route: "*", user },
  );
  return { ...view, setMobileMenuOpen };
};

describe("Header", () => {
  afterEach(() => i18n.changeLanguage("en"));

  it("offers login to visitors", () => {
    open();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: /Messages/ })).not.toBeInTheDocument();
  });

  it("shows a logged-in reader their messages, unread count and profile", () => {
    open({ user: { id: 3, name: "Saif" }, unread: 3 });
    expect(screen.getByRole("link", { name: "Messages (3 unread)" })).toHaveAttribute("href", "/messages");
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
  });

  it("highlights the current section", () => {
    open();
    expect(screen.getByRole("link", { name: "Free Library" })).toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: "Browse All" })).not.toHaveClass("text-primary");
  });

  it("searches the catalog from any page", async () => {
    open();
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    const box = screen.getByRole("textbox", { name: "Search by title or author" });
    expect(box).toHaveFocus();
    await userEvent.type(box, " Dune {Enter}");
    expect(screen.getByTestId("url")).toHaveTextContent("/?search=Dune");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("closes the search box with Escape", async () => {
    open();
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("switches the language and remembers it", async () => {
    open();
    await userEvent.click(screen.getByRole("button", { name: "Change language" }));
    await userEvent.click(screen.getByRole("button", { name: "Français" }));
    expect(i18n.language).toBe("fr");
    expect(localStorage.getItem("language")).toBe("fr");
    expect(screen.queryByRole("button", { name: "العربية" })).not.toBeInTheDocument();
  });

  it("closes the language menu when clicking elsewhere", async () => {
    open();
    await userEvent.click(screen.getByRole("button", { name: "Change language" }));
    expect(screen.getByRole("button", { name: "العربية" })).toBeInTheDocument();
    await userEvent.click(document.body);
    expect(screen.queryByRole("button", { name: "العربية" })).not.toBeInTheDocument();
  });

  it("opens the mobile menu", async () => {
    const { setMobileMenuOpen } = open();
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(setMobileMenuOpen).toHaveBeenCalledWith(true);
  });
});
