import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import BookCover from "./BookCover";

describe("BookCover", () => {
  it("shows the uploaded cover", () => {
    render(<BookCover src="https://example.com/dune.jpg" alt="Dune" />);
    expect(screen.getByRole("img", { name: "Dune" })).toHaveAttribute("src", "https://example.com/dune.jpg");
  });

  it("shows a placeholder when the listing has no cover", () => {
    render(<BookCover src={null} alt="Dune" />);
    expect(screen.getByRole("img", { name: "Dune" }).tagName).toBe("DIV");
  });

  it("swaps a broken image for the placeholder", () => {
    render(<BookCover src="https://example.com/missing.jpg" alt="Dune" />);
    fireEvent.error(screen.getByRole("img", { name: "Dune" }));
    expect(screen.getByRole("img", { name: "Dune" }).tagName).toBe("DIV");
  });
});
