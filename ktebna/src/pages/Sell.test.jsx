import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import apiClient from "../apiClient";
import { renderPage, routeGets } from "../test/renderPage";
import Sell from "./Sell";

vi.mock("../apiClient", () => import("../test/apiClientMock"));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../components/maps/PickupPicker", () => ({ default: () => null }));

const me = { id: 3, name: "Saif" };
const cover = new File(["jpeg bytes"], "dune.jpg", { type: "image/jpeg" });

const next = () => userEvent.click(screen.getByRole("button", { name: "Continue" }));
const publish = () => userEvent.click(screen.getByRole("button", { name: "Publish Listing" }));
const sentForm = (call) => Object.fromEntries(call[1].entries());

// Step 1: photo, title and category.
const fillDetails = async () => {
  await userEvent.upload(document.querySelector('input[type="file"]'), cover);
  await userEvent.type(screen.getByPlaceholderText("e.g. Season of Migration to the North"), "Dune");
  await userEvent.type(screen.getByPlaceholderText("e.g. Tayeb Salih"), "Frank Herbert");
  await userEvent.selectOptions(screen.getByRole("combobox"), "Science Fiction");
  await next();
};

describe("Sell: List a Book", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("won't leave step 1 without a photo, title and category", async () => {
    renderPage(<Sell />, { path: "/sell", route: "/sell", user: me });
    await next();
    expect(screen.getByText("Add a photo of the book")).toBeInTheDocument();
    expect(screen.getAllByText("This field is required")).toHaveLength(2);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("clears a field's error as soon as it is filled in", async () => {
    renderPage(<Sell />, { path: "/sell", route: "/sell", user: me });
    await next();
    await userEvent.type(screen.getByPlaceholderText("e.g. Season of Migration to the North"), "D");
    expect(screen.getAllByText("This field is required")).toHaveLength(1);
  });

  it("asks for a price when selling, but not when giving a book away", async () => {
    renderPage(<Sell />, { path: "/sell", route: "/sell", user: me });
    await fillDetails();
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Like New" }));
    await userEvent.click(screen.getByRole("button", { name: "Direct Sale" }));
    await next();
    expect(screen.getByText("This field is required")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Free Giving" }));
    expect(screen.queryByPlaceholderText("e.g. 25 TND")).not.toBeInTheDocument();
    await next();
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
  });

  it("publishes a new listing and opens its page", async () => {
    apiClient.post.mockResolvedValue({ data: { id: 42 } });
    renderPage(<Sell />, { path: "/sell", route: "/sell", user: me });
    await fillDetails();
    await userEvent.click(screen.getByRole("button", { name: "Gently Read" }));
    await userEvent.click(screen.getByRole("button", { name: "Direct Sale" }));
    await userEvent.type(screen.getByPlaceholderText("e.g. 25 TND"), " 25 TND ");
    await next();
    await userEvent.selectOptions(screen.getByRole("combobox"), "Tunis");
    await publish();

    const [call] = apiClient.post.mock.calls;
    expect(call[0]).toBe("/api/posts");
    expect(sentForm(call)).toMatchObject({
      bookName: "Dune",
      bookAuthor: "Frank Herbert",
      bookCategory: "Science Fiction",
      bookCondition: "gentlyRead",
      bookDealType: "sell",
      bookDeal: "25 TND",
      bookLocation: "Tunis",
      isPublic: "true",
    });
    // No map pin was chosen, so no pickup fields are sent.
    expect(call[1].has("pickupLat")).toBe(false);
    expect(call[1].get("image")).toBe(cover);
    expect(toast.success).toHaveBeenCalledWith("Your book is listed!");
    expect(screen.getByTestId("url")).toHaveTextContent("/book/42");
  });

  it("jumps back to the step with a missing field when publishing", async () => {
    renderPage(<Sell />, { path: "/sell", route: "/sell", user: me });
    await fillDetails();
    await userEvent.click(screen.getByRole("button", { name: "Like New" }));
    await userEvent.click(screen.getByRole("button", { name: "Free Giving" }));
    await next();
    await publish();
    expect(screen.getByText("This field is required")).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("keeps the form and reports the error when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiClient.post.mockRejectedValue(new Error("500"));
    renderPage(<Sell />, { path: "/sell", route: "/sell", user: me });
    await fillDetails();
    await userEvent.click(screen.getByRole("button", { name: "Like New" }));
    await userEvent.click(screen.getByRole("button", { name: "Free Giving" }));
    await next();
    await userEvent.selectOptions(screen.getByRole("combobox"), "Tunis");
    await publish();
    expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try again.");
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
  });

  it("edits an existing listing with its current values", async () => {
    apiClient.get.mockImplementation(
      routeGets({
        "/api/posts/7": {
          id: 7,
          user: me,
          bookName: "Dune",
          bookCategory: "Fiction",
          bookCondition: "likeNew",
          bookDealType: "Donate",
          bookLocation: "Sfax",
          bookImage: "/uploads/dune.jpg",
          isPublic: false,
        },
      }),
    );
    apiClient.put.mockResolvedValue({ data: { id: 7 } });
    renderPage(<Sell />, { path: "/sell/7", route: "/sell/:id", user: me });

    expect(await screen.findByDisplayValue("Dune")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Edit Listing" })).toBeInTheDocument();
    await next();
    expect(screen.getByRole("button", { name: "Free Giving" })).toHaveAttribute("aria-pressed", "true");
    await next();
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    const [call] = apiClient.put.mock.calls;
    expect(call[0]).toBe("/api/posts/7");
    expect(sentForm(call)).toMatchObject({ bookDealType: "donate", bookDeal: "", isPublic: "false" });
    expect(call[1].has("image")).toBe(false);
    expect(toast.success).toHaveBeenCalledWith("Listing updated");
  });

  it("refuses to edit someone else's listing", async () => {
    apiClient.get.mockImplementation(
      routeGets({ "/api/posts/7": { id: 7, user: { id: 99 }, bookName: "Not mine" } }),
    );
    renderPage(<Sell />, { path: "/sell/7", route: "/sell/:id", user: me });
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent("/profile"));
    expect(toast.error).toHaveBeenCalledWith("You can only edit your own listings.");
  });
});
