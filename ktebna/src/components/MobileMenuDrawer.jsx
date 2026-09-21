import { useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookOpen, CirclePlus, Info, LibraryBig, Mail, MessageCircle, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Brand } from "./Header";

const MobileMenuDrawer = ({ open, onClose }) => {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === "rtl";
  const offset = rtl ? 320 : -320;

  // Keyboard users can close the menu with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const links = [
    { to: "/", label: t("nav.browse"), icon: BookOpen, end: true },
    { to: "/saved", label: t("nav.saved"), icon: Bookmark },
    { to: "/sell", label: t("nav.sell"), icon: CirclePlus },
    { to: "/messages", label: t("nav.messages"), icon: MessageCircle },
    { to: "/books", label: t("nav.library"), icon: LibraryBig },
    { to: "/about", label: t("nav.about"), icon: Info },
    { to: "/contact", label: t("nav.contact"), icon: Mail },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop: a real button so it's reachable and labelled for assistive tech. */}
          <motion.button
            type="button"
            aria-label={t("catalog.clear")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: offset }}
            animate={{ x: 0 }}
            exit={{ x: offset }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute inset-y-0 start-0 w-[85%] max-w-xs border-e bg-background p-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label={t("header.menu")}
          >
            <div className="mb-6 flex items-center justify-between">
              <Brand onClick={onClose} />
              <button
                className="grid size-9 place-items-center rounded-md hover:bg-accent"
                onClick={onClose}
                aria-label={t("catalog.clear")}
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {links.map(({ to, label, icon, end }) => {
                const Icon = icon;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                      }`
                    }
                  >
                    <Icon className="size-4" />
                    {label}
                  </NavLink>
                );
              })}
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuDrawer;
