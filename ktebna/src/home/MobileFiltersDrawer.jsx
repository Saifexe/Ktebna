import React from "react";
import { Filter, X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HomeFilterPanel from "./HomeFilterPanel";
import { useTranslation } from "react-i18next";
const DRAWER_ANIMATION = {
  initial: { x: -320 },
  animate: { x: 0 },
  exit: { x: -320 },
  transition: { type: "spring", stiffness: 260, damping: 30 },
};

const MobileFiltersDrawer = ({
  open,
  onClose,
  category,
  setCategory,
  dealType,
  setDealType,
}) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        >
          <motion.div
            {...DRAWER_ANIMATION}
            className="absolute inset-y-0 left-0 w-[85%] max-w-xs overflow-y-auto border-r border-stone-800/20 bg-stone-50 p-4 shadow-xl dark:border-stone-700/50 dark:bg-stone-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                <span className="font-semibold">{t("header.filters")}</span>
              </div>
              <button
                className="rounded-xl border border-stone-300 bg-white/70 p-2 dark:border-stone-700 dark:bg-stone-800"
                onClick={onClose}
                aria-label="Close filters"
              >
                <X size={14} />
              </button>
            </div>
            <HomeFilterPanel
              category={category}
              setCategory={setCategory}
              dealType={dealType}
              setDealType={setDealType}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileFiltersDrawer;
