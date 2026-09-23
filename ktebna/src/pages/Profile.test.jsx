import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import apiClient from "../apiClient";
import { getMyConversations } from "../chat/chatService";
import { renderPage, routeGets } from "../test/renderPage";
import Profile from "./Profile";

vi.mock("../apiClient", () => import("../test/apiClientMock"));
vi.mock("../chat/chatService", () => ({ getMyConversations: vi.fn() }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// The saved tab has its own component; here we only check that the tab switches to it.
vi.mock("../components/SavedGrid", () => ({ default: () => <p>saved grid</p> }));

const me = { id: 3, name: "Saif", email: "saif@example.com" };
const dune = { id: 1, bookName: "Dune", bookAuthor: "Frank Herbert", bookDealType: "sell", bookDeal: "25 TND", isPublic: true };
const cairo = { id: 2, bookName: "The Cairo Trilogy", bookDealType: "donate", isPublic: false };

const listing = (name) => screen.getByRole("heading", { name }).closest("div.flex.gap-4");

// A tiny fake server: hides and deletes stick, so refetches see them.
const open = (initial = [dune, cairo]) => {
  let posts = initial;
  apiClient.get.mockImplementation(
    routeGets({
      "/api/posts/me": () => ({ data: posts, count: posts.length }),
      "/api/saved-posts/ids": [1, 7],
    }),
  );
  apiClient.patch.mockImplementation(async (url, { isPublic }) => {
    posts = posts.map((p) => (url === `/api/posts/${p.id}/visibility` ? { ...p, isPublic } : p));
  });
  apiClient.delete.mockImplementation(async (url) => {
    posts = posts.filter((p) => url !== `/api/posts/${p.id}`);
  });
  return renderPage(<Profile />, { path: "/profile", route: "/profile", user: me });
};

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyConversations.mockResolvedValue([{ id: 11 }]);
  });

  it("summarises the reader's account", async () => {
    open();
    expect(screen.getByRole("heading", { name: "Saif" })).toBeInTheDocument();
    expect(screen.getByText(/saif@example.com/)).toBeInTheDocument();
    expect(await screen.findByText("2/6")).toBeInTheDocument();
    expect(await screen.findByText("Dune")).toBeInTheDocument();
    // Total, public and hidden listing counts.
    const metrics = ["Total", "Public", "Hidden"].map(
      (label) => screen.getAllByText(label).find((el) => el.tagName === "P").nextSibling.textContent,
    );
    expect(metrics).toEqual(["2", "1", "1"]);
  });

  it("marks each listing public or hidden", async () => {
    open();
    await screen.findByText("Dune");
    expect(within(listing("Dune")).getByText("Public")).toBeInTheDocument();
    expect(within(listing("The Cairo Trilogy")).getByText("Hidden")).toBeInTheDocument();
  });

  it("hides a listing straight away and tells the server", async () => {
    open();
    await screen.findByText("Dune");
    await userEvent.click(within(listing("Dune")).getByRole("button", { name: "Hide listing" }));

    expect(apiClient.patch).toHaveBeenCalledWith("/api/posts/1/visibility", { isPublic: false });
    expect(within(listing("Dune")).getByText("Hidden")).toBeInTheDocument();
  });

  it("undoes the change if the server refuses it", async () => {
    open();
    apiClient.patch.mockRejectedValue(new Error("500"));
    await screen.findByText("Dune");
    await userEvent.click(within(listing("Dune")).getByRole("button", { name: "Hide listing" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(within(listing("Dune")).getByText("Public")).toBeInTheDocument();
  });

  it("deletes a listing after confirmation", async () => {
    open();
    await screen.findByText("Dune");
    await userEvent.click(within(listing("Dune")).getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(apiClient.delete).toHaveBeenCalledWith("/api/posts/1");
    await waitFor(() => expect(screen.queryByText("Dune")).not.toBeInTheDocument());
  });

  it("links each listing to its edit page", async () => {
    open();
    await screen.findByText("Dune");
    expect(within(listing("Dune")).getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/sell/1");
  });

  it("renames the account", async () => {
    apiClient.put.mockResolvedValue({});
    const { refreshUser } = open();
    await userEvent.click(screen.getByRole("button", { name: /Edit Profile/ }));
    const input = screen.getByRole("textbox", { name: "Your name" });
    expect(input).toHaveFocus();

    await userEvent.clear(input);
    await userEvent.type(input, "  Saif Eddine ");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(apiClient.put).toHaveBeenCalledWith("/api/account/name", { name: "Saif Eddine" });
    expect(refreshUser).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("doesn't call the server when the name is unchanged", async () => {
    open();
    await userEvent.click(screen.getByRole("button", { name: /Edit Profile/ }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(apiClient.put).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Saif" })).toBeInTheDocument();
  });

  it("switches to the saved books tab", async () => {
    open();
    await userEvent.click(screen.getByRole("tab", { name: "Saved Books" }));
    expect(screen.getByTestId("url")).toHaveTextContent("/profile?tab=saved");
    expect(screen.getByText("saved grid")).toBeInTheDocument();
  });

  it("invites a new reader to list their first book", async () => {
    open([]);
    expect(await screen.findByText("You haven’t listed any books yet")).toBeInTheDocument();
  });
});
