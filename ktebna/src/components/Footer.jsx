import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  const columns = [
    {
      title: t("header.menu"),
      links: [
        { to: "/", label: t("nav.browse") },
        { to: "/books", label: t("nav.library") },
        { to: "/about", label: t("nav.about") },
        { to: "/contact", label: t("nav.contact") },
      ],
    },
    {
      title: t("nav.profile"),
      links: [
        { to: "/sell", label: t("nav.sell") },
        { to: "/saved", label: t("nav.saved") },
        { to: "/messages", label: t("nav.messages") },
        { to: "/profile", label: t("profile.myListings") },
      ],
    },
  ];

  return (
    <footer className="hidden border-t border-border bg-surface-soft py-10 text-sm md:block">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 md:grid-cols-4 lg:px-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">
              Ktebna<span className="text-primary">.</span>
            </span>
          </div>
          <p className="mt-2 max-w-xs text-muted-foreground">{t("footer.tagline")}</p>
        </div>

        {columns.map(({ title, links }) => (
          <div key={title}>
            <h4 className="mb-2 font-semibold">{title}</h4>
            <ul className="space-y-2 text-muted-foreground">
              {links.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="transition-colors hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-border px-4 pt-6 text-muted-foreground lg:px-6">
        © {new Date().getFullYear()} Ktebna — {t("footer.rights")}
      </div>
    </footer>
  );
};

export default Footer;
