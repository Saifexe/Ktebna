// Thin wrapper around the Spring Boot messaging endpoints. The backend
// (MessageController) handles get-or-create conversation, the 2-message
// limit, and the email notification in a single call - see POST /api/messages.
import apiClient from "../apiClient";

export const getConversationWith = async (otherUserId) => {
  const { data } = await apiClient.get(`/api/conversations/with/${otherUserId}`);
  return data; // ConversationResponse | null
};

export const getMessages = async (conversationId) => {
  if (!conversationId) return [];
  const { data } = await apiClient.get(
    `/api/conversations/${conversationId}/messages`,
  );
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
