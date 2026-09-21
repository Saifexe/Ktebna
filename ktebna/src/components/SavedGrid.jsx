import { useContext } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bookmark, Heart } from "lucide-react";
import apiClient from "../apiClient";
import { AuthContext } from "../auth/AuthProvider";
import { useSaved } from "../hooks/useSaved";
import { MAX_SAVED, dealLabel } from "../lib/listing";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import BookCover from "./BookCover";

// The saved-books shelf, shared by /saved and the profile "Saved Books" tab.
const SavedGrid = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { toggle } = useSaved();

  const { data, isLoading } = useQuery({
    queryKey: ["savedPosts", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await apiClient.get("/api/saved-posts", { params: { page: 0, size: MAX_SAVED } })).data,
  });

  const posts = data?.data ?? [];

  if (isLoading) return <Spinner />;
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title={t("savedPage.empty")}
        text={t("savedPage.emptyText")}
        action={<Button to="/">{t("savedPage.browse")}</Button>}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
      {posts.map((post) => (
        <div key={post.id} className="flex flex-col">
          <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
            <Link to={`/book/${post.id}`}>
              <BookCover src={post.bookImage} alt={post.bookName} className="size-full" />
            </Link>
            <Button
              size="icon"
              className="absolute end-2 top-2"
              onClick={() => toggle(post.id)}
              aria-label={t("savedPage.remove")}
              title={t("savedPage.remove")}
            >
              <Heart className="fill-current" />
            </Button>
          </div>
          <h2 className="mt-3 line-clamp-2 font-display text-lg font-bold">{post.bookName}</h2>
          <p className="truncate text-sm text-muted-foreground">
            {post.bookAuthor || post.user?.name}
          </p>
          <p className="mt-1 truncate text-sm font-bold text-primary">{dealLabel(post, t)}</p>
          <div className="mt-auto pt-3">
            <Button to={`/book/${post.id}`} className="w-full">
              {t("savedPage.view")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedGrid;
