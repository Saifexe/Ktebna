// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";

// Red unread counter: 1–8 as-is, then "9+". Pops when the number changes.
const badgeLabel = (count) => (count > 8 ? "9+" : String(count));

const UnreadBadge = ({ count, className = "" }) => (
  <AnimatePresence>
    {count > 0 && (
      <motion.span
        key={badgeLabel(count)}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        aria-hidden="true"
        className={`pointer-events-none grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background ${className}`}
      >
        {badgeLabel(count)}
      </motion.span>
    )}
  </AnimatePresence>
);

export default UnreadBadge;
