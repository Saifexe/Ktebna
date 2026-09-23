import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import apiClient from "../apiClient";
import { renderPage, routeGets } from "../test/renderPage";
import LibraryBook from "./LibraryBook";

vi.mock("../apiClient", () => import("../test/apiClientMock"));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const sharer = { id: 3, name: "Saif" };
const book = {
  id: 1,
  title: "Les Misérables",
  author: "Victor Hugo",
  language: "fr",
  category: "Classics",
  pdfUrl: "https://example.org/miserables.pdf",
  description: "Public-domain edition.",
  createdAt: "2026-09-20T10:00:00Z",
  user: sharer,
};

const open = (data = book, user = null) => {
  apiClient.get.mockImplementation(routeGets({ "/api/library/1": data }));
  return renderPage(<LibraryBook />, { path: "/books/1", route: "/books/:id", user });
};

describe("LibraryBook", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the book with its language, category and sharer", async () => {
    open();
    expect(await screen.findByRole("heading", { name: "Les Misérables" })).toBeInTheDocument();
    expect(screen.getByText("Victor Hugo")).toBeInTheDocument();
    expect(screen.getByText("French")).toBeInTheDocument();
    expect(screen.getByText("Classics")).toBeInTheDocument();
    expect(screen.getByText("Public-domain edition.")).toBeInTheDocument();
    expect(screen.getByText("Saif")).toBeInTheDocument();
  });

  it("opens the PDF in a new tab without giving it access to this page", async () => {
    const openWindow = vi.spyOn(window, "open").mockImplementation(() => null);
    open();
    await userEvent.click(await screen.findByRole("button", { name: /Read the PDF/ }));
    expect(openWindow).toHaveBeenCalledWith(book.pdfUrl, "_blank", "noopener,noreferrer");
  });

  it("only lets the sharer remove it", async () => {
    open(book, { id: 9 });
    await screen.findByRole("heading", { name: "Les Misérables" });
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });

  it("asks for confirmation, then removes the book", async () => {
    apiClient.delete.mockResolvedValue({});
    open(book, sharer);
    await userEvent.click(await screen.findByRole("button", { name: /Remove/ }));
    expect(apiClient.delete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: /Remove/ }));
    await userEvent.click(screen.getByRole("button", { name: /Confirm removal/ }));

    expect(apiClient.delete).toHaveBeenCalledWith("/api/library/1");
    expect(toast.success).toHaveBeenCalledWith("Book removed from the library");
    expect(screen.getByTestId("url")).toHaveTextContent(/^\/books$/);
  });

  it("stays on the page when removal fails", async () => {
    apiClient.delete.mockRejectedValue(new Error("500"));
    open(book, sharer);
    await userEvent.click(await screen.findByRole("button", { name: /Remove/ }));
    await userEvent.click(screen.getByRole("button", { name: /Confirm removal/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByTestId("url")).toHaveTextContent("/books/1");
  });

  it("handles a book that no longer exists", async () => {
    open(new Error("404"));
    expect(await screen.findByText("This book isn't in the library")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the library" })).toHaveAttribute("href", "/books");
  });
});
