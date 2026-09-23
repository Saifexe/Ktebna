import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import apiClient from "../apiClient";
import { renderPage, routeGets } from "../test/renderPage";
import Library from "./Library";

vi.mock("../apiClient", () => import("../test/apiClientMock"));

const miserables = { id: 1, title: "Les Misérables", author: "Victor Hugo", language: "fr" };
const ayyam = { id: 2, title: "الأيام", author: "Taha Hussein", language: "ar" };

const url = () => screen.getByTestId("url").textContent;
const lastParams = () => apiClient.get.mock.calls.at(-1)[1].params;
const open = (books = [miserables, ayyam], options = {}) => {
  apiClient.get.mockImplementation(routeGets({ "/api/library": { data: books, count: books.length, totalPages: 2 } }));
  return renderPage(<Library />, { path: "/books", route: "/books", ...options });
};

describe("Library", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists the shared PDFs, each linking to its page", async () => {
    open();
    expect(await screen.findByText("Les Misérables")).toBeInTheDocument();
    expect(screen.getByText("الأيام")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Les Misérables/ })).toHaveAttribute("href", "/books/1");
    expect(lastParams()).toEqual({ page: 0, size: 24 });
  });

  it("searches and filters by language and category through the URL", async () => {
    open();
    await screen.findByText("Les Misérables");
    await userEvent.type(screen.getByRole("textbox"), " Hugo ");
    await userEvent.keyboard("{Enter}");
    expect(url()).toBe("/books?q=Hugo");

    await userEvent.click(screen.getByRole("button", { name: "French" }));
    await userEvent.click(screen.getByRole("button", { name: "Classics" }));
    expect(url()).toBe("/books?q=Hugo&language=fr&category=Classics");
    expect(lastParams()).toMatchObject({ search: "Hugo", language: "fr", category: "Classics" });

    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(url()).toBe("/books?language=fr&category=Classics");
    await userEvent.click(screen.getByRole("button", { name: "All languages" }));
    expect(url()).toBe("/books?category=Classics");
  });

  it("pages through the library", async () => {
    window.scrollTo = vi.fn();
    open();
    await screen.findByText("Les Misérables");
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(url()).toBe("/books?page=2");
  });

  it("asks visitors to log in before sharing a book", async () => {
    const { promptLogin } = open();
    await userEvent.click(await screen.findByRole("button", { name: "Share a book" }));
    expect(promptLogin).toHaveBeenCalled();
    expect(url()).toBe("/books");
  });

  it("invites readers to share when nothing matches", async () => {
    open([], { user: { id: 3 } });
    expect(await screen.findByText("No books here yet")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: "Share a book" });
    await userEvent.click(buttons.at(-1));
    expect(url()).toBe("/books/new");
  });
});
