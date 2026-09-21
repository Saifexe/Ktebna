import { NavLink } from "react-router-dom";
import { Bookmark, BookOpen, CirclePlus, MessageCircle, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import UnreadBadge from "../ui/UnreadBadge";
import { useUnread } from "../hooks/useUnread";

// Mobile tab bar from the Lovable redesign. Account-only tabs are guarded by
// RequireAuth, which sends logged-out visitors to /login and back.
const BottomNav = () => {
  const { t } = useTranslation();
  const { total: unread } = useUnread();

  const items = [
    { to: "/", label: t("bottomNav.explore"), icon: <BookOpen />, end: true },
    { to: "/saved", label: t("bottomNav.saved"), icon: <Bookmark /> },
    {
      to: "/sell",
      label: t("bottomNav.sell"),
      icon: <CirclePlus className="!size-11 -mt-4 fill-primary text-primary-foreground" />,
    },
    {
      to: "/messages",
      label: t("bottomNav.messages"),
      icon: (
        <span className="relative">
          <MessageCircle />
          <UnreadBadge count={unread} className="absolute -end-2.5 -top-2" />
        </span>
      ),
    },
    { to: "/profile", label: t("bottomNav.profile"), icon: <User /> },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center text-[10px]">
        {items.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 [&_svg]:size-5 ${
                isActive ? "font-bold text-primary" : "text-muted-foreground"
              }`
            }
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
