import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import apiClient from "../apiClient";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const HomeBook = ({
  book,
  userId,
  isSaved: isSavedProp = false,
  setOpenLogin,
  onClick,
  handleOpenContactDrawer,
}) => {
  const { t } = useTranslation();
  const [isSaved, setIsSaved] = useState(isSavedProp);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setIsSaved(isSavedProp);
  }, [isSavedProp]);

  const handleToggleSave = async (postId) => {
    if (!userId) {
      setOpenLogin(true);
      return;
    }
    setSaving(true);
    try {
      if (isSaved) {
        await apiClient.delete(`/api/saved-posts/${postId}`);
        setIsSaved(false);
      } else {
        await apiClient.post(`/api/saved-posts/${postId}`);
        setIsSaved(true);
      }
    } catch (err) {
      if (err?.response?.status === 400) {
        toast.error(t("bookCard.maxSavedReached"));
      } else {
        console.error("Save toggle failed:", err);
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onClick={onClick}
      className="group relative rounded-b-2xl border border-stone-200/60 bg-stone-50 shadow-sm transition hover:shadow-lg dark:border-stone-800/60 dark:bg-stone-900 cursor-pointer"
    >
      {book.bookDealType && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-amber-600/95 px-2.5 py-1 text-xs font-medium text-amber-50 shadow">
          {t(`filterPanel.${book.bookDealType.toLowerCase()}`)}
        </div>
      )}

      <div className="relative w-full rounded-xl p-1 pb-4 shadow-inner">
        <img src={book.bookImage} className="w-full aspect-3/4 object-cover" />
      </div>

      <div className="px-3 pb-3">
        <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100 line-clamp-2 truncate">
          <span className="text-sm text-amber-700">
            {t("BookDrawer.have")}:
          </span>{" "}
          {book.bookName}
        </h3>
        <p className="text-sm text-black dark:text-stone-400">
          {book.user?.name}
          <span className="text-sm text-stone-600 dark:text-stone-400">
            ({book.bookLocation})
          </span>
        </p>
        <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100 line-clamp-2 truncate">
          <span className="text-sm text-amber-700">
            {t("BookDrawer.want")}:
          </span>{" "}
          {book.bookDeal}
        </h3>

        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSave(book.id);
              }}
              disabled={saving}
              className="w-1/2 flex justify-center items-center gap-1 rounded-xl border border-stone-300 bg-white/70 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 active:scale-[0.98] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 max-w-[50%]"
              aria-label="Add to wishlist"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              <span className="hidden sm:inline truncate">
                {isSaved ? t("bookCard.saved") : t("bookCard.save")}
              </span>
            </button>

            <button
              className="w-1/2 flex justify-center items-center gap-1 rounded-xl border border-amber-700 bg-amber-50 py-2 text-sm font-medium hover:bg-amber-100 active:scale-[0.98] "
              onClick={(e) => {
                e.stopPropagation();
                handleOpenContactDrawer();
              }}
            >
              <span className="truncate text-center text-amber-700">
                {t("bookCard.contact")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomeBook;
