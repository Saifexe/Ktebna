import { useContext } from "react";
import { NotificationsContext } from "../context/notifications";

// Unread message counts for the badges, the inbox list and read receipts.
export const useUnread = () => useContext(NotificationsContext);
