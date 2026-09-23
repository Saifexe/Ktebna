import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import apiClient from "../apiClient";
import { renderPage, routeGets } from "../test/renderPage";
import BookDetail from "./BookDetail";

vi.mock("../apiClient", () => import("../test/apiClientMock"));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// The Google map needs a real browser and API key; the link below it is what we check.
vi.mock("../components/maps/PickupMap", () => ({ default: () => null }));

const seller = { id: 3, name: "Saif" };
const post = {
  id: 7,
  isPublic: true,
  bookName: "Dune",
  bookAuthor: "Frank Herbert",
  bookCategory: "Science Fiction",
  bookCondition: "gentlyRead",
  bookDealType: "exchange",
  bookDeal: "Any Asimov",
  bookDescription: "Cover slightly worn.",
  bookLocation: "Sousse",
  pickupSpot: "Café Le Pacha",
  pickupLat: 35.83,
  pickupLng: 10.64,
  createdAt: "2026-09-01T10:00:00Z",
  user: seller,
};

const open = (data, options = {}) => {
  apiClient.get.mockImplementation(
    routeGets({ "/api/posts/7": data, "/api/saved-posts/ids": [] }),
  );
  return renderPage(<BookDetail />, { path: "/book/7", route: "/book/:id", ...options });
};

describe("BookDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the listing: title, author, deal, condition and seller", async () => {
    open(post);
    expect(await screen.findByRole("heading", { name: "Dune" })).toBeInTheDocument();
    expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
    expect(screen.getByText("Swap · Any Asimov")).toBeInTheDocument();
    expect(screen.getByText("Open to Book Swap")).toBeInTheDocument();
    expect(screen.getAllByText("Gently Read").length).toBeGreaterThan(0);
    expect(screen.getByText("Saif")).toBeInTheDocument();
    expect(screen.getByText("Cover slightly worn.")).toBeInTheDocument();
  });

  it("links the pickup spot to Google Maps", async () => {
    open(post);
    const link = await screen.findByRole("link", { name: "Open in Google Maps" });
    expect(link).toHaveAttribute("href", expect.stringContaining("query=35.83%2C10.64"));
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("opens the pickup section to show the meeting spot", async () => {
    open(post);
    await userEvent.click(await screen.findByRole("button", { name: "Exchange & pickup" }));
    expect(screen.getByText(/Meet in a busy public place in Sousse/)).toBeInTheDocument();
    expect(screen.queryByText("Cover slightly worn.")).not.toBeInTheDocument();
  });

  it("marks gifts as free", async () => {
    open({ ...post, bookDealType: "donate", bookDeal: "" });
    expect(await screen.findByText("Free to a good home")).toBeInTheDocument();
  });

  it("asks visitors to log in before messaging the seller", async () => {
    const { promptLogin } = open(post);
    await userEvent.click(await screen.findByRole("button", { name: "Message Seller" }));
    expect(promptLogin).toHaveBeenCalled();
    expect(screen.getByTestId("url")).toHaveTextContent("/book/7");
  });

  it("opens a chat with the seller about this book", async () => {
    open(post, { user: { id: 9 } });
    await userEvent.click(await screen.findByRole("button", { name: "Message Seller" }));
    expect(screen.getByTestId("url")).toHaveTextContent("/messages?with=3&name=Saif&book=Dune");
  });

  it("links the seller card to their public profile", async () => {
    open(post);
    expect(await screen.findByRole("link", { name: "View profile: Saif" })).toHaveAttribute("href", "/user/3");
  });

  it("lets the owner edit instead of messaging themselves", async () => {
    open(post, { user: seller });
    expect(await screen.findByText("This is your listing.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit listing" })).toHaveAttribute("href", "/sell/7");
    expect(screen.queryByRole("button", { name: "Message Seller" })).not.toBeInTheDocument();
  });

  it("warns that a reserved book is being arranged but still allows messaging", async () => {
    open({ ...post, status: "RESERVED" }, { user: { id: 9 } });
    expect(await screen.findByText(/the seller is arranging this deal/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Message Seller" })).toBeInTheDocument();
  });

  it("stops offering to message about a sold book", async () => {
    open({ ...post, status: "SOLD" }, { user: { id: 9 } });
    expect(await screen.findByText("This book has found a new reader and is no longer available.")).toBeInTheDocument();
    expect(screen.getByText("Swapped")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Message Seller" })).not.toBeInTheDocument();
    // Saving and sharing still work.
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("doesn't show visitor notices to the owner", async () => {
    open({ ...post, status: "SOLD" }, { user: seller });
    expect(await screen.findByText("This is your listing.")).toBeInTheDocument();
    expect(screen.queryByText(/no longer available/)).not.toBeInTheDocument();
  });

  it("hides private listings from everyone but their owner", async () => {
    open({ ...post, isPublic: false }, { user: { id: 9 } });
    expect(await screen.findByText("This book isn’t available anymore")).toBeInTheDocument();
  });

  it("shows the owner that their listing is private", async () => {
    open({ ...post, isPublic: false }, { user: seller });
    expect(await screen.findByText("Private — only you can see this listing")).toBeInTheDocument();
  });

  it("handles a listing that no longer exists", async () => {
    open(new Error("404"));
    expect(await screen.findByText("This book isn’t available anymore")).toBeInTheDocument();
  });

  it("copies the link when the browser has no share sheet", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    open(post, { user: { id: 9 } });
    await userEvent.click(await screen.findByRole("button", { name: "Share" }));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(toast.success).toHaveBeenCalledWith("Link copied to clipboard");
  });

  it("falls back gracefully for old listings without details", async () => {
    open({ id: 7, isPublic: true, bookName: "Old book", user: seller });
    expect(await screen.findByText("The seller hasn’t added a description yet. Send them a message to ask about the book’s condition.")).toBeInTheDocument();
    expect(screen.getAllByText("Not specified")).toHaveLength(3);
  });
});
