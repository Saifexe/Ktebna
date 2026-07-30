import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../auth/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Send, BookOpen, AlertCircle } from "lucide-react";
import { getConversationWith, getMessages, sendMessage } from "./chatService";
import { useTranslation } from "react-i18next";

export default function ChatDrawer({
  open,
  onClose,
  otherUserId,
  otherUserName,
  userName,
  bookName,
}) {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const queryClient = useQueryClient();

  const { data: conversation } = useQuery({
    queryKey: ["conversation", user?.id, otherUserId],
    queryFn: () => getConversationWith(otherUserId),
    enabled: !!user?.id && !!otherUserId && open,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: () => getMessages(conversation?.id),
    enabled: !!conversation?.id,
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (messageContent) =>
      sendMessage({ otherUserId, bookName, messageContent }),
    onMutate: () => {
      setSending(true);
    },
    onSuccess: (data) => {
      if (!conversation) {
        queryClient.invalidateQueries(["conversation", user?.id, otherUserId]);
      }
      queryClient.invalidateQueries(["messages", data.conversation.id]);
      queryClient.setQueryData(
        ["messages", data.conversation.id],
        (old = []) => [...old, data.message],
      );
      setInput("");
      setSending(false);
    },
    onError: (err) => {
      alert(
        err.response?.data?.error || err.message || "Failed to send message",
      );
      setSending(false);
    },
  });

  const handleSend = () => {
    if (input.trim() && !sending) {
      sendMessageMutation.mutate(input);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const userMessageCount = messages.filter((m) => m.userId === user?.id).length;
  const messageLimit = 2;
  const canSendMore = userMessageCount < messageLimit;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-[100dvh] w-4/5 sm:w-[420px] bg-gradient-to-b from-gray-50 to-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {otherUserName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 truncate">
                {otherUserName || "User"}
              </h2>
              {(bookName || conversation?.conversationTopic) && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <BookOpen size={12} />
                  <span className="truncate">
                    {bookName || conversation?.conversationTopic}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Message Limit Warning */}
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          <div className="flex items-start gap-2">
            <AlertCircle
              size={16}
              className="text-amber-600 mt-0.5 flex-shrink-0"
            />
            <p className="text-xs text-amber-800">
              {t("chatDrawer.messageLimitWarning")}
            </p>
          </div>
        </div>
        {!canSendMore && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-start gap-2">
              <AlertCircle
                size={16}
                className="text-amber-600 mt-0.5 flex-shrink-0"
              />
              <p className="text-xs text-amber-800">
                {t("chatDrawer.messageLimitReached")}
              </p>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Send size={28} className="text-amber-600" />
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                {t("chatDrawer.noMessagesYet")}
              </p>
              <p className="text-gray-400 text-xs">
                {t("chatDrawer.startConversation")}{" "}
                {bookName || t("chatDrawer.thisBook")}
              </p>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => {
                const isOwn = m.userId === user?.id;
                const showName =
                  idx === 0 || messages[idx - 1].userId !== m.userId;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      isOwn ? "items-end" : "items-start"
                    }`}
                  >
                    {showName && !isOwn && (
                      <span className="text-xs font-medium text-gray-600 mb-1 px-1">
                        {m.userName || "Unknown"}
                      </span>
                    )}
                    <div
                      className={`group relative px-4 py-2.5 rounded-2xl max-w-[85%] shadow-sm transition-all ${
                        isOwn
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">
                        {m.messageContent}
                      </p>
                      <span
                        className={`text-[10px] mt-1 block ${
                          isOwn ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  canSendMore
                    ? t("chatDrawer.typeMessage")
                    : t("chatDrawer.messageLimitReachedPlaceholder")
                }
                disabled={!canSendMore || sending}
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 transition-all text-sm"
                style={{
                  minHeight: "44px",
                  maxHeight: "120px",
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {userMessageCount}/{messageLimit}
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || !canSendMore}
              className={`p-3 rounded-full transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
                sending
                  ? "bg-amber-400"
                  : "bg-amber-600 hover:bg-amber-700 active:scale-95"
              }`}
            >
              <Send
                size={20}
                className={`text-white ${sending ? "animate-pulse" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
