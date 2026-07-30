// Kept for backwards-compatible naming with the original project structure;
// delegates to the same REST endpoints as chatService.js. The message limit
// check and email notification are now handled entirely server-side.
import { getMessages, sendMessage } from "./chatService";

export { getMessages, sendMessage };
