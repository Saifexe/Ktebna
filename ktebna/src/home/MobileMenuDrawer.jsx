import React from "react";
import { Menu, X, Home, BookOpen, Info, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const DRAWER_ANIMATION = {
  initial: { x: -320 },
  animate: { x: 0 },
  exit: { x: -320 },
  transition: { type: "spring", stiffness: 260, damping: 30 },
};

const MobileMenuDrawer = ({ open, onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const links = [
    { to: "/", label: t("header.home"), icon: Home },
    { to: "/books", label: t("header.books"), icon: BookOpen },
    { to: "/about", label: t("header.about"), icon: Info },
    { to: "/contact", label: t("header.contact"), icon: Mail },
  ];

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
            className="absolute inset-y-0 left-0 w-[85%] max-w-xs border-r border-stone-800/20 bg-stone-50 p-4 shadow-xl dark:border-stone-700/50 dark:bg-stone-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                <span className="font-semibold">{t("header.menu")}</span>
              </div>
              <button
                className="rounded-xl border border-stone-300 bg-white/70 p-2 dark:border-stone-700 dark:bg-stone-800"
                onClick={onClose}
                aria-label="Close menu"
              >
                <X size={14} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2">
              {links.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition
                    hover:bg-amber-50 dark:hover:bg-amber-900/20
                    ${
                      location.pathname === to ||
                      location.pathname.startsWith(to + "/")
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        : ""
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuDrawer;
