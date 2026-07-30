// Kept for backwards-compatible naming with the original project structure;
// delegates to the same REST endpoints as chatService.js.
import { getConversationWith, getMyConversations } from "./chatService";

export const getConversation = getConversationWith;
export const listConversations = getMyConversations;
