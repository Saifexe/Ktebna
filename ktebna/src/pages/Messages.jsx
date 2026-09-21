import { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { BookOpen, ChevronLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { AuthContext } from "../auth/AuthProvider";
import { getConversationWith, getMessages, getMyConversations, sendMessage } from "../chat/chatService";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import UnreadBadge from "../ui/UnreadBadge";
import { useUnread } from "../hooks/useUnread";
import { timeAgo } from "../lib/listing";

const otherParticipant = (conv, userId) =>
  conv.firstUser?.id === userId ? conv.secondUser : conv.firstUser;

// Two-pane inbox from the Lovable redesign. The open thread is addressed by
// ?with=<userId> so book pages can deep-link into a (possibly new) chat.
const Messages = () => {
  const { t, i18n } = useTranslation();
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const withId = Number(params.get("with")) || null;
  const [draft, setDraft] = useState("");
  const { countFor, markRead } = useUnread();
  const [pageVisible, setPageVisible] = useState(document.visibilityState === "visible");
  const endRef = useRef(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getMyConversations,
    refetchInterval: 15000,
  });

  const listed = conversations.find((c) => otherParticipant(c, user.id)?.id === withId);

  // A conversation opened from a book page may not be in the list yet.
  const { data: fetched } = useQuery({
    queryKey: ["conversation", user.id, withId],
    queryFn: () => getConversationWith(withId),
    enabled: Boolean(withId) && !listed && !isLoading,
  });
  const conversation = listed || fetched || null;

  const other = conversation
    ? otherParticipant(conversation, user.id)
    : withId
      ? { id: withId, name: params.get("name") || t("chatDrawer.user") }
      : null;
  const topic = conversation?.conversationTopic || params.get("book") || "";

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: () => getMessages(conversation.id),
    enabled: Boolean(conversation?.id),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const onChange = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  // Reading the open thread clears its unread count (only while the tab is visible).
  const unreadHere = countFor(conversation?.id);
  useEffect(() => {
    if (!conversation?.id || unreadHere === 0 || !pageVisible) return;
    queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
    markRead(conversation.id);
  }, [conversation?.id, unreadHere, pageVisible, markRead, queryClient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, withId]);

  const send = useMutation({
    mutationFn: (content) =>
      sendMessage({ otherUserId: withId, bookName: topic || undefined, messageContent: content }),
    onSuccess: (data) => {
      queryClient.setQueryData(["messages", data.conversation.id], (old = []) => [...old, data.message]);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation", user.id, withId] });
      setDraft("");
    },
    onError: (err) => toast.error(err?.response?.data?.error || t("chatDrawer.sendError")),
  });

  const submit = (e) => {
    e.preventDefault();
    if (draft.trim() && !send.isPending) send.mutate(draft.trim());
  };

  const open = (conv) => {
    const o = otherParticipant(conv, user.id);
    setParams({ with: String(o.id) });
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="mx-auto grid max-w-6xl md:min-h-[calc(100vh-4rem)] md:grid-cols-[320px_1fr]">
      <aside className={`border-e p-4 ${withId ? "hidden md:block" : ""}`}>
        <h1 className="font-display text-2xl font-bold">{t("messagesPage.title")}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{t("messagesPage.note")}</p>

        {isLoading ? (
          <Spinner />
        ) : conversations.length === 0 && !withId ? (
          <div className="mt-8 text-center">
            <MessageCircle className="mx-auto size-10 text-primary" />
            <p className="mt-3 font-bold">{t("messagesPage.empty")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("messagesPage.emptyText")}</p>
            <Button to="/" variant="outline" className="mt-4">
              {t("savedPage.browse")}
            </Button>
          </div>
        ) : (
          <ul className="mt-2">
            {conversations.map((conv) => {
              const o = otherParticipant(conv, user.id);
              const active = o?.id === withId;
              const mine = conv.lastMessageSender === user.id;
              const unread = active ? 0 : countFor(conv.id);
              return (
                <li key={conv.id}>
                  <button
                    onClick={() => open(conv)}
                    className={`mt-2 flex w-full items-center gap-3 rounded-md p-3 text-start transition-colors ${
                      active ? "bg-accent" : "hover:bg-muted"
                    }`}
                  >
                    <Avatar src={o?.profilePicture} name={o?.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <b className="truncate">{o?.name}</b>
                        <span
                          className={`shrink-0 text-[10px] ${unread ? "font-bold text-red-600" : "text-muted-foreground"}`}
                        >
                          {timeAgo(conv.updatedAt, i18n.language)}
                        </span>
                      </div>
                      {conv.conversationTopic && (
                        <p className="truncate text-xs text-primary">{conv.conversationTopic}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <p
                          className={`min-w-0 flex-1 truncate text-xs ${
                            unread ? "font-semibold text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {mine && `${t("messagesPage.you")}: `}
                          {conv.lastMessageContent}
                        </p>
                        <UnreadBadge count={unread} className="ring-0" />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section
        className={`flex h-[calc(100dvh-8rem)] flex-col p-4 md:h-[calc(100vh-4rem)] ${
          withId ? "" : "hidden md:flex"
        }`}
      >
        {!other ? (
          <div className="grid flex-1 place-items-center">
            <EmptyState
              icon={MessageCircle}
              title={t("messagesPage.select")}
              text={t("messagesPage.selectText")}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b pb-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setParams({})}
                aria-label={t("messagesPage.back")}
              >
                <ChevronLeft className="rtl:rotate-180" />
              </Button>
              <Avatar src={other.profilePicture} name={other.name} />
              <div className="min-w-0">
                <b className="block truncate">{other.name}</b>
                {topic && (
                  <p className="flex items-center gap-1 truncate text-xs text-trust">
                    <BookOpen className="size-3 shrink-0" /> {t("messagesPage.about")} {topic}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto py-6">
              {loadingMessages ? (
                <Spinner />
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {topic ? t("messagesPage.start", { book: topic }) : t("messagesPage.startGeneric")}
                </p>
              ) : (
                messages.map((m) => {
                  const own = m.userId === user.id;
                  return (
                    <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-md rounded-lg p-3 ${
                          own ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-line break-words">{m.messageContent}</p>
                        <span
                          className={`mt-1 block text-[10px] ${
                            own ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(m.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={submit} className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("messagesPage.placeholder")}
                aria-label={t("messagesPage.placeholder")}
                className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                type="submit"
                size="icon"
                className="size-11"
                disabled={!draft.trim() || send.isPending}
                aria-label={t("messagesPage.send")}
              >
                {send.isPending ? <Loader2 className="animate-spin" /> : <Send className="rtl:-scale-x-100" />}
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
};

export default Messages;
