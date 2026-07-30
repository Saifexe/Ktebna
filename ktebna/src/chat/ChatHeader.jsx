import { X, BookOpen } from "lucide-react";

export default function ChatHeader({
  otherUserName,
  bookName,
  conversationTopic,
  onClose,
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
          {otherUserName?.charAt(0)?.toUpperCase() || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 truncate">
            {otherUserName || "User"}
          </h2>

          {(bookName || conversationTopic) && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <BookOpen size={12} />
              <span className="truncate">{bookName || conversationTopic}</span>
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
  );
}
