import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import UnreadBadge from "./UnreadBadge";

describe("UnreadBadge", () => {
  it("stays hidden when nothing is unread", () => {
    const { container } = render(<UnreadBadge count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows counts up to 8 as they are", () => {
    render(<UnreadBadge count={8} />);
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("switches to 9+ from 9 messages on", () => {
    render(<UnreadBadge count={9} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("caps larger counts at 9+", () => {
    render(<UnreadBadge count={42} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });
});
