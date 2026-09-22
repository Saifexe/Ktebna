import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BookOpen, Plus, Search, SearchX, X } from "lucide-react";
import apiClient from "../apiClient";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import BookCover from "../components/BookCover";
import Pagination from "../components/Pagination";
import { useRequireAuth } from "../hooks/useRequireAuth";
import CATEGORIES from "../data/categories";
import LIBRARY_LANGUAGES from "../data/libraryLanguages";

const PAGE_SIZE = 24;

const chip = (active) =>
  `rounded-full border px-3 py-1.5 text-sm transition-colors ${
    active
      ? "border-primary bg-primary font-semibold text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
  }`;

const LibraryCard = ({ book, t }) => (
  <Link to={`/books/${book.id}`} className="group">
    <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
      <BookCover
        src={book.coverImage}
        alt={book.title}
        className="size-full transition duration-500 group-hover:scale-105"
      />
      <Badge tone="trust" className="absolute start-2 top-2 shadow-sm">
        PDF
      </Badge>
    </div>
    <h3 dir="auto" className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug">{book.title}</h3>
    {book.author && <p className="truncate text-sm text-muted-foreground">{book.author}</p>}
    <p className="mt-2 flex items-center gap-1.5 font-bold text-primary">
      <BookOpen className="size-4" /> {t("library.readNow")}
    </p>
  </Link>
);

// The free Library: PDFs readers have shared. Filters live in the query string.
const Library = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const [params, setParams] = useSearchParams();
  const search = params.get("q") || "";
  const language = params.get("language") || "";
  const category = params.get("category") || "";
  const page = Math.max(Number(params.get("page")) || 1, 1);
  const [query, setQuery] = useState(search);

  useEffect(() => setQuery(search), [search]);

  const update = (changes) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([key, value]) =>
        value ? next.set(key, value) : next.delete(key),
      );
      if (!("page" in changes)) next.delete("page");
      return next;
    });
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["library", { search, language, category, page }],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await apiClient.get("/api/library", {
          params: {
            page: page - 1,
            size: PAGE_SIZE,
            search: search || undefined,
            language: language || undefined,
            category: category || undefined,
          },
        })
      ).data,
  });

  const books = data?.data ?? [];
  const shareBook = () => requireAuth(() => navigate("/books/new"));

  const renderResults = () => {
    if (isLoading) return <Spinner />;
    if (books.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title={t("library.empty")}
          text={t("library.emptyText")}
          action={
            <Button onClick={shareBook}>
              <Plus /> {t("library.share")}
            </Button>
          }
        />
      );
    }
    return (
      <div
        className={`grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity md:grid-cols-3 lg:grid-cols-4 ${
          isFetching ? "opacity-60" : ""
        }`}
      >
        {books.map((book) => (
          <LibraryCard key={book.id} book={book} t={t} />
        ))}
      </div>
    );
  };

  return (
    <>
      <section className="border-b border-border bg-surface-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
          <p className="mb-3 text-xs font-bold uppercase text-primary">{t("nav.library")}</p>
          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight md:text-5xl">
            {t("library.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t("library.subtitle")}</p>
          <div className="mt-7 flex max-w-2xl flex-wrap items-center gap-3">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: query.trim() });
              }}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border bg-background p-2 shadow-sm"
            >
              <Search className="ms-2 size-5 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("library.searchPlaceholder")}
                aria-label={t("library.searchPlaceholder")}
                className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    update({ q: "" });
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={t("catalog.clear")}
                >
                  <X className="size-4" />
                </button>
              )}
            </form>
            <Button size="lg" onClick={shareBook}>
              <Plus /> {t("library.share")}
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button className={chip(!language)} onClick={() => update({ language: "" })}>
              {t("library.allLanguages")}
            </button>
            {LIBRARY_LANGUAGES.map((l) => (
              <button key={l} className={chip(language === l)} onClick={() => update({ language: l })}>
                {t(`library.languages.${l}`)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={chip(!category)} onClick={() => update({ category: "" })}>
              {t("catalog.all")}
            </button>
            {CATEGORIES.map((c) => (
              <button key={c} className={chip(category === c)} onClick={() => update({ category: c })}>
                {t(`categories.${c}`)}
              </button>
            ))}
          </div>
        </div>

        {renderResults()}

        <Pagination
          page={page}
          totalPages={data?.totalPages}
          onChange={(p) => {
            update({ page: String(p) });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </section>
    </>
  );
};

export default Library;
