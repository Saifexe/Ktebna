import { useContext } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BookOpen, Edit3, MessageCircle, UserX } from "lucide-react";
import apiClient from "../apiClient";
import { AuthContext } from "../auth/AuthProvider";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useSaved } from "../hooks/useSaved";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Spinner from "../ui/Spinner";
import Stat from "../ui/Stat";
import BookCard from "../components/BookCard";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 12;

// A reader as others see them: same header card as /profile and the catalog's
// book grid, but read-only and without the email address.
const PublicProfile = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const requireAuth = useRequireAuth();
  const { isSaved, toggle } = useSaved();
  const [params, setParams] = useSearchParams();
  const page = Math.max(Number(params.get("page")) || 1, 1);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["publicProfile", id],
    queryFn: async () => (await apiClient.get(`/api/users/${id}/profile`)).data,
    retry: false,
  });

  const { data: postsPage, isLoading: loadingPosts, isFetching } = useQuery({
    queryKey: ["publicPosts", id, page],
    enabled: Boolean(profile),
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (await apiClient.get(`/api/users/${id}/posts`, { params: { page: page - 1, size: PAGE_SIZE } })).data,
  });

  if (isLoading) return <Spinner className="py-24" />;
  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={UserX}
          title={t("publicProfile.notFound")}
          text={t("publicProfile.notFoundText")}
          action={<Button to="/">{t("book.backToBrowse")}</Button>}
        />
      </div>
    );
  }

  const isMe = user?.id === profile.id;
  const posts = postsPage?.data ?? [];
  const since = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString(i18n.language, { month: "long", year: "numeric" })
    : null;

  const message = () =>
    requireAuth(() =>
      navigate(`/messages?${new URLSearchParams({ with: String(profile.id), name: profile.name })}`),
    );

  const renderBooks = () => {
    if (loadingPosts) return <Spinner />;
    if (posts.length === 0) {
      return (
        <EmptyState
          icon={BookOpen}
          title={t("publicProfile.empty")}
          text={isMe ? t("profile.noListingsText") : t("publicProfile.emptyText")}
          action={isMe ? <Button to="/sell">{t("profile.newListing")}</Button> : null}
        />
      );
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
    <div className="mx-auto max-w-6xl px-4 py-4">
      <section className="rounded-lg border bg-card p-6 text-center">
        <Avatar
          src={profile.profilePicture}
          name={profile.name}
          className="mx-auto size-24 border-4 border-background text-3xl shadow"
        />
        <h1 className="mt-3 font-display text-3xl font-bold">{profile.name}</h1>
        {since && (
          <p className="mt-1 text-xs text-trust">{t("publicProfile.memberSince", { date: since })}</p>
        )}

        <div className="mx-auto mt-5 grid max-w-md grid-cols-2 rounded-md bg-surface-soft p-3">
          <Stat n={profile.activeListings} label={t("publicProfile.onOffer")} />
          <Stat n={profile.completedDeals} label={t("publicProfile.completed")} />
        </div>

        <div className="mx-auto mt-4 flex max-w-md">
          {isMe ? (
            <Button to="/profile" variant="outline" className="flex-1">
              <Edit3 /> {t("publicProfile.editOwn")}
            </Button>
          ) : (
            <Button onClick={message} className="flex-1">
              <MessageCircle /> {t("publicProfile.message")}
            </Button>
          )}
        </div>
      </section>

      <h2 className="mt-7 mb-4 font-display text-2xl font-bold">
        {t("publicProfile.books", { name: profile.name })}
      </h2>
      {renderBooks()}

      <Pagination
        page={page}
        totalPages={postsPage?.totalPages}
        onChange={(p) => {
          setParams(p > 1 ? { page: String(p) } : {});
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
};

export default PublicProfile;
