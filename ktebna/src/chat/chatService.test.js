import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../apiClient";
import {
  getConversationWith,
  getMessages,
  getMyConversations,
  getUnread,
  markConversationRead,
  sendMessage,
} from "./chatService";

vi.mock("../apiClient", () => import("../test/apiClientMock"));

describe("chatService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockImplementation(async (url) => ({ data: `GET ${url}` }));
    apiClient.post.mockImplementation(async (url, body) => ({ data: { url, body } }));
  });

  it("reads conversations, a thread and unread counts from the right endpoints", async () => {
    expect(await getMyConversations()).toBe("GET /api/conversations");
    expect(await getConversationWith(5)).toBe("GET /api/conversations/with/5");
    expect(await getMessages(11)).toBe("GET /api/conversations/11/messages");
    expect(await getUnread()).toBe("GET /api/conversations/unread");
  });

  it("asks only for newer messages when given the last one seen", async () => {
    await getMessages(11, 40);
    expect(apiClient.get).toHaveBeenCalledWith("/api/conversations/11/messages", { params: { afterId: 40 } });
  });

  it("returns no messages for a chat that doesn't exist yet", async () => {
    expect(await getMessages(null)).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("sends a message with its book topic", async () => {
    const result = await sendMessage({ otherUserId: 5, bookName: "Dune", messageContent: "Hi" });
    expect(result).toEqual({
      url: "/api/messages",
      body: { otherUserId: 5, bookName: "Dune", messageContent: "Hi" },
    });
  });

  it("marks a conversation read", async () => {
    await markConversationRead(11);
    expect(apiClient.post).toHaveBeenCalledWith("/api/conversations/11/read");
  });
});
