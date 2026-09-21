import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../auth/AuthProvider";
import { getUnread, markConversationRead } from "../chat/chatService";
import MessagePopups from "../components/MessagePopups";
import { NotificationsContext } from "./notifications";

const POLL_MS = 8000;

// Polls unread counts, drives the red badges, and pops a toast whenever a
// conversation gains unread messages that the user isn't already looking at.
export const NotificationsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const openWith = pathname === "/messages" ? Number(params.get("with")) || null : null;

  const unreadKey = useMemo(() => ["unread", user?.id], [user?.id]);
  const { data } = useQuery({
    queryKey: unreadKey,
    queryFn: getUnread,
    enabled: Boolean(user),
    refetchInterval: POLL_MS,
  });

  const items = useMemo(() => (user ? (data?.conversations ?? []) : []), [data, user]);
  const total = user ? (data?.total ?? 0) : 0;

  const [popups, setPopups] = useState([]);
  const previous = useRef(null);
  const openWithRef = useRef(openWith);
  openWithRef.current = openWith;

  // Compare with the last poll; the very first result only seeds the baseline.
  useEffect(() => {
    if (!user || !data) {
      previous.current = null;
      return;
    }
    const before = previous.current;
    previous.current = new Map(items.map((i) => [i.conversationId, i.count]));
    if (!before) return;

    const fresh = items.filter(
      (i) => i.count > (before.get(i.conversationId) ?? 0) && i.otherUser?.id !== openWithRef.current,
    );
    if (fresh.length === 0) return;

    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    fresh.forEach((i) => queryClient.invalidateQueries({ queryKey: ["messages", i.conversationId] }));
    setPopups((current) => {
      const others = current.filter((p) => !fresh.some((f) => f.conversationId === p.conversationId));
      const added = fresh.map((i) => ({ ...i, key: `${i.conversationId}-${i.count}-${Date.now()}` }));
      return [...added, ...others].slice(0, 3);
    });
  }, [data, items, user, queryClient]);

  // Opening a chat clears its popup.
  useEffect(() => {
    if (openWith) setPopups((current) => current.filter((p) => p.otherUser?.id !== openWith));
  }, [openWith]);

  // "(3) Ktebna" in the browser tab while there are unread messages.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\)\s*/, "");
    document.title = total > 0 ? `(${total > 8 ? "9+" : total}) ${base}` : base;
  }, [total]);

  const countFor = useCallback(
    (conversationId) => items.find((i) => i.conversationId === conversationId)?.count ?? 0,
    [items],
  );

  const markRead = useCallback(
    async (conversationId) => {
      if (!conversationId) return;
      queryClient.setQueryData(unreadKey, (old) => {
        if (!old) return old;
        const removed = old.conversations.find((i) => i.conversationId === conversationId);
        if (!removed) return old;
        previous.current?.set(conversationId, 0);
        return {
          total: old.total - removed.count,
          conversations: old.conversations.filter((i) => i.conversationId !== conversationId),
        };
      });
      try {
        await markConversationRead(conversationId);
      } finally {
        queryClient.invalidateQueries({ queryKey: unreadKey });
      }
    },
    [queryClient, unreadKey],
  );

  const value = useMemo(() => ({ total, countFor, markRead }), [total, countFor, markRead]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <MessagePopups
        popups={popups}
        onDismiss={(key) => setPopups((current) => current.filter((p) => p.key !== key))}
      />
    </NotificationsContext.Provider>
  );
};
