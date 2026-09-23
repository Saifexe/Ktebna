import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import apiClient from "../apiClient";
import { renderPage } from "../test/renderPage";
import ShareBook from "./ShareBook";

vi.mock("../apiClient", () => import("../test/apiClientMock"));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const [titleBox, authorBox] = [0, 1];
const textboxes = () => screen.getAllByRole("textbox");
const share = () => userEvent.click(screen.getByRole("button", { name: "Share in the library" }));
const open = () => renderPage(<ShareBook />, { path: "/books/new", route: "/books/new", user: { id: 3 } });

const fillValid = async () => {
  await userEvent.type(textboxes()[titleBox], " Les Misérables ");
  await userEvent.type(textboxes()[authorBox], "Victor Hugo");
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Language" }), "fr");
  await userEvent.type(screen.getByPlaceholderText("https://…/book.pdf"), "https://example.org/m.pdf");
};

describe("ShareBook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:cover");
    URL.revokeObjectURL = vi.fn();
  });

  it("reminds readers to share only legal copies", () => {
    open();
    expect(screen.getByText(/Never share pirated copies/)).toBeInTheDocument();
  });

  it("requires a title, a language and a PDF link", async () => {
    open();
    await share();
    expect(screen.getAllByText("This field is required")).toHaveLength(3);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("only accepts web links for the PDF", async () => {
    open();
    await fillValid();
    const link = screen.getByPlaceholderText("https://…/book.pdf");
    await userEvent.clear(link);
    await userEvent.type(link, "javascript:alert(1)");
    await share();
    expect(screen.getByText("Enter a link that starts with http:// or https://")).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("shares the book with a cover and opens its page", async () => {
    apiClient.post.mockResolvedValue({ data: { id: 12 } });
    open();
    await fillValid();
    const cover = new File(["jpeg"], "cover.jpg", { type: "image/jpeg" });
    await userEvent.upload(document.querySelector('input[type="file"]'), cover);
    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", "blob:cover");
    await share();

    const [url, body] = apiClient.post.mock.calls[0];
    expect(url).toBe("/api/library");
    expect(Object.fromEntries(body.entries())).toMatchObject({
      title: "Les Misérables",
      author: "Victor Hugo",
      language: "fr",
      pdfUrl: "https://example.org/m.pdf",
      image: cover,
    });
    // Empty optional fields aren't sent.
    expect(body.has("category")).toBe(false);
    expect(toast.success).toHaveBeenCalledWith("Book added to the library!");
    expect(screen.getByTestId("url")).toHaveTextContent("/books/12");
  });

  it("shows the server's reason when sharing fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiClient.post.mockRejectedValue({ response: { data: { error: "Link already shared" } } });
    open();
    await fillValid();
    await share();
    expect(toast.error).toHaveBeenCalledWith("Link already shared");
    expect(screen.getByTestId("url")).toHaveTextContent("/books/new");
  });
});
