import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../auth/AuthProvider";
import { getUnread, markConversationRead } from "../chat/chatService";
import { NotificationsContext } from "./notifications";
import { NotificationsProvider } from "./NotificationsProvider";

vi.mock("../chat/chatService", () => ({
  getUnread: vi.fn(),
  markConversationRead: vi.fn().mockResolvedValue(undefined),
}));

const amira = { id: 5, name: "Amira" };
const unread = (count) => ({
  total: count,
  conversations: count
    ? [{ conversationId: 11, count, otherUser: amira, lastMessageContent: "Is Dune still available?" }]
    : [],
});

// Shows what the header badge and inbox read from the context.
const Probe = () => {
  const { total, countFor, markRead } = useContext(NotificationsContext);
  return (
    <>
      <p>total {total}</p>
      <p>chat {countFor(11)}</p>
      <button type="button" onClick={() => markRead(11)}>
        read
      </button>
    </>
  );
};

const setup = ({ user = { id: 1 }, path = "/" } = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={{ user }}>
        <MemoryRouter initialEntries={[path]}>
          <NotificationsProvider>
            <Probe />
          </NotificationsProvider>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  // Stands in for the 8-second poll.
  return () => act(() => client.refetchQueries({ queryKey: ["unread"] }));
};

describe("NotificationsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = "Ktebna";
  });

  it("exposes the unread totals and shows them in the tab title", async () => {
    getUnread.mockResolvedValue(unread(3));
    setup();
    expect(await screen.findByText("total 3")).toBeInTheDocument();
    expect(screen.getByText("chat 3")).toBeInTheDocument();
    expect(document.title).toBe("(3) Ktebna");
  });

  it("caps the tab title at 9+", async () => {
    getUnread.mockResolvedValue(unread(12));
    setup();
    await waitFor(() => expect(document.title).toBe("(9+) Ktebna"));
  });

  it("doesn't pop up for messages that were already unread on page load", async () => {
    getUnread.mockResolvedValue(unread(2));
    setup();
    await screen.findByText("total 2");
    expect(screen.queryByText("Amira")).not.toBeInTheDocument();
  });

  it("pops up when a new message arrives", async () => {
    getUnread.mockResolvedValue(unread(1));
    const poll = setup();
    await screen.findByText("total 1");

    getUnread.mockResolvedValue(unread(2));
    await poll();

    expect(await screen.findByText("Amira")).toBeInTheDocument();
    expect(screen.getByText("Is Dune still available?")).toBeInTheDocument();
    expect(screen.getByText("2 new messages")).toBeInTheDocument();
  });

  it("stays quiet when the reader already has that chat open", async () => {
    getUnread.mockResolvedValue(unread(1));
    const poll = setup({ path: "/messages?with=5" });
    await screen.findByText("total 1");

    getUnread.mockResolvedValue(unread(2));
    await poll();

    await screen.findByText("total 2");
    expect(screen.queryByText("Amira")).not.toBeInTheDocument();
  });

  it("clears a conversation's count as soon as it is read", async () => {
    getUnread.mockResolvedValue(unread(4));
    setup();
    await screen.findByText("total 4");

    getUnread.mockResolvedValue(unread(0));
    await userEvent.click(screen.getByRole("button", { name: "read" }));

    expect(await screen.findByText("total 0")).toBeInTheDocument();
    expect(markConversationRead).toHaveBeenCalledWith(11);
    expect(document.title).toBe("Ktebna");
  });

  it("does nothing for visitors who aren't logged in", async () => {
    setup({ user: null });
    expect(screen.getByText("total 0")).toBeInTheDocument();
    expect(getUnread).not.toHaveBeenCalled();
  });
});
