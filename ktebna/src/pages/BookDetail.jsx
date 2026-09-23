import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  ArrowLeftRight,
  BookX,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  EyeOff,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
} from "lucide-react";
import apiClient from "../apiClient";
import { AuthContext } from "../auth/AuthProvider";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useSaved } from "../hooks/useSaved";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import BookCover from "../components/BookCover";
import PickupMap from "../components/maps/PickupMap";
import { googleMapsLink } from "../lib/maps";
import {
  chatLink,
  conditionTone,
  dealLabel,
  formatDate,
  normalizeDealType,
  postStatus,
  statusLabel,
  timeAgo,
} from "../lib/listing";

const Accordion = ({ id, title, open, onToggle, children }) => (
  <div className="border-b py-4">
    <button
      onClick={() => onToggle(open ? "" : id)}
      aria-expanded={open}
      className="flex w-full items-center justify-between text-start font-bold"
    >
      {title}
      <ChevronDown className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="mt-3 whitespace-pre-line text-muted-foreground">{children}</div>}
  </div>
);

const BookDetail = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const requireAuth = useRequireAuth();
  const { isSaved, toggle } = useSaved();
  const [open, setOpen] = useState("description");

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => (await apiClient.get(`/api/posts/${id}`)).data,
    retry: false,
  });

  if (isLoading) return <Spinner className="py-24" />;

  const isOwner = post && user?.id === post.user?.id;
  if (isError || !post || (!post.isPublic && !isOwner)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={BookX}
          title={t("book.notFound")}
          text={t("book.notFoundText")}
          action={<Button to="/">{t("book.backToBrowse")}</Button>}
        />
      </div>
    );
  }

  const type = normalizeDealType(post.bookDealType);
  const status = postStatus(post);
  const saved = isSaved(post.id);
  const city = post.bookLocation ? t(`cities.${post.bookLocation}`, post.bookLocation) : "";
  const conditionLabel = post.bookCondition
    ? t(`conditions.${post.bookCondition}`, post.bookCondition)
    : null;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: post.bookName, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("book.linkCopied"));
      }
    } catch {
      // Share sheet dismissed: nothing to do.
    }
  };

  const message = () => requireAuth(() => navigate(chatLink(post)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 lg:px-6">
      <p className="mb-4 truncate text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          {t("book.home")}
        </Link>
        {post.bookCategory && (
          <>
            {" / "}
            <Link
              to={`/?category=${encodeURIComponent(post.bookCategory)}`}
              className="hover:text-primary"
            >
              {t(`categories.${post.bookCategory}`, post.bookCategory)}
            </Link>
          </>
        )}
        {" / "}
        <b className="text-foreground">{post.bookName}</b>
      </p>

      {!post.isPublic && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <EyeOff className="size-4" /> {t("book.private")}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-lg border bg-surface-soft p-5">
          <BookCover
            src={post.bookImage}
            alt={post.bookName}
            className="mx-auto h-[60vh] max-h-[680px] w-full"
            imgClassName="object-contain"
          />
          {conditionLabel && (
            <div className="absolute start-8 top-8">
              <Badge tone={conditionTone(post.bookCondition)}>● {conditionLabel}</Badge>
            </div>
          )}
        </div>

        <div className="lg:pt-5">
          <div className="flex flex-wrap gap-2">
            {post.bookCategory && (
              <Badge>{t(`categories.${post.bookCategory}`, post.bookCategory)}</Badge>
            )}
            {type && <Badge>{t(`deal.${type}`)}</Badge>}
            {status !== "AVAILABLE" && (
              <Badge tone={status === "SOLD" ? "sold" : "reserved"}>{statusLabel(post, t)}</Badge>
            )}
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight">{post.bookName}</h1>
          {post.bookAuthor && (
            <p className="mt-4">
              {t("book.by")} <b>{post.bookAuthor}</b>
            </p>
          )}

          <div className="mt-6 rounded-lg border bg-surface-soft p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-display text-3xl font-bold">{dealLabel(post, t)}</span>
              {conditionLabel && <Badge tone={conditionTone(post.bookCondition)}>{conditionLabel}</Badge>}
            </div>

            {type === "exchange" && (
              <div className="my-5 rounded-md bg-background p-4">
                <b className="flex items-center gap-2">
                  <ArrowLeftRight className="size-4 text-primary" /> {t("book.openToSwap")}
                </b>
                {post.bookDeal && (
                  <p className="mt-1 text-sm italic text-muted-foreground">
                    {t("book.wants")}: {post.bookDeal}
                  </p>
                )}
              </div>
            )}
            {type === "donate" && (
              <div className="my-5 rounded-md bg-background p-4">
                <b className="flex items-center gap-2">
                  <Gift className="size-4 text-trust" /> {t("book.freeGiving")}
                </b>
              </div>
            )}

            {!isOwner && status === "RESERVED" && (
              <p className="my-5 flex gap-2 rounded-md bg-amber-100 p-4 text-sm text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                <Clock className="size-4 shrink-0" /> {t("status.reservedNote")}
              </p>
            )}
            {!isOwner && status === "SOLD" && (
              <p className="my-5 flex gap-2 rounded-md bg-muted p-4 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 shrink-0" /> {t("status.soldNote")}
              </p>
            )}

            {isOwner ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">{t("book.yourListing")}</p>
                <Button to={`/sell/${post.id}`} className="ms-auto">
                  <Edit3 /> {t("book.editListing")}
                </Button>
              </div>
            ) : (
              <div
                className={`mt-5 grid gap-2 ${
                  status === "SOLD"
                    ? "grid-cols-[auto_auto] justify-end"
                    : "grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_1fr_auto_auto]"
                }`}
              >
                {/* A finished deal has no one left to message about it. */}
                {status !== "SOLD" && (
                  <>
                    <Button onClick={message}>
                      <MessageCircle /> {t("book.messageSeller")}
                    </Button>
                    <Button variant="outline" onClick={message} className="hidden sm:inline-flex">
                      {t("book.makeOffer")}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggle(post.id)}
                  aria-label={saved ? t("book.unsave") : t("book.save")}
                  aria-pressed={saved}
                >
                  <Heart className={saved ? "fill-primary text-primary" : ""} />
                </Button>
                <Button variant="outline" size="icon" onClick={share} aria-label={t("book.share")}>
                  <Share2 />
                </Button>
              </div>
            )}
          </div>

          <Link
            to={`/user/${post.user?.id}`}
            aria-label={`${t("publicProfile.view")}: ${post.user?.name}`}
            className="mt-5 flex items-center gap-4 rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-muted/60"
          >
            <Avatar src={post.user?.profilePicture} name={post.user?.name} className="size-12" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{t("book.listedBy")}</p>
              <b className="block truncate">{post.user?.name}</b>
              <p className="text-xs text-muted-foreground">
                {city && (
                  <>
                    <MapPin className="me-0.5 inline size-3 text-primary" />
                    {city} ·{" "}
                  </>
                )}
                {timeAgo(post.createdAt, i18n.language)}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
          </Link>
        </div>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary">{t("book.overview")}</p>
          <Accordion
            id="description"
            title={t("book.description")}
            open={open === "description"}
            onToggle={setOpen}
          >
            {post.bookDescription || t("book.noDescription")}
          </Accordion>
          <Accordion id="pickup" title={t("book.pickup")} open={open === "pickup"} onToggle={setOpen}>
            {post.pickupSpot && (
              <p className="mb-2 font-semibold text-foreground">
                <MapPin className="me-1 inline size-4 text-primary" />
                {t("map.spot")}: {post.pickupSpot}
              </p>
            )}
            {t("book.pickupText", { city: city || "Tunisia" })}
          </Accordion>
        </div>

        <aside className="h-fit rounded-lg border bg-surface-soft p-5">
          <h3 className="font-display text-xl font-bold">{t("book.details")}</h3>
          <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-muted-foreground">{t("book.category")}</dt>
            <dd>
              {post.bookCategory
                ? t(`categories.${post.bookCategory}`, post.bookCategory)
                : t("book.notSpecified")}
            </dd>
            <dt className="text-muted-foreground">{t("book.condition")}</dt>
            <dd className={conditionLabel ? "text-trust" : ""}>
              {conditionLabel || t("book.notSpecified")}
            </dd>
            <dt className="text-muted-foreground">{t("book.dealType")}</dt>
            <dd>{type ? t(`deal.${type}`) : t("book.notSpecified")}</dd>
            <dt className="text-muted-foreground">{t("book.listed")}</dt>
            <dd>{formatDate(post.createdAt, i18n.language)}</dd>
          </dl>
          {city && (
            <div className="mt-5 space-y-3 border-t pt-4">
              <PickupMap lat={post.pickupLat} lng={post.pickupLng} city={post.bookLocation} />
              <p className="flex items-start gap-1 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {post.pickupSpot && <b className="block">{post.pickupSpot}</b>}
                  {city}, Tunisia
                </span>
              </p>
              <a
                href={googleMapsLink({
                  lat: post.pickupLat,
                  lng: post.pickupLng,
                  spot: post.pickupSpot,
                  city: post.bookLocation,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" /> {t("map.open")}
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default BookDetail;
