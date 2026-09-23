import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import apiClient from "../apiClient";
import { renderPage, routeGets } from "../test/renderPage";
import Catalog from "./Catalog";

vi.mock("../apiClient", () => import("../test/apiClientMock"));

const dune = { id: 1, bookName: "Dune", bookAuthor: "Frank Herbert", bookDealType: "sell", bookDeal: "25 TND" };
const titan = { id: 2, bookName: "Attack on Titan", bookDealType: "exchange", bookDeal: "Naruto" };

const feed = (posts, totalPages = 1) => ({ data: posts, totalPages });
const url = () => screen.getByTestId("url").textContent;
const lastFeedParams = () =>
  apiClient.get.mock.calls.filter(([u]) => u === "/api/posts").at(-1)[1].params;

describe("Catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockImplementation(routeGets({ "/api/posts": feed([dune, titan], 3) }));
  });

  it("lists the latest books from the feed", async () => {
    renderPage(<Catalog />);
    expect(await screen.findByText("Dune")).toBeInTheDocument();
    expect(screen.getByText("Attack on Titan")).toBeInTheDocument();
    expect(screen.getByText("Fresh from community shelves")).toBeInTheDocument();
    expect(lastFeedParams()).toEqual({ page: 0, size: 12 });
  });

  it("searches by title or author and keeps the query in the URL", async () => {
    renderPage(<Catalog />);
    await screen.findByText("Dune");

    await userEvent.type(screen.getByRole("textbox", { name: "Search by title or author" }), "  Dune ");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(url()).toBe("/?search=Dune");
    expect(await screen.findByText("Results for “Dune”")).toBeInTheDocument();
    expect(lastFeedParams()).toMatchObject({ search: "Dune" });
  });

  it("clears the search box and its results", async () => {
    renderPage(<Catalog />, { path: "/?search=Dune" });
    expect(await screen.findByRole("textbox")).toHaveValue("Dune");
    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(url()).toBe("/");
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("combines deal type, category and city filters in the URL", async () => {
    renderPage(<Catalog />);
    await screen.findByText("Dune");
    await userEvent.click(screen.getByRole("button", { name: /Filters/ }));

    await userEvent.click(screen.getByRole("button", { name: "Book Swap" }));
    await userEvent.click(screen.getByRole("button", { name: "Manga & Comics" }));
    await userEvent.selectOptions(screen.getByRole("combobox"), "Sfax");

    expect(url()).toBe("/?dealType=exchange&category=Manga+%26+Comics&location=Sfax");
    expect(lastFeedParams()).toMatchObject({ dealType: "exchange", category: "Manga & Comics", location: "Sfax" });
    // The Filters button counts the active filters.
    expect(within(screen.getByRole("button", { name: /Filters/ })).getByText("3")).toBeInTheDocument();
  });

  it("opens the filter panel when a shared link already has filters", async () => {
    renderPage(<Catalog />, { path: "/?category=Fiction&page=2" });
    await screen.findByText("Dune");
    expect(screen.getByRole("button", { name: /Filters/ })).toHaveAttribute("aria-expanded", "true");
    expect(lastFeedParams()).toMatchObject({ page: 1, category: "Fiction" });

    // Changing a filter goes back to the first page.
    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(url()).toBe("/");
  });

  it("pages through the results", async () => {
    window.scrollTo = vi.fn();
    renderPage(<Catalog />);
    await screen.findByText("Dune");
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(url()).toBe("/?page=2");
  });

  it("explains when nothing matches", async () => {
    apiClient.get.mockImplementation(routeGets({ "/api/posts": feed([]) }));
    renderPage(<Catalog />, { path: "/?search=zzz" });
    expect(await screen.findByText("No books match your search")).toBeInTheDocument();
  });

  it("asks visitors to log in before saving a book", async () => {
    const { promptLogin } = renderPage(<Catalog />);
    await screen.findByText("Dune");
    await userEvent.click(screen.getAllByRole("button", { name: "Save book" })[0]);
    expect(promptLogin).toHaveBeenCalled();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("saves a book for a logged-in reader", async () => {
    let savedIds = [];
    apiClient.get.mockImplementation(
      routeGets({ "/api/posts": feed([dune]), "/api/saved-posts/ids": () => savedIds }),
    );
    apiClient.post.mockImplementation(async () => {
      savedIds = [1];
    });
    renderPage(<Catalog />, { user: { id: 9 } });
    await screen.findByText("Dune");
    await userEvent.click(screen.getByRole("button", { name: "Save book" }));
    expect(apiClient.post).toHaveBeenCalledWith("/api/saved-posts/1");
    expect(await screen.findByRole("button", { name: "Remove from saved" })).toBeInTheDocument();
  });
});
