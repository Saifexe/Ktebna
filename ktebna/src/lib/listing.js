// Vocabulary shared by the catalog, book page, sell flow and profile.
// Values are what the backend stores; labels come from i18n (deal.*, conditions.*).

export const DEAL_TYPES = ["sell", "exchange", "donate"];

export const CONDITIONS = ["likeNew", "gentlyRead", "wellLoved", "collectors"];

export const MAX_SAVED = 6;

// Swaps and gifts read as community gestures, so they carry the "trust" green;
// a straight sale uses the warm accent (same rule as the Lovable cards).
export const dealTone = (dealType) =>
  ["exchange", "donate"].includes(String(dealType).toLowerCase()) ? "trust" : "accent";

export const conditionTone = (condition) =>
  ["likeNew", "collectors"].includes(condition) ? "trust" : "accent";

// Older posts stored the deal type with arbitrary casing.
export const normalizeDealType = (dealType) => String(dealType || "").toLowerCase();

// The price / swap / "Free" line shown under a book title.
export const dealLabel = (post, t) => {
  const type = normalizeDealType(post.bookDealType);
  if (type === "donate") return t("catalog.free");
  if (type === "exchange") return post.bookDeal ? `${t("catalog.swap")} · ${post.bookDeal}` : t("deal.exchange");
  return post.bookDeal || t("deal.sell");
};

export const timeAgo = (date, lng = "en") => {
  if (!date) return "";
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat(lng, { numeric: "auto", style: "short" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "minute");
};

export const formatDate = (date, lng = "en") =>
  date ? new Date(date).toLocaleDateString(lng, { day: "numeric", month: "long", year: "numeric" }) : "";

// Deep link that opens (or starts) a chat with the owner of a post.
export const chatLink = (post) => {
  const params = new URLSearchParams({ with: String(post.user?.id ?? "") });
  if (post.user?.name) params.set("name", post.user.name);
  if (post.bookName) params.set("book", post.bookName);
  return `/messages?${params.toString()}`;
};
