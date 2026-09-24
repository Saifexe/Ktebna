// Thin wrapper around the Spring Boot messaging endpoints. The backend
// (MessageController) handles get-or-create conversation and the email
// notification in a single call - see POST /api/messages.
import apiClient from "../apiClient";

export const getConversationWith = async (otherUserId) => {
  const { data } = await apiClient.get(`/api/conversations/with/${otherUserId}`);
  return data; // ConversationResponse | null
};

// The whole thread, oldest first; with afterId, only the messages newer than it.
export const getMessages = async (conversationId, afterId) => {
  if (!conversationId) return [];
  const url = `/api/conversations/${conversationId}/messages`;
  const { data } = afterId ? await apiClient.get(url, { params: { afterId } }) : await apiClient.get(url);
  return data; // MessageResponse[]
};

export const sendMessage = async ({ otherUserId, bookName, messageContent }) => {
  const { data } = await apiClient.post("/api/messages", {
    otherUserId,
    bookName,
    messageContent,
  });
  return data; // { conversation, message }
};

export const getMyConversations = async () => {
  const { data } = await apiClient.get("/api/conversations");
  return data; // ConversationResponse[]
};

export const getUnread = async () => {
  const { data } = await apiClient.get("/api/conversations/unread");
  return data; // { total, conversations: [{ conversationId, count, otherUser, ... }] }
};

export const markConversationRead = async (conversationId) => {
  await apiClient.post(`/api/conversations/${conversationId}/read`);
};
