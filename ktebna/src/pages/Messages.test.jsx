import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { getConversationWith, getMessages, getMyConversations, sendMessage } from "../chat/chatService";
import { NotificationsContext } from "../context/notifications";
import { renderPage } from "../test/renderPage";
import Messages from "./Messages";

vi.mock("../chat/chatService", () => ({
  getConversationWith: vi.fn(),
  getMessages: vi.fn(),
  getMyConversations: vi.fn(),
  sendMessage: vi.fn(),
}));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const me = { id: 1, name: "Saif" };
const amira = { id: 5, name: "Amira" };
const karim = { id: 6, name: "Karim" };

const withAmira = {
  id: 11,
  firstUser: amira,
  secondUser: me,
  conversationTopic: "Dune",
  lastMessageContent: "Is it still available?",
  lastMessageSender: 5,
};
const withKarim = {
  id: 12,
  firstUser: me,
  secondUser: karim,
  lastMessageContent: "Thanks!",
  lastMessageSender: 1,
};

const thread = [
  { id: 100, userId: 5, messageContent: "Is it still available?", createdAt: "2026-09-23T09:00:00Z" },
  { id: 101, userId: 1, messageContent: "Yes, it is.", createdAt: "2026-09-23T09:05:00Z" },
];

const open = (path, unread = { 11: 2 }) => {
  const notifications = {
    total: 0,
    countFor: (id) => unread[id] ?? 0,
    markRead: vi.fn(),
  };
  const view = renderPage(
    <NotificationsContext.Provider value={notifications}>
      <Messages />
    </NotificationsContext.Provider>,
    { path, route: "/messages", user: me },
  );
  return { ...view, markRead: notifications.markRead };
};

describe("Messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    getMyConversations.mockResolvedValue([withAmira, withKarim]);
    getMessages.mockResolvedValue(thread);
  });

  it("lists conversations with the other reader, topic, last message and unread count", async () => {
    open("/messages");
    const amiraRow = (await screen.findByText("Amira")).closest("button");
    expect(within(amiraRow).getByText("Dune")).toBeInTheDocument();
    expect(within(amiraRow).getByText("Is it still available?")).toBeInTheDocument();
    expect(within(amiraRow).getByText("2")).toBeInTheDocument();
    // My own last message is prefixed with "You".
    expect(screen.getByText("You: Thanks!")).toBeInTheDocument();
    expect(screen.getByText("Select a conversation")).toBeInTheDocument();
  });

  it("opens a thread and marks it read", async () => {
    const { markRead } = open("/messages");
    await userEvent.click(await screen.findByText("Amira"));

    expect(screen.getByTestId("url")).toHaveTextContent("/messages?with=5");
    expect(await screen.findByText("Yes, it is.")).toBeInTheDocument();
    expect(getMessages).toHaveBeenCalledWith(11);
    await waitFor(() => expect(markRead).toHaveBeenCalledWith(11));
  });

  it("refreshes an open thread by fetching only the messages after the last one shown", async () => {
    const newer = { id: 999, userId: 5, messageContent: "Saturday works for me", createdAt: "2026-09-23T09:20:00Z" };
    getMessages.mockImplementation(async (id, afterId) => (afterId ? [newer] : thread));
    const { client } = open("/messages?with=5", {});
    expect(await screen.findByText("Yes, it is.")).toBeInTheDocument();

    // What the 5-second poll does.
    await act(() => client.refetchQueries({ queryKey: ["messages", 11] }));

    expect(getMessages).toHaveBeenLastCalledWith(11, thread[thread.length - 1].id);
    expect(await screen.findByText("Saturday works for me")).toBeInTheDocument();
    expect(screen.getByText("Yes, it is.")).toBeInTheDocument();
  });

  it("sends a reply in the open thread", async () => {
    sendMessage.mockResolvedValue({
      conversation: { id: 11 },
      message: { id: 102, userId: 1, messageContent: "See you at 5?", createdAt: "2026-09-23T09:10:00Z" },
    });
    open("/messages?with=5");
    const box = await screen.findByRole("textbox", { name: "Write a message…" });
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toBeDisabled();

    await userEvent.type(box, "  See you at 5?  ");
    await userEvent.click(send);

    expect(sendMessage).toHaveBeenCalledWith({ otherUserId: 5, bookName: "Dune", messageContent: "See you at 5?" });
    expect(await screen.findByText("See you at 5?")).toBeInTheDocument();
    expect(box).toHaveValue("");
  });

  it("starts a new chat from a book page", async () => {
    getMyConversations.mockResolvedValue([]);
    getConversationWith.mockResolvedValue(null);
    open("/messages?with=9&name=Leila&book=Meditations", {});

    expect(await screen.findByText("Leila")).toBeInTheDocument();
    expect(screen.getByText(/About/)).toHaveTextContent("About Meditations");
    expect(screen.getByText("Say hello and ask about “Meditations”.")).toBeInTheDocument();
    await waitFor(() => expect(getConversationWith).toHaveBeenCalledWith(9));
  });

  it("shows the server's reason when a message can't be sent", async () => {
    sendMessage.mockRejectedValue({ response: { data: { error: "Message too long" } } });
    open("/messages?with=5");
    await userEvent.type(await screen.findByRole("textbox"), "Hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Message too long"));
  });

  it("links the chat header to the other reader's profile", async () => {
    open("/messages?with=5");
    expect(await screen.findByRole("link", { name: "View profile: Amira" })).toHaveAttribute("href", "/user/5");
  });

  it("goes back to the list on mobile", async () => {
    open("/messages?with=5");
    await userEvent.click(await screen.findByRole("button", { name: "Back to conversations" }));
    expect(screen.getByTestId("url")).toHaveTextContent(/^\/messages$/);
  });

  it("invites new readers to start a conversation", async () => {
    getMyConversations.mockResolvedValue([]);
    open("/messages");
    expect(await screen.findByText("No conversations yet")).toBeInTheDocument();
  });
});
