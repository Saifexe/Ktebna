import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Filter, SearchX, Search, X } from "lucide-react";
import apiClient from "../apiClient";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import BookCard from "../components/BookCard";
import Pagination from "../components/Pagination";
import { useSaved } from "../hooks/useSaved";
import { DEAL_TYPES } from "../lib/listing";
import CATEGORIES from "../data/categories";
import cities from "../data/cities";

const PAGE_SIZE = 12;

const chip = (active) =>
  `rounded-full border px-3 py-1.5 text-sm transition-colors ${
    active
      ? "border-primary bg-primary font-semibold text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
  }`;

// Home / Browse All. Every filter lives in the query string, so results are
// shareable and the header search box can drive this page from anywhere.
const Catalog = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const dealType = params.get("dealType") || "";
  const location = params.get("location") || "";
  const page = Math.max(Number(params.get("page")) || 1, 1);

  const [query, setQuery] = useState(search);
  const [showFilters, setShowFilters] = useState(Boolean(category || dealType || location));
  const { isSaved, toggle } = useSaved();

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
    queryKey: ["feed", { search, category, dealType, location, page }],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await apiClient.get("/api/posts", {
          params: {
            page: page - 1,
            size: PAGE_SIZE,
            search: search || undefined,
            category: category || undefined,
            dealType: dealType || undefined,
            location: location || undefined,
          },
        })
      ).data,
  });

  const posts = data?.data ?? [];
  const activeFilters = [category, dealType, location].filter(Boolean).length;

  const renderResults = () => {
    if (isLoading) return <Spinner />;
    if (posts.length === 0) {
      return <EmptyState icon={SearchX} title={t("catalog.empty")} text={t("catalog.emptyText")} />;
    }
    return (
      <div
        className={`grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity md:grid-cols-3 lg:grid-cols-4 ${
          isFetching ? "opacity-60" : ""
        }`}
      >
        {posts.map((post) => (
          <BookCard key={post.id} post={post} saved={isSaved(post.id)} onToggleSave={toggle} />
        ))}
      </div>
    );
  };

  return (
    <>
      <section className="border-b border-border bg-surface-soft">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
          <p className="mb-3 text-xs font-bold uppercase text-primary">{t("catalog.eyebrow")}</p>
          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight md:text-6xl">
            {t("catalog.title")}
          </h1>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              update({ search: query.trim() });
            }}
            className="mt-7 flex max-w-2xl items-center gap-3 rounded-lg border bg-background p-2 shadow-sm"
          >
            <Search className="ms-2 size-5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("catalog.searchPlaceholder")}
              aria-label={t("catalog.searchPlaceholder")}
              className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  update({ search: "" });
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label={t("catalog.clear")}
              >
                <X className="size-4" />
              </button>
            )}
            <Button type="submit">{t("catalog.search")}</Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {search ? t("catalog.resultsFor", { query: search }) : t("catalog.fresh")}
            </p>
            <h2 className="font-display text-2xl font-bold">{t("catalog.explore")}</h2>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            <Filter /> {t("catalog.filters")}
            {activeFilters > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="mb-8 space-y-5 rounded-lg border bg-card p-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                {t("catalog.dealType")}
              </p>
              <div className="flex flex-wrap gap-2">
                <button className={chip(!dealType)} onClick={() => update({ dealType: "" })}>
                  {t("catalog.all")}
                </button>
                {DEAL_TYPES.map((d) => (
                  <button key={d} className={chip(dealType === d)} onClick={() => update({ dealType: d })}>
                    {t(`deal.${d}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                {t("catalog.category")}
              </p>
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

            <div className="flex flex-wrap items-end justify-between gap-4">
              <label className="block text-xs font-bold uppercase text-muted-foreground">
                {t("catalog.city")}
                <select
                  value={location}
                  onChange={(e) => update({ location: e.target.value })}
                  className="mt-2 block h-10 w-56 rounded-md border bg-background px-3 text-sm font-normal normal-case text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t("cities.allTunisia")}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {t(`cities.${c}`)}
                    </option>
                  ))}
                </select>
              </label>
              {activeFilters > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => update({ category: "", dealType: "", location: "" })}
                >
                  <X /> {t("catalog.clear")}
                </Button>
              )}
            </div>
          </div>
        )}

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

export default Catalog;
