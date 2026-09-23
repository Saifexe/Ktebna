import { Link } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import Badge from "../ui/Badge";
import BookCover from "./BookCover";
import { conditionTone, dealLabel, dealTone, normalizeDealType, postStatus, statusLabel } from "../lib/listing";

// Catalog tile from the Lovable redesign: cover, status badge, serif title,
// author, and the deal line in the primary colour.
const BookCard = ({ post, saved, onToggleSave }) => {
  const { t } = useTranslation();
  const type = normalizeDealType(post.bookDealType);
  const status = postStatus(post);
  // A reserved or sold status wins, then condition, then deal type; old
  // listings without any of them get no badge.
  let badge = null;
  if (status !== "AVAILABLE") {
    badge = { tone: status === "SOLD" ? "sold" : "reserved", label: statusLabel(post, t) };
  } else if (post.bookCondition) {
    badge = { tone: conditionTone(post.bookCondition), label: t(`conditions.${post.bookCondition}`) };
  } else if (type) {
    badge = { tone: dealTone(type), label: t(`deal.${type}`) };
  }

  return (
    <div className="group relative">
      <Link to={`/book/${post.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
          <BookCover
            src={post.bookImage}
            alt={post.bookName}
            className={`size-full transition duration-500 group-hover:scale-105 ${
              status === "SOLD" ? "opacity-60 grayscale" : ""
            }`}
          />
          {badge && (
            <Badge tone={badge.tone} className="absolute start-2 top-2 shadow-sm">
              {badge.label}
            </Badge>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 font-display text-lg font-bold leading-snug">
          {post.bookName}
        </h3>
        <p className="truncate text-sm text-muted-foreground">
          {post.bookAuthor || post.user?.name}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="truncate font-bold text-primary">{dealLabel(post, t)}</p>
          {post.bookLocation && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {t(`cities.${post.bookLocation}`, post.bookLocation)}
            </span>
          )}
        </div>
      </Link>

      {onToggleSave && (
        <button
          type="button"
          onClick={() => onToggleSave(post.id)}
          aria-label={saved ? t("book.unsave") : t("book.save")}
          aria-pressed={saved}
          className="absolute end-2 top-2 grid size-9 place-items-center rounded-full bg-background/90 shadow-sm backdrop-blur transition hover:scale-105"
        >
          <Heart className={`size-4 ${saved ? "fill-primary text-primary" : "text-foreground"}`} />
        </button>
      )}
    </div>
  );
};

export default BookCard;
