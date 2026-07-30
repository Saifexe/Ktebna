import { Send } from "lucide-react";
import MessageBubble from "./MessageBubble";

export default function MessageList({
  messages,
  userId,
  bookName,
  formatTime,
  messagesEndRef,
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <Send size={28} className="text-blue-600" />
        </div>
        <p className="text-gray-500 text-sm font-medium mb-1">
          No messages yet
        </p>
        <p className="text-gray-400 text-xs">
          Start a conversation about {bookName || "this book"}
        </p>
      </div>
    );
  }

  return (
    <>
      {messages.map((m, idx) => {
        const isOwn = m.user_id === userId;
        const showName = idx === 0 || messages[idx - 1].user_id !== m.user_id;

        return (
          <MessageBubble
            key={m.id}
            message={m}
            isOwn={isOwn}
            showName={showName}
            formatTime={formatTime}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </>
  );
}
