import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import i18n from "../i18n";
import BookCard from "./BookCard";

const post = {
  id: 7,
  bookName: "Dune",
  bookAuthor: "Frank Herbert",
  bookDealType: "sell",
  bookDeal: "25 TND",
  bookLocation: "Sfax",
  bookCondition: "likeNew",
  bookImage: "/uploads/dune.jpg",
  user: { id: 3, name: "Saif" },
};

const renderCard = (props) =>
  render(
    <MemoryRouter>
      <BookCard post={post} {...props} />
    </MemoryRouter>,
  );

describe("BookCard", () => {
  it("shows the title, author, price and city, linking to the book page", () => {
    renderCard();
    expect(screen.getByRole("heading", { name: "Dune" })).toBeInTheDocument();
    expect(screen.getByText("Frank Herbert")).toBeInTheDocument();
    expect(screen.getByText("25 TND")).toBeInTheDocument();
    expect(screen.getByText("Sfax")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/book/7");
  });

  it("badges the condition before the deal type", () => {
    renderCard();
    expect(screen.getByText("Like New")).toBeInTheDocument();
  });

  it("falls back to a deal badge and the seller's name on older listings", () => {
    render(
      <MemoryRouter>
        <BookCard post={{ ...post, bookCondition: null, bookAuthor: null, bookDealType: "Donate" }} />
      </MemoryRouter>,
    );
    expect(screen.getByText(i18n.t("deal.donate"))).toBeInTheDocument();
    expect(screen.getByText("Saif")).toBeInTheDocument();
  });

  it("hides the heart when saving isn't available", () => {
    renderCard();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("saves the book when the heart is clicked", async () => {
    const onToggleSave = vi.fn();
    renderCard({ saved: false, onToggleSave });
    const heart = screen.getByRole("button", { name: i18n.t("book.save") });
    expect(heart).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(heart);
    expect(onToggleSave).toHaveBeenCalledWith(7);
  });

  it("marks a saved book so it can be removed", () => {
    renderCard({ saved: true, onToggleSave: vi.fn() });
    expect(screen.getByRole("button", { name: i18n.t("book.unsave") })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
