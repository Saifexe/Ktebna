import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import apiClient from "../apiClient";
import { renderPage, routeGets } from "../test/renderPage";
import PublicProfile from "./PublicProfile";

vi.mock("../apiClient", () => import("../test/apiClientMock"));

const amira = {
  id: 5,
  name: "Amira",
  profilePicture: null,
  memberSince: "2026-03-14T10:00:00",
  activeListings: 2,
  completedDeals: 4,
};
const dune = { id: 1, bookName: "Dune", bookDealType: "sell", bookDeal: "25 TND", user: { id: 5, name: "Amira" } };
const titan = { id: 2, bookName: "Attack on Titan", bookDealType: "exchange", status: "RESERVED", user: { id: 5, name: "Amira" } };

const open = ({ profile = amira, posts = [dune, titan], user = null, totalPages = 1 } = {}) => {
  apiClient.get.mockImplementation(
    routeGets({
      "/api/users/5/profile": profile,
      "/api/users/5/posts": { data: posts, count: posts.length, totalPages },
      "/api/saved-posts/ids": [],
    }),
  );
  return renderPage(<PublicProfile />, { path: "/user/5", route: "/user/:id", user });
};

describe("PublicProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("introduces the reader with their stats and books", async () => {
    open();
    expect(await screen.findByRole("heading", { name: "Amira" })).toBeInTheDocument();
    expect(screen.getByText("Member since March 2026")).toBeInTheDocument();
    expect(screen.getByText("Books on offer").previousSibling).toHaveTextContent("2");
    expect(screen.getByText("Completed deals").previousSibling).toHaveTextContent("4");
    expect(screen.getByRole("heading", { name: "Amira's books" })).toBeInTheDocument();
    expect(await screen.findByText("Dune")).toBeInTheDocument();
    expect(screen.getByText("Reserved")).toBeInTheDocument();
  });

  it("never shows an email address", async () => {
    open({ profile: { ...amira, email: "leak@example.com" } });
    await screen.findByRole("heading", { name: "Amira" });
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it("asks visitors to log in before messaging", async () => {
    const { promptLogin } = open();
    await userEvent.click(await screen.findByRole("button", { name: "Message" }));
    expect(promptLogin).toHaveBeenCalled();
  });

  it("opens a chat with the reader", async () => {
    open({ user: { id: 9 } });
    await userEvent.click(await screen.findByRole("button", { name: "Message" }));
    expect(screen.getByTestId("url")).toHaveTextContent("/messages?with=5&name=Amira");
  });

  it("offers to edit your own profile instead of messaging yourself", async () => {
    open({ user: { id: 5 } });
    expect(await screen.findByRole("link", { name: "Edit your profile" })).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("button", { name: "Message" })).not.toBeInTheDocument();
  });

  it("says so when the reader has nothing on offer", async () => {
    open({ posts: [] });
    expect(await screen.findByText("No books on offer right now")).toBeInTheDocument();
  });

  it("pages through a long shelf", async () => {
    window.scrollTo = vi.fn();
    open({ totalPages: 2 });
    await screen.findByText("Dune");
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByTestId("url")).toHaveTextContent("/user/5?page=2");
  });

  it("handles a deleted account", async () => {
    open({ profile: new Error("404") });
    expect(await screen.findByText("Reader not found")).toBeInTheDocument();
  });
});
