// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, MessageCircle, X } from "lucide-react";
import Avatar from "../ui/Avatar";

const POPUP_SECONDS = 6;

// Each card dismisses itself; the bar along its bottom shows the time left.
const AutoDismiss = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, POPUP_SECONDS * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <motion.span
      initial={{ scaleX: 1 }}
      animate={{ scaleX: 0 }}
      transition={{ duration: POPUP_SECONDS, ease: "linear" }}
      className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary rtl:origin-right"
    />
  );
};

// Stack of "you've got a message" cards that spring in from the top corner.
const MessagePopups = ({ popups, onDismiss }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const fromSide = i18n.dir() === "rtl" ? -80 : 80;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-20 z-[60] flex flex-col items-end gap-3 sm:inset-x-auto sm:end-4 sm:w-96"
    >
      <AnimatePresence initial={false}>
        {popups.map((p) => (
          <motion.div
            key={p.key}
            layout
            initial={{ opacity: 0, x: fromSide, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: fromSide, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="pointer-events-auto relative w-full overflow-hidden rounded-lg border bg-card shadow-lg"
          >
            <button
              type="button"
              onClick={() => {
                onDismiss(p.key);
                navigate(`/messages?with=${p.otherUser.id}`);
              }}
              className="flex w-full items-start gap-3 p-4 pe-10 text-start transition-colors hover:bg-muted/60"
              aria-label={t("notifications.open")}
            >
              <span className="relative shrink-0">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                <Avatar src={p.otherUser?.profilePicture} name={p.otherUser?.name} className="relative size-11" />
                <span className="absolute -bottom-1 -end-1 grid size-5 place-items-center rounded-full bg-red-600 text-white ring-2 ring-card">
                  <MessageCircle className="size-3" />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase text-primary">
                  {p.count > 1 ? t("notifications.newMessages", { count: p.count }) : t("notifications.newMessage")}
                </span>
                <span className="block truncate font-bold">{p.otherUser?.name}</span>
                {p.conversationTopic && (
                  <span className="flex items-center gap-1 truncate text-xs text-trust">
                    <BookOpen className="size-3 shrink-0" /> {p.conversationTopic}
                  </span>
                )}
                <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.lastMessageContent}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDismiss(p.key)}
              className="absolute end-2 top-2 grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label={t("notifications.dismiss")}
            >
              <X className="size-4" />
            </button>
            <AutoDismiss onDone={() => onDismiss(p.key)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MessagePopups;
