export default function MessageBubble({
  message,
  isOwn,
  showName,
  formatTime,
}) {
  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      {showName && !isOwn && (
        <span className="text-xs font-medium text-gray-600 mb-1 px-1">
          {message.users?.name || "Unknown"}
        </span>
      )}

      <div
        className={`group relative px-4 py-2.5 rounded-2xl max-w-[85%] shadow-sm ${
          isOwn
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
        }`}
      >
        <p className="text-sm leading-relaxed break-words">
          {message.message_content}
        </p>

        <span
          className={`text-[10px] mt-1 block ${
            isOwn ? "text-blue-100" : "text-gray-400"
          }`}
        >
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
