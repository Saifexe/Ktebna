import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import apiClient from "../apiClient";
import { renderPage, routeGets } from "../test/renderPage";
import SavedGrid from "./SavedGrid";

vi.mock("../apiClient", () => import("../test/apiClientMock"));

const dune = { id: 1, bookName: "Dune", bookAuthor: "Frank Herbert", bookDealType: "sell", bookDeal: "25 TND" };
const cairo = { id: 2, bookName: "The Cairo Trilogy", bookDealType: "exchange", status: "SOLD", user: { name: "Amira" } };

// A fake server whose saved list shrinks when a book is removed.
const open = (initial = [dune, cairo]) => {
  let saved = initial;
  apiClient.get.mockImplementation(
    routeGets({
      "/api/saved-posts": () => ({ data: saved, count: saved.length }),
      "/api/saved-posts/ids": () => saved.map((p) => p.id),
    }),
  );
  apiClient.delete.mockImplementation(async (url) => {
    saved = saved.filter((p) => url !== `/api/saved-posts/${p.id}`);
  });
  return renderPage(<SavedGrid />, { user: { id: 9 } });
};

const card = (name) => screen.getByRole("heading", { name }).closest("div.flex.flex-col");

describe("SavedGrid", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows each saved book with its price and a link to it", async () => {
    open();
    expect(await screen.findByText("Dune")).toBeInTheDocument();
    expect(within(card("Dune")).getByText("25 TND")).toBeInTheDocument();
    expect(within(card("Dune")).getByRole("link", { name: "View book" })).toHaveAttribute("href", "/book/1");
  });

  it("marks a book that has already changed hands", async () => {
    open();
    await screen.findByText("The Cairo Trilogy");
    expect(within(card("The Cairo Trilogy")).getByText("Swapped")).toBeInTheDocument();
    expect(within(card("The Cairo Trilogy")).getByText("Amira")).toBeInTheDocument();
  });

  it("removes a book from the shelf", async () => {
    open();
    await screen.findByText("Dune");
    await userEvent.click(within(card("Dune")).getByRole("button", { name: "Remove from saved" }));
    expect(apiClient.delete).toHaveBeenCalledWith("/api/saved-posts/1");
    await waitFor(() => expect(screen.queryByText("Dune")).not.toBeInTheDocument());
  });

  it("invites readers to browse when the shelf is empty", async () => {
    open([]);
    expect(await screen.findByText("No saved books yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse books" })).toHaveAttribute("href", "/");
  });
});
