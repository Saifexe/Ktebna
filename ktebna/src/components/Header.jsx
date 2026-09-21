import { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, Languages, Menu, MessageCircle, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../auth/AuthProvider";
import { MobileFiltersContext } from "../context/MobileFiltersContext";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import UnreadBadge from "../ui/UnreadBadge";
import { useUnread } from "../hooks/useUnread";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "ar", name: "العربية" },
];

export const Brand = () => (
  <Link to="/" className="flex items-center gap-2">
    <BookOpen className="size-7 text-primary" />
    <span className="font-display text-xl font-bold">
      Ktebna<span className="text-primary">.</span>
    </span>
  </Link>
);

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user } = useContext(AuthContext);
  const { setMobileMenuOpen } = useContext(MobileFiltersContext);
  const { total: unread } = useUnread();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const langRef = useRef(null);

  useEffect(() => {
    if (!langOpen) return;
    const close = (e) => {
      if (!langRef.current?.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [langOpen]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
    setLangOpen(false);
  };

  const links = [
    { to: "/", label: t("nav.browse"), end: true },
    { to: "/saved", label: t("nav.saved") },
    { to: "/books", label: t("nav.library") },
    { to: "/sell", label: t("nav.sell") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="-ms-2 md:hidden"
          onClick={() => setMobileMenuOpen(true)}
          aria-label={t("header.menu")}
        >
          <Menu />
        </Button>
        <Brand />

        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `transition-colors hover:text-primary ${isActive ? "text-primary" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1">
          {searchOpen ? (
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(query.trim() ? `/?search=${encodeURIComponent(query.trim())}` : "/");
                setSearchOpen(false);
                setQuery("");
              }}
              className="flex items-center gap-1 rounded-md border bg-card ps-3"
            >
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                placeholder={t("catalog.searchPlaceholder")}
                aria-label={t("catalog.searchPlaceholder")}
                className="h-8 w-36 bg-transparent text-sm outline-none sm:w-56"
              />
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)} aria-label={t("catalog.clear")}>
                <X />
              </Button>
            </form>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label={t("catalog.search")}>
              <Search />
            </Button>
          )}

          <div className="relative" ref={langRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLangOpen((v) => !v)}
              aria-label={t("nav.language")}
              aria-expanded={langOpen}
            >
              <Languages />
            </Button>
            {langOpen && (
              <div className="absolute end-0 z-50 mt-2 w-40 overflow-hidden rounded-lg border bg-card shadow-lg">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full px-4 py-2 text-start text-sm transition-colors hover:bg-muted ${
                      i18n.language?.startsWith(lang.code) ? "bg-accent font-semibold text-accent-foreground" : ""
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                to="/messages"
                className="relative"
                aria-label={
                  unread > 0
                    ? `${t("nav.messages")} (${t("notifications.unread", { count: unread })})`
                    : t("nav.messages")
                }
              >
                <MessageCircle />
                <UnreadBadge count={unread} className="absolute -end-0.5 -top-0.5" />
              </Button>
              <Link to="/profile" aria-label={t("nav.profile")} className="ms-1">
                <Avatar src={user.profilePicture} name={user.name} className="size-9" ring />
              </Link>
            </>
          ) : (
            <Button to="/login" size="sm" className="ms-1">
              {t("nav.login")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
