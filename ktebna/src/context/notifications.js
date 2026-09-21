import { createContext } from "react";

// { total, countFor(conversationId), markRead(conversationId) }; see NotificationsProvider.
export const NotificationsContext = createContext({
  total: 0,
  countFor: () => 0,
  markRead: () => {},
});
