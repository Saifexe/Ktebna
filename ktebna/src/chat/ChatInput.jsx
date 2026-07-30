import { Send } from "lucide-react";

export default function ChatInput({
  input,
  setInput,
  onSend,
  onKeyPress,
  sending,
  canSendMore,
  inputRef,
  userMessageCount,
  messageLimit,
}) {
  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder={
              canSendMore ? "Type a message..." : "Message limit reached"
            }
            disabled={!canSendMore || sending}
            rows={1}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 transition-all text-sm"
            style={{ minHeight: "44px", maxHeight: "120px" }}
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
          onClick={onSend}
          disabled={!input.trim() || sending || !canSendMore}
          className={`p-3 rounded-full transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
            sending
              ? "bg-blue-400"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95"
          }`}
        >
          <Send
            size={20}
            className={`text-white ${sending ? "animate-pulse" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
